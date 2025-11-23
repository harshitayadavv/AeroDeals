from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

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