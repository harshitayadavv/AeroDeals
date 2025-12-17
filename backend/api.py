from fastapi import FastAPI, Query, HTTPException, Depends, status, WebSocket
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
    verify_google_token,
    get_or_create_google_user
)

from datetime import datetime, timedelta
from bson import ObjectId
import logging
import uuid

# ==================== APP SETUP ====================

app = FastAPI(title="AeroDeals API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== DB EVENTS ====================

@app.on_event("startup")
async def startup_db():
    await Database.connect_db()
    logger.info("🚀 AeroDeals API started")

@app.on_event("shutdown")
async def shutdown_db():
    await Database.close_db()
    logger.info("👋 AeroDeals API shutdown")

# ==================== ROOT ====================

@app.get("/")
async def root():
    return {
        "message": "✈️ Welcome to AeroDeals API",
        "version": "2.0.0",
        "endpoints": {
            "auth": "/auth/*",
            "search": "/search",
            "history": "/history",
            "saved": "/saved",
            "games": "/games/*"
        }
    }

# ==================== AUTH ====================

@app.post("/auth/register", response_model=UserResponse, status_code=201)
async def register(user: UserCreate):
    users = Database.get_collection("users")

    if await users.find_one({"email": user.email}):
        raise HTTPException(400, "Email already registered")

    doc = {
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": get_password_hash(user.password),
        "is_active": True,
        "created_at": datetime.utcnow()
    }

    res = await users.insert_one(doc)
    return UserResponse(
        id=str(res.inserted_id),
        email=user.email,
        full_name=user.full_name,
        created_at=doc["created_at"]
    )

@app.post("/auth/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form.username, form.password)
    if not user:
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token({"sub": user.email})
    return Token(access_token=token, token_type="bearer")

@app.post("/auth/login-json", response_model=Token)
async def login_json(data: UserLogin):
    user = await authenticate_user(data.email, data.password)
    if not user:
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token({"sub": user.email})
    return Token(access_token=token, token_type="bearer")

@app.post("/auth/google", response_model=Token)
async def google_login(body: dict):
    token = body.get("token")
    if not token:
        raise HTTPException(400, "Google token required")

    google_user = await verify_google_token(token)
    user = await get_or_create_google_user(google_user)

    jwt = create_access_token({"sub": user.email})
    return Token(access_token=jwt, token_type="bearer")

@app.get("/auth/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_active_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        profile_picture=current_user.profile_picture,
        created_at=current_user.created_at
    )

# ==================== FLIGHT SEARCH ====================

@app.get("/search")
async def search_flights(
    origin: str = Query(..., description="Origin city"),
    destination: str = Query(..., description="Destination city"),
    start_date: str = Query(..., description="Start date YYYY-MM-DD"),
    end_date: str = Query(..., description="End date YYYY-MM-DD"),
    current_user: User = Depends(get_current_active_user)
):
    logger.info(f"Search: {origin} → {destination} ({start_date} to {end_date}) by {current_user.email}")

    if not all(validate_date_format(d) for d in [start_date, end_date]):
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD")

    scraper = FlightScraper()
    try:
        results = scraper.find_best_deals(
            origin.upper(), destination.upper(), start_date, end_date
        )
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        raise HTTPException(500, "Flight scraping failed")

    if results.empty:
        return {
            "flights": [],
            "analysis": {"min_price": 0, "avg_price": 0, "total_flights": 0},
            "message": "No flights found"
        }

    analysis = FlightDataProcessor.analyze_deals(results)
    flights = results.drop(columns=["price_num"], errors="ignore").to_dict("records")

    try:
        searches = Database.get_collection("searches")
        doc = {
            "user_id": str(current_user.id),
            "origin": origin.upper(),
            "destination": destination.upper(),
            "start_date": start_date,
            "end_date": end_date,
            "flights": flights,
            "analysis": analysis,
            "is_saved": False,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=7)
        }

        res = await searches.insert_one(doc)
        search_id = str(res.inserted_id)
        logger.info(f"✅ Search saved: {search_id}")

        return {
            "search_id": search_id,
            "flights": flights,
            "analysis": analysis
        }
    except Exception as e:
        logger.error(f"Save failed: {e}")
        return {
            "flights": flights,
            "analysis": analysis,
            "warning": "Search not saved"
        }

@app.get("/history")
async def get_history(current_user: User = Depends(get_current_active_user)):
    try:
        searches = Database.get_collection("searches")
        cursor = searches.find({
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
        logger.error(f"History fetch failed: {e}")
        raise HTTPException(500, "Failed to fetch history")

@app.get("/saved")
async def get_saved(current_user: User = Depends(get_current_active_user)):
    try:
        searches = Database.get_collection("searches")
        cursor = searches.find({
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
        logger.error(f"Saved fetch failed: {e}")
        raise HTTPException(500, "Failed to fetch saved searches")

@app.get("/search/{search_id}")
async def get_search_details(
    search_id: str,
    current_user: User = Depends(get_current_active_user)
):
    try:
        if not ObjectId.is_valid(search_id):
            raise HTTPException(400, "Invalid search ID")

        searches = Database.get_collection("searches")
        doc = await searches.find_one({
            "_id": ObjectId(search_id),
            "user_id": str(current_user.id)
        })

        if not doc:
            raise HTTPException(404, "Search not found")

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
        logger.error(f"Search details failed: {e}")
        raise HTTPException(500, "Failed to fetch search details")

@app.post("/save/{search_id}")
async def save_search(
    search_id: str,
    current_user: User = Depends(get_current_active_user)
):
    try:
        if not ObjectId.is_valid(search_id):
            raise HTTPException(400, "Invalid search ID")

        searches = Database.get_collection("searches")
        result = await searches.update_one(
            {"_id": ObjectId(search_id), "user_id": str(current_user.id)},
            {"$set": {"is_saved": True}}
        )

        if result.matched_count == 0:
            raise HTTPException(404, "Search not found")

        return {"message": "Search saved successfully", "search_id": search_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Save search failed: {e}")
        raise HTTPException(500, "Failed to save search")

@app.delete("/history/{search_id}")
async def delete_history(
    search_id: str,
    current_user: User = Depends(get_current_active_user)
):
    try:
        if not ObjectId.is_valid(search_id):
            raise HTTPException(400, "Invalid search ID")

        searches = Database.get_collection("searches")
        result = await searches.delete_one({
            "_id": ObjectId(search_id),
            "user_id": str(current_user.id)
        })

        if result.deleted_count == 0:
            raise HTTPException(404, "Search not found")

        return {"message": "Search deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete failed: {e}")
        raise HTTPException(500, "Failed to delete search")

@app.delete("/saved/{search_id}")
async def delete_saved(
    search_id: str,
    current_user: User = Depends(get_current_active_user)
):
    try:
        if not ObjectId.is_valid(search_id):
            raise HTTPException(400, "Invalid search ID")

        searches = Database.get_collection("searches")
        result = await searches.delete_one({
            "_id": ObjectId(search_id),
            "user_id": str(current_user.id),
            "is_saved": True
        })

        if result.deleted_count == 0:
            raise HTTPException(404, "Saved search not found")

        return {"message": "Search removed from saved"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete saved failed: {e}")
        raise HTTPException(500, "Failed to delete saved search")

# ==================== GAME ENDPOINTS ====================

@app.post("/games/score")
async def submit_game_score(
    score_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Submit game score and update user profile"""
    try:
        game_type = score_data.get("game_type", "voice")
        score = int(score_data.get("score", 0))

        users = Database.get_collection("users")
        user = await users.find_one({"_id": ObjectId(current_user.id)})

        game_stats = user.get("game_stats", {})
        stats = game_stats.get(game_type, {
            "high_score": 0,
            "total_games": 0,
            "total_score": 0,
            "last_played": None
        })

        stats["total_games"] += 1
        stats["total_score"] += score
        stats["last_played"] = datetime.utcnow()

        is_high = score > stats["high_score"]
        if is_high:
            stats["high_score"] = score
            logger.info(f"🏆 NEW HIGH SCORE! {current_user.email}: {score}")

        game_stats[game_type] = stats

        await users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": {
                "game_stats": game_stats,
                "last_game_played": datetime.utcnow()
            }}
        )

        logger.info(f"📊 Score submitted: {score} for {current_user.email}")

        return {
            "success": True,
            "score": score,
            "is_high_score": is_high,
            "high_score": stats["high_score"],
            "total_games": stats["total_games"],
            "average_score": round(stats["total_score"] / stats["total_games"], 2)
        }

    except Exception as e:
        logger.error(f"Game score error: {e}")
        raise HTTPException(500, "Failed to submit score")


@app.get("/games/stats")
async def get_game_stats(current_user: User = Depends(get_current_active_user)):
    """Get user's game statistics"""
    try:
        users = Database.get_collection("users")
        user = await users.find_one({"_id": ObjectId(current_user.id)})

        game_stats = user.get("game_stats", {})
        formatted = {}

        for g, s in game_stats.items():
            formatted[g] = {
                "high_score": s.get("high_score", 0),
                "total_games": s.get("total_games", 0),
                "total_score": s.get("total_score", 0),
                "average_score": round(
                    s["total_score"] / s["total_games"], 2
                ) if s["total_games"] else 0,
                "last_played": s.get("last_played")
            }

        return {
            "stats": formatted,
            "last_played": user.get("last_game_played"),
            "total_games_all_types": sum(s.get("total_games", 0) for s in game_stats.values())
        }

    except Exception as e:
        logger.error(f"Stats fetch failed: {e}")
        raise HTTPException(500, "Failed to fetch stats")


@app.get("/games/leaderboard")
async def leaderboard(
    game_type: str = Query("voice", description="Game type"),
    limit: int = Query(10, description="Top N players")
):
    """Get leaderboard for a game type"""
    try:
        users = Database.get_collection("users")

        pipeline = [
            {"$match": {f"game_stats.{game_type}": {"$exists": True}}},
            {"$project": {
                "full_name": 1,
                "email": 1,
                "high_score": f"$game_stats.{game_type}.high_score",
                "total_games": f"$game_stats.{game_type}.total_games"
            }},
            {"$sort": {"high_score": -1}},
            {"$limit": limit}
        ]

        leaderboard = []
        async for u in users.aggregate(pipeline):
            leaderboard.append({
                "rank": len(leaderboard) + 1,
                "player": u.get("full_name", "Anonymous"),
                "email": u["email"].split("@")[0] + "***",
                "high_score": u.get("high_score", 0),
                "total_games": u.get("total_games", 0)
            })

        return {
            "game_type": game_type,
            "leaderboard": leaderboard,
            "total_players": len(leaderboard)
        }

    except Exception as e:
        logger.error(f"Leaderboard failed: {e}")
        raise HTTPException(500, "Failed to fetch leaderboard")


# ==================== GAME WEBSOCKET (OPTIONAL) ====================
# Uncomment if using full backend WebSocket implementation

@app.post("/games/voice/session")
async def create_voice_session(
    current_user: User = Depends(get_current_active_user)
):
    '''Create a new voice game session'''
    session_id = str(uuid.uuid4())
    logger.info(f"🎮 Voice session {session_id} for {current_user.email}")
    return {
        "session_id": session_id,
        "websocket_url": f"/ws/game/voice/{session_id}"
    }


@app.websocket("/ws/game/voice/{session_id}")
async def voice_game_ws(websocket: WebSocket, session_id: str):
    '''WebSocket endpoint for voice game'''
    from games.game_websocket import handle_voice_game_websocket
    await handle_voice_game_websocket(websocket, session_id)
