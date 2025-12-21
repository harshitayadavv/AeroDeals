"""
Complete api.py with auth endpoints included directly
"""

from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import logging
import uuid
import os

# Database
from src.database import Database, connect_to_mongo, close_mongo_connection

# Auth functions
from src.auth import (
    get_current_user,
    create_access_token,
    verify_google_token,
    get_or_create_google_user,
    authenticate_user,
    get_user_by_email,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

# Models
from src.models import User

# Game imports
from games.gesture_websocket import handle_gesture_game_websocket

logger = logging.getLogger(__name__)


# ===== CREATE APP =====
app = FastAPI(
    title="AeroDeals API",
    description="Flight search and AI-powered games",
    version="2.0.0"
)


# ===== CORS =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== STARTUP/SHUTDOWN =====
@app.on_event("startup")
async def startup_event():
    """Connect to MongoDB on startup"""
    await connect_to_mongo()
    logger.info("✅ Startup complete - MongoDB connected")


@app.on_event("shutdown")
async def shutdown_event():
    """Close MongoDB connection on shutdown"""
    await close_mongo_connection()
    logger.info("👋 AeroDeals API shutdown")


# ===== HELPER TO GET DB =====
def get_db():
    """Get database instance"""
    database_name = os.getenv("DATABASE_NAME", "aerodeals")
    return Database.client[database_name]


# ===== ROOT ENDPOINT =====
@app.get("/")
async def root():
    """API welcome message"""
    return {
        "message": "Welcome to AeroDeals API",
        "version": "2.0.0",
        "features": ["Flight Search", "Voice Game", "Gesture Game"]
    }


# ===== AUTH ENDPOINTS =====

@app.post("/auth/register")
async def register(user_data: dict):
    """Register new user"""
    try:
        email = user_data.get("email")
        password = user_data.get("password")
        full_name = user_data.get("full_name", "")
        
        # Check if user exists
        existing_user = await get_user_by_email(email)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user
        users_collection = Database.get_collection("users")
        new_user = {
            "email": email,
            "full_name": full_name,
            "hashed_password": get_password_hash(password),
            "google_id": None,
            "profile_picture": None,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        
        result = await users_collection.insert_one(new_user)
        
        # Create token
        access_token = create_access_token(
            data={"sub": email},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": email,
                "full_name": full_name
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auth/login-json")
async def login(credentials: dict):
    """Login with email and password"""
    try:
        email = credentials.get("email")
        password = credentials.get("password")
        
        user = await authenticate_user(email, password)
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Incorrect email or password"
            )
        
        # Create token
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "full_name": user.full_name
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/auth/google")
async def google_login(token_data: dict):
    """Login with Google OAuth"""
    try:
        token = token_data.get("credential") or token_data.get("token")
        
        if not token:
            raise HTTPException(status_code=400, detail="No token provided")
        
        # Verify Google token
        google_user_info = await verify_google_token(token)
        
        # Get or create user
        user = await get_or_create_google_user(google_user_info)
        
        # Create JWT token
        access_token = create_access_token(
            data={"sub": user.email},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "email": user.email,
                "full_name": user.full_name,
                "picture": user.profile_picture
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return {
        "email": current_user.email,
        "full_name": current_user.full_name,
        "profile_picture": current_user.profile_picture,
        "google_id": current_user.google_id,
        "created_at": current_user.created_at
    }


# ===== YOUR EXISTING FLIGHT ENDPOINTS GO HERE =====

@app.get("/search")
async def search_flights(
    origin: str,
    destination: str,
    start_date: str,
    end_date: str,
    current_user: User = Depends(get_current_user)
):
    """Search flights and save to history"""
    try:
        logger.info(f"🔍 Flight search: {origin} → {destination} ({start_date} to {end_date})")
        
        from src.flight_scraper import FlightScraper
        from src.data_processor import process_flights
        
        # Search flights
        scraper = FlightScraper()
        flights = scraper.find_best_deals(origin, destination, start_date, end_date)
        
        if not flights:
            logger.warning(f"⚠️ No flights found for {origin} → {destination}")
            return {
                "origin": origin,
                "destination": destination,
                "start_date": start_date,
                "end_date": end_date,
                "flights": [],
                "analysis": {
                    "min_price": 0,
                    "max_price": 0,
                    "avg_price": 0,
                    "total_flights": 0
                }
            }
        
        # Process flights data
        analysis = process_flights(flights)
        
        # Save to history
        db = get_db()
        search_record = {
            "user_email": current_user.email,
            "origin": origin,
            "destination": destination,
            "start_date": start_date,
            "end_date": end_date,
            "flights": flights,
            "analysis": analysis,
            "created_at": datetime.utcnow(),
            "is_saved": False
        }
        
        result = await db.search_history.insert_one(search_record)
        search_record["_id"] = str(result.inserted_id)
        
        logger.info(f"✅ Found {len(flights)} flights, saved to history")
        
        return {
            "id": str(result.inserted_id),
            "origin": origin,
            "destination": destination,
            "start_date": start_date,
            "end_date": end_date,
            "flights": flights[:10],  # Return first 10
            "analysis": analysis,
            "total_flights": len(flights)
        }
        
    except Exception as e:
        logger.error(f"❌ Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/search/{search_id}")
async def get_search_details(
    search_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get detailed flight information for a search"""
    try:
        from bson import ObjectId
        
        db = get_db()
        search = await db.search_history.find_one({
            "_id": ObjectId(search_id),
            "user_email": current_user.email
        })
        
        if not search:
            raise HTTPException(status_code=404, detail="Search not found")
        
        search["_id"] = str(search["_id"])
        return search
        
    except Exception as e:
        logger.error(f"Error fetching search details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history")
async def get_search_history(current_user: User = Depends(get_current_user)):
    """Get user's search history"""
    try:
        db = get_db()
        
        # Get searches from last 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        cursor = db.search_history.find({
            "user_email": current_user.email,
            "created_at": {"$gte": seven_days_ago},
            "is_saved": False
        }).sort("created_at", -1)
        
        history = await cursor.to_list(length=100)
        
        # Convert ObjectId to string
        for item in history:
            item["_id"] = str(item["_id"])
        
        return {"history": history, "count": len(history)}
        
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/saved")
async def get_saved_searches(current_user: User = Depends(get_current_user)):
    """Get user's saved searches"""
    try:
        db = get_db()
        
        cursor = db.search_history.find({
            "user_email": current_user.email,
            "is_saved": True
        }).sort("created_at", -1)
        
        saved = await cursor.to_list(length=100)
        
        for item in saved:
            item["_id"] = str(item["_id"])
        
        return {"saved": saved, "count": len(saved)}
        
    except Exception as e:
        logger.error(f"Error fetching saved: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/save/{search_id}")
async def save_search(
    search_id: str,
    current_user: User = Depends(get_current_user)
):
    """Save a search permanently"""
    try:
        from bson import ObjectId
        
        db = get_db()
        result = await db.search_history.update_one(
            {
                "_id": ObjectId(search_id),
                "user_email": current_user.email
            },
            {"$set": {"is_saved": True}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Search not found")
        
        return {"success": True, "message": "Search saved"}
        
    except Exception as e:
        logger.error(f"Error saving search: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/history/{search_id}")
async def delete_search(
    search_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a search from history"""
    try:
        from bson import ObjectId
        
        db = get_db()
        result = await db.search_history.delete_one({
            "_id": ObjectId(search_id),
            "user_email": current_user.email
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Search not found")
        
        return {"success": True, "message": "Search deleted"}
        
    except Exception as e:
        logger.error(f"Error deleting search: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== GAME ENDPOINTS =====

@app.post("/games/score")
async def submit_game_score(
    score_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Submit game score"""
    try:
        game_type = score_data.get("game_type", "voice")
        score = score_data.get("score", 0)
        email = current_user.email  # FIX: Use .email not ["email"]
        
        logger.info(f"📊 Score submission: {email} - {game_type}: {score}")
        
        db = get_db()
        existing_stats = await db.game_stats.find_one({"email": email})
        
        if not existing_stats:
            existing_stats = {
                "email": email,
                "voice": {
                    "high_score": 0,
                    "total_games": 0,
                    "total_score": 0,
                    "average_score": 0,
                    "last_played": None
                },
                "gesture": {
                    "high_score": 0,
                    "total_games": 0,
                    "total_score": 0,
                    "average_score": 0,
                    "last_played": None
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        
        game_stats = existing_stats.get(game_type, {
            "high_score": 0,
            "total_games": 0,
            "total_score": 0,
            "average_score": 0,
            "last_played": None
        })
        
        is_high_score = score > game_stats.get("high_score", 0)
        new_total_games = game_stats.get("total_games", 0) + 1
        new_total_score = game_stats.get("total_score", 0) + score
        new_average = round(new_total_score / new_total_games, 2)
        
        updated_game_stats = {
            "high_score": max(score, game_stats.get("high_score", 0)),
            "total_games": new_total_games,
            "total_score": new_total_score,
            "average_score": new_average,
            "last_played": datetime.utcnow()
        }
        
        existing_stats[game_type] = updated_game_stats
        existing_stats["updated_at"] = datetime.utcnow()
        
        logger.info(f"💾 Updating stats in database for {email}")
        logger.info(f"   New high score: {updated_game_stats['high_score']}")
        logger.info(f"   Total games: {updated_game_stats['total_games']}")
        
        result = await db.game_stats.update_one(
            {"email": email},
            {"$set": existing_stats},
            upsert=True
        )
        
        logger.info(f"✅ Database update result: matched={result.matched_count}, modified={result.modified_count}")
        
        if is_high_score:
            logger.info(f"🏆 NEW HIGH SCORE! {email}: {score} ({game_type})")
        
        return {
            "success": True,
            "is_high_score": is_high_score,
            "high_score": updated_game_stats["high_score"],
            "total_games": updated_game_stats["total_games"],
            "average_score": updated_game_stats["average_score"]
        }
        
    except Exception as e:
        logger.error(f"Error submitting score: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/games/stats")
async def get_game_stats(current_user: User = Depends(get_current_user)):
    """Get user's game statistics"""
    try:
        email = current_user.email
        db = get_db()
        
        stats = await db.game_stats.find_one({"email": email})
        
        if not stats:
            return {
                "stats": {
                    "voice": {
                        "high_score": 0,
                        "total_games": 0,
                        "average_score": 0,
                        "last_played": None
                    },
                    "gesture": {
                        "high_score": 0,
                        "total_games": 0,
                        "average_score": 0,
                        "last_played": None
                    }
                }
            }
        
        stats.pop("_id", None)
        
        return {
            "stats": {
                "voice": stats.get("voice", {
                    "high_score": 0,
                    "total_games": 0,
                    "average_score": 0,
                    "last_played": None
                }),
                "gesture": stats.get("gesture", {
                    "high_score": 0,
                    "total_games": 0,
                    "average_score": 0,
                    "last_played": None
                })
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== GESTURE GAME =====

@app.post("/games/gesture/session")
async def create_gesture_game_session(current_user: User = Depends(get_current_user)):
    """Create gesture game session"""
    session_id = str(uuid.uuid4())
    logger.info(f"✋ Gesture session: {session_id}")
    
    return {
        "session_id": session_id,
        "websocket_url": f"/ws/gesture/{session_id}"
    }


@app.websocket("/ws/gesture/{session_id}")
async def gesture_game_websocket(websocket: WebSocket, session_id: str):
    """Gesture game WebSocket"""
    try:
        await handle_gesture_game_websocket(websocket, session_id)
    except Exception as e:
        logger.error(f"Gesture WebSocket error: {e}")
        raise