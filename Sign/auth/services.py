import bcrypt # type: ignore
import jwt # type: ignore
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List

from models.user import UserCreate, UserInDB, UserPublic
from db.mongo_client import get_db
from db.redis_client import get_redis
from core.config import settings
from bson import ObjectId # type: ignore

# --- Password Hashing ---
def hash_password(password: str) -> str:
    """Hash password dùng bcrypt."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Kiểm tra password hash."""
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_byte = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_byte)

# --- JWT Handling ---
JWT_SECRET = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
REDIS_BLOCKLIST_PREFIX = "blocklist:jwt:"

def create_access_token(user: UserInDB) -> str:
    """Tạo JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "user_id": str(user.id), # Subject là user_id dạng string
        "username": user.username,
        "roles": user.roles,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": uuid.uuid4().hex # JWT ID duy nhất
    }
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Giải mã và xác thực JWT."""
    try:
        # Thêm leeway để xử lý chênh lệch nhỏ về đồng hồ giữa các server
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM], leeway=timedelta(seconds=10))
        # Kiểm tra xem token có JTI không (quan trọng cho blocklist)
        if "jti" not in payload:
            print("WARN: Token does not contain JTI claim.")
            return None # Coi như không hợp lệ nếu thiếu JTI
        return payload
    except jwt.ExpiredSignatureError:
        print("Token has expired.")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {e}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred during token decoding: {e}")
        return None

# --- Redis Blocklist ---
def add_token_to_blocklist(jti: str, expires_in_seconds: int):
    """Thêm JTI vào Redis blocklist."""
    redis = get_redis()
    if not redis:
        print("ERROR: Redis client not available. Cannot add token to blocklist.")
        return # Hoặc raise exception nếu việc blocklist là bắt buộc

    key = f"{REDIS_BLOCKLIST_PREFIX}{jti}"
    try:
        # Set giá trị là 'blocked' và thời gian hết hạn (tính bằng giây)
        redis.setex(key, expires_in_seconds, "blocked")
        print(f"Token JTI {jti} added to blocklist for {expires_in_seconds} seconds.")
    except Exception as e:
        print(f"ERROR: Failed to add JTI {jti} to Redis blocklist: {e}")

def is_token_blocklisted(jti: str) -> bool:
    """Kiểm tra JTI có trong Redis blocklist không."""
    redis = get_redis()
    if not redis:
        print("ERROR: Redis client not available. Assuming token is NOT blocklisted (potential risk).")
        # Quyết định an toàn: nên coi là blocklisted nếu không check được?
        # return True # Lựa chọn an toàn hơn nhưng có thể gây phiền toái
        return False # Lựa chọn hiện tại: log lỗi và cho qua

    key = f"{REDIS_BLOCKLIST_PREFIX}{jti}"
    try:
        return redis.exists(key) > 0
    except Exception as e:
        print(f"ERROR: Failed to check Redis blocklist for JTI {jti}: {e}")
        # Lựa chọn an toàn tương tự như trên
        return False


# --- User CRUD Operations ---
def get_user_by_username(username: str) -> Optional[UserInDB]:
    """Lấy user từ DB theo username."""
    db = get_db()
    if not db: return None
    user_data = db.users.find_one({"username": username})
    if user_data:
        try:
            return UserInDB(**user_data)
        except Exception as e: # Handle Pydantic validation error etc.
            print(f"Error validating user data from DB for {username}: {e}")
            return None
    return None

def get_user_by_email(email: str) -> Optional[UserInDB]:
    """Lấy user từ DB theo email."""
    db = get_db()
    if not db: return None
    user_data = db.users.find_one({"email": email})
    if user_data:
        try:
            return UserInDB(**user_data)
        except Exception as e:
             print(f"Error validating user data from DB for {email}: {e}")
             return None
    return None

def get_user_by_id(user_id: str) -> Optional[UserInDB]:
    """Lấy user từ DB theo ID (dạng string)."""
    db = get_db()
    if not db or not ObjectId.is_valid(user_id):
        return None
    user_data = db.users.find_one({"_id": ObjectId(user_id)})
    if user_data:
        try:
            return UserInDB(**user_data)
        except Exception as e:
             print(f"Error validating user data from DB for ID {user_id}: {e}")
             return None
    return None

def create_db_user(user_in: UserCreate) -> Optional[UserInDB]:
    """Tạo user mới trong DB."""
    db = get_db()
    if not db: return None
    hashed_pass = hash_password(user_in.password)
    # Tạo dict để insert, không bao gồm password gốc, thêm hashed_password và thời gian
    user_doc = user_in.dict(exclude={"password"})
    user_doc["hashed_password"] = hashed_pass
    user_doc["created_at"] = datetime.utcnow()
    user_doc["updated_at"] = datetime.utcnow()
    user_doc["roles"] = ["user"] # Gán role mặc định

    try:
        result = db.users.insert_one(user_doc)
        # Lấy lại user vừa tạo để có _id và các giá trị default
        created_user_data = db.users.find_one({"_id": result.inserted_id})
        if created_user_data:
            return UserInDB(**created_user_data)
        else:
            print("Failed to retrieve newly created user.")
            return None
    except pymongo.errors.DuplicateKeyError: # type: ignore
        print(f"Cannot create user. Username or email already exists.") # Giả sử có unique index
        return None
    except Exception as e:
        print(f"Error creating user in DB: {e}")
        return None