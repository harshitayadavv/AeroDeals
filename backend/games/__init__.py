"""
Games package initialization
backend/games/__init__.py
"""

# Remove the 'backend.' prefix - it's already in the backend folder!

from games.voice_game import VoiceGameEngine, get_game, delete_game
from games.gesture_game import GestureGameEngine, get_gesture_game, delete_gesture_game

__all__ = [
    'VoiceGameEngine',
    'get_game',
    'delete_game',
    'GestureGameEngine',
    'get_gesture_game',
    'delete_gesture_game'
]