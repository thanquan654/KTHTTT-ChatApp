from flask import Blueprint, request, jsonify
from datetime import datetime
from ..mongo import get_mongo_client
from bson import ObjectId

room_bp = Blueprint("message_api", __name__, url_prefix="/api/room")

def convert_id(room):
    room["_id"] = str(room["_id"])
    return room




# GET /api/room - Get user's groups - OK
@room_bp.route("/", methods=["GET"])
def get_user_room():
    db = get_mongo_client().Chatapp
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "Thiếu userId"}), 400

    room_list = list(db.rooms.find({"members": {"$in": [user_id]}}))
    return jsonify([convert_id(room) for room in room_list])


# POST /api/room - Create new group
@room_bp.route("/", methods=["POST"])
def create_group():
    db = get_mongo_client().Chatapp
    data = request.json
    name = data.get("name")
    members = data.get("members")

    if not name or not isinstance(members, list):
        return jsonify({"error": "Thiếu tên hoặc members"}), 400

    new_group = {
        "name": name,
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
