# ✈️ AeroDeals

**Find the best flight deals and play interactive AI-powered games!**

AeroDeals is a full-stack application that combines flight search functionality with innovative voice and gesture-controlled games. Built with React, FastAPI, MongoDB, Web Speech API, and MediaPipe technologies.

---

## 🚀 Features

### ✈️ Flight Search Module
- **🔐 User Authentication** - Secure JWT-based login/signup with Google OAuth
- **👤 User Profiles** - Personalized search history and user dashboard
- **🔎 Smart City Search** - Search by city names or airport codes with autocomplete
- **💰 Price Analysis** - View lowest, average, and total flights found
- **📜 Search History** - Auto-saves all searches for 7 days (user-specific)
- **⭐ Save Searches** - Bookmark your favorite searches permanently
- **🗄️ MongoDB Integration** - Persistent storage with user isolation
- **📊 Detailed View** - Click to see complete flight listings
- **🧠 Smart Analysis** - Get insights on best deals

### 🎮 Game Zone - Sky Racer

#### 🎤 Voice Controlled Mode
- **Real-time Speech Recognition** via Web Speech API
- **Instant Response** to voice commands ("up", "down", "left", "right")
- **Navigate an airplane** through obstacles with your voice
- **Progressive Difficulty** with speed multipliers
- **Score Tracking** and high score persistence per user

#### ✋ Gesture Controlled Mode
- **Hand Gesture Recognition** via MediaPipe and OpenCV
- **Zone-Based Controls** - Move hand to different screen areas
  - **TOP zone** → Airplane moves UP
  - **BOTTOM zone** → Airplane moves DOWN
  - **LEFT zone** → Airplane moves LEFT
  - **RIGHT zone** → Airplane moves RIGHT
- **No Finger Counting** - Simple and intuitive
- **Real-time Video Feed** - See your hand with landmarks
- **Visual Guidance** - Screen zones marked for easy control
- **Auto Camera Shutdown** - Privacy-friendly
- **Same Game Mechanics** - Birds, clouds, thunder, UFOs

### 🏆 Achievements & Statistics System
- **Dual Game Modes** - Voice and Gesture separate stats
- **High Score Tracking** - Per game mode
- **Badge System** - 8 unique achievements:
  - 🎮 Sky Racer - Play any game
  - 🎤 Voice Master - Win 5 voice games
  - ✋ Gesture Pro - Win 5 gesture games
  - 🏆 High Scorer - Reach 100 points
  - ⭐ Pro Pilot - Reach 500 points
  - 👑 Voice Legend - 1000 points in voice mode
  - 💎 Gesture Legend - 1000 points in gesture mode
  - ✈️ First Flight - Complete first search
- **Game Statistics** - Total games, average score, last played
- **Progress Tracking** - Visual progress bars to legend status

### 👤 User Profile & Statistics
- **🏅 Comprehensive Stats Dashboard**
  - Separate stats for voice and gesture modes
  - High scores per game type
  - Total games played
  - Average score tracking
  - Last played timestamps
  - Overall progress metrics
- **✈️ Flight Search Activity**
  - Total searches count
  - Saved searches tracker
  - Search history management
- **🔄 Auto-Refresh** - Stats update every 5 seconds

### 🌐 General Features
- **🌙 Modern UI** - Dark themed responsive interface with Tailwind CSS
- **📱 Responsive Design** - Works on desktop, tablet, and mobile
- **🔒 Security** - JWT authentication, password hashing, user isolation

---

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React, Tailwind CSS, Web Speech API, Canvas API |
| **Backend** | FastAPI (Python), Motor (Async MongoDB), WebSockets |
| **Computer Vision** | MediaPipe, OpenCV, NumPy |
| **Database** | MongoDB Atlas, JWT Auth, PyMongo |
| **Games** | Web Speech API, MediaPipe Hand Tracking, HTML5 Canvas |
| **Tools** | Selenium, Pandas, BeautifulSoup |

---

## 📦 Project Structure

