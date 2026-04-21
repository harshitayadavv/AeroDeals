"""
gesture_websocket.py — lightweight WebSocket handler
=====================================================
Browser now handles all gesture detection (MediaPipe JS).
This file ONLY receives gesture direction strings and runs game logic.

NO OpenCV. NO MediaPipe. NO frame processing.
Backend is now fully deployable on Render free tier.
"""

import asyncio
import json
import logging

from fastapi import WebSocket, WebSocketDisconnect
from games.gesture_game import get_gesture_game, delete_gesture_game

logger = logging.getLogger(__name__)


async def handle_gesture_game_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    logger.info("Gesture WS connected: {}".format(session_id))

    game           = get_gesture_game(session_id)
    last_gesture   = "none"
    game_loop_task = None

    async def game_update_loop():
        nonlocal last_gesture
        while True:
            try:
                if game.game_started and not game.game_over:
                    game.update()
                    await websocket.send_json({
                        "type":    "game_state",
                        "state":   game.get_game_state(),
                        "gesture": last_gesture,
                    })
                await asyncio.sleep(0.033)   # ~30 fps
            except Exception as e:
                logger.error("Game loop error: {}".format(e))
                break

    try:
        while True:
            data    = await websocket.receive_text()
            message = json.loads(data)
            mtype   = message.get("type")

            # ── start game ────────────────────────────────────────────────
            if mtype == "start":
                game.start_game()
                await websocket.send_json({
                    "type":  "game_started",
                    "state": game.get_game_state(),
                })
                if game_loop_task:
                    game_loop_task.cancel()
                game_loop_task = asyncio.create_task(game_update_loop())
                logger.info("Game started for session: {}".format(session_id))

            # ── gesture from browser (only thing sent now) ─────────────
            elif mtype == "gesture":
                direction = message.get("direction", "none").lower().strip()
                if direction in ("up", "down", "left", "right"):
                    if game.game_started and not game.game_over:
                        game.process_gesture_command(direction)
                        last_gesture = direction
                        logger.info("Gesture: {}".format(direction))

            # ── restart ───────────────────────────────────────────────────
            elif mtype == "restart":
                game.start_game()
                last_gesture = "none"
                await websocket.send_json({
                    "type":  "game_restarted",
                    "state": game.get_game_state(),
                })
                if game_loop_task:
                    game_loop_task.cancel()
                game_loop_task = asyncio.create_task(game_update_loop())

            else:
                logger.debug("Unknown message type: {}".format(mtype))

    except WebSocketDisconnect:
        logger.info("WS disconnected: {}".format(session_id))
    except Exception as e:
        logger.error("WS error: {}".format(e))
    finally:
        if game_loop_task:
            game_loop_task.cancel()
        delete_gesture_game(session_id)
        logger.info("Session cleaned up: {}".format(session_id))