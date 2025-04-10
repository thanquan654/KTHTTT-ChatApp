# Tech Stack
- 🎯 Frontend: React
- 🔥 Backend: Flask (Python)
- 📡 WebSocket: Flask-SocketIO
- 🧠 MongoDB: Lưu trữ tin nhắn, nhóm
- ⚡ Redis: Pub/Sub hỗ trợ realtime, session scaling
# ⚙️ Cài đặt & chạy


### 1. Clone repository
```bash
git clone https://github.com/thanquan654/KTHTTT-ChatApp.git
cd KTHTTT-ChatApp
```

### 2. Phần Backend (Flask)
1. Cài đặt môi trường ảo và thư viện
```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

2. Chạy server
```bash
python ./backend/run.py
```

### 3. Phần Frontend (React)
1. Cài đặt thư viện React
```bash
cd frontend
npm install
```
2. Chạy frontend
```bash
npm run dev
```
