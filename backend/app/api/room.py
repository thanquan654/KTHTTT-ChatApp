import re
from flask import Blueprint, g, request, jsonify
from datetime import datetime

from ..helpers.auth.decorators import token_required
from ..models.user import UserInDB, UserPublic
from ..mongo import get_mongo_client
from bson import ObjectId
from ..helpers import convert_id, mongo_to_json

room_bp = Blueprint("room_api", __name__, url_prefix="/api/room")

# GET /api/room - Get user's groups
@room_bp.route("/", methods=["GET"])
def get_user_room():
    db = get_mongo_client().Chatapp
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "Thiếu userId"}), 400

    room_list = list(db.rooms.find({"members": {"$in": [ObjectId(user_id)]}}))

    for room in room_list:
        members_ids = room.get("members")
        members = list(db.users.find({"_id": {"$in": members_ids}}))
        room = convert_id(room)
        room["members"] = mongo_to_json([convert_id(member) for member in members])


    return jsonify(mongo_to_json([convert_id(room) for room in room_list]))

# GET /api/room/<room_id> - Get group details and messages
@room_bp.route("/<room_id>", methods=["GET"])
def get_room_detail(room_id):
    db = get_mongo_client().Chatapp
    limit = int(request.args.get("limit", 20))
    before_timestamp_str = request.args.get("before")

    room = db.rooms.find_one({"_id": ObjectId(room_id)})
    if not room:
        return jsonify({"error": "Group không tồn tại", "errorCode": "GROUP_NOT_FOUND"}), 404

    members_ids = room.get("members")
    members = list(db.users.find({"_id": {"$in": members_ids}}))
    room = convert_id(room)
    room["members"] = mongo_to_json([convert_id(member) for member in members])

    query = {"roomId": ObjectId(room_id)}
    if before_timestamp_str:
        before_timestamp = datetime.fromisoformat(before_timestamp_str.replace('Z', '+00:00'))
        query["createdAt"] = {"$lt": before_timestamp}

    messages = list(
        db.messages.find(query)
        .sort("createdAt", -1)
        .limit(limit)
    )


    messages.reverse()

    return jsonify(mongo_to_json({
        "room": (room),
        "messages": [(msg) for msg in messages]
    }))

# POST /api/room - Create new room
@room_bp.route("/", methods=["POST"])
def create_group():
    db = get_mongo_client().Chatapp
    data = request.json
    name = data.get("name")
    members = data.get("members")
    type = data.get("type")

    if not name or not isinstance(members, list) or not type:
        return jsonify({"error": "Thiếu tên hoặc members"}), 400

    new_group = {
        "name": name,
        'type': type,
        "lastMessage": "",
        "members": [ObjectId(member) for member in members],
        "createdAt": datetime.now()
    }

    result = db.rooms.insert_one(new_group)
    new_group["_id"] = str(result.inserted_id)
    return jsonify(mongo_to_json(new_group)), 201

# POST /api/room/<group_id>/join - Join group
@room_bp.route("/<room_id>/join", methods=["POST"])
def join_group(room_id):
    db = get_mongo_client().Chatapp
    user_id = request.json.get("userId")
    if not user_id:
        return jsonify({"error": "Thiếu userId"}), 400

    result = db.rooms.update_one(
        {"_id": ObjectId(room_id)},
        {"$addToSet": {"members": ObjectId(user_id)}}
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
        {"$pull": {"members": ObjectId(user_id)}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Group không tồn tại"}), 404
    return jsonify({"message": "Đã rời khỏi group"})

@room_bp.route('/users/search', methods=['GET'])
# @token_required # Chỉ user đã đăng nhập mới được tìm kiếm
def search_users():
    """Endpoint tìm kiếm user theo username."""
    db = get_mongo_client().Chatapp
    query = request.args.get('q', '')

    if not query or len(query) < 2:
        return jsonify({"message": "Search query must be at least 2 characters long"}), 400

    # # Lấy user ID hiện tại từ context g (được set bởi @token_required)
    # current_user: UserPublic = g.current_user
    # if not current_user:
    #      # Lỗi này không nên xảy ra nếu @token_required hoạt động đúng
    #     return jsonify({"message": "Could not identify current user"}), 401

    # Gọi hàm service để tìm kiếm
    try:
        regex_query = re.compile(f'.*{re.escape(query)}.*', re.IGNORECASE)

        # Chỉ lấy các trường cần thiết từ DB để tạo UserPublic (tối ưu)
        projection = {
            "_id": 1,
            "name": 1,
            "email": 1, # Lấy cả email vì UserPublic có thể cần
            "roles": 1,
            "created_at": 1
            # Không lấy hashed_password
        }

        cursor = db.users.find(
            {
                "name": regex_query,
                # "_id": {"$ne": current_oid} # $ne: not equal - Loại trừ user hiện tại
            },
            projection # Chỉ lấy các trường đã định nghĩa
        )

        users_found = []
        for user_data in cursor:
            try:
                users_found.append(user_data)
            except Exception as e:
                print(f"Error validating user data during search for user {user_data.get('_id')}: {e}")
    except Exception as e:
        print(f"Error during user search: {e}")
        return jsonify({"message": "An error occurred during search"}), 500

    return jsonify(mongo_to_json(users_found)), 200
