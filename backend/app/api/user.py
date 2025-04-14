from flask import Blueprint, request, jsonify, g # type: ignore
from pydantic import ValidationError # type: ignore
from datetime import datetime, timezone, timedelta

from ..helpers.auth import services
from ..helpers.auth.decorators import token_required, role_required, admin_required
from ..models.user import UserCreate, UserLogin, UserPublic, Token

# Tạo Blueprint
auth_bp = Blueprint('auth_api', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Endpoint đăng ký user mới."""
    try:
        user_in = UserCreate(**request.json)
    except ValidationError as e:
        return jsonify({"message": "Invalid input", "details": e.errors()}), 400

    # Kiểm tra email tồn tại
    if services.get_user_by_email(user_in.email):
        return jsonify({"message": f"Email '{user_in.email}' already registered"}), 409

    # Tạo user trong DB
    created_user = services.create_db_user(user_in)
    if not created_user:
        # create_db_user đã log lỗi chi tiết
        return jsonify({"message": "Failed to register user due to server error"}), 500

    # Trả về thông tin user public (không có password hash)
    user_public = UserPublic.model_validate(created_user)
    return jsonify(user_public.model_dump()), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Endpoint đăng nhập, trả về JWT."""
    try:
        login_data = UserLogin(**request.json)
    except ValidationError as e:
        return jsonify({"message": "Invalid input", "details": e.errors()}), 400

    # Tìm user bằng username
    user = services.get_user_by_email(login_data.email)
    if not user:
        return jsonify({"message": "Incorrect username or password"}), 401 # Luôn trả về lỗi chung chung

    # Kiểm tra password
    if not services.verify_password(login_data.password, user.hashed_password):
        return jsonify({"message": "Incorrect username or password"}), 401

    # Chuẩn bị thông tin user public
    user_public = UserPublic.model_validate(user)

    # Tạo access token
    access_token = services.create_access_token(user)

    g.current_user = user_public

    # Trả về token
    return jsonify({
        "access_token": access_token,
        "token_type": "bearer", # Thông tin loại token (tiêu chuẩn)
        "user": user_public.model_dump(by_alias=True) # Trả về user public data
    }), 200

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



# @auth_bp.route('/users/me', methods=['GET'])
# @token_required # Yêu cầu xác thực
# def get_current_user_profile():
#     """Endpoint lấy thông tin của user đang đăng nhập."""
#     # Decorator đã xác thực và đặt g.current_user
#     current_user_public: UserPublic = g.current_user
#     if current_user_public:
#         return jsonify(current_user_public.dict()), 200
#     else:
#         # Lỗi này không nên xảy ra nếu decorator hoạt động đúng
#         return jsonify({"message": "Could not retrieve user profile"}), 500

# # Ví dụ Endpoint yêu cầu quyền admin
# @auth_bp.route('/admin/users', methods=['GET'])
# @token_required
# # @role_required(['admin']) # Cách dùng chung
# @admin_required          # Cách dùng decorator cụ thể hơn
# def admin_get_all_users():
    """(Admin only) Endpoint ví dụ lấy danh sách user (chỉ trả về thông tin public)."""
    # Logic lấy danh sách user từ DB (chưa implement trong services)

    # users_public = [UserPublic.from_orm(u) for u in users_in_db]
    admin_user = g.current_user
    return jsonify({
        "message": f"Welcome Admin {admin_user.username}! This is the user list (to be implemented).",
        "users": [] # Thay bằng list user thật
        }), 200

@auth_bp.route('/me', methods=['GET'])
# @token_required # Decorator này xử lý toàn bộ việc xác thực
def get_current_user_profile():
    """Endpoint lấy thông tin của user đang đăng nhập dựa trên token."""
    # Decorator @token_required đã:
    # 1. Xác thực token từ header Authorization
    # 2. Kiểm tra token hết hạn
    # 3. Kiểm tra token trong blocklist (Redis)
    # 4. Lấy user_id từ token
    # 5. Lấy user từ DB và đặt vào g.current_user dưới dạng UserPublic

    current_user_public: UserPublic = g.current_user # Lấy UserPublic từ context g

    if current_user_public:
        return jsonify(current_user_public.model_dump(by_alias=True)), 200
    else:
        print("ERROR: User not found in 'g' context despite token being valid in /users/me")
        return jsonify({"message": "Could not retrieve user profile after authentication"}), 404 # Hoặc 500
