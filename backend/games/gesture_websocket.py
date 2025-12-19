"""
WebSocket handler with RELIABLE gesture detection using hand position
No more finger counting - uses hand movement and orientation
"""

import asyncio
import json
import logging
import base64
import cv2
import numpy as np
from fastapi import WebSocket, WebSocketDisconnect
import mediapipe as mp

from games.gesture_game import get_gesture_game, delete_gesture_game

logger = logging.getLogger(__name__)

# Initialize MediaPipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.6
)


def detect_gesture_by_position(hand_landmarks, frame_width, frame_height) -> str:
    """
    RELIABLE gesture detection using hand position and shape
    
    Gestures:
    - Hand in TOP half of screen → UP
    - Hand in BOTTOM half of screen → DOWN
    - Hand in LEFT half of screen → LEFT  
    - Hand in RIGHT half of screen → RIGHT
    
    Priority: Vertical (up/down) over horizontal (left/right)
    """
    
    # Get center of palm (point 9 = middle of palm)
    palm_center = hand_landmarks.landmark[9]
    
    # Normalize to screen coordinates (0 to 1)
    palm_x = palm_center.x
    palm_y = palm_center.y
    
    # Calculate distances from center
    center_x = 0.5
    center_y = 0.5
    
    x_distance = palm_x - center_x  # Negative = left, Positive = right
    y_distance = palm_y - center_y  # Negative = up, Positive = down
    
    # Determine if hand is clearly in a zone (need significant offset)
    THRESHOLD = 0.15  # 15% from center
    
    # Prioritize vertical movement (up/down)
    if y_distance < -THRESHOLD:
        return "up"
    elif y_distance > THRESHOLD:
        return "down"
    
    # Then check horizontal
    elif x_distance < -THRESHOLD:
        return "left"
    elif x_distance > THRESHOLD:
        return "right"
    
    else:
        return "none"  # Hand near center = neutral


def get_gesture_description(gesture: str, palm_x: float, palm_y: float) -> str:
    """Get description of current gesture"""
    position = f"Hand at ({palm_x:.2f}, {palm_y:.2f})"
    
    if gesture == "up":
        return f"☝️ UP - {position}"
    elif gesture == "down":
        return f"👇 DOWN - {position}"
    elif gesture == "left":
        return f"👈 LEFT - {position}"
    elif gesture == "right":
        return f"👉 RIGHT - {position}"
    else:
        return f"✋ CENTER - {position}"


