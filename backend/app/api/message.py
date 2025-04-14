from flask import Blueprint, request, jsonify
from datetime import datetime
from ..mongo import get_mongo_client
from bson import ObjectId
from ..helpers import convert_id, mongo_to_json

message_bp = Blueprint("message_api", __name__, url_prefix="/api/message")

@message_bp.route("/", methods=["POST"])
def send_message():
    db = get_mongo_client().Chatapp
    data = request.json
    room_id = data.get("roomId")
    sender_id = data.get("senderId")
    content = data.get("content")

    if not room_id or not sender_id or not content:
        return jsonify({"error": "Thiếu groupId, senderId hoặc content", "errorCode": "MISSING_REQUIRED_FIELDS"}), 400

    new_message = {
        "roomId": ObjectId(room_id),
        "senderId": ObjectId(sender_id),
        "content": content,
        "readBy": [],
        "createdAt": datetime.now().timestamp()
    }

    result = db.messages.insert_one(new_message)
    new_message["_id"] = str(result.inserted_id)

    # TODO: Publish event 'new_message' to Redis Pub/Sub for real-time push
    # You will add this part when integrating with Websocket and Redis

    return jsonify(mongo_to_json(convert_id(new_message))), 201

# POST /api/message/<message_id>/read - Mark message as read
@message_bp.route("/<message_id>/read", methods=["POST"])
def mark_message_read(message_id):
    db = get_mongo_client().Chatapp
    user_id = request.json.get("userId") # Expect userId in request body
    if not user_id:
        return jsonify({"error": "Thiếu userId", "errorCode": "MISSING_USER_ID"}), 400

    message = db.messages.find_one({"_id": ObjectId(message_id)})
    if not message:
        return jsonify({"error": "Tin nhắn không tồn tại", "errorCode": "MESSAGE_NOT_FOUND"}), 404

    if user_id in message.get("readBy", []): # Check if already marked as read by this user
        return jsonify({"message": "Tin nhắn đã được đánh dấu là đã đọc bởi người dùng này", "errorCode": "ALREADY_MARKED_READ"}), 200 # Or 204 No Content if you prefer no body

    result = db.messages.update_one(
        {"_id": ObjectId(message_id)},
        {"$addToSet": {"readBy": ObjectId(user_id)}} # Use $addToSet to avoid duplicates
    )

    if result.modified_count == 0: # Check if update actually happened (should happen unless already read - handled above)
        return jsonify({"message": "Không thể đánh dấu tin nhắn là đã đọc", "errorCode": "MARK_READ_FAILED"}), 500 # Or different error code if you can pinpoint why

    # **TODO: Publish event 'message_read' to Redis Pub/Sub for real-time update**
    # You will add this part when integrating with Websocket and Redis

    return jsonify({"message": "Đã đánh dấu tin nhắn là đã đọc"}) # Or return updated message if you want more data
