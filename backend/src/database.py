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
            
            if not mongodb_uri:
                raise ValueError("❌ MONGODB_URI not found in environment variables")
            
            logger.info("🔄 Connecting to MongoDB...")
            
            # Create client with proper SSL/TLS configuration
            cls.client = AsyncIOMotorClient(
                mongodb_uri,
                tlsCAFile=certifi.where(),  # ✅ This fixes the SSL error
                serverSelectionTimeoutMS=30000,  # Increased timeout
                connectTimeoutMS=30000,
                socketTimeoutMS=30000,
                retryWrites=True,
                w='majority'
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
