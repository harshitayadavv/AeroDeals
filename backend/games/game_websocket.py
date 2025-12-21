"""
Simple WebSocket handler for voice game
Save as: backend/games/game_websocket.py
"""

import asyncio
import json
import logging
from fastapi import WebSocket

from games.voice_game import get_game, delete_game

logger = logging.getLogger(__name__)


async def handle_voice_game_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket handler for voice-controlled game
    """
    
    await websocket.accept()
    logger.info(f"🎤 Voice WebSocket connected: {session_id}")
    
    game = get_game(session_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            msg_type = message.get("type")
            
            if msg_type == "start":
                game.start_game()
                state = game.get_game_state()
                
                await websocket.send_json({
                    "type": "game_started",
                    "state": state
                })
                logger.info("🎮 Voice game started")
                
            elif msg_type == "command":
                command = message.get("command", "")
                if command:
                    game.process_command(command)
                    
            elif msg_type == "update":
                game.update()
                
                await websocket.send_json({
                    "type": "game_state",
                    "state": game.get_game_state()
                })
                
            elif msg_type == "restart":
                game.start_game()
                await websocket.send_json({
                    "type": "game_restarted",
                    "state": game.get_game_state()
                })
            
    except Exception as e:
        logger.error(f"Voice WebSocket error: {e}")
    
    finally:
        delete_game(session_id)
        logger.info(f"🗑️ Voice game session cleaned up: {session_id}")