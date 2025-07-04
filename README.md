# ✈️ AeroDeals

> Find the best flight deals between two cities within a selected date range.

AeroDeals helps you explore and compare flight prices effortlessly. Built with a modern stack — React, Tailwind CSS, and FastAPI — AeroDeals scrapes flight data and displays best deals for your route and travel period.

---

## 🌐 Live Demo

👉 [Visit AeroDeals](https://aerodeals-frontend.vercel.app)

---

## 🚀 Features

- 🔎 Search for flights by origin, destination, and date range  
- 💰 View lowest, average, and total flights found  
- 🧠 Smart analysis of best deals  
- ⚙️ Backend powered by FastAPI and Selenium for scraping  
- 🌙 Dark themed responsive UI with Tailwind CSS  

---

## 🛠 Tech Stack

| Frontend            | Backend                | Deployment     |
|---------------------|------------------------|----------------|
| React               | FastAPI (Python)       | Vercel (FE)    |
| Tailwind CSS        | Selenium (for scraping)| Render (BE)    |
| JavaScript (ES6+)   | Pandas + BeautifulSoup | GitHub         |

---

## 📦 Project Structure

```
AeroDeals/
│
├── frontend/                # React + Tailwind frontend
│   ├── public/
│   └── src/
│
├── backend/                 # FastAPI + Selenium backend
│   ├── api.py
│   ├── main.py
│   └── src/
│
├── venv/                    # Python virtual environment (not pushed to GitHub)
├── README.md
└── requirements.txt
```

---

## ⚙️ Getting Started Locally

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- Chrome browser (for Selenium)

### 🖥 Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 🧠 Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn api:app --reload
```

The backend API will be available at `http://localhost:8000`

**Note:** Make sure ChromeDriver is installed or use webdriver-manager for automatic driver management.

### 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
# Optional: Add any API keys or configuration variables
CHROMEDRIVER_PATH=/path/to/chromedriver
```

---

## 🌍 Deployment

| Service  | URL                                          |
|----------|----------------------------------------------|
| Frontend | https://aero-deals.vercel.app/               |
| Backend  | https://aerodeals-backend.onrender.com       |

### Deploy Your Own

#### Frontend (Vercel)
1. Fork this repository
2. Connect your GitHub account to Vercel
3. Import the project and set build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`

#### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn api:app --host 0.0.0.0 --port $PORT`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---
