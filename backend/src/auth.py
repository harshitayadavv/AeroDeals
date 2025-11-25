from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from src.models import TokenData, User
from src.database import Database
from bson import ObjectId
from google.auth.transport import requests
from google.oauth2 import id_token
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_by_email(email: str) -> Optional[User]:
    """Get user from database by email"""
    users_collection = Database.get_collection("users")
    user_dict = await users_collection.find_one({"email": email})
    
    if user_dict:
        return User(**user_dict)
    return None

async def authenticate_user(email: str, password: str):
    """Authenticate user with email and password"""
    user = await get_user_by_email(email)
    if not user:
        return False
    if not user.hashed_password:  # Google users don't have passwords
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

# ==================== GOOGLE OAUTH FUNCTIONS - NEW ====================

async def verify_google_token(token: str) -> dict:
    """Verify Google OAuth token and return user info"""
    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        # Verify the issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
        
        # Return user info
        return {
            'email': idinfo['email'],
            'name': idinfo.get('name', ''),
            'picture': idinfo.get('picture', ''),
            'google_id': idinfo['sub']
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Google token verification failed: {str(e)}"
        )

async def get_or_create_google_user(google_user_info: dict) -> User:
    """Get existing user or create new one from Google OAuth"""
    users_collection = Database.get_collection("users")
    
    # Check if user exists by email
    user_dict = await users_collection.find_one({"email": google_user_info['email']})
    
    if user_dict:
        # User exists - update Google ID if not set
        if not user_dict.get('google_id'):
            await users_collection.update_one(
                {"email": google_user_info['email']},
                {"$set": {
                    "google_id": google_user_info['google_id'],
                    "profile_picture": google_user_info.get('picture')
                }}
            )
            user_dict['google_id'] = google_user_info['google_id']
            user_dict['profile_picture'] = google_user_info.get('picture')
        
        return User(**user_dict)
    
    # Create new user
    new_user = {
        "email": google_user_info['email'],
        "full_name": google_user_info['name'],
        "google_id": google_user_info['google_id'],
        "profile_picture": google_user_info.get('picture'),
        "hashed_password": "",  # No password for Google users
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(new_user)
    new_user['_id'] = result.inserted_id
    
    return User(**new_user)

# ==================== END GOOGLE OAUTH ====================

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user = await get_user_by_email(email=token_data.email)
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user