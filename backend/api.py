from fastapi import FastAPI, Query
from src.flight_scraper import FlightScraper
from src.data_processor import FlightDataProcessor
from src.utils import validate_date_format
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Optional: Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/search")
def search_flights(
    origin: str = Query(..., description="Origin city"),
    destination: str = Query(..., description="Destination city"),
    start_date: str = Query(..., description="Start date in YYYY-MM-DD"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD")
):
    if not all(validate_date_format(d) for d in [start_date, end_date]):
        return {"error": "Invalid date format. Use YYYY-MM-DD"}

    scraper = FlightScraper()
    results = scraper.find_best_deals(origin, destination, start_date, end_date)

    if results.empty:
        return {"flights": [], "message": "No flights found"}

    analysis = FlightDataProcessor.analyze_deals(results)
    flights_json = results.drop(columns=["price_num"], errors='ignore').to_dict(orient="records")

    return {
        "flights": flights_json,
        "analysis": analysis
    }
