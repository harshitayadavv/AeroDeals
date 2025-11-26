import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import certifi
import logging

load_dotenv()

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB Atlas"""
        try:
            mongodb_uri = os.getenv("MONGODB_URI")
            
            # DEBUG: Print what we're getting
            logger.info(f"📝 MONGODB_URI exists: {mongodb_uri is not None}")
            logger.info(f"📝 MONGODB_URI length: {len(mongodb_uri) if mongodb_uri else 0}")
            if mongodb_uri:
                logger.info(f"📝 MONGODB_URI starts with: {mongodb_uri[:20]}...")
                logger.info(f"📝 Has mongodb+srv: {'mongodb+srv' in mongodb_uri}")
            else:
                logger.error("❌ MONGODB_URI is None or empty!")
            
            if not mongodb_uri:
                raise ValueError("❌ MONGODB_URI not found in environment variables")
            
            # Check if URI is valid
            if not mongodb_uri.startswith(('mongodb://', 'mongodb+srv://')):
                raise ValueError(f"❌ Invalid MongoDB URI format. Got: {mongodb_uri[:30]}...")
            
            logger.info("🔄 Connecting to MongoDB...")
            
            # Clean connection
            cls.client = AsyncIOMotorClient(
                mongodb_uri,
                tlsCAFile=certifi.where(),
                serverSelectionTimeoutMS=30000,
                connectTimeoutMS=30000,
                socketTimeoutMS=30000
            )
            
            # Test connection
            await cls.client.admin.command('ping')
            logger.info("✅ Successfully connected to MongoDB Atlas!")
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise
    
    @classmethod
    async def close_db(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            logger.info("👋 MongoDB connection closed")
    
    @classmethod
    def get_collection(cls, collection_name: str):
        """Get a collection from the database"""
        if cls.client is None:
            raise RuntimeError("Database not connected. Call connect_db() first.")
        
        database_name = os.getenv("DATABASE_NAME", "aerodeals")
        return cls.client[database_name][collection_name]