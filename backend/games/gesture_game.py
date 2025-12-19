"""
Gesture Controlled Airplane Game Engine
Same game logic as voice_game.py but controlled by hand gestures
"""

import random
import time
from typing import Dict, List, Tuple
from dataclasses import dataclass, asdict
import logging

logger = logging.getLogger(__name__)


@dataclass
class Airplane:
    """Player's airplane"""
    x: float = 100
    y: float = 250
    width: int = 80
    height: int = 35
    speed: int = 25  # Increased for very visible movement
    
    def move_up(self, canvas_height: int):
        old_y = self.y
        self.y = max(30, self.y - self.speed)
        logger.info(f"🔼 MOVE_UP called: {old_y} → {self.y} (delta: {self.y - old_y})")
    
    def move_down(self, canvas_height: int):
        old_y = self.y
        self.y = min(canvas_height - self.height - 30, self.y + self.speed)
        logger.info(f"🔽 MOVE_DOWN called: {old_y} → {self.y} (delta: {self.y - old_y})")
    
    def move_left(self, canvas_width: int):
        old_x = self.x
        self.x = max(20, self.x - self.speed)
        logger.info(f"◀️ MOVE_LEFT called: {old_x} → {self.x} (delta: {self.x - old_x})")
    
    def move_right(self, canvas_width: int):
        old_x = self.x
        self.x = min(canvas_width - self.width - 20, self.x + self.speed)
        logger.info(f"▶️ MOVE_RIGHT called: {old_x} → {self.x} (delta: {self.x - old_x})")
    
    def get_bounds(self) -> Tuple[float, float, float, float]:
        return (self.x, self.y, self.x + self.width, self.y + self.height)


@dataclass
class Obstacle:
    """Obstacles moving toward the airplane"""
    x: float
    y: float
    width: int = 50
    height: int = 40
    speed: float = 4.0
    type: str = "cloud"  # Changed from obstacle_type to type
    id: int = 0
    
    def move(self):
        self.x -= self.speed
    
    def is_off_screen(self) -> bool:
        return self.x + self.width < 0
    
    def get_bounds(self) -> Tuple[float, float, float, float]:
        return (self.x, self.y, self.x + self.width, self.y + self.height)


