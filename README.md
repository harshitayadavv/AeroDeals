# ✈️ SkyRacer

**An AI-powered gesture and voice controlled airplane game!**

SkyRacer is a full-stack game where you control an airplane using your **hand swipes** or **voice commands** — no keyboard needed. Built with React, FastAPI, MongoDB, MediaPipe, and WebSockets.

---

## 🎮 Live Demo

> Frontend: `http://localhost:5173`  
> Backend API: `http://localhost:8000`  
> API Docs: `http://localhost:8000/docs`

---

## 🚀 Features

### ✋ Gesture Controlled Mode (Swipe to fly!)

Control the airplane by swiping your hand in front of the camera.

**How it works:**
- Hold your hand still for ~1 second (camera learns your hand)
- Swipe **up** → airplane moves up
- Swipe **down** → airplane moves down
- Swipe **left** → airplane moves left
- Swipe **right** → airplane moves right
- Bring hand back to center → ready for next swipe

**Tech:** MOG2 background subtraction (OpenCV) tracks your swipe direction in real time. No skin color detection — works in any lighting.

---

### 🎤 Voice Controlled Mode

Control the airplane by speaking.

**Commands:** Say `"up"`, `"down"`, `"left"`, `"right"`

**Tech:** Web Speech API (Chrome) — works offline, no API key needed.

---

### 🏆 Obstacles to Avoid

| Obstacle | Icon |
|----------|------|
| Birds | 🦅 |
| Lightning | ⚡ |
| Clouds | ☁️ |
| UFOs | 🛸 |

Difficulty increases every 100 points — obstacles spawn faster and move quicker.

---

### 👤 User Profile & Achievements

- 📊 Separate stats for voice and gesture modes
- 🏅 8 unique achievement badges
- 🏆 High scores per game mode
- 📈 Progress bars toward legend status

**Achievements:**

| Badge | Requirement |
|-------|------------|
| 🎮 Sky Racer | Play your first game |
| 🎤 Voice Master | Win 5 voice games |
| ✋ Gesture Pro | Win 5 gesture games |
| 🏆 High Scorer | Reach 100 points |
| ⭐ Pro Pilot | Reach 500 points |
| 👑 Voice Legend | 1000 points in voice mode |
| 💎 Gesture Legend | 1000 points in gesture mode |
| ✈️ First Flight | Complete first search |

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Tailwind CSS, Canvas API, Vite |
| Backend | FastAPI, WebSockets, Motor (async MongoDB) |
| Gesture | OpenCV MOG2 background subtraction |
| Voice | Web Speech API |
| Auth | JWT + Google OAuth 2.0 + bcrypt |
| Database | MongoDB Atlas |
| Deploy | Docker, Docker Compose |

---

## ⚙️ Quick Start

### Prerequisites
- Node.js v16+
- Python 3.8+
- MongoDB Atlas account
- Chrome browser (for voice mode)
- Webcam (for gesture mode)

---

### Option A — Run with Docker (recommended)

```bash
git clone https://github.com/harshitayadavv/AeroDeals.git
cd AeroDeals

# Create backend .env
cp backend/.env.production.example backend/.env
# Edit backend/.env with your credentials

# Create frontend .env
echo "VITE_API_URL=http://localhost:8000" > frontend/.env
echo "VITE_GOOGLE_CLIENT_ID=your_google_client_id" >> frontend/.env

# Build and run
docker-compose up --build
```

- Frontend → http://localhost:3000
- Backend → http://localhost:8000

---

### Option B — Run locally

**Backend:**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create .env (see Environment Variables section below)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
```

---

### Environment Variables

**`backend/.env`**
```env
MONGODB_URI=your_mongodb_connection_string
DATABASE_NAME=skyracer
SECRET_KEY=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ENVIRONMENT=development
```

**`frontend/.env`**
```env
VITE_API_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

> Generate a secret key: `openssl rand -hex 32`

---

## 📁 Project Structure

```
AeroDeals/
├── docker-compose.yml
├── .gitignore
├── backend/
│   ├── dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── api.py
│   ├── games/
│   │   ├── gesture_game.py
│   │   ├── gesture_websocket.py
│   │   ├── voice_game.py
│   │   └── game_websocket.py
│   └── src/
│       ├── auth.py
│       ├── database.py
│       ├── models.py
│       └── utils.py
└── frontend/
    ├── dockerfile
    └── src/
        ├── components/
        │   ├── GestureGame.jsx
        │   ├── VoiceGame.jsx
        │   ├── GameZone.jsx
        │   ├── Login.jsx
        │   ├── Signup.jsx
        │   ├── Navbar.jsx
        │   ├── Profile.jsx
        │   └── Tabs.jsx
        ├── App.jsx
        └── main.jsx
```

---

## 🔒 Security

- JWT authentication with expiry
- Passwords hashed with bcrypt
- Google OAuth 2.0
- User data isolated per account in MongoDB
- Secrets via environment variables (never committed)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License

---

## 👥 Author

**Harshita Yadav**  
GitHub: [@harshitayadavv](https://github.com/harshitayadavv)

---

## 📊 Project Status

| Feature | Status |
|---------|--------|
| Voice Game | ✅ Complete |
| Gesture Game (Swipe) | ✅ Complete |
| User Profiles | ✅ Complete |
| Achievements | ✅ Complete |
| Docker Support | ✅ Complete |
| Global Leaderboard | 🔜 Coming Soon |
| Mobile App | 🔜 Coming Soon |

**Latest:** v2.0.0 — Swipe-based gesture control 🎉

---

⭐ **Star this repo if you find it helpful!**  
Made with ❤️ by Harshita Yadav