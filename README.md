# ✈️ AeroDeals

> Find the best flight deals between two cities within a selected date range.

AeroDeals helps you explore and compare flight prices effortlessly. Built with a modern stack — React, Tailwind CSS, FastAPI, and MongoDB — AeroDeals scrapes flight data, stores search history, and displays the best deals for your route and travel period.

---

## 🚀 Features

- 🔐 **User Authentication** - Secure JWT-based login/signup with Google OAuth
- 👤 **User Profiles** - Personalized search history for each user
- 🔎 **Smart City Search** - Search by city names or airport codes with autocomplete
- 💰 **Price Analysis** - View lowest, average, and total flights found  
- 📜 **Search History** - Auto-saves all searches for 7 days (user-specific)
- ⭐ **Save Searches** - Bookmark your favorite searches permanently
- 🗄️ **MongoDB Integration** - Persistent storage with user isolation
- 📊 **Detailed View** - Click to see complete flight listings
- 🧠 **Smart Analysis** - Get insights on best deals
- 🌐 **Google Login** - Quick sign-in with your Google account
- 🌙 **Modern UI** - Dark themed responsive interface with Tailwind CSS
- 🐳 **Docker Support** - Containerized deployment ready

---

## 🛠 Tech Stack

| Frontend            | Backend                | Database       | Tools          | DevOps    |
|---------------------|------------------------|----------------|----------------|-----------|
| React               | FastAPI (Python)       | MongoDB Atlas  | Selenium       | Docker    |
| Tailwind CSS        | Motor (Async MongoDB)  | JWT Auth       | Pandas         |           |
| Google OAuth        | Pydantic               | PyMongo        | BeautifulSoup  |           |

---

## 📦 Project Structure
```
AeroDeals/
│
├── frontend/                     # React + Tailwind frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Tabs.jsx          # Navigation tabs
│   │   │   ├── AirportSearch.jsx # Autocomplete city search
│   │   │   ├── SearchCard.jsx    # Reusable search card
│   │   │   ├── SearchHistory.jsx # History tab
│   │   │   ├── SavedSearches.jsx # Saved searches tab
│   │   │   ├── FlightDetails.jsx # Flight details modal
│   │   │   ├── Login.jsx         # Login page
│   │   │   └── Signup.jsx        # Signup page
│   │   ├── data/
│   │   │   └── airports.js       # Airport/city database
│   │   ├── utils/
│   │   │   └── auth.js           # Authentication utilities
│   │   ├── App.jsx
│   │   └── main.jsx
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
│   ├── main.py                   # CLI entry point
│   ├── .env.example              # Environment variables template
│   └── requirements.txt
│
├── Dockerfile                    # Docker configuration for backend
├── .dockerignore                 # Docker ignore rules
├── docker-compose.yml            # Docker Compose setup (optional)
├── venv/                         # Python virtual environment (gitignored)
├── .gitignore
├── README.md
└── LICENSE
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- MongoDB Atlas account (free tier)
- Chrome browser (for Selenium)
- Google Cloud Console account (for OAuth)
- **Docker & Docker Compose** (optional, for containerized deployment)

---

### 🗄️ MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a **free M0 cluster**
3. Create a database user (username & password)
4. Add your IP to Network Access (or allow `0.0.0.0/0` for testing)
5. Get your connection string:
   - Click **Connect** → **Drivers** → **Python**
   - Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`)

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

## 🚀 Quick Start (Choose Your Method)

### Method 1: 🐳 Using Docker (Recommended)

**Prerequisites:** Docker and Docker Compose installed
```bash
# 1. Clone the repository
git clone https://github.com/harshitayadavv/AeroDeals.git
cd AeroDeals

# 2. Create .env file
# Copy backend/.env.example to project root and rename to .env
# Edit .env with your MongoDB URI, Secret Key, and Google Client ID

# 3. Build and run with Docker Compose
docker-compose up -d

# 4. Access the application
# Backend API: http://localhost:10000

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

**Or build manually:**
```bash
# Build Docker image
docker build -t aerodeals-api .

# Run container
docker run -d \
  -p 10000:10000 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e SECRET_KEY="your-secret-key" \
  -e GOOGLE_CLIENT_ID="your-google-client-id" \
  --name aerodeals-api \
  aerodeals-api
