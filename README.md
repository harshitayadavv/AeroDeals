# ✈️ AeroDeals

> Find the best flight deals between two cities within a selected date range.

AeroDeals helps you explore and compare flight prices effortlessly. Built with a modern stack — React, Tailwind CSS, FastAPI, and MongoDB — AeroDeals scrapes flight data, stores search history, and displays the best deals for your route and travel period.

---

## 🚀 Features

- 🔎 **Smart City Search** - Search by city names or airport codes with autocomplete
- 💰 **Price Analysis** - View lowest, average, and total flights found  
- 📜 **Search History** - Auto-saves all searches for 7 days
- ⭐ **Save Searches** - Bookmark your favorite searches permanently
- 🗄️ **MongoDB Integration** - Persistent storage for search history and saved searches
- 📊 **Detailed View** - Click to see complete flight listings
- 🧠 **Smart Analysis** - Get insights on best deals
- ⚙️ **Backend** - Powered by FastAPI and Selenium for scraping  
- 🌙 **Modern UI** - Dark themed responsive interface with Tailwind CSS  

---

## 🛠 Tech Stack

| Frontend            | Backend                | Database       | Tools          |
|---------------------|------------------------|----------------|----------------|
| React               | FastAPI (Python)       | MongoDB Atlas  | Selenium       |
| Tailwind CSS        | Motor (Async MongoDB)  | PyMongo        | Pandas         |
| JavaScript (ES6+)   | Pydantic               |                | BeautifulSoup  |

---

## 📦 Project Structure

```
AeroDeals/
│
├── frontend/                     # React + Tailwind frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Tabs.jsx          # Navigation tabs
│       │   ├── AirportSearch.jsx # Autocomplete city search
│       │   ├── SearchCard.jsx    # Reusable search card
│       │   ├── SearchHistory.jsx # History tab
│       │   ├── SavedSearches.jsx # Saved searches tab
│       │   └── FlightDetails.jsx # Flight details modal
│       ├── data/
│       │   └── airports.js       # Airport/city database
│       ├── App.jsx
│       └── main.jsx
│
├── backend/                      # FastAPI + MongoDB backend
│   ├── api.py                    # Main API routes
│   ├── main.py                   # CLI entry point
│   ├── .env                      # Environment variables (not in git)
│   └── src/
│       ├── database.py           # MongoDB connection
│       ├── models.py             # Pydantic models
│       ├── flight_scraper.py     # Flight scraping logic
│       ├── data_processor.py     # Data analysis
│       └── utils.py              # Helper functions
│
├── venv/                         # Python virtual environment (not in git)
├── .gitignore
├── README.md
└── requirements.txt
```

---

## ⚙️ Getting Started Locally

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- MongoDB Atlas account (free tier)
- Chrome browser (for Selenium)

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

### 🧠 Backend Setup

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

# Create .env file and add your MongoDB connection
# Create a file named .env with:
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=aerodeals
ENVIRONMENT=development

# Start FastAPI server
uvicorn api:app --reload
```

The backend API will be available at `http://127.0.0.1:8000`

**✅ Verify Backend:** Visit `http://127.0.0.1:8000` - you should see a welcome message!

---

### 🖥 Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

## 🎯 API Endpoints

| Method | Endpoint              | Description                          |
|--------|-----------------------|--------------------------------------|
| GET    | `/`                   | API welcome message                  |
| GET    | `/search`             | Search flights & save to history     |
| GET    | `/history`            | Get search history (last 7 days)     |
| GET    | `/saved`              | Get permanently saved searches       |
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

# Environment
ENVIRONMENT=development
```

**⚠️ Important:** Never commit `.env` file to GitHub!

---

## 📚 How to Use

1. **Search Flights**
   - Enter origin city (e.g., "Delhi" or "DEL")
   - Enter destination city (e.g., "Mumbai" or "BOM")
   - Select date range
   - Click "Find Flights"

2. **View Results**
   - See price analysis (lowest, average, total flights)
   - Browse top 10 flights
   - Click "View Details" for complete list

3. **Save Searches**
   - Click "⭐ Save This Search" to bookmark
   - View in "Saved" tab anytime

4. **Search History**
   - All searches auto-saved for 7 days
   - View in "History" tab
   - Save or delete as needed

---

## 🌍 Deployment (Coming Soon)

Currently running on:
- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8000`

**Production deployment instructions will be added after authentication is implemented.**

---

## 🔮 Upcoming Features

- 🔐 **User Authentication** (JWT-based login/signup)
- 👤 **User Profiles** (Personalized search history)
- 🔔 **Price Alerts** (Get notified when prices drop)
- 📊 **Advanced Analytics** (Price trends, best time to book)
- 🌐 **Real Flight Data** (Integration with live flight APIs)

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

---

**⭐ Star this repo if you find it helpful!**