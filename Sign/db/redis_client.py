import redis # type: ignore
from flask import current_app, g # type: ignore

def get_redis() -> redis.Redis | None:
    """Lấy Redis client từ application context g nếu có, hoặc tạo mới."""
    if 'redis_client' not in g:
        redis_url = current_app.config['REDIS_URL']
        try:
            # decode_responses=True để làm việc với string thay vì bytes
            g.redis_client = redis.from_url(redis_url, decode_responses=True)
            g.redis_client.ping()
            print("Redis client connected.")
        except redis.exceptions.ConnectionError as err:
            print(f"ERROR: Could not connect to Redis: {err}")
            g.redis_client = None
        except Exception as e:
            print(f"ERROR: An unexpected error occurred with Redis: {e}")
            g.redis_client = None
    return g.redis_client

def close_redis_client(e=None):
    """Đóng Redis client khi app context kết thúc (thường không cần thiết với pool)."""
    client = g.pop('redis_client', None)
    # redis-py tự quản lý pool, không cần đóng explicit connection trừ khi cần
    # if client is not None:
    #     client.close() # Không cần thiết
    #     print("Redis connection closed.")
    pass # Chỉ cần pop khỏi g

def init_app(app):
    """Đăng ký hàm close_redis_client để chạy khi teardown app context."""
    app.teardown_appcontext(close_redis_client)