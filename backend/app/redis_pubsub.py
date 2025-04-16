# redis_pubsub.py
import json
import redis
import threading
import time
from flask import current_app
from .redis import get_redis, init_redis

def ensure_redis_connection():
    """Đảm bảo Redis connection còn sống, nếu không thì reconnect"""
    redis_client = get_redis()
    try:
        if redis_client:
            redis_client.ping()
            return redis_client
    except:
        print("Redis connection lost, attempting to reconnect...")
        init_redis()
        redis_client = get_redis()
        if redis_client:
            try:
                redis_client.ping()
                print("Redis reconnected successfully")
                return redis_client
            except:
                pass
    return None

def get_redis_pubsub_client():
    """Lấy Redis Pub/Sub client (khác với client Redis thông thường)."""
    redis_client = get_redis() # Sử dụng hàm get_redis() đã có để lấy Redis client
    if redis_client:
        return redis_client.pubsub() # Tạo Pub/Sub instance từ Redis client thông thường
    else:
        return None

def publish_event(channel: str, data: dict, max_retries=3):
    """Publish một sự kiện lên kênh Redis Pub/Sub với retry mechanism."""
    retries = 0
    while retries < max_retries:
        redis_client = ensure_redis_connection()
        if not redis_client:
            print(f"ERROR: Redis client not available, retry {retries + 1}/{max_retries}")
            retries += 1
            time.sleep(1)  # Đợi 1 giây trước khi thử lại
            continue

        try:
            message = json.dumps(data)
            redis_client.publish(channel, message)
            print(f"Published event to channel '{channel}': {data}")
            return True
        except redis.exceptions.ConnectionError as e:
            print(f"ERROR: Redis connection error (retry {retries + 1}/{max_retries}): {e}")
            retries += 1
            time.sleep(1)
        except Exception as e:
            print(f"ERROR: Unexpected error while publishing: {e}")
            retries += 1
            time.sleep(1)

    print(f"ERROR: Failed to publish after {max_retries} retries")
    return False

def subscribe_channel(channel: str, handler_function):
    """Subscribe vào kênh Redis Pub/Sub và xử lý sự kiện bằng handler_function."""
    pubsub_client = get_redis_pubsub_client()
    if not pubsub_client:
        print(f"ERROR: Cannot subscribe to channel '{channel}'.")
        return False

    try:
        pubsub_client.subscribe(channel)
        print(f"Subscribed to channel '{channel}'.")

        for message in pubsub_client.listen():
            if message['type'] == 'message':
                channel_name = message['channel'].decode('utf-8')
                message_data = message['data'].decode('utf-8')

                try:
                    # Parse JSON message
                    event_data = json.loads(message_data)
                    handler_function(event_data)
                except json.JSONDecodeError as e:
                    print(f"ERROR: Invalid JSON data from channel '{channel_name}': {e}")
                except Exception as e:
                    print(f"ERROR: Error processing message from channel '{channel_name}': {e}")

    except redis.exceptions.ConnectionError as e:
        print(f"ERROR: Redis connection error for channel '{channel}': {e}")
        return False
    except Exception as e:
        print(f"ERROR: Unexpected error for channel '{channel}': {e}")
        return False
    finally:
        if pubsub_client:
            pubsub_client.unsubscribe(channel)
            print(f"Unsubscribed from channel '{channel}'.")

def subscribe_in_background(channel: str, handler_function, socketio):
    """Chạy Redis subscription trong một thread riêng với auto-reconnect"""
    def run_subscription():
        while True:
            pubsub_client = None
            try:
                redis_client = ensure_redis_connection()
                if not redis_client:
                    print(f"ERROR: Cannot connect to Redis, retrying in 5 seconds...")
                    time.sleep(5)
                    continue

                pubsub_client = redis_client.pubsub()
                pubsub_client.subscribe(channel)
                print(f"Successfully subscribed to channel '{channel}'")

                for message in pubsub_client.listen():
                    if message['type'] == 'message':
                        try:
                            channel_name = message['channel']
                            message_data = message['data']

                            event_data = json.loads(message_data) if isinstance(message_data, str) else message_data
                            print(f"Received message on channel {channel}: {event_data}")

                            # Không cần app context vì chúng ta sử dụng socketio trực tiếp
                            handler_function(event_data)
                            print(f"Successfully processed message")

                        except json.JSONDecodeError as e:
                            print(f"ERROR: Invalid JSON data: {e}")
                            print(f"Raw message: {message}")
                        except Exception as e:
                            print(f"ERROR: Message processing error: {e}")
                            print(f"Message type: {type(message_data)}")
                            print(f"Raw message: {message}")

            except redis.exceptions.ConnectionError as e:
                print(f"ERROR: Redis connection lost: {e}")
            except Exception as e:
                print(f"ERROR: Unexpected error: {e}")
            finally:
                if pubsub_client:
                    try:
                        pubsub_client.unsubscribe(channel)
                        pubsub_client.close()
                    except:
                        pass
                print(f"Connection lost. Reconnecting in 5 seconds...")
                time.sleep(5)

    thread = threading.Thread(target=run_subscription, daemon=True)
    thread.start()
    return thread
