"""
WebSocket handler for real-time voice game communication
Handles voice commands and sends game state updates
"""

from fastapi import WebSocket, WebSocketDisconnect
import json
import asyncio
import logging
import uuid
import speech_recognition as sr
import io
import wave

logger = logging.getLogger(__name__)


class GameConnectionManager:
    """Manage WebSocket connections for games"""
    
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.recognizer = sr.Recognizer()
        # Adjust for ambient noise
        self.recognizer.energy_threshold = 4000
        self.recognizer.dynamic_energy_threshold = True
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept and store a new connection"""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"🔌 WebSocket connected: {session_id}")
    
    def disconnect(self, session_id: str):
        """Remove a connection"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info(f"🔌 WebSocket disconnected: {session_id}")
    
    async def send_game_state(self, session_id: str, game_state: dict):
        """Send game state to client"""
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_json({
                    "type": "game_state",
                    "data": game_state
                })
            except Exception as e:
                logger.error(f"Failed to send game state: {e}")
    
    async def send_message(self, session_id: str, message_type: str, data: dict):
        """Send a custom message to client"""
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_json({
                    "type": message_type,
                    "data": data
                })
            except Exception as e:
                logger.error(f"Failed to send message: {e}")
    
    def recognize_speech_from_audio(self, audio_data: bytes) -> str:
        """Convert audio bytes to text using speech recognition"""
        try:
            # Convert bytes to AudioData
            audio = sr.AudioData(audio_data, 16000, 2)
            
            # Use Google Speech Recognition (free, no API key needed)
            text = self.recognizer.recognize_google(audio, language="en-US")
            logger.info(f"🎤 Recognized: {text}")
            return text.lower()
            
        except sr.UnknownValueError:
            logger.warning("Could not understand audio")
            return ""
        except sr.RequestError as e:
            logger.error(f"Speech recognition error: {e}")
            return ""
        except Exception as e:
            logger.error(f"Audio processing error: {e}")
            return ""


# Global connection manager
manager = GameConnectionManager()


async def handle_voice_game_websocket(websocket: WebSocket, session_id: str):
    """Handle WebSocket connection for voice-controlled game"""
    from backend.games.voice_game import get_game, delete_game
    
    await manager.connect(websocket, session_id)
    game = get_game(session_id)
    
    # Game loop task
    async def game_loop():
        """Send game state updates at 30 FPS"""
        while session_id in manager.active_connections:
            try:
                game.update()
                game_state = game.get_game_state()
                await manager.send_game_state(session_id, game_state)
                await asyncio.sleep(1/30)  # 30 FPS
            except Exception as e:
                logger.error(f"Game loop error: {e}")
                break
    
    # Start game loop
    game_loop_task = asyncio.create_task(game_loop())
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive()
            
            if "text" in data:
                message = json.loads(data["text"])
                message_type = message.get("type")
                
                if message_type == "start_game":
                    game.start_game()
                    await manager.send_message(session_id, "game_started", {})
                    logger.info(f"🎮 Game started for session {session_id}")
                
                elif message_type == "voice_command":
                    command = message.get("command", "")
                    if command:
                        game.process_voice_command(command)
                
                elif message_type == "ping":
                    await manager.send_message(session_id, "pong", {})
            
            elif "bytes" in data:
                # Audio data received
                audio_bytes = data["bytes"]
                
                # Recognize speech
                command = manager.recognize_speech_from_audio(audio_bytes)
                
                if command:
                    # Send recognized command back to client
                    await manager.send_message(session_id, "command_recognized", {
                        "command": command
                    })
                    
                    # Process command in game
                    game.process_voice_command(command)
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        # Cleanup
        game_loop_task.cancel()
        manager.disconnect(session_id)
        delete_game(session_id)