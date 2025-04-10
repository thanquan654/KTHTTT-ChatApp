from flask import Flask
from flask_cors import CORS
from .mongo import get_mongo_client, close_mongo_client

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.teardown_appcontext(close_mongo_client)

    from app.api import room_bp
    app.register_blueprint(room_bp)

    return app
