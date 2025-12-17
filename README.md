# ✈️ AeroDeals

**Find the best flight deals and play interactive AI-powered games!**

AeroDeals is a full-stack application that combines flight search functionality with innovative voice-controlled games. Built with React, FastAPI, MongoDB, and Web Speech API technologies.

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

### 🎮 Game Zone (NEW!)
- **🎤 Voice Controlled Game** - Play "Sky Racer" using voice commands
  - Real-time speech recognition via Web Speech API
  - Instant response to voice commands ("up", "down", "left", "right")
  - Navigate an airplane through obstacles with your voice
  - Score tracking and high score persistence
  - Progressive difficulty with speed multipliers
- **🏆 Achievements System**
  - High score tracking per user
  - Game statistics (total games played, average score)
  - Personal records and milestones

### 👤 User Profile & Statistics
- **🏅 Game Stats Dashboard**
  - High scores per game type
  - Total games played
  - Average score tracking
  - Last played timestamps
- **✈️ Flight Search Activity**
  - Total searches count
  - Saved searches tracker
  - Search history management

### 🌐 General Features
- **🌙 Modern UI** - Dark themed responsive interface with Tailwind CSS
- **📱 Responsive Design** - Works on desktop, tablet, and mobile
- **🔒 Security** - JWT authentication, password hashing, user isolation
- **🐳 Docker Support** - Containerized deployment ready

---

## 🛠 Tech Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React, Tailwind CSS, Web Speech API, Canvas API |
| **Backend** | FastAPI (Python), Motor (Async MongoDB) |
| **Database** | MongoDB Atlas, JWT Auth, PyMongo |
| **Games** | Web Speech API (Voice Recognition), HTML5 Canvas |
| **Tools** | Selenium, Pandas, BeautifulSoup |
| **DevOps** | Docker, Docker Compose |

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
│   │   │   ├── VoiceGame.jsx     # Voice controlled Sky Racer game
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
│   │   ├── api.py                # Main API routes (includes game endpoints)
│   │   ├── auth.py               # Authentication logic (Google OAuth)
│   │   ├── database.py           # MongoDB connection
│   │   ├── models.py             # Pydantic models
│   │   ├── flight_scraper.py     # Flight scraping logic
│   │   ├── data_processor.py     # Data analysis
│   │   └── utils.py              # Helper functions
│   ├── main.py                   # CLI entry point
│   ├── .env.example              # Environment variables template
│   └── requirements.txt
│
├── Dockerfile                    # Docker configuration for backend
├── .dockerignore                 # Docker ignore rules
├── docker-compose.yml            # Docker Compose setup
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
- **Chrome browser** (for Selenium and Web Speech API)
- **Google Cloud Console** account (for OAuth)
- **Docker & Docker Compose** (optional)

> **Note:** Voice recognition requires a modern browser (Chrome, Edge, or Safari) with microphone permissions.

---

### 🗄️ MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free M0 cluster
3. Create a database user (username & password)
4. **Add your IP to Network Access:**
   - Go to **Security** → **Network Access**
   - Click **"+ ADD IP ADDRESS"**
   - Choose **"ALLOW ACCESS FROM ANYWHERE"** (for development)
   - Or click **"ADD CURRENT IP ADDRESS"**
5. Get your connection string:
   - Click **Connect** → **Drivers** → **Python**
   - Copy the connection string

> **⚠️ Important:** If you get SSL handshake errors, your IP address needs to be whitelisted in MongoDB Atlas Network Access settings.

---

### 🔑 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to **APIs & Services** → **OAuth consent screen**
4. Configure consent screen and add test users
5. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
6. Set application type to **Web application**
7. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
8. Copy the **Client ID**

---

### 🚀 Quick Start

#### Method 1: 🐳 Using Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/harshitayadavv/AeroDeals.git
cd AeroDeals

# 2. Create .env file in project root
cp backend/.env.example .env
# Edit .env with your MongoDB URI, Secret Key, and Google Client ID

# 3. Build and run with Docker Compose
docker-compose up -d

# 4. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

#### Method 2: 💻 Local Development

**Backend Setup:**

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Start FastAPI server
uvicorn src.api:app --reload --host 0.0.0.0 --port 8000
```

**Frontend Setup:**

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your Google Client ID

# Start development server
npm run dev
```

---

## 🔧 Environment Variables

### Backend `.env` (Required)

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

# Database Name
DATABASE_NAME=aerodeals

# JWT Configuration
SECRET_KEY=your_secret_key_here  # Generate: openssl rand -hex 32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com

# Environment
ENVIRONMENT=development
```

### Frontend `.env` (Required)

```env
# API Configuration
VITE_API_URL=http://127.0.0.1:8000

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

> **⚠️ Important:**
> - Never commit `.env` files to GitHub
> - Generate a strong `SECRET_KEY`: `openssl rand -hex 32`
> - Both frontend and backend must use the **same** Google Client ID

---

## 🎯 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login-json` | Login with email/password |
| POST | `/auth/google` | Login with Google OAuth |
| GET | `/auth/me` | Get current user info |

### Flight Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API welcome message |
| GET | `/search` | Search flights & save to history |
| GET | `/history` | Get user's search history |
| GET | `/saved` | Get user's saved searches |
| GET | `/search/{id}` | Get details of a specific search |
| POST | `/save/{id}` | Save a search permanently |
| DELETE | `/history/{id}` | Delete a search from history |
| DELETE | `/saved/{id}` | Remove a saved search |