```
AeroDeals/
│
├── frontend/                     # React + Tailwind frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Main navigation bar
│   │   │   ├── Tabs.jsx          # Flight search tabs
│   │   │   ├── AirportSearch.jsx # Autocomplete city search
│   │   │   ├── SearchCard.jsx    # Reusable search card
│   │   │   ├── SearchHistory.jsx # History tab
│   │   │   ├── SavedSearches.jsx # Saved searches tab
│   │   │   ├── FlightDetails.jsx # Flight details modal
│   │   │   ├── GameZone.jsx      # Game selection screen
│   │   │   ├── VoiceGame.jsx     # Voice controlled game
│   │   │   ├── GestureGame.jsx   # Gesture controlled game
│   │   │   ├── Profile.jsx       # User profile with stats
│   │   │   ├── Login.jsx         # Login page
│   │   │   └── Signup.jsx        # Signup page
│   │   ├── data/
│   │   │   └── airports.js       # Airport/city database
│   │   ├── utils/
│   │   │   └── auth.js           # Authentication utilities
│   │   ├── App.jsx               # Main app with routing
│   │   └── main.jsx              # Entry point with Google OAuth
│   ├── .env.example              # Environment variables template
│   └── package.json
│
├── backend/                      # FastAPI + MongoDB backend
│   ├── src/
│   │   ├── api.py                # Main API routes
│   │   ├── auth.py               # Authentication logic
│   │   ├── database.py           # MongoDB connection
│   │   ├── models.py             # Pydantic models
│   │   ├── flight_scraper.py     # Flight scraping logic
│   │   ├── data_processor.py     # Data analysis
│   │   └── utils.py              # Helper functions
│   ├── games/
│   │   ├── voice_game.py         # Voice game engine
│   │   ├── gesture_game.py       # Gesture game engine
│   │   ├── voice_websocket.py    # Voice WebSocket handler
│   │   └── gesture_websocket.py  # Gesture WebSocket handler
│   ├── main.py                   # CLI entry point
│   ├── .env.example              # Environment variables template
│   └── requirements.txt
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** 3.8+
- **MongoDB Atlas** account (free tier)
- **Chrome browser** (for Selenium, Web Speech API, and best MediaPipe support)
- **Webcam** (for gesture control)
- **Microphone** (for voice control)
- **Google Cloud Console** account (for OAuth)

> **Note:** 
> - Voice recognition requires Chrome/Edge/Safari with microphone permissions
> - Gesture control requires webcam access and good lighting

---

### 🗄️ MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free M0 cluster
3. Create a database user (username & password)
4. **Add your IP to Network Access:**
   - Go to **Security** → **Network Access**
   - Click **"+ ADD IP ADDRESS"**
   - Choose **"ALLOW ACCESS FROM ANYWHERE"** (for development)
5. Get your connection string

---

### 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Configure OAuth consent screen
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized JavaScript origins:
   - `http://localhost:5173`
6. Copy the **Client ID**

---

### 🚀 Installation & Setup

#### Step 1: Clone Repository

```bash
git clone https://github.com/harshitayadavv/AeroDeals.git
cd AeroDeals
```

#### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials (see below)
```

**Backend `.env` Configuration:**

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=aerodeals
SECRET_KEY=your_secret_key_here  # Generate with: openssl rand -hex 32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
ENVIRONMENT=development
```

**Start Backend Server:**

```bash
uvicorn src.api:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at: `http://localhost:8000`

#### Step 3: Frontend Setup

Open a **new terminal** window:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials (see below)
```

**Frontend `.env` Configuration:**

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

**Start Frontend Development Server:**

```bash
npm run dev
```

Frontend will run at: `http://localhost:5173`

---

## 🎯 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login-json` | Login with credentials |
| POST | `/auth/google` | Google OAuth login |
| GET | `/auth/me` | Get current user |

### Flight Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Search & save to history |
| GET | `/history` | Get search history |
| GET | `/saved` | Get saved searches |
| POST | `/save/{id}` | Save search permanently |
| DELETE | `/history/{id}` | Delete from history |