def process_frame(frame_data: str):
    """
    Process base64 frame and detect gesture
    Returns: (gesture, processed_frame_base64, hand_detected, description)
    """
    try:
        # Decode base64 image
        img_data = base64.b64decode(frame_data.split(',')[1])
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return "none", None, False, "Frame decode failed"
        
        # Flip frame horizontally for mirror effect
        frame = cv2.flip(frame, 1)
        
        frame_height, frame_width = frame.shape[:2]
        
        # Convert to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = hands.process(rgb_frame)
        
        gesture = "none"
        hand_detected = False
        description = "No hand detected"
        
        # Draw zone guides (quadrants)
        cv2.line(frame, (frame_width//2, 0), (frame_width//2, frame_height), (100, 100, 100), 1)
        cv2.line(frame, (0, frame_height//2), (frame_width, frame_height//2), (100, 100, 100), 1)
        
        # Add zone labels
        cv2.putText(frame, "UP", (frame_width//2 - 20, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, "DOWN", (frame_width//2 - 30, frame_height - 10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, "LEFT", (10, frame_height//2), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, "RIGHT", (frame_width - 70, frame_height//2), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        
        # Detect hand and gesture
        if results.multi_hand_landmarks:
            hand_detected = True
            hand_landmarks = results.multi_hand_landmarks[0]
            
            # Detect gesture by hand position
            gesture = detect_gesture_by_position(hand_landmarks, frame_width, frame_height)
            
            # Get palm center for visualization
            palm_center = hand_landmarks.landmark[9]
            palm_x = palm_center.x
            palm_y = palm_center.y
            
            description = get_gesture_description(gesture, palm_x, palm_y)
            
            # Draw hand landmarks
            mp.solutions.drawing_utils.draw_landmarks(
                frame,
                hand_landmarks,
                mp_hands.HAND_CONNECTIONS,
                mp.solutions.drawing_styles.get_default_hand_landmarks_style(),
                mp.solutions.drawing_styles.get_default_hand_connections_style()
            )
            
            # Draw palm center with large circle
            palm_pixel_x = int(palm_x * frame_width)
            palm_pixel_y = int(palm_y * frame_height)
            cv2.circle(frame, (palm_pixel_x, palm_pixel_y), 15, (0, 255, 0), -1)
            
            # Color code by gesture
            color = (0, 255, 0)  # Green default
            if gesture == "up":
                color = (255, 255, 0)  # Cyan
            elif gesture == "down":
                color = (0, 165, 255)  # Orange
            elif gesture == "left":
                color = (255, 0, 255)  # Magenta
            elif gesture == "right":
                color = (255, 255, 0)  # Yellow
            
            # Draw gesture text
            cv2.putText(
                frame,
                f"GESTURE: {gesture.upper()}",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                color,
                3
            )
        else:
            cv2.putText(
                frame,
                "SHOW YOUR HAND",
                (frame_width//2 - 120, frame_height//2),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                (0, 0, 255),
                2
            )
        
        # Encode processed frame back to base64
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        processed_frame = base64.b64encode(buffer).decode('utf-8')
        processed_frame = f"data:image/jpeg;base64,{processed_frame}"
        
        return gesture, processed_frame, hand_detected, description
        
    except Exception as e:
        logger.error(f"Frame processing error: {e}")
        return "none", None, False, f"Error: {str(e)}"


async def handle_gesture_game_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket handler with position-based gesture detection
    """
    
    await websocket.accept()
    logger.info(f"✋ Gesture WebSocket connected: {session_id}")
    
    game = get_gesture_game(session_id)
    last_gesture = "none"
    game_loop_task = None
    gesture_cooldown = {}  # Prevent gesture spam
    
    async def game_update_loop():
        """Continuous game update loop"""
        loop_count = 0
        while True:
            try:
                if game.game_started and not game.game_over:
                    game.update()
                    
                    state = game.get_game_state()
                    
                    # Log every 30 frames (once per second at 30fps)
                    if loop_count % 30 == 0:
                        logger.info(f"🎮 Game Loop #{loop_count}: Airplane at ({state['airplane']['x']:.1f}, {state['airplane']['y']:.1f}), Obstacles: {len(state['obstacles'])}")
                    
                    await websocket.send_json({
                        "type": "game_state",
                        "state": state,
                        "hand_detected": False,
                        "gesture": last_gesture
                    })
                    
                    loop_count += 1
                
                await asyncio.sleep(0.033)  # ~30 FPS
            except Exception as e:
                logger.error(f"Game loop error: {e}")
                break
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            msg_type = message.get("type")
            
            if msg_type == "start":
                logger.info("🎮 GAME START REQUEST")
                game.start_game()
                state = game.get_game_state()
                
                await websocket.send_json({
                    "type": "game_started",
                    "state": state
                })
                logger.info("✅ Game started!")
                
                # Start game loop
                if game_loop_task:
                    game_loop_task.cancel()
                game_loop_task = asyncio.create_task(game_update_loop())
                
            elif msg_type == "frame":
                # Process video frame for gesture detection
                frame_data = message.get("frame", "")
                
                if frame_data:
                    gesture, processed_frame, hand_detected, description = process_frame(frame_data)
                    
                    # Send processed frame back
                    if processed_frame:
                        await websocket.send_json({
                            "type": "video_frame",
                            "frame": processed_frame,
                            "gesture": gesture,
                            "hand_detected": hand_detected,
                            "description": description
                        })
                    
                    # Process gesture if game is active
                    if game.game_started and not game.game_over:
                        if gesture != "none":
                            # Always process gesture, even if same (for continuous movement)
                            game.process_gesture_command(gesture)
                            if gesture != last_gesture:
                                logger.info(f"✋ {description}")
                            last_gesture = gesture
                        else:
                            last_gesture = "none"
            
            elif msg_type == "stop_camera":
                logger.info("📹 Camera stop requested")
                # Just acknowledge - frontend handles camera
                await websocket.send_json({
                    "type": "camera_stopped"
                })
                
            elif msg_type == "restart":
                logger.info("🔄 RESTART GAME")
                game.start_game()
                await websocket.send_json({
                    "type": "game_restarted",
                    "state": game.get_game_state()
                })
                
                # Restart game loop
                if game_loop_task:
                    game_loop_task.cancel()
                game_loop_task = asyncio.create_task(game_update_loop())
            
            else:
                logger.warning(f"Unknown message type: {msg_type}")
    
    except WebSocketDisconnect:
        logger.info(f"👋 WebSocket disconnected: {session_id}")
    
    except Exception as e:
        logger.error(f"❌ WebSocket error: {e}")
    
    finally:
        if game_loop_task:
            game_loop_task.cancel()
        delete_gesture_game(session_id)
        logger.info(f"🗑️ Gesture game session cleaned up: {session_id}")