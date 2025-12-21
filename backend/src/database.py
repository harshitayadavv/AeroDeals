import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

# Global db variable for compatibility
db = None

class Database:
    client: AsyncIOMotorClient = None
    
    @classmethod
    async def connect_db(cls):
        """Connect to MongoDB Atlas"""
        global db  # Add this line
        
        try:
            mongodb_uri = os.getenv("MONGODB_URI")
            
            if not mongodb_uri:
                raise ValueError("❌ MONGODB_URI not found in environment variables")
            
            # Remove prefix if exists
            if mongodb_uri.startswith("MONGODB_URI="):
                mongodb_uri = mongodb_uri.replace("MONGODB_URI=", "", 1)
            
            logger.info("🔄 Connecting to MongoDB...")
            
            # Simple connection
            cls.client = AsyncIOMotorClient(mongodb_uri)
            
            # Test connection
            await cls.client.admin.command('ping')
            logger.info("✅ Successfully connected to MongoDB Atlas!")
            
            # Set global db variable for compatibility
            database_name = os.getenv("DATABASE_NAME", "aerodeals")
            db = cls.client[database_name]
            
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


# Compatibility functions for api.py
async def connect_to_mongo():
    """Compatibility wrapper for Database.connect_db()"""
    await Database.connect_db()


async def close_mongo_connection():
    """Compatibility wrapper for Database.close_db()"""
    await Database.close_db()


# Export for imports
__all__ = ['Database', 'db', 'connect_to_mongo', 'close_mongo_connection']