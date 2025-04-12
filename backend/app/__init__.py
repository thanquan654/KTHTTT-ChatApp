from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from .mongo import get_mongo_client, close_mongo_client
from .redis import get_redis, close_redis_client
from .socket_events import register_socket_events

def create_app():
    app = Flask(__name__)
    secret_key = app.config.get('SECRET_KEY', None)
    app.config['SECRET_KEY'] = secret_key


    socketio = SocketIO(
        app,
        cors_allowed_origins=["http://localhost:5173"],
        async_mode='eventlet'
    )

    CORS(
        app,
        origins=["http://localhost:5173"], # Chỉ định các origin được phép
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], # Các method được phép
        allow_headers=["Content-Type", "Authorization"], # Các header được phép gửi từ frontend)
    )

    app.teardown_appcontext(close_mongo_client)
    app.teardown_appcontext(close_redis_client)

    # Đăng ký các event handler cho socketio

    register_socket_events(socketio)

    from app.api import room_bp, auth_bp, message_bp
    app.register_blueprint(room_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(message_bp)


    return socketio, app
