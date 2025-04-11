from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///chat.db'
db = SQLAlchemy(app)

# Model tin nhắn
class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, nullable=False)
    receiver_id = db.Column(db.Integer, nullable=False)
    content = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

# Tạo DB lần đầu
with app.app_context():
    db.create_all()

# Gửi tin nhắn
@app.route('/api/messages', methods=['POST'])
def send_message():
    data = request.get_json()
    message = Message(
        sender_id=data['senderId'],
        receiver_id=data['receiverId'],
        content=data['content']
    )
    db.session.add(message)
    db.session.commit()
    return jsonify({'message': 'Message sent successfully'}), 201

# Nhận tin nhắn giữa 2 người dùng
@app.route('/api/messages', methods=['GET'])
def get_messages():
    user1 = int(request.args.get('user1'))
    user2 = int(request.args.get('user2'))

    messages = Message.query.filter(
        ((Message.sender_id == user1) & (Message.receiver_id == user2)) |
        ((Message.sender_id == user2) & (Message.receiver_id == user1))
    ).order_by(Message.timestamp).all()

    return jsonify([
        {
            'id': m.id,
            'senderId': m.sender_id,
            'receiverId': m.receiver_id,
            'content': m.content,
            'timestamp': m.timestamp.isoformat()
        }
        for m in messages
    ])

if __name__ == '__main__':
    app.run(debug=True)
