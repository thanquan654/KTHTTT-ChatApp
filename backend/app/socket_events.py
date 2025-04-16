from bson import ObjectId
from flask_socketio import emit, join_room, leave_room
from flask import request, current_app
from datetime import datetime
import logging
import uuid
import json

from .mongo import get_mongo_client
from .redis_pubsub import publish_event, subscribe_channel, subscribe_in_background
from .constants import REDIS_CHANNELS

logger = logging.getLogger(__name__)

class SocketStore:
    def __init__(self):
        self.online_users = {}
        self.typing_users = {}

def register_socket_events(socketio):
    store = SocketStore()
    subscription_threads = []

    # Handler cho user status events
    def handle_redis_user_status(message):
        try:
            event_type = message.get('event')
            event_data = message.get('data')

            if event_type == 'user_online':
                socketio.emit('user_online', event_data)
            elif event_type == 'user_offline':
                socketio.emit('user_offline', event_data)
        except Exception as e:
            logger.error(f"Redis user status handling error: {str(e)}")

    # Handler cho room events
    def handle_redis_room_events(message):
        try:
            event_type = message.get('event')
            event_data = message.get('data')
            room_id = event_data.get('roomId')

            if event_type == 'room_subscribed':
                socketio.emit('room_subscribed', event_data, room=room_id)
            elif event_type == 'room_unsubscribed':
                socketio.emit('room_unsubscribed', event_data, room=room_id)
        except Exception as e:
            logger.error(f"Redis room events handling error: {str(e)}")

    # Handler cho message events
    def handle_redis_message_events(message):
        try:
            event_type = message.get('event')
            event_data = message.get('data')
            room_id = event_data.get('roomId')

            if event_type == 'new_message':
                socketio.emit('new_message', event_data, room=room_id)
            elif event_type == 'message_read':
                socketio.emit('message_read', event_data, room=room_id)
        except Exception as e:
            logger.error(f"Redis message events handling error: {str(e)}")

    # Handler cho typing events
    def handle_redis_typing_events(message):
        try:
            event_data = message.get('data')
            room_id = event_data.get('roomId')
            socketio.emit('typing_status', event_data, room=room_id)
        except Exception as e:
            logger.error(f"Redis typing events handling error: {str(e)}")

    # Subscribe to all channels
    subscription_threads.extend([
        subscribe_in_background(REDIS_CHANNELS['USER_STATUS'], handle_redis_user_status, socketio),
        subscribe_in_background(REDIS_CHANNELS['ROOM_EVENTS'], handle_redis_room_events, socketio),
        subscribe_in_background(REDIS_CHANNELS['MESSAGE_EVENTS'], handle_redis_message_events, socketio),
        subscribe_in_background(REDIS_CHANNELS['TYPING_EVENTS'], handle_redis_typing_events, socketio)
    ])

    @socketio.on('connect')
    def handle_connect():
        db = get_mongo_client().Chatapp
        try:
            user_id = request.args.get('user_id')
            print(f"Socket connection attempt from user_id: {user_id}, sid: {request.sid}")

            if not user_id:
                raise ValueError("user_id is required")

            store.online_users[user_id] = request.sid
            print(f"User {user_id} connected with socket id {request.sid}")
            print(f"Current online users: {store.online_users}")

            # Update MongoDB status
            db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"status": 'online'}}
            )

            # Publish to Redis
            success = publish_event(REDIS_CHANNELS['USER_STATUS'], {
                'event': 'user_online',
                'data': {
                    'user_id': user_id,
                    'timestamp': datetime.now().isoformat()
                }
            })

            if success:
                print(f"Successfully published user_online event for user {user_id}")
            else:
                print(f"Failed to publish user_online event for user {user_id}")

            logger.info(f'Client connected. User ID: {user_id}')

        except Exception as e:
            logger.error(f"Connection error: {str(e)}")
            print(f"Connection error: {e}")

    @socketio.on('disconnect')
    def handle_disconnect():
        db = get_mongo_client().Chatapp
        try:
            user_id = None
            for uid, sid in store.online_users.items():
                if sid == request.sid:
                    user_id = uid
                    break

            if user_id:
                del store.online_users[user_id]

                # Update MongoDB status
                db.users.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {"status": 'offline'}}
                )

                # Publish to Redis
                success = publish_event(REDIS_CHANNELS['USER_STATUS'], {
                    'event': 'user_offline',
                    'data': {
                        'user_id': user_id,
                        'timestamp': datetime.now().isoformat()
                    }
                })

                if success:
                    print(f"Successfully published user_offline event for user {user_id}")
                else:
                    print(f"Failed to publish user_offline event for user {user_id}")

            logger.info(f'Client disconnected. User ID: {user_id}')

        except Exception as e:
            logger.error(f"Disconnection error: {str(e)}")
            print(f"Disconnection error: {e}")

    @socketio.on('subscribe_room')
    def handle_subscribe_room(data):
        try:
            room_id = data.get('roomId')
            user_id = data.get('userId')

            if not room_id or not user_id:
                raise ValueError("roomId and userId are required")

            join_room(room_id)
            if room_id not in store.typing_users:
                store.typing_users[room_id] = set()

            success = publish_event(REDIS_CHANNELS['ROOM_EVENTS'], {
                'event': 'room_subscribed',
                'data': {
                    'roomId': room_id,
                    'userId': user_id,
                    'timestamp': datetime.now().isoformat()
                }
            })
            logger.info(f"User {user_id} subscribed to room {room_id}")
        except Exception as e:
            logger.error(f"Room subscription error: {str(e)}")
            socketio.emit('error', {'message': str(e)}, room=request.sid)

    @socketio.on('unsubscribe_room')
    def handle_unsubscribe_room(data):
        try:
            room_id = data.get('roomId')
            user_id = data.get('userId')

            if not room_id or not user_id:
                raise ValueError("roomId and userId are required")

            leave_room(room_id)

            # Remove user from room's typing users if present
            if room_id in store.typing_users:
                store.typing_users[room_id].discard(user_id)

            success = publish_event(REDIS_CHANNELS['ROOM_EVENTS'], {
                'event': 'room_unsubscribed',
                'data': {
                    'roomId': room_id,
                    'userId': user_id,
                    'timestamp': datetime.now().isoformat()
                }
            })
            logger.info(f"User {user_id} unsubscribed from room {room_id}")
        except Exception as e:
            logger.error(f"Room unsubscription error: {str(e)}")
            socketio.emit('error', {'message': str(e)}, room=request.sid)

    @socketio.on('message')
    def handle_message(data):
        try:
            room_id = data.get('roomId')
            sender_id = data.get('senderId')
            content = data.get('content')

            if not all([room_id, sender_id, content]):
                raise ValueError("roomId, senderId, and content are required")

            message = {
                '_id': str(uuid.uuid4()),
                'roomId': room_id,
                'senderId': sender_id,
                'content': content,
                'createdAt': datetime.now().timestamp(),
                'readBy': [sender_id],
            }

            success = publish_event(REDIS_CHANNELS['MESSAGE_EVENTS'], {
                'event': 'new_message',
                'data': message
            })
            logger.info(f"Message sent in room {room_id} by user {sender_id}")
        except Exception as e:
            logger.error(f"Message handling error: {str(e)}")
            socketio.emit('error', {'message': str(e)}, room=request.sid)

    @socketio.on('typing')
    def handle_typing(data):
        try:
            db = get_mongo_client().Chatapp
            room_id = data.get('roomId')
            user_id = data.get('userId')
            is_typing = data.get('isTyping', False)

            if not room_id or not user_id:
                raise ValueError("roomId and userId are required")

            if is_typing:
                if room_id not in store.typing_users:
                    store.typing_users[room_id] = set()
                store.typing_users[room_id].add(user_id)
            else:
                if room_id in store.typing_users:
                    store.typing_users[room_id].discard(user_id)

            db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"typing": is_typing}})

            success = publish_event(REDIS_CHANNELS['TYPING_EVENTS'], {
                'event': 'typing_status',
                'data': {
                    'roomId': room_id,
                    'userId': user_id,
                    'isTyping': is_typing,
                    'timestamp': datetime.now().isoformat()
                }
            })
            logger.info(f"Typing status updated for user {user_id} in room {room_id}")
        except Exception as e:
            logger.error(f"Typing handling error: {str(e)}")
            socketio.emit('error', {'message': str(e)}, room=request.sid)

    @socketio.on('read_message')
    def handle_read_message(data):
        try:
            db = get_mongo_client().Chatapp
            message_id = data.get('messageId')
            user_id = data.get('userId')
            room_id = data.get('roomId')

            if not all([message_id, user_id, room_id]):
                raise ValueError("messageId, userId, and roomId are required")

            db.messages.update_one(
                {"_id": ObjectId(message_id)},
                {"$addToSet": {"readBy": user_id}}
            )

            success = publish_event(REDIS_CHANNELS['MESSAGE_EVENTS'], {
                'event': 'message_read',
                'data': {
                    'messageId': message_id,
                    'userId': user_id,
                    'roomId': room_id,
                    'timestamp': datetime.now().isoformat()
                }
            })
            logger.info(f"Message {message_id} read by user {user_id} in room {room_id}")
        except Exception as e:
            logger.error(f"Read message handling error: {str(e)}")
            socketio.emit('error', {'message': str(e)}, room=request.sid)
