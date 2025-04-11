import pymongo # type: ignore
from flask import current_app, g # type: ignore
from pymongo.database import Database # type: ignore

def get_mongo_client():
    """Lấy MongoDB client từ application context g nếu có, hoặc tạo mới."""
    if 'mongo_client' not in g:
        mongo_uri = current_app.config['MONGODB_URI']
        try:
            # Nên đặt timeout để tránh treo nếu không kết nối được
            g.mongo_client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            # Ping để kiểm tra kết nối ngay lập tức
            g.mongo_client.admin.command('ping')
            print("MongoDB client connected.")
        except pymongo.errors.ServerSelectionTimeoutError as err:
            print(f"ERROR: Could not connect to MongoDB: {err}")
            g.mongo_client = None # Đánh dấu là không kết nối được
        except Exception as e:
            print(f"ERROR: An unexpected error occurred with MongoDB: {e}")
            g.mongo_client = None
    return g.mongo_client

def get_db() -> Database | None:
    """Lấy database object từ client."""
    client = get_mongo_client()
    if client:
        db_name = current_app.config['MONGODB_DB_NAME']
        return client[db_name]
    return None

def close_mongo_client(e=None):
    """Đóng MongoDB client khi application context kết thúc."""
    client = g.pop('mongo_client', None)
    if client is not None:
        client.close()
        print("MongoDB connection closed.")

def init_app(app):
    """Đăng ký hàm close_mongo_client để chạy khi teardown app context."""
    app.teardown_appcontext(close_mongo_client)