class GestureGameEngine:
    """Main game engine for gesture-controlled airplane game"""
    
    def __init__(self, canvas_width: int = 800, canvas_height: int = 500):
        self.canvas_width = canvas_width
        self.canvas_height = canvas_height
        self.airplane = Airplane()
        self.obstacles: List[Obstacle] = []
        self.score = 0
        self.game_over = False
        self.game_started = False
        self.last_obstacle_time = time.time()
        self.obstacle_spawn_interval = 2.0  # Start with 2 seconds
        self.game_speed = 1.0
        self.start_time = None
        self.obstacle_id_counter = 0
        
    def start_game(self):
        """Initialize/restart the game"""
        self.airplane = Airplane()
        self.obstacles = []
        self.score = 0
        self.game_over = False
        self.game_started = True
        self.last_obstacle_time = time.time()
        self.obstacle_spawn_interval = 2.0
        self.game_speed = 1.0
        self.start_time = time.time()
        self.obstacle_id_counter = 0
        logger.info("🎮 Gesture game started!")
    
    def process_gesture_command(self, command: str):
        """Process gesture command and move airplane"""
        logger.info(f"🎮 PROCESS_GESTURE called: command={command}, started={self.game_started}, over={self.game_over}")
        
        if not self.game_started or self.game_over:
            logger.warning(f"⚠️ Cannot process - started={self.game_started}, over={self.game_over}")
            return
        
        command = command.lower().strip()
        logger.info(f"✈️ Processing command: {command} | Current pos: ({self.airplane.x}, {self.airplane.y})")
        
        if command == "up":
            old_y = self.airplane.y
            self.airplane.move_up(self.canvas_height)
            logger.info(f"✈️ UP: {old_y} → {self.airplane.y}")
        
        elif command == "down":
            old_y = self.airplane.y
            self.airplane.move_down(self.canvas_height)
            logger.info(f"✈️ DOWN: {old_y} → {self.airplane.y}")
        
        elif command == "left":
            old_x = self.airplane.x
            self.airplane.move_left(self.canvas_width)
            logger.info(f"✈️ LEFT: {old_x} → {self.airplane.x}")
        
        elif command == "right":
            old_x = self.airplane.x
            self.airplane.move_right(self.canvas_width)
            logger.info(f"✈️ RIGHT: {old_x} → {self.airplane.x}")
        
        else:
            logger.warning(f"❌ Unknown command: {command}")
    
    def spawn_obstacle(self):
        """Spawn a new obstacle from the right side"""
        # Don't spawn obstacles in the first 1.5 seconds
        if self.start_time and (time.time() - self.start_time) < 1.5:
            return
        
        # Choose obstacle type
        obstacle_types = [
            {"type": "bird", "width": 50, "height": 40},
            {"type": "cloud", "width": 60, "height": 40},
            {"type": "thunder", "width": 30, "height": 70},
            {"type": "ufo", "width": 50, "height": 40}
        ]
        
        obstacle_config = random.choice(obstacle_types)
        
        # Random Y position (avoid edges)
        y = random.randint(60, self.canvas_height - obstacle_config["height"] - 60)
        
        # Create obstacle
        obstacle = Obstacle(
            x=self.canvas_width + 20,  # Spawn just off-screen right
            y=y,
            width=obstacle_config["width"],
            height=obstacle_config["height"],
            speed=3.5 * self.game_speed,
            type=obstacle_config["type"],
            id=self.obstacle_id_counter
        )
        
        self.obstacle_id_counter += 1
        self.obstacles.append(obstacle)
        
        logger.info(f"🌩️ Spawned {obstacle.type} at x={obstacle.x}, y={y}")
    
    def check_collision(self, obj1_bounds: Tuple, obj2_bounds: Tuple) -> bool:
        """Check if two rectangular objects collide"""
        x1_1, y1_1, x2_1, y2_1 = obj1_bounds
        x1_2, y1_2, x2_2, y2_2 = obj2_bounds
        
        collided = not (x2_1 < x1_2 or x2_2 < x1_1 or y2_1 < y1_2 or y2_2 < y1_1)
        
        if collided:
            logger.info(f"💥 COLLISION DETECTED:")
            logger.info(f"   Airplane: ({x1_1:.1f}, {y1_1:.1f}) to ({x2_1:.1f}, {y2_1:.1f})")
            logger.info(f"   Obstacle: ({x1_2:.1f}, {y1_2:.1f}) to ({x2_2:.1f}, {y2_2:.1f})")
        
        return collided
    
    def update(self):
        """Update game state (called every frame ~30 FPS)"""
        if not self.game_started or self.game_over:
            return
        
        current_time = time.time()
        
        # Spawn obstacles at regular intervals
        if current_time - self.last_obstacle_time >= self.obstacle_spawn_interval:
            self.spawn_obstacle()
            self.last_obstacle_time = current_time
        
        airplane_bounds = self.airplane.get_bounds()
        
        # Update all obstacles
        for obstacle in self.obstacles[:]:
            obstacle.move()
            
            # Check collision with GENEROUS padding for forgiveness
            padding = 15  # Increased from 10
            airplane_collision_bounds = (
                airplane_bounds[0] + padding,
                airplane_bounds[1] + padding,
                airplane_bounds[2] - padding,
                airplane_bounds[3] - padding
            )
            
            if self.check_collision(airplane_collision_bounds, obstacle.get_bounds()):
                self.game_over = True
                logger.warning(f"💥 COLLISION with {obstacle.type}!")
                logger.warning(f"   Airplane bounds: {airplane_bounds}")
                logger.warning(f"   Obstacle bounds: {obstacle.get_bounds()}")
                logger.warning(f"   Final Score: {self.score}")
                return
            
            # Remove obstacles that went off screen and award points
            if obstacle.is_off_screen():
                self.obstacles.remove(obstacle)
                self.score += 10
                
                # Increase difficulty every 100 points
                if self.score % 100 == 0 and self.score > 0:
                    self.game_speed = min(2.0, self.game_speed + 0.1)
                    self.obstacle_spawn_interval = max(1.0, self.obstacle_spawn_interval - 0.1)
                    logger.info(f"🚀 Difficulty increased! Speed: {self.game_speed:.1f}x")
    
    def get_game_state(self) -> Dict:
        """Return current game state for frontend"""
        return {
            "airplane": asdict(self.airplane),
            "obstacles": [asdict(obs) for obs in self.obstacles],
            "score": self.score,
            "gameOver": self.game_over,
            "gameStarted": self.game_started,
            "gameSpeed": round(self.game_speed, 1)
        }


# Game session manager
active_gesture_games: Dict[str, GestureGameEngine] = {}


def get_gesture_game(session_id: str) -> GestureGameEngine:
    """Get or create a gesture game session"""
    if session_id not in active_gesture_games:
        active_gesture_games[session_id] = GestureGameEngine()
    return active_gesture_games[session_id]


def delete_gesture_game(session_id: str):
    """Remove a gesture game session"""
    if session_id in active_gesture_games:
        del active_gesture_games[session_id]
        logger.info(f"🗑️ Gesture game session {session_id} deleted")