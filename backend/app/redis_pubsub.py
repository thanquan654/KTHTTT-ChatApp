# redis_pubsub.py
import redis
from flask import current_app # Import current_app để log
from .redis import get_redis

def get_redis_pubsub_client():
    """Lấy Redis Pub/Sub client (khác với client Redis thông thường)."""
    redis_client = get_redis() # Sử dụng hàm get_redis() đã có để lấy Redis client
    if redis_client:
        return redis_client.pubsub() # Tạo Pub/Sub instance từ Redis client thông thường
    else:
        return None

def publish_event(channel: str, data: dict):
    """Publish một sự kiện lên kênh Redis Pub/Sub."""
    redis_client = get_redis() # Lấy Redis client
    if not redis_client:
        print(f"ERROR: Redis client not available, cannot publish event to channel '{channel}'.")
        return False # Hoặc raise exception nếu cần

    try:
        # Serialize data thành JSON string trước khi publish (nếu cần phức tạp hơn string)
        # import json
        # message = json.dumps(data)
        message = str(data) # Đơn giản hóa ban đầu, publish data dạng string
        redis_client.publish(channel, message)
        print(f"Published event to channel '{channel}': {data}")
        return True
    except redis.exceptions.ConnectionError as e:
        print(f"ERROR: Redis connection error while publishing to channel '{channel}': {e}")
        return False
    except Exception as e:
        print(f"ERROR: Unexpected error while publishing to channel '{channel}': {e}")
        return False

def subscribe_channel(channel: str, handler_function):
    """Subscribe vào kênh Redis Pub/Sub và xử lý sự kiện bằng handler_function."""
    pubsub_client = get_redis_pubsub_client() # Lấy Pub/Sub client
    if not pubsub_client:
        print(f"ERROR: Cannot subscribe to channel '{channel}' because Redis Pub/Sub client is not available.")
        return False

    try:
        pubsub_client.subscribe(channel)
        print(f"Subscribed to channel '{channel}'.")

        # Lặp vô hạn để lắng nghe tin nhắn từ kênh
        for message in pubsub_client.listen():
            if message['type'] == 'message':
                channel_name = message['channel'].decode('utf-8') # Decode channel name
                message_data = message['data'].decode('utf-8') # Decode message data (string)
                print(f"Received message from channel '{channel_name}': {message_data}")
                try:
                    # Deserialize message data về dictionary nếu publish dạng JSON
                    # import json
                    # event_data = json.loads(message_data)
                    event_data = message_data # Đơn giản hóa, message_data là string
                    handler_function(event_data) # Gọi handler function để xử lý sự kiện
                except Exception as e:
                    print(f"ERROR: Error processing message from channel '{channel_name}': {e}")

    except redis.exceptions.ConnectionError as e:
        print(f"ERROR: Redis connection error while subscribing to channel '{channel}': {e}")
        return False
    except Exception as e:
        print(f"ERROR: Unexpected error while subscribing to channel '{channel}': {e}")
        return False
    finally:
        if pubsub_client:
            pubsub_client.unsubscribe(channel) # Đảm bảo unsubscribe khi có lỗi hoặc kết thúc
            print(f"Unsubscribed from channel '{channel}'.")