```

---

### Method 2: 💻 Local Development (Traditional)

#### 🧠 Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Edit .env and add your credentials:
# - MongoDB connection string
# - Secret key (generate with: openssl rand -hex 32)
# - Google Client ID

# Start FastAPI server
uvicorn src.api:app --reload --host 0.0.0.0 --port 10000
```

The backend API will be available at `http://127.0.0.1:10000`

**✅ Verify Backend:** Visit `http://127.0.0.1:10000` - you should see a welcome message!

---

#### 🖥 Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env and add your Google Client ID

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

## 🐳 Docker Commands Reference
```bash
# Build image
docker build -t aerodeals-api .

# Run container
docker run -d -p 10000:10000 --name aerodeals-api aerodeals-api

# View logs
docker logs -f aerodeals-api

# Stop container
docker stop aerodeals-api

# Remove container
docker rm aerodeals-api

# Using Docker Compose
docker-compose up -d        # Start in background
docker-compose logs -f      # View logs
docker-compose down         # Stop and remove
docker-compose restart      # Restart services
```

---

## 🎯 API Endpoints

### Authentication

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| POST   | `/auth/register`      | Register new user                    |
| POST   | `/auth/login-json`    | Login with email/password            |
| POST   | `/auth/google`        | Login with Google OAuth              |
| GET    | `/auth/me`            | Get current user info                |

### Flight Search

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/`                   | API welcome message                  |
| GET    | `/search`             | Search flights & save to history     |
| GET    | `/history`            | Get user's search history            |
| GET    | `/saved`              | Get user's saved searches            |
| GET    | `/search/{id}`        | Get details of a specific search     |
| POST   | `/save/{id}`          | Save a search permanently            |
| DELETE | `/history/{id}`       | Delete a search from history         |
| DELETE | `/saved/{id}`         | Remove a saved search                |

---

## 🔧 Environment Variables

### Backend `.env` (Required)
```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority

# Database Name
DATABASE_NAME=aerodeals

# JWT Configuration
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here

# Environment
ENVIRONMENT=development
```

### Frontend `.env` (Required)
```env
# API Configuration
VITE_API_URL=http://127.0.0.1:10000

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

**⚠️ Important:** 
- Never commit `.env` files to GitHub!
- Use `.env.example` files as templates
- Generate a strong SECRET_KEY: `openssl rand -hex 32`

---

## 📚 How to Use

### 1. **Sign Up / Login**
   - Create an account with email and password
   - Or sign in with Google (one-click!)
   - Your searches are private and secure

### 2. **Search Flights**
   - Enter origin city (e.g., "Delhi" or "DEL")
   - Enter destination city (e.g., "Mumbai" or "BOM")
   - Select date range
   - Click "Find Flights"

### 3. **View Results**
   - See price analysis (lowest, average, total flights)
   - Browse top 10 flights
   - Click "View Details" for complete list

### 4. **Save Searches**
   - Click "⭐ Save This Search" to bookmark
   - View in "Saved" tab anytime
   - Your saved searches persist forever

### 5. **Search History**
   - All your searches auto-saved for 7 days
   - View in "History" tab
   - Save or delete as needed

---

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ User-specific data isolation
- ✅ Google OAuth 2.0 integration
- ✅ Protected API endpoints
- ✅ Automatic token refresh
- ✅ Secure session management
- ✅ Containerized deployment with Docker

---

## 🌍 Deployment

**Coming Soon:** Production deployment guides for:
- Frontend: Vercel / Netlify
- Backend: AWS / Cloud platforms
- Database: MongoDB Atlas (already cloud-based)

---

## 🔮 Upcoming Features

- 🔔 **Price Alerts** - Get notified when prices drop
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
- Authentication with [JWT](https://jwt.io/) and [Google OAuth](https://developers.google.com/identity)
- Containerized with [Docker](https://www.docker.com/)

---

## 🐛 Known Issues

- Flight scraping may be slow depending on website response times
- Some airports may not be in the autocomplete database
- Date validation is client-side only

---

## 📞 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Read the setup guide carefully

---

**⭐ Star this repo if you find it helpful!**

**Made with ❤️ by Harshita Yadav**