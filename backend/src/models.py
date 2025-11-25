from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        
        return core_schema.with_info_plain_validator_function(
            cls.validate,
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            )
        )

    @classmethod
    def validate(cls, v, info):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    email: EmailStr
    full_name: str
    hashed_password: str
    google_id: Optional[str] = None  # NEW: For Google OAuth
    profile_picture: Optional[str] = None  # NEW: For Google profile picture
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    profile_picture: Optional[str] = None  # NEW: Include profile picture
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Flight Models
class FlightData(BaseModel):
    airline: str
    departure: str
    arrival: str
    price: str
    duration: str
    date: str

class SearchRequest(BaseModel):
    origin: str
    destination: str
    start_date: str
    end_date: str

class SearchResult(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: Optional[str] = None
    origin: str
    destination: str
    start_date: str
    end_date: str
    flights: List[FlightData]
    analysis: dict
    is_saved: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class SearchHistory(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    search_id: str
    user_id: Optional[str] = None
    origin: str
    destination: str
    start_date: str
    end_date: str
    total_flights: int
    min_price: float
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}