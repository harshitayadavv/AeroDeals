from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.flight_scraper import FlightScraper
from src.data_processor import FlightDataProcessor
from src.utils import validate_date_format
from src.database import Database
from src.models import SearchResult, FlightData
from datetime import datetime, timedelta
from bson import ObjectId
import logging

app = FastAPI(title="AeroDeals API", version="2.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection events
@app.on_event("startup")
async def startup_db_client():
    await Database.connect_db()
    logger.info("🚀 AeroDeals API started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    await Database.close_db()
    logger.info("👋 AeroDeals API shutdown")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "✈️ Welcome to AeroDeals API",
        "version": "2.0.0",
        "endpoints": {
            "search": "/search",
            "history": "/history",
            "saved": "/saved"
        }
    }

# Search flights endpoint
@app.get("/search")
async def search_flights(
    origin: str = Query(..., description="Origin city"),
    destination: str = Query(..., description="Destination city"),
    start_date: str = Query(..., description="Start date in YYYY-MM-DD"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD")
):
    logger.info(f"Search request: {origin} → {destination} ({start_date} to {end_date})")

    # Validate dates
    if not all(validate_date_format(d) for d in [start_date, end_date]):
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Scrape flights
    scraper = FlightScraper()
    try:
        results = scraper.find_best_deals(origin.upper(), destination.upper(), start_date, end_date)
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        raise HTTPException(status_code=500, detail="Flight scraping failed")

    if results.empty:
        return {
            "flights": [],
            "analysis": {
                "min_price": 0,
                "avg_price": 0,
                "total_flights": 0
            },
            "message": "No flights found"
        }

    # Analyze deals
    analysis = FlightDataProcessor.analyze_deals(results)
    flights_json = results.drop(columns=["price_num"], errors='ignore').to_dict(orient="records")

    # Save to MongoDB (History)
    try:
        searches_collection = Database.get_collection("searches")
        
        search_document = {
            "origin": origin.upper(),
            "destination": destination.upper(),
            "start_date": start_date,
            "end_date": end_date,
            "flights": flights_json,
            "analysis": analysis,
            "is_saved": False,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7)  # Auto-delete after 7 days
        }
        
        result = await searches_collection.insert_one(search_document)
        search_id = str(result.inserted_id)
        logger.info(f"✅ Search saved to history with ID: {search_id}")
        
        return {
            "search_id": search_id,
            "flights": flights_json,
            "analysis": analysis
        }
        
    except Exception as e:
        logger.error(f"Failed to save search: {e}")
        # Still return results even if DB save fails
        return {
            "flights": flights_json,
            "analysis": analysis,
            "warning": "Search completed but not saved to history"
        }

# Get search history (last 7 days)
@app.get("/history")
async def get_history():
    try:
        searches_collection = Database.get_collection("searches")
        
        # Get all searches that haven't expired (including saved ones)
        cursor = searches_collection.find({
            "expires_at": {"$gt": datetime.utcnow()}
        }).sort("created_at", -1).limit(50)
        
        history = []
        async for doc in cursor:
            history.append({
                "id": str(doc["_id"]),
                "origin": doc["origin"],
                "destination": doc["destination"],
                "start_date": doc["start_date"],
                "end_date": doc["end_date"],
                "total_flights": doc["analysis"]["total_flights"],
                "min_price": doc["analysis"]["min_price"],
                "is_saved": doc.get("is_saved", False),  # Show if it's saved
                "created_at": doc["created_at"].isoformat(),
                "expires_at": doc["expires_at"].isoformat()
            })
        
        return {"history": history, "count": len(history)}
        
    except Exception as e:
        logger.error(f"Failed to fetch history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")

# Get saved searches
@app.get("/saved")
async def get_saved_searches():
    try:
        searches_collection = Database.get_collection("searches")
        
        cursor = searches_collection.find({
            "is_saved": True
        }).sort("created_at", -1)
        
        saved = []
        async for doc in cursor:
            saved.append({
                "id": str(doc["_id"]),
                "origin": doc["origin"],
                "destination": doc["destination"],
                "start_date": doc["start_date"],
                "end_date": doc["end_date"],
                "total_flights": doc["analysis"]["total_flights"],
                "min_price": doc["analysis"]["min_price"],
                "created_at": doc["created_at"].isoformat()
            })
        
        return {"saved": saved, "count": len(saved)}
        
    except Exception as e:
        logger.error(f"Failed to fetch saved searches: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch saved searches")

# Get search details by ID
@app.get("/search/{search_id}")
async def get_search_details(search_id: str):
    try:
        if not ObjectId.is_valid(search_id):
            raise HTTPException(status_code=400, detail="Invalid search ID")
        
        searches_collection = Database.get_collection("searches")
        doc = await searches_collection.find_one({"_id": ObjectId(search_id)})
        
        if not doc:
            raise HTTPException(status_code=404, detail="Search not found")
        
        return {
            "id": str(doc["_id"]),
            "origin": doc["origin"],
            "destination": doc["destination"],
            "start_date": doc["start_date"],
            "end_date": doc["end_date"],
            "flights": doc["flights"],
            "analysis": doc["analysis"],
            "is_saved": doc["is_saved"],
            "created_at": doc["created_at"].isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch search details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch search details")

# Save a search permanently
@app.post("/save/{search_id}")
async def save_search(search_id: str):
    try:
        if not ObjectId.is_valid(search_id):
            raise HTTPException(status_code=400, detail="Invalid search ID")
        
        searches_collection = Database.get_collection("searches")
        
        result = await searches_collection.update_one(
            {"_id": ObjectId(search_id)},
            {
                "$set": {"is_saved": True}
                # Keep expires_at so it still appears in history for 7 days
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Search not found")
        
        return {"message": "Search saved successfully", "search_id": search_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save search: {e}")
        raise HTTPException(status_code=500, detail="Failed to save search")

# Delete from history
@app.delete("/history/{search_id}")
async def delete_from_history(search_id: str):
    try:
        if not ObjectId.is_valid(search_id):
            raise HTTPException(status_code=400, detail="Invalid search ID")
        
        searches_collection = Database.get_collection("searches")
        
        # Delete the search completely (works for both saved and unsaved)
        result = await searches_collection.delete_one({
            "_id": ObjectId(search_id)
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Search not found")
        
        return {"message": "Search deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete search: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete search")

# Remove from saved
@app.delete("/saved/{search_id}")
async def delete_saved_search(search_id: str):
    try:
        if not ObjectId.is_valid(search_id):
            raise HTTPException(status_code=400, detail="Invalid search ID")
        
        searches_collection = Database.get_collection("searches")
        
        result = await searches_collection.delete_one({
            "_id": ObjectId(search_id),
            "is_saved": True
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Saved search not found")
        
        return {"message": "Search removed from saved"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete saved search: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete saved search")