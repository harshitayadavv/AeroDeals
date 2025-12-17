"""
Voice Controlled Airplane Game Engine
Handles game state, collision detection, and voice command processing
"""

import asyncio
import random
import time
from typing import Dict, List, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class Airplane:
    """Player's airplane"""
    x: float = 50  # Start at 50px from left
    y: float = 250  # Middle of 500px height
    width: int = 60
    height: int = 40
    speed: int = 15
    
    def move_up(self, canvas_height: int):
        self.y = max(0, self.y - self.speed)
    
    def move_down(self, canvas_height: int):
        self.y = min(canvas_height - self.height, self.y + self.speed)
    
    def move_left(self, canvas_width: int):
        self.x = max(0, self.x - self.speed)
    
    def move_right(self, canvas_width: int):
        self.x = min(canvas_width - self.width, self.x + self.speed)
    
    def get_bounds(self) -> Tuple[float, float, float, float]:
        """Return (x1, y1, x2, y2) for collision detection"""
        return (self.x, self.y, self.x + self.width, self.y + self.height)


@dataclass
class Obstacle:
    """Obstacles moving toward the airplane"""
    x: float
    y: float
    width: int = 40
    height: int = 40
    speed: int = 5
    obstacle_type: str = "cloud"  # cloud, bird, mountain
    
    def move(self):
        """Move obstacle from right to left"""
        self.x -= self.speed
    
    def is_off_screen(self) -> bool:
        """Check if obstacle has moved past the left edge"""
        return self.x + self.width < 0
    
    def get_bounds(self) -> Tuple[float, float, float, float]:
        """Return (x1, y1, x2, y2) for collision detection"""
        return (self.x, self.y, self.x + self.width, self.y + self.height)


class VoiceGameEngine:
    """Main game engine for voice-controlled airplane game"""
    
    def __init__(self, canvas_width: int = 800, canvas_height: int = 500):
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        self.airplane = Airplane()
        self.obstacles: List[Obstacle] = []
        self.score = 0
        self.game_over = False
        self.game_started = False
        self.last_obstacle_time = time.time()
        self.obstacle_spawn_interval = 1.5  # Seconds between obstacles
        self.game_speed = 1.0  # Speed multiplier (increases with score)
        
    def start_game(self):
        """Initialize/restart the game"""
        self.airplane = Airplane()
        self.obstacles = []
        self.score = 0
        self.game_over = False
        self.game_started = True
        self.last_obstacle_time = time.time()
        self.game_speed = 1.0
        logger.info("🎮 Game started!")
    
    def process_voice_command(self, command: str):
        """Process voice command and move airplane"""
        if not self.game_started or self.game_over:
            return
        
        command = command.lower().strip()
        
        if command in ["up", "move up", "go up"]:
            self.airplane.move_up(self.canvas_height)
            logger.info(f"✈️ Airplane moved UP to y={self.airplane.y}")
        
        elif command in ["down", "move down", "go down"]:
            self.airplane.move_down(self.canvas_height)
            logger.info(f"✈️ Airplane moved DOWN to y={self.airplane.y}")
        
        elif command in ["left", "move left", "go left"]:
            self.airplane.move_left(self.canvas_width)
            logger.info(f"✈️ Airplane moved LEFT to x={self.airplane.x}")
        
        elif command in ["right", "move right", "go right"]:
            self.airplane.move_right(self.canvas_width)
            logger.info(f"✈️ Airplane moved RIGHT to x={self.airplane.x}")
        
        else:
            logger.warning(f"❌ Unknown command: {command}")
    
    def spawn_obstacle(self):
        """Spawn a new obstacle from the right side"""
        obstacle_types = ["cloud", "bird", "mountain"]
        obstacle_type = random.choice(obstacle_types)
        
        # Random Y position (avoid top and bottom edges)
        y = random.randint(50, self.canvas_height - 90)
        
        obstacle = Obstacle(
            x=self.canvas_width,
            y=y,
            speed=int(5 * self.game_speed),
            obstacle_type=obstacle_type
        )
        
        self.obstacles.append(obstacle)
        logger.info(f"🌩️ Spawned {obstacle_type} at y={y}")
    
    def check_collision(self, obj1_bounds: Tuple, obj2_bounds: Tuple) -> bool:
        """Check if two rectangular objects collide"""
        x1_1, y1_1, x2_1, y2_1 = obj1_bounds
        x1_2, y1_2, x2_2, y2_2 = obj2_bounds
        
        return not (x2_1 < x1_2 or x2_2 < x1_1 or y2_1 < y1_2 or y2_2 < y1_1)
    
    def update(self):
        """Update game state (called every frame)"""
        if not self.game_started or self.game_over:
            return
        
        # Spawn obstacles periodically
        current_time = time.time()
        if current_time - self.last_obstacle_time >= self.obstacle_spawn_interval:
            self.spawn_obstacle()
            self.last_obstacle_time = current_time
        
        # Move obstacles
        airplane_bounds = self.airplane.get_bounds()
        
        for obstacle in self.obstacles[:]:
            obstacle.move()
            
            # Check collision
            if self.check_collision(airplane_bounds, obstacle.get_bounds()):
                self.game_over = True
                logger.warning(f"💥 COLLISION! Game Over. Final Score: {self.score}")
                return
            
            # Remove off-screen obstacles and increment score
            if obstacle.is_off_screen():
                self.obstacles.remove(obstacle)
                self.score += 10
                
                # Increase difficulty every 100 points
                if self.score % 100 == 0:
                    self.game_speed += 0.1
                    self.obstacle_spawn_interval = max(0.8, self.obstacle_spawn_interval - 0.1)
                    logger.info(f"🚀 Difficulty increased! Speed: {self.game_speed:.1f}x")
    
    def get_game_state(self) -> Dict:
        """Return current game state for frontend"""
        return {
            "airplane": asdict(self.airplane),
            "obstacles": [asdict(obs) for obs in self.obstacles],
            "score": self.score,
            "game_over": self.game_over,
            "game_started": self.game_started,
            "canvas_width": self.canvas_width,
            "canvas_height": self.canvas_height,
            "game_speed": round(self.game_speed, 1)
        }


# Game session manager (in-memory, can be replaced with Redis for production)
active_games: Dict[str, VoiceGameEngine] = {}


def get_game(session_id: str) -> VoiceGameEngine:
    """Get or create a game session"""
    if session_id not in active_games:
        active_games[session_id] = VoiceGameEngine()
    return active_games[session_id]


def delete_game(session_id: str):
    """Remove a game session"""
    if session_id in active_games:
        del active_games[session_id]
        logger.info(f"🗑️ Game session {session_id} deleted")