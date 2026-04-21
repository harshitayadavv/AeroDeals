import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Gesture detection — velocity-based (fixed)
 * -------------------------------------------
 * Instead of tracking displacement from a start point,
 * we track palm VELOCITY over a sliding window of frames.
 *
 * Palm positions from last WINDOW_SIZE frames are stored.
 * Every frame: compute net displacement oldest→newest.
 * If net displacement exceeds threshold AND is dominant axis → fire.
 * After firing, enforce cooldown. No "return to center" required.
 *
 * This means: just swipe naturally in any direction. Done.
 */

const WINDOW_SIZE   = 8;      // frames to average over (~130ms at 60fps)
const MIN_DISP      = 0.09;   // min net displacement (fraction of frame) to fire
const COOLDOWN_MS   = 400;    // ms between gestures

const MP_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MP_CDN  = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.js';
const MP_MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

// Hand skeleton connections
const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

function GestureGame({ onBack }) {
  const [gameState, setGameState] = useState({
    airplane: { x: 100, y: 250, width: 80, height: 35 },
    obstacles: [], score: 0,
    gameOver: false, gameStarted: false, gameSpeed: 1.0,
  });
  const [isConnected,    setIsConnected]    = useState(false);
  const [handDetected,   setHandDetected]   = useState(false);
  const [currentGesture, setCurrentGesture] = useState('none');
  const [lastCommand,    setLastCommand]     = useState('');
  const [highScore,      setHighScore]       = useState(0);
  const [justBeatHigh,   setJustBeatHigh]   = useState(false);
  const [error,          setError]          = useState('');
  const [webcamReady,    setWebcamReady]    = useState(false);
  const [mpStatus,       setMpStatus]       = useState('loading'); // loading|ready|error
  const [gestureInfo,    setGestureInfo]    = useState('Loading hand tracking...');

  const canvasRef   = useRef(null);
  const overlayRef  = useRef(null);
  const videoRef    = useRef(null);
  const wsRef       = useRef(null);
  const gameStateRef = useRef(gameState);
  const landmarkerRef = useRef(null);
  const rafRef      = useRef(null);

  // Velocity tracking — plain object so updates don't cause re-renders
  const velRef = useRef({
    positions: [],      // [{x, y, t}] sliding window
    lastFiredAt: 0,
  });

  const CANVAS_W = 800;
  const CANVAS_H = 500;

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { loadHighScore(); }, []);
  useEffect(() => {
    initAll();
    return cleanup;
  }, []);

  // ── High score ────────────────────────────────────────────────────────────
  const loadHighScore = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/games/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setHighScore(d.stats?.gesture?.high_score || 0);
      }
    } catch(e) {}
  };

  // ── Init ──────────────────────────────────────────────────────────────────
  const initAll = async () => {
    await initMediaPipe();
  };

  const cleanup = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    stopWebcam();
    landmarkerRef.current?.close();
    wsRef.current?.close();
  };

  const initMediaPipe = async () => {
    setMpStatus('loading');
    try {
      const { HandLandmarker, FilesetResolver } = await import(MP_CDN);
      const vision = await FilesetResolver.forVisionTasks(MP_WASM);
      landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MP_MODEL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
      setMpStatus('ready');
      setGestureInfo('Hand tracking ready — show your hand!');
      await initWebcam();
    } catch(e) {
      console.error('MediaPipe error:', e);
      setMpStatus('error');
      setError('❌ Hand tracking failed to load. Please refresh.');
    }
  };

  const initWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      await new Promise(r => { videoRef.current.onloadedmetadata = r; });
      await videoRef.current.play();
      setWebcamReady(true);
      startLoop();
    } catch(e) {
      setError('🎥 Camera access denied. Please allow camera permissions.');
    }
  };

  const stopWebcam = () => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamReady(false);
  };

  // ── Detection loop ────────────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    const loop = (nowMs) => {
      rafRef.current = requestAnimationFrame(loop);
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !landmarkerRef.current) return;

      let results;
      try { results = landmarkerRef.current.detectForVideo(video, nowMs); }
      catch(e) { return; }

      // Draw landmarks on overlay
      const overlay = overlayRef.current;
      if (overlay) {
        overlay.width  = video.videoWidth;
        overlay.height = video.videoHeight;
        const ctx = overlay.getContext('2d');
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        if (results.landmarks?.length > 0) {
          setHandDetected(true);
          const lm = results.landmarks[0];
          drawHand(ctx, lm, overlay.width, overlay.height);
          // Use palm center (landmark 9) for tracking
          const palm = lm[9];
          detectGesture(palm.x, palm.y, nowMs);
        } else {
          setHandDetected(false);
          velRef.current.positions = [];   // clear history when hand gone
          setCurrentGesture('none');
          setGestureInfo('Show your hand...');
        }
      }
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Velocity-based gesture detection ──────────────────────────────────────
  const detectGesture = (nx, ny, nowMs) => {
    const v = velRef.current;

    // Add to sliding window
    v.positions.push({ x: nx, y: ny, t: nowMs });
    if (v.positions.length > WINDOW_SIZE) v.positions.shift();
    if (v.positions.length < 4) return;   // need enough frames

    // Net displacement: newest - oldest in window
    const oldest = v.positions[0];
    const newest = v.positions[v.positions.length - 1];
    const dx = newest.x - oldest.x;
    const dy = newest.y - oldest.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);

    // Not moved enough
    if (adx < MIN_DISP && ady < MIN_DISP) {
      setGestureInfo(`Palm at (${nx.toFixed(2)}, ${ny.toFixed(2)})`);
      return;
    }

    // Cooldown check
    if (nowMs - v.lastFiredAt < COOLDOWN_MS) return;

    // Dominant axis wins
    let gesture;
    if (adx >= ady) {
      gesture = dx > 0 ? 'right' : 'left';
    } else {
      gesture = dy > 0 ? 'down' : 'up';
    }

    // Fire!
    v.lastFiredAt = nowMs;
    v.positions   = [];   // reset window so next swipe starts fresh

    setCurrentGesture(gesture);
    setLastCommand(gesture);
    setGestureInfo(`✅ ${gesture.toUpperCase()} detected!`);
    setTimeout(() => setLastCommand(''), 500);

    // Send to backend
    if (wsRef.current?.readyState === WebSocket.OPEN &&
        gameStateRef.current.gameStarted &&
        !gameStateRef.current.gameOver) {
      wsRef.current.send(JSON.stringify({ type: 'gesture', direction: gesture }));
    }
  };

  // ── Draw hand skeleton ────────────────────────────────────────────────────
  const drawHand = (ctx, lm, w, h) => {
    ctx.strokeStyle = 'rgba(100,255,160,0.85)';
    ctx.lineWidth   = 2;
    CONNECTIONS.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(lm[a].x * w, lm[a].y * h);
      ctx.lineTo(lm[b].x * w, lm[b].y * h);
      ctx.stroke();
    });
    lm.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, i === 9 ? 9 : 4, 0, Math.PI * 2);
      ctx.fillStyle = i === 9 ? '#00ffcc' : 'rgba(100,255,160,0.9)';
      ctx.fill();
    });
  };

  // ── WebSocket ─────────────────────────────────────────────────────────────
  const initWebSocket = async () => {
    try {
      wsRef.current?.close();
      const token = localStorage.getItem('auth_token');
      if (!token) { setError('❌ Not logged in'); return; }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/games/gesture/session`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Session failed');

      const { websocket_url } = await res.json();
      const wsUrl = `${import.meta.env.VITE_API_URL.replace('http','ws')}${websocket_url}`;
      const ws    = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError('');
        ws.send(JSON.stringify({ type: 'start' }));
      };

      ws.onmessage = ({ data }) => {
        try {
          const msg = JSON.parse(data);
          if (msg.type === 'game_started' && msg.state) {
            setGameState(msg.state);
          } else if (msg.type === 'game_state') {
            setGameState(msg.state);
            if (msg.state.gameOver && !gameStateRef.current.gameOver) {
              submitScore(msg.state.score);
            }
          }
        } catch(e) {}
      };

      ws.onerror  = () => setError('Connection error');
      ws.onclose  = () => setIsConnected(false);
    } catch(e) {
      setError('Failed to connect to server');
    }
  };

  // ── Start game ────────────────────────────────────────────────────────────
  const startGame = () => {
    if (!webcamReady || mpStatus !== 'ready') return;
    velRef.current = { positions: [], lastFiredAt: 0 };
    setGameState({
      airplane: { x: 100, y: 250, width: 80, height: 35 },
      obstacles: [], score: 0,
      gameOver: false, gameStarted: true, gameSpeed: 1.0,
    });
    setError(''); setJustBeatHigh(false);
    initWebSocket();
  };

  const submitScore = async (score) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/games/score`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_type: 'gesture', score }),
      });
      if (res.ok) {
        const d = await res.json();
        setHighScore(d.high_score || 0);
        setJustBeatHigh(!!d.is_high_score);
      }
    } catch(e) {}
  };

  // ── Canvas render ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    sky.addColorStop(0, '#0f172a'); sky.addColorStop(0.5, '#1e40af'); sky.addColorStop(1, '#38bdf8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Clouds
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 6; i++) {
      const x = ((i * 180 + Date.now() * 0.012) % (CANVAS_W + 150)) - 75;
      const y = 50 + i * 28;
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI*2); ctx.arc(x+24, y-5, 26, 0, Math.PI*2); ctx.arc(x+48, y, 20, 0, Math.PI*2);
      ctx.fill();
    }

    // Airplane
    const { airplane: a } = gameState;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 12;
    const fg = ctx.createLinearGradient(a.x, a.y, a.x, a.y+35);
    fg.addColorStop(0,'#e5e7eb'); fg.addColorStop(0.5,'#9ca3af'); fg.addColorStop(1,'#6b7280');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.ellipse(a.x+40, a.y+17, 38, 16, 0, 0, Math.PI*2); ctx.fill();
    const wg = ctx.createLinearGradient(a.x-5, a.y, a.x-5, a.y+15);
    wg.addColorStop(0,'#ef4444'); wg.addColorStop(1,'#991b1b');
    ctx.fillStyle = wg;
    ctx.beginPath(); ctx.moveTo(a.x+25,a.y+17); ctx.lineTo(a.x-8,a.y-2); ctx.lineTo(a.x-2,a.y+10); ctx.lineTo(a.x+5,a.y+17); ctx.closePath(); ctx.fill();
    ctx.restore();

    // Obstacles
    gameState.obstacles.forEach(obs => {
      if (obs.type === 'bird') {
        const f = Math.sin(Date.now()*0.015+obs.id)*6;
        ctx.fillStyle = '#78350f';
        ctx.beginPath(); ctx.ellipse(obs.x+25,obs.y+20,14,10,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = '#92400e';
        ctx.beginPath(); ctx.ellipse(obs.x+8,obs.y+18+f,18,7,-0.4,0,Math.PI*2); ctx.ellipse(obs.x+42,obs.y+18+f,18,7,0.4,0,Math.PI*2); ctx.fill();
      } else if (obs.type === 'cloud') {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath(); ctx.arc(obs.x+12,obs.y+20,15,0,Math.PI*2); ctx.arc(obs.x+28,obs.y+14,18,0,Math.PI*2); ctx.arc(obs.x+42,obs.y+20,15,0,Math.PI*2); ctx.fill();
      } else if (obs.type === 'thunder') {
        const g = ctx.createLinearGradient(obs.x,obs.y,obs.x,obs.y+obs.height);
        g.addColorStop(0,'#fef08a'); g.addColorStop(0.5,'#fbbf24'); g.addColorStop(1,'#f59e0b');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(obs.x+15,obs.y); ctx.lineTo(obs.x+22,obs.y+25); ctx.lineTo(obs.x+12,obs.y+25); ctx.lineTo(obs.x+18,obs.y+45); ctx.lineTo(obs.x+10,obs.y+45); ctx.lineTo(obs.x+15,obs.y+70); ctx.lineTo(obs.x+8,obs.y+40); ctx.lineTo(obs.x+16,obs.y+40); ctx.lineTo(obs.x+10,obs.y+20); ctx.closePath(); ctx.fill();
      } else if (obs.type === 'ufo') {
        ctx.fillStyle = '#6366f1';
        ctx.beginPath(); ctx.ellipse(obs.x+25,obs.y+20,24,10,0,0,Math.PI*2); ctx.fill();
        const dg = ctx.createRadialGradient(obs.x+25,obs.y+15,5,obs.x+25,obs.y+15,15);
        dg.addColorStop(0,'#a5b4fc'); dg.addColorStop(1,'#818cf8');
        ctx.fillStyle = dg;
        ctx.beginPath(); ctx.arc(obs.x+25,obs.y+14,14,0,Math.PI,true); ctx.fill();
        ['#ef4444','#22c55e','#3b82f6','#fbbf24'].forEach((c,i)=>{
          ctx.fillStyle=c; ctx.shadowColor=c; ctx.shadowBlur=8;
          ctx.beginPath(); ctx.arc(obs.x+10+i*10,obs.y+24,3,0,Math.PI*2); ctx.fill();
        });
        ctx.shadowBlur=0;
      }
    });

    // HUD
    ctx.fillStyle = 'rgba(15,23,42,0.85)'; ctx.fillRect(10,10,220,120);
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.strokeRect(10,10,220,120);
    ctx.fillStyle='#fff'; ctx.font='bold 32px Arial'; ctx.fillText(gameState.score,25,50);
    ctx.font='14px Arial'; ctx.fillStyle='#94a3b8'; ctx.fillText('SCORE',25,70);
    ctx.fillStyle='#fbbf24'; ctx.font='bold 24px Arial'; ctx.fillText(String(highScore),25,100);
    ctx.font='12px Arial'; ctx.fillStyle='#94a3b8'; ctx.fillText('HIGH SCORE',25,115);
    ctx.fillStyle='rgba(16,185,129,0.9)'; ctx.fillRect(CANVAS_W-160,15,145,35);
    ctx.fillStyle='#fff'; ctx.font='bold 18px Arial'; ctx.fillText(`⚡ ${(gameState.gameSpeed||1).toFixed(1)}x`,CANVAS_W-150,40);
  }, [gameState, highScore]);

  // ── Render ────────────────────────────────────────────────────────────────
  const COLS = { up:'from-cyan-500 to-blue-500', down:'from-orange-500 to-red-500', left:'from-purple-500 to-pink-500', right:'from-green-500 to-emerald-500' };
  const ready = webcamReady && mpStatus === 'ready';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all">
          ← Back to Game Zone
        </button>
        <div className="flex items-center gap-3 text-sm">
          {mpStatus === 'loading' && <span className="text-yellow-400 animate-pulse">⏳ Loading hand tracking...</span>}
          {mpStatus === 'ready'   && <span className="text-green-400">✅ Hand tracking ready</span>}
          {mpStatus === 'error'   && <span className="text-red-400">❌ Hand tracking failed</span>}
        </div>
        {webcamReady && (
          <button onClick={() => { stopWebcam(); wsRef.current?.close(); setIsConnected(false); }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all">
            🛑 Stop Camera
          </button>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">✋ Gesture Racer</h1>
              <p className="text-white/90 mt-1">Swipe your hand — UP · DOWN · LEFT · RIGHT</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${handDetected ? 'bg-green-500/30 border-green-400' : 'bg-black/30 border-white/20'}`}>
              <div className={`w-3 h-3 rounded-full ${handDetected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="font-bold text-sm">{handDetected ? '✋ HAND DETECTED' : 'NO HAND'}</span>
            </div>
          </div>
        </div>

        {error && <div className="bg-red-900/70 border-l-4 border-red-500 p-4 m-4"><p className="text-red-200 font-bold">{error}</p></div>}

        <div className="p-6 bg-gray-950">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Game canvas */}
            <div className="lg:col-span-2 relative">
              <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
                className="w-full rounded-xl shadow-2xl border-4 border-gray-700" />

              {lastCommand && gameState.gameStarted && !gameState.gameOver && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r ${COLS[lastCommand]||'from-purple-500 to-pink-500'} text-white px-8 py-3 rounded-full text-2xl font-bold animate-bounce shadow-2xl`}>
                  {lastCommand.toUpperCase()}
                </div>
              )}

              {gameState.gameOver && (
                <div className="absolute inset-0 bg-black/90 flex items-center justify-center rounded-xl">
                  <div className="text-center space-y-5 px-8">
                    <div className="text-8xl">💥</div>
                    <h2 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">GAME OVER</h2>
                    <p className="text-3xl font-bold text-white">Score: {gameState.score}</p>
                    <p className="text-2xl text-yellow-400">Best: {highScore}</p>
                    {justBeatHigh && <p className="text-xl text-yellow-400 animate-pulse">🏆 NEW HIGH SCORE!</p>}
                    <button onClick={startGame} className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-10 py-4 rounded-full font-bold text-xl transition-all hover:scale-105">
                      ✋ PLAY AGAIN
                    </button>
                  </div>
                </div>
              )}

              {!gameState.gameStarted && !isConnected && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 to-pink-900/95 flex items-center justify-center rounded-xl">
                  <div className="text-center space-y-6 px-8">
                    <div className="text-8xl animate-bounce">✋</div>
                    <h2 className="text-4xl font-bold text-white">Ready to Swipe?</h2>
                    {highScore > 0 && (
                      <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-3">
                        <p className="text-yellow-400 text-xl font-bold">High Score: {highScore}</p>
                      </div>
                    )}
                    <button onClick={startGame} disabled={!ready}
                      className={`${ready ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:scale-105' : 'bg-gray-600 cursor-not-allowed'} text-white px-12 py-4 rounded-full font-bold text-xl transition-all`}>
                      {mpStatus === 'loading' ? '⏳ Loading hand tracking...' : !webcamReady ? '⏳ Waiting for camera...' : '✋ START GAME'}
                    </button>
                    {ready && <p className="text-gray-300 text-sm">Show your hand → swipe in any direction!</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Camera feed */}
              <div className="bg-gray-800 rounded-xl p-4 border-2 border-purple-500">
                <h3 className="text-lg font-bold mb-3 text-purple-400">📹 Live Camera</h3>
                <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
                  <video ref={videoRef} muted playsInline autoPlay
                    className="w-full h-full object-cover [transform:scaleX(-1)]" />
                  <canvas ref={overlayRef}
                    className="absolute inset-0 w-full h-full [transform:scaleX(-1)]" />
                  {!webcamReady && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-gray-400 text-sm">Waiting for camera...</p>
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hand:</span>
                    <span className={`font-bold ${handDetected ? 'text-green-400' : 'text-red-400'}`}>
                      {handDetected ? '✅ Detected' : '❌ Not found'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last gesture:</span>
                    <span className="font-bold text-purple-400 uppercase">{currentGesture}</span>
                  </div>
                  <p className="text-xs text-gray-400 pt-1">{gestureInfo}</p>
                </div>
              </div>

              {/* Controls */}
              <div className="bg-gradient-to-br from-purple-700 to-pink-700 p-4 rounded-xl">
                <h3 className="font-bold mb-3">✋ How to Play</h3>
                <div className="space-y-2 text-sm">
                  {[['☝️','Swipe UP','Airplane moves up'],['👇','Swipe DOWN','Airplane moves down'],
                    ['👈','Swipe LEFT','Airplane moves left'],['👉','Swipe RIGHT','Airplane moves right']].map(([e,l,d])=>(
                    <div key={l} className="bg-white/20 px-3 py-2 rounded flex gap-2 items-center">
                      <span>{e}</span><div><strong>{l}</strong><span className="text-white/70"> — {d}</span></div>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-3 text-white/70">💡 Just swipe naturally — fast or slow both work!</p>
              </div>

              {/* Obstacles */}
              <div className="bg-gradient-to-br from-indigo-700 to-blue-700 p-4 rounded-xl">
                <h3 className="font-bold mb-2">🎯 Avoid These</h3>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <div>🦅 Birds</div><div>☁️ Clouds</div>
                  <div>⚡ Lightning</div><div>🛸 UFOs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GestureGame;