### Games
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/games/score` | Submit score (voice/gesture) |
| GET | `/games/stats` | Get user game statistics |
| GET | `/games/leaderboard` | Get top players |
| POST | `/games/voice/session` | Create voice game session |
| POST | `/games/gesture/session` | Create gesture game session |
| WS | `/ws/voice/{session_id}` | Voice game WebSocket |
| WS | `/ws/gesture/{session_id}` | Gesture game WebSocket |

---

## 📚 How to Use

### 1. Sign Up / Login
- Create account or sign in with Google
- Your data is private and secure

### 2. Search Flights
- Enter origin and destination
- Select dates
- View results and save searches

### 3. Play Games

#### 🎤 Voice Controlled Mode
1. Go to **🎮 Game Zone**
2. Select **🎤 Voice Controlled**
3. Allow microphone permissions
4. Click **🚀 START GAME**
5. Speak commands: "up", "down", "left", "right"
6. Avoid obstacles, beat your score!

#### ✋ Gesture Controlled Mode
1. Go to **🎮 Game Zone**
2. Select **✋ Gesture Controlled**
3. Allow webcam permissions
4. Click **✋ START GAME**
5. **Move your hand** to different zones:
   - **Top of screen** → Airplane goes UP
   - **Bottom of screen** → Airplane goes DOWN
   - **Left of screen** → Airplane goes LEFT
   - **Right of screen** → Airplane goes RIGHT
6. Watch the live video feed with hand landmarks
7. No finger counting needed - just move your hand!

### 4. Track Progress
Visit **👤 Profile** to see:
- Separate stats for voice and gesture modes
- High scores and achievements
- Progress to legend status
- Flight search statistics

---

## 🎮 Game Tips

### Voice Control
✅ Use Chrome or Edge for best support  
✅ Speak clearly and naturally  
✅ Commands: "up", "down", "left", "right"  
✅ Instant response (<100ms)  

### Gesture Control
✅ **Good lighting is essential**  
✅ Keep hand in camera view  
✅ Move hand to screen zones (not fingers!)  
✅ Watch the green circle (palm center)  
✅ No specific gestures needed  
✅ Camera auto-stops after game  
✅ Works best on desktop/laptop  

### General
✅ Progressive difficulty - speed increases  
✅ Avoid: 🦅 birds, ⚡ thunder, ☁️ clouds, 🛸 UFOs  
✅ Score: +10 points per obstacle passed  
✅ Difficulty up every 100 points  
✅ High scores synced to profile  

---

## 🔒 Security Features

✅ JWT-based authentication  
✅ Password hashing with bcrypt  
✅ User-specific data isolation  
✅ Google OAuth 2.0 integration  
✅ Protected API endpoints  
✅ Secure WebSocket connections  
✅ Auto token refresh  

---

## 🐛 Troubleshooting

### MongoDB Connection
**Error:** SSL handshake failed  
**Fix:** Add IP to Network Access in MongoDB Atlas

### Google OAuth
**Error:** Failed to fetch  
**Fix:** Verify Client ID and authorized origins

### Voice Not Working
**Error:** Speech recognition not supported  
**Fix:** Use Chrome/Edge/Safari, allow microphone

### Gesture Not Working
**Error:** Hand not detected  
**Fix:**
- Ensure good lighting
- Check webcam permissions
- Keep hand centered in view
- Try moving hand to extreme zones

### Camera Won't Stop
**Fix:**
- Wait 1-2 seconds after game over
- Click "Force Stop Camera" button
- Close browser tab if needed

### Port Already in Use
**Error:** Address already in use  
**Fix:**
```bash
# Kill process on port 8000 (Backend)
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173 (Frontend)
# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5173 | xargs kill -9
```

---

## 🔮 Upcoming Features

- 🏆 **Global Leaderboards** - Real-time rankings
- 🎯 **More Game Modes** - Endless mode, time trial
- 🤖 **AI Difficulty** - Adaptive challenge levels
- 📈 **Detailed Analytics** - Game performance metrics
- 🎨 **Theme Customization** - Light/dark mode
- 📱 **Mobile App** - React Native version
- 🔔 **Push Notifications** - Game challenges, achievements

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

## 👥 Authors

**Harshita Yadav**
- GitHub: [@harshitayadavv](https://github.com/harshitayadavv)

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Google OAuth](https://developers.google.com/identity)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [MediaPipe](https://mediapipe.dev/)
- [OpenCV](https://opencv.org/)

---

## 📞 Support

Issues? Check:
1. [Troubleshooting](#-troubleshooting) section
2. [GitHub Issues](https://github.com/harshitayadavv/AeroDeals/issues)
3. Setup guides above

---

## ⭐ Star this repo if you find it helpful!

**Made with ❤️ by Harshita Yadav**

---

## 📊 Feature Status

| Feature | Status |
|---------|--------|
| Flight Search | ✅ Complete |
| User Authentication | ✅ Complete |
| Google OAuth | ✅ Complete |
| Voice Controlled Game | ✅ Complete |
| Gesture Controlled Game | ✅ Complete |
| Game Statistics | ✅ Complete |
| Badge System | ✅ Complete |
| High Score System | ✅ Complete |
| Leaderboard API | ✅ Complete |
| User Profile | ✅ Complete |
| WebSocket Games | ✅ Complete |
| Hand Tracking | ✅ Complete |
| Global Leaderboard UI | 📋 Planned |
| Price Alerts | 📋 Planned |

---

## 🎯 Latest Updates

### v2.0.0 - Gesture Control Release
- ✅ Added gesture-controlled game mode
- ✅ MediaPipe hand tracking integration
- ✅ Zone-based control system
- ✅ Real-time video feed with landmarks
- ✅ Auto camera shutdown
- ✅ Gesture-specific badges and stats
- ✅ Separate high scores for voice and gesture
- ✅ Enhanced profile with dual game modes
- ✅ Updated UI for gesture controls

### v1.0.0 - Initial Release
- ✅ Flight search with MongoDB
- ✅ Voice-controlled game
- ✅ User authentication
- ✅ Game statistics and badges