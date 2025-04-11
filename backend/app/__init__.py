from flask import Flask
from flask_cors import CORS
from .mongo import get_mongo_client, close_mongo_client
from .redis import get_redis, close_redis_client

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.teardown_appcontext(close_mongo_client)
    app.teardown_appcontext(close_redis_client)

    from app.api import room_bp, auth_bp, message_bp
    app.register_blueprint(room_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(message_bp)


    return app
