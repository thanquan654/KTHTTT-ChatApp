from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
import datetime

app = Flask(__name__)
CORS(app)

# MongoDB Config
MONGO_URI = "mongodb+srv://Baotong0904:baotong2004@chatapp.5gbunmh.mongodb.net/?retryWrites=true&w=majority&appName=Chatapp"
client = MongoClient(MONGO_URI)
db = client["Chatapp"]
rooms = db["Rooms"]

# Helper to convert ObjectId to string
def convert_id(room):
    room["_id"] = str(room["_id"])
    return room

# -------------------------------
# GET /api/groups - Get user's groups
@app.route("/api/groups", methods=["GET"])
def get_user_groups():
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "Thiếu userId"}), 400

    group_list = list(rooms.find({"members": user_id}))
    return jsonify([convert_id(group) for group in group_list])

# -------------------------------
# POST /api/groups - Create new group
@app.route("/api/groups", methods=["POST"])
def create_group():
    data = request.json
    name = data.get("name")
    members = data.get("members")

    if not name or not isinstance(members, list):
        return jsonify({"error": "Thiếu tên hoặc members"}), 400

    new_group = {
        "name": name,
        "lastMessage": "",
        "members": members,
        "createdAt": datetime.datetime.utcnow().strftime("%Y-%m-%d")
    }

    result = rooms.insert_one(new_group)
    new_group["_id"] = str(result.inserted_id)
    return jsonify(new_group), 201

# -------------------------------
# GET /api/groups/<group_id> - Get group details
@app.route("/api/groups/<group_id>", methods=["GET"])
def get_group_details(group_id):
    group = rooms.find_one({"_id": ObjectId(group_id)})
    if not group:
        return jsonify({"error": "Group không tồn tại"}), 404
    return jsonify(convert_id(group))

# -------------------------------
# POST /api/groups/<group_id>/join - Join group
@app.route("/api/groups/<group_id>/join", methods=["POST"])
def join_group(group_id):
    user_id = request.json.get("userId")
    if not user_id:
        return jsonify({"error": "Thiếu userId"}), 400

    result = rooms.update_one(
        {"_id": ObjectId(group_id)},
        {"$addToSet": {"members": user_id}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Group không tồn tại"}), 404
    return jsonify({"message": "Đã tham gia group"})

# -------------------------------
# POST /api/groups/<group_id>/leave - Leave group
@app.route("/api/groups/<group_id>/leave", methods=["POST"])
def leave_group(group_id):
    user_id = request.json.get("userId")
    if not user_id:
        return jsonify({"error": "Thiếu userId"}), 400

    result = rooms.update_one(
        {"_id": ObjectId(group_id)},
        {"$pull": {"members": user_id}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Group không tồn tại"}), 404
    return jsonify({"message": "Đã rời khỏi group"})

# -------------------------------
if __name__ == "__main__":
    app.run(debug=True)
