import redis
from flask import current_app, g
from .helpers.auth.config import settings

def get_redis():
    """Lấy Redis client từ application context"""
    if 'redis_client' not in g:
        redis_url = settings.REDIS_URL
        try:
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
    """Đóng Redis client khi request kết thúc"""
    redis_client = g.pop('redis_client', None)
    if redis_client is not None:
        try:
            redis_client.close()
        except:
            pass
