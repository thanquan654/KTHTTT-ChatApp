from flask_socketio import emit, join_room, leave_room
from flask import request
from datetime import datetime
import logging
import uuid

logger = logging.getLogger(__name__)

class SocketStore:
    def __init__(self):
        self.online_users = {}
        self.typing_users = {}

def register_socket_events(socketio):
    store = SocketStore()

    def emit_with_error_handling(event, data, **kwargs):
        try:
            emit(event, data, **kwargs)
        except Exception as e:
            logger.error(f"Error emitting {event}: {str(e)}")
            emit('error', {'message': str(e)})

    @socketio.on('connect')
    def handle_connect():
        try:
            user_id = request.args.get('user_id')
            if not user_id:
                raise ValueError("user_id is required")

            store.online_users[user_id] = request.sid
            emit_with_error_handling('user_online', {
                'user_id': user_id,
                'timestamp': datetime.now().isoformat()
            }, broadcast=True)

            logger.info(f'Client connected. User ID: {user_id}')
        except Exception as e:
            logger.error(f"Connection error: {str(e)}")

    @socketio.on('disconnect')
    def handle_disconnect():
        try:
            user_id = None
            for uid, sid in store.online_users.items():
                if sid == request.sid:
                    user_id = uid
                    break

            if user_id:
                del store.online_users[user_id]
                emit_with_error_handling('user_offline', {
                    'user_id': user_id,
                    'timestamp': datetime.now().isoformat()
                }, broadcast=True)

            logger.info(f'Client disconnected. User ID: {user_id}')
        except Exception as e:
            logger.error(f"Disconnection error: {str(e)}")

    @socketio.on('subscribe_room')
    def handle_subscribe_room(data):
        try:
            room_id = data.get('roomId')
            user_id = data.get('userId')

            if not room_id or not user_id:
                raise ValueError("roomId and userId are required")

            join_room(room_id)

            # Add user to room members list if needed
            if room_id not in store.typing_users:
                store.typing_users[room_id] = set()

            emit_with_error_handling('room_subscribed', {
                'roomId': room_id,
                'userId': user_id,
                'timestamp': datetime.now().isoformat()
            }, room=room_id)

            logger.info(f"User {user_id} subscribed to room {room_id}")
        except Exception as e:
            logger.error(f"Room subscription error: {str(e)}")
            emit('error', {'message': str(e)})

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

            emit_with_error_handling('room_unsubscribed', {
                'roomId': room_id,
                'userId': user_id,
                'timestamp': datetime.now().isoformat()
            }, room=room_id)

            logger.info(f"User {user_id} unsubscribed from room {room_id}")
        except Exception as e:
            logger.error(f"Room unsubscription error: {str(e)}")
            emit('error', {'message': str(e)})

    @socketio.on('message')
    def handle_message(data):
        try:
            print(type(data))
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

            emit_with_error_handling('new_message', message, room=room_id)

            logger.info(f"Message sent in room {room_id} by user {sender_id}")
        except Exception as e:
            logger.error(f"Message handling error: {str(e)}")

    @socketio.on('typing')
    def handle_typing(data):
        try:
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

            emit_with_error_handling('typing_status', {
                'roomId': room_id,
                'userId': user_id,
                'isTyping': is_typing,
                'timestamp': datetime.now().isoformat()
            }, room=room_id)
            logger.info(f"Typing status updated for user {user_id} in room {room_id}")
        except Exception as e:
            logger.error(f"Typing handling error: {str(e)}")

    @socketio.on('read_message')
    def handle_read_message(data):
        try:
            message_id = data.get('messageId')
            user_id = data.get('userId')
            room_id = data.get('roomId')

            if not all([message_id, user_id, room_id]):
                raise ValueError("messageId, userId, and roomId are required")

            emit_with_error_handling('message_read', {
                'messageId': message_id,
                'userId': user_id,
                'roomId': room_id,
                'timestamp': datetime.now().isoformat()
            }, room=room_id)
            logger.info(f"Message {message_id} read by user {user_id} in room {room_id}")
        except Exception as e:
            logger.error(f"Read message handling error: {str(e)}")
