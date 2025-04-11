from flask import Blueprint, request, jsonify, g # type: ignore
from pydantic import ValidationError # type: ignore
from datetime import datetime, timezone, timedelta

from auth import services
from auth.decorators import token_required, role_required, admin_required
from models.user import UserCreate, UserLogin, UserPublic, Token

# Tạo Blueprint
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Endpoint đăng ký user mới."""
    try:
        user_in = UserCreate(**request.json)
    except ValidationError as e:
        return jsonify({"message": "Invalid input", "details": e.errors()}), 400

    # Kiểm tra username/email tồn tại
    if services.get_user_by_username(user_in.username):
        return jsonify({"message": f"Username '{user_in.username}' already exists"}), 409 # 409 Conflict
    if services.get_user_by_email(user_in.email):
        return jsonify({"message": f"Email '{user_in.email}' already registered"}), 409

    # Tạo user trong DB
    created_user = services.create_db_user(user_in)
    if not created_user:
        # create_db_user đã log lỗi chi tiết
        return jsonify({"message": "Failed to register user due to server error"}), 500

    # Trả về thông tin user public (không có password hash)
    user_public = UserPublic.from_orm(created_user)
    return jsonify(user_public.dict()), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Endpoint đăng nhập, trả về JWT."""
    try:
        login_data = UserLogin(**request.json)
    except ValidationError as e:
        return jsonify({"message": "Invalid input", "details": e.errors()}), 400

    # Tìm user bằng username
    user = services.get_user_by_username(login_data.username)
    if not user:
        return jsonify({"message": "Incorrect username or password"}), 401 # Luôn trả về lỗi chung chung

    # Kiểm tra password
    if not services.verify_password(login_data.password, user.hashed_password):
        return jsonify({"message": "Incorrect username or password"}), 401

    # Tạo access token
    access_token = services.create_access_token(user)

    # Trả về token
    token_response = Token(access_token=access_token)
    return jsonify(token_response.dict()), 200


@auth_bp.route('/logout', methods=['POST'])
@token_required # Cần phải đăng nhập mới logout được
def logout():
    """Endpoint đăng xuất: thêm JTI của token vào blocklist."""
    try:
        payload = g.token_payload # Lấy payload từ context (set bởi decorator)
        jti = payload.jti
        exp_time = payload.exp

        now = datetime.now(timezone.utc)
        # Đảm bảo exp_time có timezone để so sánh đúng
        if exp_time.tzinfo is None:
            exp_time = exp_time.replace(tzinfo=timezone.utc)

        # Tính thời gian còn lại của token (tính bằng giây)
        remaining_seconds = max(0, int((exp_time - now).total_seconds()))

        if remaining_seconds > 0:
            services.add_token_to_blocklist(jti, remaining_seconds)
        else:
            print(f"Token JTI {jti} already expired, no need to blocklist.")

        return jsonify({"message": "Logout successful"}), 200

    except AttributeError:
        print("ERROR: Token payload not found in context g during logout.")
        return jsonify({"message": "Error processing logout"}), 500
    except Exception as e:
        print(f"ERROR: Unexpected error during logout: {e}")
        return jsonify({"message": "An error occurred during logout"}), 500


@auth_bp.route('/users/me', methods=['GET'])
@token_required # Yêu cầu xác thực
def get_current_user_profile():
    """Endpoint lấy thông tin của user đang đăng nhập."""
    # Decorator đã xác thực và đặt g.current_user
    current_user_public: UserPublic = g.current_user
    if current_user_public:
        return jsonify(current_user_public.dict()), 200
    else:
        # Lỗi này không nên xảy ra nếu decorator hoạt động đúng
        return jsonify({"message": "Could not retrieve user profile"}), 500

# Ví dụ Endpoint yêu cầu quyền admin
@auth_bp.route('/admin/users', methods=['GET'])
@token_required
# @role_required(['admin']) # Cách dùng chung
@admin_required          # Cách dùng decorator cụ thể hơn
def admin_get_all_users():
    """(Admin only) Endpoint ví dụ lấy danh sách user (chỉ trả về thông tin public)."""
    # Logic lấy danh sách user từ DB (chưa implement trong services)
    
    # users_public = [UserPublic.from_orm(u) for u in users_in_db]
    admin_user = g.current_user
    return jsonify({
        "message": f"Welcome Admin {admin_user.username}! This is the user list (to be implemented).",
        "users": [] # Thay bằng list user thật
        }), 200