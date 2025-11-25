from fastapi import FastAPI, Query, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from src.flight_scraper import FlightScraper
from src.data_processor import FlightDataProcessor
from src.utils import validate_date_format
from src.database import Database
from src.models import User, UserCreate, UserResponse, Token, UserLogin
from src.auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_user_by_email,
    verify_google_token,  # NEW
    get_or_create_google_user  # NEW
)
from datetime import datetime, timedelta
from bson import ObjectId
import logging

app = FastAPI(title="AeroDeals API", version="2.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
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
            "auth": "/auth/*",
            "search": "/search",
            "history": "/history",
            "saved": "/saved"
        }
    }

# ==================== AUTH ENDPOINTS ====================

@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    users_collection = Database.get_collection("users")
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_dict = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": get_password_hash(user_data.password),
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(user_dict)
    
    return UserResponse(
        id=str(result.inserted_id),
        email=user_data.email,
        full_name=user_data.full_name,
        created_at=user_dict["created_at"]
    )

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login and get access token"""
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.email})
    
    return Token(access_token=access_token, token_type="bearer")

@app.post("/auth/login-json", response_model=Token)
async def login_json(user_data: UserLogin):
    """Login with JSON (alternative to form data)"""
    user = await authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    
    return Token(access_token=access_token, token_type="bearer")

# ==================== GOOGLE OAUTH ENDPOINT - NEW ====================

@app.post("/auth/google", response_model=Token)
async def google_login(request: dict):
    """Login with Google OAuth"""
    try:
        google_token = request.get("token")
        if not google_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google token is required"
            )
        
        # Verify Google token
        google_user_info = await verify_google_token(google_token)
        
        # Get or create user
        user = await get_or_create_google_user(google_user_info)
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        
        logger.info(f"✅ Google OAuth login successful for {user.email}")
        
        return Token(access_token=access_token, token_type="bearer")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google OAuth failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google authentication failed"
        )

# ==================== END GOOGLE OAUTH ====================

@app.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current logged-in user info"""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        profile_picture=current_user.profile_picture,  # NEW: Include profile picture
        created_at=current_user.created_at
    )

# ==================== FLIGHT SEARCH ENDPOINTS ====================

@app.get("/search")
async def search_flights(
    origin: str = Query(..., description="Origin city"),
    destination: str = Query(..., description="Destination city"),
    start_date: str = Query(..., description="Start date in YYYY-MM-DD"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD"),
    current_user: User = Depends(get_current_active_user)
):
    logger.info(f"Search request: {origin} → {destination} ({start_date} to {end_date}) by {current_user.email}")

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

    # Save to MongoDB (History) with user_id
    try:
        searches_collection = Database.get_collection("searches")
        
        search_document = {
            "user_id": str(current_user.id),
            "origin": origin.upper(),
            "destination": destination.upper(),
            "start_date": start_date,
            "end_date": end_date,
            "flights": flights_json,
            "analysis": analysis,
            "is_saved": False,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7)
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
        return {
            "flights": flights_json,
            "analysis": analysis,
            "warning": "Search completed but not saved to history"
        }

# Get search history (user-specific)
@app.get("/history")
async def get_history(current_user: User = Depends(get_current_active_user)):
    try:
        searches_collection = Database.get_collection("searches")
        
        # Get searches for current user only
        cursor = searches_collection.find({
            "user_id": str(current_user.id),
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
                "is_saved": doc.get("is_saved", False),
                "created_at": doc["created_at"].isoformat(),
                "expires_at": doc["expires_at"].isoformat()
            })
        
        return {"history": history, "count": len(history)}
        
    except Exception as e:
        logger.error(f"Failed to fetch history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history")

# Get saved searches (user-specific)
@app.get("/saved")
async def get_saved_searches(current_user: User = Depends(get_current_active_user)):
    try:
        searches_collection = Database.get_collection("searches")
        
        cursor = searches_collection.find({
            "user_id": str(current_user.id),
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

# Get search details by ID (verify ownership)
@app.get("/search/{search_id}")
async def get_search_details(
    search_id: str,
    current_user: User = Depends(get_current_active_user)
):
    try:
        if not ObjectId.is_valid(search_id):
            raise HTTPException(status_code=400, detail="Invalid search ID")
        
        searches_collection = Database.get_collection("searches")
        doc = await searches_collection.find_one({
            "_id": ObjectId(search_id),
            "user_id": str(current_user.id)
        })
        
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

# Save a search permanently (verify ownership)
@app.post("/save/{search_id}")
async def save_search(
    search_id: str,
    current_user: User = Depends(get_current_active_user)
):
    try:
        if not ObjectId.is_valid(search_id):
            raise HTTPException(status_code=400, detail="Invalid search ID")
        
        searches_collection = Database.get_collection("searches")
        
        result = await searches_collection.update_one(
            {
                "_id": ObjectId(search_id),
                "user_id": str(current_user.id)
            },
            {"$set": {"is_saved": True}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Search not found")
        
        return {"message": "Search saved successfully", "search_id": search_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save search: {e}")
        raise HTTPException(status_code=500, detail="Failed to save search")

# Delete from history (verify ownership)
@app.delete("/history/{search_id}")
async def delete_from_history(
    search_id: str,
    current_user: User = Depends(get_current_active_user)
):
    try:
        if not ObjectId.is_valid(search_id):
            raise HTTPException(status_code=400, detail="Invalid search ID")
        
        searches_collection = Database.get_collection("searches")
        
        result = await searches_collection.delete_one({
            "_id": ObjectId(search_id),
            "user_id": str(current_user.id)
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Search not found")
        
        return {"message": "Search deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete search: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete search")

# Remove from saved (verify ownership)
@app.delete("/saved/{search_id}")
async def delete_saved_search(
    search_id: str,
    current_user: User = Depends(get_current_active_user)
):
    try:
        if not ObjectId.is_valid(search_id):
            raise HTTPException(status_code=400, detail="Invalid search ID")
        
        searches_collection = Database.get_collection("searches")
        
        result = await searches_collection.delete_one({
            "_id": ObjectId(search_id),
            "user_id": str(current_user.id),
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