### Games (NEW!)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/games/score` | Submit game score and update high score |
| GET | `/games/stats` | Get user's game statistics |
| GET | `/games/leaderboard` | Get top players leaderboard |

---

## 📚 How to Use

### 1. Sign Up / Login
- Create an account with email and password
- Or sign in with Google (one-click!)
- Your data is private and secure

### 2. Navigate the App
- **🏠 Home** - Search for flights
- **🎮 Game Zone** - Play voice controlled games
- **👤 Profile** - View your stats and achievements

### 3. Search Flights
- Enter origin city (e.g., "Delhi" or "DEL")
- Enter destination city (e.g., "Mumbai" or "BOM")
- Select date range
- Click "Find Flights"
- View results and save searches

### 4. Play Voice Game (Sky Racer)
- Click **🎮 Game Zone** in navigation
- Select **🎤 Voice Controlled Game**
- Allow microphone permissions when prompted
- Click **🚀 START GAME**
- Voice recognition starts automatically
- Speak commands:
  - **"up"** - Move airplane up
  - **"down"** - Move airplane down
  - **"left"** - Move airplane left
  - **"right"** - Move airplane right
- Avoid obstacles (birds, lightning, clouds, UFOs)
- Beat your high score!

### 5. Track Your Progress
- Visit **👤 Profile** to see:
  - Game high scores
  - Total games played
  - Average scores
  - Flight search statistics
  - Account information

---

## 🎮 Voice Game Tips

✅ **Use Chrome or Edge** - Best browser support for Web Speech API  
✅ **Allow Microphone** - Grant permissions when prompted  
✅ **Speak Clearly** - Natural voice, normal volume  
✅ **Instant Response** - Commands processed in real-time (<100ms)  
✅ **No Delay** - Airplane moves immediately when you speak  
✅ **Progressive Difficulty** - Speed increases every 50 points  
✅ **High Score Sync** - Automatically saved to your profile  

---

## 🔒 Security Features

✅ JWT-based authentication  
✅ Password hashing with bcrypt  
✅ User-specific data isolation  
✅ Google OAuth 2.0 integration  
✅ Protected API endpoints  
✅ Automatic token refresh  
✅ Secure session management  
✅ Containerized deployment with Docker  

---

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Error:** `SSL handshake failed` or `Cannot connect to MongoDB`

**Solution:**
1. Go to MongoDB Atlas → **Security** → **Network Access**
2. Click **"+ ADD IP ADDRESS"**
3. Select **"ALLOW ACCESS FROM ANYWHERE"** (for development)
4. Wait 1-2 minutes for changes to apply

### Google OAuth "Failed to Fetch"

**Solution:**
1. Verify your `.env` files have the correct `GOOGLE_CLIENT_ID`
2. Check Google Cloud Console:
   - **Authorized JavaScript origins** include `http://localhost:5173`
3. Restart both frontend and backend
4. Clear browser cache

### Voice Recognition Not Working

**Error:** "Speech recognition not supported"

**Solution:**
1. Use Chrome, Edge, or Safari (best support)
2. Check microphone permissions in browser settings
3. Ensure you're on `http://localhost` or `https://` (required for mic access)
4. Try refreshing the page and allow permissions again

### Voice Commands Delayed or Not Responding

**Solution:**
1. Speak clearly and naturally
2. Check microphone levels in system settings
3. Ensure no other apps are using the microphone
4. Try restarting the game

---

## 🔮 Upcoming Features

- 👋 **Gesture Controlled Games** - Play using hand gestures (MediaPipe/OpenCV)
- 🏆 **Global Leaderboards** - Compete with other players worldwide
- 🎯 **More Game Modes** - Additional challenges and difficulty levels
- 🔔 **Price Alerts** - Get notified when flight prices drop
- 📊 **Advanced Analytics** - Price trends, best time to book
- 🌐 **Real Flight Data** - Integration with live flight APIs
- 📧 **Email Notifications** - Search summaries and alerts
- 🎨 **Theme Customization** - Light/dark mode toggle
- 📱 **Mobile App** - React Native version

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👥 Authors

**Harshita Yadav**
- GitHub: [@harshitayadavv](https://github.com/harshitayadavv)

---

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/)
- UI powered by [Tailwind CSS](https://tailwindcss.com/)
- Database by [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Authentication with JWT and [Google OAuth](https://developers.google.com/identity/protocols/oauth2)
- Voice recognition via [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- Containerized with [Docker](https://www.docker.com/)

---

## 📞 Support

If you encounter any issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Open an [issue on GitHub](https://github.com/harshitayadavv/AeroDeals/issues)
3. Read the setup guide carefully

---

## ⭐ Star this repo if you find it helpful!

**Made with ❤️ by Harshita Yadav**

---

## 📊 Current Status

| Feature | Status |
|---------|--------|
| Flight Search | ✅ Complete |
| User Authentication | ✅ Complete |
| Google OAuth | ✅ Complete |
| Search History | ✅ Complete |
| User Profile | ✅ Complete |
| Voice Controlled Game | ✅ Complete |
| Game Statistics | ✅ Complete |
| High Score System | ✅ Complete |
| Leaderboard API | ✅ Complete |
| Gesture Controlled Games | 📋 Planned |
| Price Alerts | 📋 Planned |

