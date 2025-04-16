import redis
from flask import current_app, g
from .helpers.auth.config import settings

_redis_client = None

def init_redis():
    """Khởi tạo Redis client một lần duy nhất khi start server"""
    global _redis_client
    redis_url = settings.REDIS_URL
    try:
        print(f"Connecting to Redis at {redis_url}")
        _redis_client = redis.from_url(redis_url, decode_responses=True)
        _redis_client.ping()
        print("Redis client connected.")
    except redis.exceptions.ConnectionError as err:
        print(f"ERROR: Could not connect to Redis: {err}")
        _redis_client = None
    except Exception as e:
        print(f"ERROR: An unexpected error occurred with Redis: {e}")
        _redis_client = None

def get_redis():
    """Lấy Redis client từ global variable hoặc tạo mới nếu chưa có"""
    global _redis_client
    if _redis_client is None:
        init_redis()
    return _redis_client

def close_redis_client():
    """Đóng Redis client khi shutdown server"""
    global _redis_client
    if _redis_client is not None:
        try:
            _redis_client.close()
            _redis_client = None
        except:
            pass
