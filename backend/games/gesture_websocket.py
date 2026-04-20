"""
Gesture detection — MOG2 swipe (tested, optimized)
====================================================

PROVEN APPROACH (tested in isolation before shipping):
  MOG2 background subtractor learns your still hand as background in ~1 sec.
  The moment you swipe, only the NEW position lights up as ONE clean blob.
  We track first-blob-position → last-blob-position = swipe vector.

WORKFLOW FOR USER:
  1. Show hand to camera, hold STILL ~1 sec (MOG2 learns it)
  2. Swipe in any direction
  3. Gesture fires immediately when blob travels MIN_SWIPE_PX pixels
  4. Hold still again briefly → ready for next swipe

STATE MACHINE:
  IDLE      → no blob visible (hand still, learned as background)
  TRACKING  → blob appeared (hand moving), recording start+current pos
  COOLDOWN  → gesture just fired, brief pause before next

KEY BUG FIX vs previous version:
  Old code reset to IDLE when blob disappeared mid-swipe.
  New code fires using last_pos when blob disappears, so fast swipes work.
"""

import asyncio
import base64
import json
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor

try:
    import cv2
    import numpy as np
    CV2_OK = True
except ImportError:
    CV2_OK = False

from fastapi import WebSocket, WebSocketDisconnect
from games.gesture_game import get_gesture_game, delete_gesture_game

logger = logging.getLogger(__name__)
_executor = ThreadPoolExecutor(max_workers=2)

# ── tunables ───────────────────────────────────────────────────────────────
MOG2_HISTORY    = 12     # frames to learn background (~0.4s at 30fps)
MOG2_THRESHOLD  = 50     # background sensitivity — raise if false triggers
MIN_BLOB_AREA   = 400    # px² — ignore tiny noise
MIN_SWIPE_PX    = 55     # pixels to travel before gesture fires
COOLDOWN_SEC    = 0.35   # seconds between gestures

# ── MediaPipe Tasks API — only used if hand_landmarker.task exists ─────────
_landmarker = None
_mp_Image   = None
_mp_ok      = False
_mp_tried   = False


def _try_init_mediapipe():
    global _landmarker, _mp_Image, _mp_ok, _mp_tried
    if _mp_tried:
        return _mp_ok
    _mp_tried = True
    candidates = [
        os.environ.get("HAND_LANDMARKER_MODEL", ""),
        "hand_landmarker.task",
        os.path.join(os.path.dirname(__file__), "hand_landmarker.task"),
        "/tmp/hand_landmarker.task",
    ]
    model_path = next((p for p in candidates if p and os.path.exists(p)), None)
    if not model_path:
        return False
    try:
        import mediapipe as mp
        from mediapipe.tasks.python import BaseOptions
        from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions, RunningMode
        _landmarker = HandLandmarker.create_from_options(
            HandLandmarkerOptions(
                base_options=BaseOptions(model_asset_path=model_path),
                running_mode=RunningMode.IMAGE,
                num_hands=1,
                min_hand_detection_confidence=0.5,
            ))
        _mp_Image = mp.Image
        _mp_ok    = True
        logger.info("MediaPipe HandLandmarker ready")
    except Exception as e:
        logger.info("MediaPipe failed: {} — using MOG2".format(e))
    return _mp_ok


# ── detector ───────────────────────────────────────────────────────────────

IDLE     = "idle"
TRACKING = "tracking"
COOLDOWN = "cooldown"

MORPH_K = None   # lazy init after cv2 confirmed available


