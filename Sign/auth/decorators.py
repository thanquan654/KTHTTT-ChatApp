import functools
from flask import request, jsonify, g # type: ignore
from typing import List, Callable

from auth.services import decode_token, is_token_blocklisted, get_user_by_id
from models.user import UserPublic, TokenPayload # Import model để gõ type hint

# Thêm UserPublic vào g để các route có thể sử dụng thông tin user an toàn
def set_current_user(user_in_db):
     if user_in_db:
         g.current_user = UserPublic.from_orm(user_in_db)
     else:
         g.current_user = None

def token_required(f: Callable) -> Callable:
    """Decorator để xác thực JWT và kiểm tra blocklist."""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"message": "Authorization token is missing or invalid format"}), 401

        payload = decode_token(token)
        if not payload:
            # decode_token đã log lỗi cụ thể (expired, invalid)
            return jsonify({"message": "Invalid or expired token"}), 401

        # Kiểm tra blocklist bằng JTI
        jti = payload.get("jti")
        if not jti or is_token_blocklisted(jti):
            return jsonify({"message": "Token has been revoked (logged out)"}), 401

        # Lấy user từ DB dựa vào user_id trong token
        user_id = payload.get("user_id")
        if not user_id:
             return jsonify({"message": "Token payload missing user identifier"}), 401

        user = get_user_by_id(user_id)
        if not user:
            # User đã bị xóa khỏi DB sau khi token được cấp?
            return jsonify({"message": "User associated with token not found"}), 401

        # Lưu thông tin user và payload vào context g để route sử dụng
        set_current_user(user) # Lưu UserPublic
        g.token_payload = TokenPayload(**payload) # Lưu payload đã validate

        return f(*args, **kwargs)
    return decorated_function


def role_required(required_roles: List[str]) -> Callable:
    """Decorator để kiểm tra quyền của user. Phải dùng sau @token_required."""
    if not isinstance(required_roles, list):
        required_roles = [required_roles] # Cho phép truyền vào string đơn

    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            # Lấy thông tin user từ context g (đã được set bởi @token_required)
            current_user: UserPublic = getattr(g, 'current_user', None)

            if not current_user:
                # Lỗi logic: decorator này phải chạy sau token_required
                print("ERROR: @role_required used without @token_required or user not found")
                return jsonify({"message": "Internal server error: Cannot verify user role"}), 500

            user_roles = set(current_user.roles)
            # Kiểm tra xem user có bất kỳ role nào trong danh sách yêu cầu không
            if not any(role in user_roles for role in required_roles):
                return jsonify({"message": f"Access forbidden: Requires role(s) {required_roles}"}), 403

            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Ví dụ tạo decorator cụ thể cho role admin
def admin_required(f: Callable) -> Callable:
     return role_required(["admin"])(f)