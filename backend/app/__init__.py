from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from .mongo import get_mongo_client, close_mongo_client
from .redis import get_redis, close_redis_client, init_redis
from .socket_events import register_socket_events

def init_services(app):
    """Khởi tạo các services cần thiết"""
    # Khởi tạo Redis connection
    init_redis()
    redis_client = get_redis()
    if not redis_client:
        app.logger.error("Failed to initialize Redis")

def create_app():
    app = Flask(__name__)
    secret_key = app.config.get('SECRET_KEY', None)
    app.config['SECRET_KEY'] = secret_key

    socketio = SocketIO(
        app,
        cors_allowed_origins=["http://localhost:5173"],
        message_queue='redis://127.0.0.1:6379',
        async_mode='eventlet',
        logger=True,
    )

    CORS(
        app,
        origins=["http://localhost:5173"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # Đăng ký các event handler cho socketio
    register_socket_events(socketio)

    from app.api import room_bp, auth_bp, message_bp
    app.register_blueprint(room_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(message_bp)

    # Khởi tạo services khi start app
    init_services(app)

    # Cleanup khi shutdown
    app.teardown_appcontext(close_mongo_client)
    app.teardown_appcontext(lambda x: close_redis_client())

    return socketio, app
