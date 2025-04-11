from flask import Blueprint, request, jsonify
from datetime import datetime
from ..mongo import get_mongo_client
from bson import ObjectId

room_bp = Blueprint("message_api", __name__, url_prefix="/api/room")

def convert_id(room):
    room["_id"] = str(room["_id"])
    return room

# GET /api/room - Get user's groups
@room_bp.route("/", methods=["GET"])
def get_user_room():
    db = get_mongo_client().Chatapp
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "Thiếu userId"}), 400

    room_list = list(db.rooms.find({"members": {"$in": [user_id]}}))
    return jsonify([convert_id(room) for room in room_list])

# GET /api/room/<room_id> - Get group details and messages
@room_bp.route("/<room_id>", methods=["GET"])
def get_room_detail(room_id):
    db = get_mongo_client().Chatapp
    limit = int(request.args.get("limit", 20))
    before_timestamp_str = request.args.get("before")

    room = db.rooms.find_one({"_id": ObjectId(room_id)})
    if not room:
        return jsonify({"error": "Group không tồn tại", "errorCode": "GROUP_NOT_FOUND"}), 404

    query = {"groupId": room_id}
    if before_timestamp_str:
        before_timestamp = datetime.fromisoformat(before_timestamp_str.replace('Z', '+00:00'))
        query["createdAt"] = {"$lt": before_timestamp}

    messages = list(
        db.messages.find(query)
        .sort("createdAt", -1)
        .limit(limit)
    )


    messages.reverse()

    return jsonify({
        "room": convert_id(room),
        "messages": [convert_id(msg) for msg in messages]
    })

# POST /api/room - Create new room
@room_bp.route("/", methods=["POST"])
def create_group():
    db = get_mongo_client().Chatapp
    data = request.json
    name = data.get("name")
    members = data.get("members")
    type = data.get("type")

    if not name or not isinstance(members, list):
        return jsonify({"error": "Thiếu tên hoặc members"}), 400

    new_group = {
        "name": name,
        'type': type,
        "lastMessage": "",
        "members": members,
        "createdAt": datetime.now()
    }

    result = db.rooms.insert_one(new_group)
    new_group["_id"] = str(result.inserted_id)
    return jsonify(new_group), 201

# POST /api/room/<group_id>/join - Join group
@room_bp.route("/<room_id>/join", methods=["POST"])
def join_group(room_id):
    db = get_mongo_client().Chatapp
    user_id = request.json.get("userId")
    if not user_id:
        return jsonify({"error": "Thiếu userId"}), 400

    result = db.rooms.update_one(
        {"_id": ObjectId(room_id)},
        {"$addToSet": {"members": user_id}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Group không tồn tại"}), 404
    return jsonify({"message": "Đã tham gia group"})

# POST /api/groups/<group_id>/leave - Leave group
@room_bp.route("/<room_id>/leave", methods=["POST"])
def leave_group(room_id):
    db = get_mongo_client().Chatapp
    user_id = request.json.get("userId")
    if not user_id:
        return jsonify({"error": "Thiếu userId"}), 400

    result = db.rooms.update_one(
        {"_id": ObjectId(room_id)},
        {"$pull": {"members": user_id}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Group không tồn tại"}), 404
    return jsonify({"message": "Đã rời khỏi group"})
