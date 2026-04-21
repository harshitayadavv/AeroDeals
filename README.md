# ✈️ SkyRacer

**An AI-powered gesture and voice controlled airplane game!**

Control an airplane using **hand swipes** or **voice commands** — no keyboard needed.

## 🌐 Live Demo

| | Link |
|--|------|
| 🎮 **Frontend** | [sky-racer.vercel.app](https://sky-racer.vercel.app) |
| ⚙️ **Backend API** | [skyracer.onrender.com](https://skyracer.onrender.com) |
| 📖 **API Docs** | [skyracer.onrender.com/docs](https://skyracer.onrender.com/docs) |

> ⚠️ Backend is on Render free tier — first load may take 30–60 seconds to wake up.

---

## 🚀 Features

### ✋ Gesture Controlled Mode

Control the airplane by swiping your hand in front of the camera.

- Swipe **UP** → airplane moves up
- Swipe **DOWN** → airplane moves down
- Swipe **LEFT** → airplane moves left
- Swipe **RIGHT** → airplane moves right

**Tech:** MediaPipe Hand Landmarker runs entirely in the browser — no server processing needed.

---

### 🎤 Voice Controlled Mode

Control the airplane by speaking.

**Commands:** Say `"up"`, `"down"`, `"left"`, `"right"`

**Tech:** Web Speech API — works in Chrome, no API key needed.

---

### 🏆 Obstacles to Avoid

| Obstacle | Icon |
|----------|------|
| Birds | 🦅 |
| Lightning | ⚡ |
| Clouds | ☁️ |
| UFOs | 🛸 |

Difficulty increases every 100 points.

---

### 👤 User Profile & Achievements

- 📊 Separate stats for voice and gesture modes
- 🏅 8 unique achievement badges
- 🏆 High scores per game mode
- 📈 Progress bars toward legend status

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
| Gesture | MediaPipe Hand Landmarker (browser-side) |
| Voice | Web Speech API |
| Auth | JWT + Google OAuth 2.0 + bcrypt |
| Database | MongoDB Atlas |
| Hosting | Vercel (frontend) + Render (backend) |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v16+
- Python 3.8+
- MongoDB Atlas account
- Chrome browser
- Webcam + Microphone

---

### Option A — Docker (easiest)

Make sure [Docker Desktop](https://www.docker.com/products/docker-desktop/) is installed and running.

```bash
# Clone the repo
git clone https://github.com/harshitayadavv/SkyRacer.git
cd SkyRacer

# Create backend .env
cp backend/.env.production.example backend/.env
# Edit backend/.env with your credentials

# Create frontend .env
echo "VITE_API_URL=http://localhost:8000" > frontend/.env
echo "VITE_GOOGLE_CLIENT_ID=your_google_client_id" >> frontend/.env

# Build and start everything
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

```bash
# Stop everything
docker-compose down

# Rebuild after code changes
docker-compose up --build

# Run in background
docker-compose up -d
```

---

### Option B — Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt

# Create backend/.env (see Environment Variables below)
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend (new terminal):**
```bash
cd frontend
npm install

# Create frontend/.env (see Environment Variables below)
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

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

> Generate a secret key: `openssl rand -hex 32`

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 📁 Project Structure

```
SkyRacer/
├── docker-compose.yml
├── README.md
├── .gitignore
├── backend/
│   ├── dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── api.py
│   ├── .env.production.example
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
    ├── package.json
    └── src/
        ├── components/
        │   ├── GestureGame.jsx
        │   ├── VoiceGame.jsx
        │   ├── GameZone.jsx
        │   ├── Login.jsx
        │   ├── Signup.jsx
        │   ├── Navbar.jsx
        │   └── Profile.jsx
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
3. Commit: `git commit -m "add your feature"`
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
| Gesture Game | ✅ Complete |
| User Profiles | ✅ Complete |
| Achievements | ✅ Complete |
| Docker Support | ✅ Complete |
| Deployed (Vercel + Render) | ✅ Live |
| Global Leaderboard | 🔜 Coming Soon |
| Mobile App | 🔜 Coming Soon |

**Latest:** v2.0.0 — Browser-based gesture detection 🎉

---

⭐ **Star this repo if you find it helpful!**
Made with ❤️ by Harshita Yadav