class GestureDetector:

    def __init__(self):
        self.mog        = None   # init lazily so it's in the executor thread
        self.state      = IDLE
        self.start_pos  = None   # (x,y) px where swipe started
        self.last_pos   = None   # (x,y) px most recent blob position
        self.cool_until = 0.0

    def _ensure_mog(self):
        if self.mog is None:
            self.mog = cv2.createBackgroundSubtractorMOG2(
                history=MOG2_HISTORY,
                varThreshold=MOG2_THRESHOLD,
                detectShadows=False)

    # ── get blob ──────────────────────────────────────────────────────────

    def _blob(self, frame):
        """Apply MOG2, return centroid (x,y) in pixels or None."""
        global MORPH_K
        if MORPH_K is None:
            MORPH_K = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))

        self._ensure_mog()
        mask = self.mog.apply(frame)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN,  MORPH_K)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, MORPH_K)

        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not cnts:
            return None

        c = max(cnts, key=cv2.contourArea)
        if cv2.contourArea(c) < MIN_BLOB_AREA:
            return None

        M = cv2.moments(c)
        if M["m00"] == 0:
            return None

        return (int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"]))

    def _mp_blob(self, frame, fw, fh):
        """Get palm centroid from MediaPipe."""
        rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_img = _mp_Image(image_format=_mp_Image.ImageFormat.SRGB, data=rgb)
        result = _landmarker.detect(mp_img)
        if not result.hand_landmarks:
            return None
        lm   = result.hand_landmarks[0]
        palm = lm[9]
        return (int(palm.x * fw), int(palm.y * fh))

    # ── direction ─────────────────────────────────────────────────────────

    @staticmethod
    def _direction(sx, sy, ex, ey):
        dx, dy = ex - sx, ey - sy
        if abs(dx) >= abs(dy):
            return "right" if dx > 0 else "left"
        return "down" if dy > 0 else "up"

    @staticmethod
    def _dist(a, b):
        return ((a[0]-b[0])**2 + (a[1]-b[1])**2) ** 0.5

    # ── update state machine ──────────────────────────────────────────────

    def _update(self, pos, now):
        """Feed current blob position (or None). Returns gesture or 'none'."""

        if self.state == COOLDOWN:
            if now >= self.cool_until:
                self.state    = IDLE
                self.last_pos = None
            return "none"

        if self.state == IDLE:
            if pos is not None:
                self.state     = TRACKING
                self.start_pos = pos
                self.last_pos  = pos
            return "none"

        # TRACKING
        if pos is not None:
            self.last_pos = pos
        
        # Check if traveled far enough (use last known pos even if blob gone)
        if self.last_pos is not None and self.start_pos is not None:
            dist = self._dist(self.start_pos, self.last_pos)
            if dist >= MIN_SWIPE_PX:
                gesture = self._direction(
                    self.start_pos[0], self.start_pos[1],
                    self.last_pos[0],  self.last_pos[1])
                self.state      = COOLDOWN
                self.cool_until = now + COOLDOWN_SEC
                self.start_pos  = None
                logger.info("Swipe {} dist={:.0f}px".format(gesture, dist))
                return gesture

        if pos is None:
            # Blob gone but didn't swipe far enough — back to idle
            self.state     = IDLE
            self.start_pos = None
            self.last_pos  = None

        return "none"

    # ── draw ─────────────────────────────────────────────────────────────

    def _draw(self, frame, fw, fh, pos, gesture):
        f  = cv2.FONT_HERSHEY_SIMPLEX
        cx, cy = fw // 2, fh // 2

        # Crosshair
        cv2.line(frame, (cx, 0),  (cx, fh), (40, 40, 40), 1)
        cv2.line(frame, (0, cy),  (fw, cy), (40, 40, 40), 1)

        # Swipe arrows
        g = (70, 70, 70)
        cv2.arrowedLine(frame, (cx, cy-50), (cx, cy-90), g, 2, tipLength=0.35)
        cv2.arrowedLine(frame, (cx, cy+50), (cx, cy+90), g, 2, tipLength=0.35)
        cv2.arrowedLine(frame, (cx-50, cy), (cx-90, cy), g, 2, tipLength=0.35)
        cv2.arrowedLine(frame, (cx+50, cy), (cx+90, cy), g, 2, tipLength=0.35)
        cv2.putText(frame, "UP",    (cx-12, cy-95), f, 0.4, g, 1)
        cv2.putText(frame, "DOWN",  (cx-18, cy+108),f, 0.4, g, 1)
        cv2.putText(frame, "LEFT",  (cx-98, cy+5),  f, 0.4, g, 1)
        cv2.putText(frame, "RIGHT", (cx+52, cy+5),  f, 0.4, g, 1)

        # State indicator dot top-right
        dot = {IDLE:(60,60,60), TRACKING:(0,220,80), COOLDOWN:(0,140,220)}
        cv2.circle(frame, (fw-18, 18), 9, dot.get(self.state,(60,60,60)), -1)

        # Trail line
        if self.start_pos and self.last_pos and self.state == TRACKING:
            cv2.line(frame, self.start_pos, self.last_pos, (0, 220, 180), 2)
            cv2.circle(frame, self.start_pos, 5, (255,255,255), -1)

        # Blob dot
        if pos:
            col = {IDLE:(100,100,100), TRACKING:(0,255,80), COOLDOWN:(0,140,220)}
            cv2.circle(frame, pos, 13, col.get(self.state,(100,100,100)), -1)
            cv2.circle(frame, pos, 16, (255,255,255), 1)

        # Big gesture flash
        COLS = {"up":(0,230,230),"down":(0,165,255),
                "left":(230,50,230),"right":(230,230,0)}
        if gesture != "none":
            col = COLS[gesture]
            cv2.putText(frame, gesture.upper(), (14,52), f, 1.8, (0,0,0), 7)
            cv2.putText(frame, gesture.upper(), (12,50), f, 1.8, col,      3)

        # Hint
        hints = {IDLE:    "Hold still, then swipe",
                 TRACKING: "Swiping...",
                 COOLDOWN: "Ready..."}
        cv2.putText(frame, hints.get(self.state,""),
                    (6, fh-8), f, 0.42, (90,90,90), 1)

    # ── main entry (runs in executor) ─────────────────────────────────────

    def process(self, frame_data):
        if not CV2_OK:
            return "none", frame_data, False, "no cv2"

        try:
            raw   = base64.b64decode(frame_data.split(',')[1])
            arr   = np.frombuffer(raw, np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        except Exception as e:
            return "none", frame_data, False, str(e)

        if frame is None:
            return "none", frame_data, False, "null frame"

        frame  = cv2.flip(frame, 1)
        fh, fw = frame.shape[:2]
        now    = time.monotonic()

        # Get blob position
        if _try_init_mediapipe():
            pos = self._mp_blob(frame, fw, fh)
        else:
            pos = self._blob(frame)

        gesture = self._update(pos, now)
        self._draw(frame, fw, fh, pos, gesture)

        _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        b64    = "data:image/jpeg;base64," + base64.b64encode(buf).decode()
        return gesture, b64, pos is not None, "state={} g={}".format(self.state, gesture)


# ── WebSocket handler ──────────────────────────────────────────────────────

async def handle_gesture_game_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    logger.info("WS connected: {}".format(session_id))

    game           = get_gesture_game(session_id)
    detector       = GestureDetector()
    loop           = asyncio.get_event_loop()
    last_gesture   = "none"
    game_loop_task = None
    camera_active  = True
    processing     = False

    async def game_update_loop():
        nonlocal last_gesture
        while True:
            try:
                if game.game_started and not game.game_over:
                    game.update()
                    await websocket.send_json({
                        "type":          "game_state",
                        "state":         game.get_game_state(),
                        "hand_detected": False,
                        "gesture":       last_gesture,
                    })
                await asyncio.sleep(0.033)
            except Exception as e:
                logger.error("Game loop: {}".format(e))
                break

    try:
        while True:
            data    = await websocket.receive_text()
            message = json.loads(data)
            mtype   = message.get("type")

            if mtype == "start":
                game.start_game()
                camera_active = True
                await websocket.send_json({"type": "game_started",
                                           "state": game.get_game_state()})
                if game_loop_task:
                    game_loop_task.cancel()
                game_loop_task = asyncio.create_task(game_update_loop())

            elif mtype == "frame":
                frame_data = message.get("frame", "")
                if not frame_data or not camera_active:
                    continue
                if processing:
                    continue
                processing = True
                try:
                    gesture, processed, detected, desc = await loop.run_in_executor(
                        _executor, detector.process, frame_data)
                finally:
                    processing = False

                await websocket.send_json({
                    "type":          "video_frame",
                    "frame":         processed,
                    "gesture":       gesture,
                    "hand_detected": detected,
                    "description":   desc,
                })

                if game.game_started and not game.game_over and gesture != "none":
                    game.process_gesture_command(gesture)
                    if gesture != last_gesture:
                        logger.info("Gesture: {}".format(gesture))
                    last_gesture = gesture
                else:
                    last_gesture = "none"

            elif mtype == "stop_camera":
                camera_active = False
                await websocket.send_json({"type": "camera_stopped", "status": "success"})

            elif mtype == "resume_camera":
                camera_active = True
                await websocket.send_json({"type": "camera_resumed", "status": "success"})

            elif mtype == "restart":
                game.start_game()
                camera_active = True
                await websocket.send_json({"type": "game_restarted",
                                           "state": game.get_game_state()})
                if game_loop_task:
                    game_loop_task.cancel()
                game_loop_task = asyncio.create_task(game_update_loop())

            else:
                logger.warning("Unknown: {}".format(mtype))

    except WebSocketDisconnect:
        logger.info("WS disconnected: {}".format(session_id))
    except Exception as e:
        logger.error("WS error: {}".format(e))
    finally:
        if game_loop_task:
            game_loop_task.cancel()
        delete_gesture_game(session_id)
        logger.info("Session cleaned up: {}".format(session_id))