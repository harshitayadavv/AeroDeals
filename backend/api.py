from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.flight_scraper import FlightScraper
from src.data_processor import FlightDataProcessor
from src.utils import validate_date_format
import logging

app = FastAPI()

# Enable CORS for frontend (you can restrict it to Vercel domain later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with ["https://your-frontend.vercel.app"] for stricter rules
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging (optional but useful)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.get("/search")
def search_flights(
    origin: str = Query(..., description="Origin city"),
    destination: str = Query(..., description="Destination city"),
    start_date: str = Query(..., description="Start date in YYYY-MM-DD"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD")
):
    logger.info(f"Received search request: {origin} to {destination} from {start_date} to {end_date}")

    if not all(validate_date_format(d) for d in [start_date, end_date]):
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    scraper = FlightScraper()
    try:
        results = scraper.find_best_deals(origin.upper(), destination.upper(), start_date, end_date)
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        raise HTTPException(status_code=500, detail="Flight scraping failed. Please try again later.")

    if results.empty:
        return {
            "flights": [],
            "analysis": {
                "min_price": 0,
                "avg_price": 0,
                "total_flights": 0
            },
            "message": "No flights found in the selected date range."
        }

    analysis = FlightDataProcessor.analyze_deals(results)
    flights_json = results.drop(columns=["price_num"], errors='ignore').to_dict(orient="records")

    return {
        "flights": flights_json,
        "analysis": analysis
    }
