import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * VoiceGame — fixed speech recognition + UI matching GestureGame
 *
 * FIXES vs old version:
 *  1. Recognition restart uses a ref (not stale closure) so it always restarts
 *  2. interimResults = true so partial results fire faster
 *  3. Same canvas drawing code as GestureGame (sky, clouds, airplane, obstacles)
 *  4. Same layout structure as GestureGame sidebar style
 *  5. Game loop uses requestAnimationFrame (not setGameState inside rAF)
 */

const CANVAS_W = 800;
const CANVAS_H = 500;
const MOVE_AMOUNT = 45;
const BOUNDARY_TOP    = 30;
const BOUNDARY_BOTTOM = 30;
const BOUNDARY_LEFT   = 20;
const BOUNDARY_RIGHT  = 20;

function VoiceGame({ onBack }) {
  const [gameState, setGameState] = useState({
    airplane: { x: 100, y: 250, width: 80, height: 35 },
    obstacles: [], score: 0,
    gameOver: false, gameStarted: false, gameSpeed: 1.0,
  });
  const [isListening,  setIsListening]  = useState(false);
  const [lastCommand,  setLastCommand]  = useState('');
  const [highScore,    setHighScore]    = useState(0);
  const [justBeatHigh, setJustBeatHigh] = useState(false);
  const [error,        setError]        = useState('');
  const [micStatus,    setMicStatus]    = useState('idle'); // idle|listening|error

  const canvasRef       = useRef(null);
  const gameStateRef    = useRef(gameState);
  const rafRef          = useRef(null);
  const recognitionRef  = useRef(null);
  const listeningRef    = useRef(false);   // ref mirror so closures see current value
  const spawnTimerRef   = useRef(Date.now());
  const spawnIntervalRef = useRef(2200);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // ── High score ────────────────────────────────────────────────────────────
  useEffect(() => { loadHighScore(); }, []);

  const loadHighScore = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/games/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setHighScore(d.stats?.voice?.high_score || 0);
      }
    } catch(e) {}
  };

  // ── Speech recognition setup ──────────────────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('⚠️ Speech recognition not supported. Use Chrome!');
      return;
    }

    const rec = new SR();
    rec.continuous      = true;
    rec.interimResults  = true;   // get partial results → faster response
    rec.lang            = 'en-US';
    rec.maxAlternatives = 1;

    let lastCmd = '';
    let lastCmdTime = 0;

    rec.onresult = (e) => {
      // Check all results, including interim ones
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript.toLowerCase().trim();
        const now = Date.now();

        const COMMANDS = ['up', 'down', 'left', 'right'];
        const matched = COMMANDS.find(c => transcript.includes(c));

        if (matched) {
          // Debounce same command within 400ms
          if (matched === lastCmd && now - lastCmdTime < 400) continue;
          lastCmd     = matched;
          lastCmdTime = now;

          setLastCommand(matched);
          setTimeout(() => setLastCommand(''), 800);
          moveAirplane(matched);
        }
      }
    };

    rec.onerror = (e) => {
      if (e.error === 'not-allowed') {
        setError('🎤 Microphone blocked! Allow mic access and refresh.');
        setMicStatus('error');
        listeningRef.current = false;
        setIsListening(false);
      }
      // Ignore 'no-speech' and 'aborted' — normal during game
    };

    rec.onend = () => {
      // Use ref (not stale closure) to check if we should restart
      if (listeningRef.current) {
        try { rec.start(); } catch(e) {}
      }
    };

    recognitionRef.current = rec;

    return () => {
      try { rec.stop(); } catch(e) {}
    };
  }, []);

  // ── Start / stop listening ────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    listeningRef.current = true;
    setIsListening(true);
    setMicStatus('listening');
    try { recognitionRef.current.start(); } catch(e) {}
  }, []);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setIsListening(false);
    setMicStatus('idle');
    try { recognitionRef.current?.stop(); } catch(e) {}
  }, []);

  // ── Move airplane ─────────────────────────────────────────────────────────
  const moveAirplane = useCallback((cmd) => {
    setGameState(prev => {
      if (prev.gameOver || !prev.gameStarted) return prev;
      const a    = { ...prev.airplane };
      const maxY = CANVAS_H - a.height - BOUNDARY_BOTTOM;
      const maxX = CANVAS_W - a.width  - BOUNDARY_RIGHT;
      if (cmd === 'up')    a.y = Math.max(BOUNDARY_TOP,  a.y - MOVE_AMOUNT);
      if (cmd === 'down')  a.y = Math.min(maxY,           a.y + MOVE_AMOUNT);
      if (cmd === 'left')  a.x = Math.max(BOUNDARY_LEFT,  a.x - MOVE_AMOUNT);
      if (cmd === 'right') a.x = Math.min(maxX,           a.x + MOVE_AMOUNT);
      return { ...prev, airplane: a };
    });
  }, []);

  // ── Game loop (rAF) ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const loop = () => {
      setGameState(prev => {
        if (prev.gameOver || !prev.gameStarted) return prev;
        const next = { ...prev, obstacles: [...prev.obstacles] };
        const now  = Date.now();

        // Spawn obstacle
        if (now - spawnTimerRef.current > spawnIntervalRef.current) {
          const types = ['bird','thunder','cloud','ufo'];
          const type  = types[Math.floor(Math.random() * types.length)];
          next.obstacles.push({
            id: Math.random(), x: CANVAS_W,
            y: Math.random() * (CANVAS_H - 140) + 70,
            width: type === 'thunder' ? 30 : 50,
            height: type === 'thunder' ? 70 : 50,
            speed: 3.5 * next.gameSpeed, type,
          });
          spawnTimerRef.current = now;
        }

        const { airplane: a } = next;
        const pad = 8;

        next.obstacles = next.obstacles
          .map(o => ({ ...o, x: o.x - o.speed }))
          .filter(o => {
            if (o.x + o.width < 0) {
              next.score += 10;
              if (next.score % 50 === 0) {
                next.gameSpeed = Math.min(3.0, next.gameSpeed + 0.05);
                spawnIntervalRef.current = Math.max(1200, spawnIntervalRef.current - 50);
              }
              return false;
            }
            // Collision
            if (a.x+pad < o.x+o.width-pad && a.x+a.width-pad > o.x+pad &&
                a.y+pad < o.y+o.height-pad && a.y+a.height-pad > o.y+pad) {
              next.gameOver = true;
              stopListening();
              submitScore(next.score);
            }
            return true;
          });

        return next;
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [gameState.gameStarted, gameState.gameOver]);

  // ── Canvas render — IDENTICAL to GestureGame ─────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Sky
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

    // Airplane (same as GestureGame)
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

    // Obstacles (same as GestureGame)
    gameState.obstacles.forEach(obs => {
      if (obs.type === 'bird') {
        const f = Math.sin(Date.now()*0.015+obs.id)*6;
        ctx.fillStyle='#78350f'; ctx.beginPath(); ctx.ellipse(obs.x+25,obs.y+20,14,10,0,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#92400e'; ctx.beginPath(); ctx.ellipse(obs.x+8,obs.y+18+f,18,7,-0.4,0,Math.PI*2); ctx.ellipse(obs.x+42,obs.y+18+f,18,7,0.4,0,Math.PI*2); ctx.fill();
      } else if (obs.type === 'cloud') {
        ctx.fillStyle='#94a3b8'; ctx.beginPath(); ctx.arc(obs.x+12,obs.y+20,15,0,Math.PI*2); ctx.arc(obs.x+28,obs.y+14,18,0,Math.PI*2); ctx.arc(obs.x+42,obs.y+20,15,0,Math.PI*2); ctx.fill();
      } else if (obs.type === 'thunder') {
        const g = ctx.createLinearGradient(obs.x,obs.y,obs.x,obs.y+obs.height);
        g.addColorStop(0,'#fef08a'); g.addColorStop(0.5,'#fbbf24'); g.addColorStop(1,'#f59e0b');
        ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(obs.x+15,obs.y); ctx.lineTo(obs.x+22,obs.y+25); ctx.lineTo(obs.x+12,obs.y+25); ctx.lineTo(obs.x+18,obs.y+45); ctx.lineTo(obs.x+10,obs.y+45); ctx.lineTo(obs.x+15,obs.y+70); ctx.lineTo(obs.x+8,obs.y+40); ctx.lineTo(obs.x+16,obs.y+40); ctx.lineTo(obs.x+10,obs.y+20); ctx.closePath(); ctx.fill();
      } else if (obs.type === 'ufo') {
        ctx.fillStyle='#6366f1'; ctx.beginPath(); ctx.ellipse(obs.x+25,obs.y+20,24,10,0,0,Math.PI*2); ctx.fill();
        const dg=ctx.createRadialGradient(obs.x+25,obs.y+15,5,obs.x+25,obs.y+15,15);
        dg.addColorStop(0,'#a5b4fc'); dg.addColorStop(1,'#818cf8'); ctx.fillStyle=dg;
        ctx.beginPath(); ctx.arc(obs.x+25,obs.y+14,14,0,Math.PI,true); ctx.fill();
        ['#ef4444','#22c55e','#3b82f6','#fbbf24'].forEach((c,i)=>{ ctx.fillStyle=c; ctx.shadowColor=c; ctx.shadowBlur=8; ctx.beginPath(); ctx.arc(obs.x+10+i*10,obs.y+24,3,0,Math.PI*2); ctx.fill(); });
        ctx.shadowBlur=0;
      }
    });

    // HUD
    ctx.fillStyle='rgba(15,23,42,0.85)'; ctx.fillRect(10,10,220,120);
    ctx.strokeStyle='#3b82f6'; ctx.lineWidth=2; ctx.strokeRect(10,10,220,120);
    ctx.fillStyle='#fff'; ctx.font='bold 32px Arial'; ctx.fillText(gameState.score,25,50);
    ctx.font='14px Arial'; ctx.fillStyle='#94a3b8'; ctx.fillText('SCORE',25,70);
    ctx.fillStyle='#fbbf24'; ctx.font='bold 24px Arial'; ctx.fillText(String(highScore),25,100);
    ctx.font='12px Arial'; ctx.fillStyle='#94a3b8'; ctx.fillText('HIGH SCORE',25,115);
    ctx.fillStyle='rgba(16,185,129,0.9)'; ctx.fillRect(CANVAS_W-160,15,145,35);
    ctx.fillStyle='#fff'; ctx.font='bold 18px Arial'; ctx.fillText(`⚡ ${(gameState.gameSpeed||1).toFixed(1)}x`,CANVAS_W-150,40);
  }, [gameState, highScore]);

  // ── Start game ────────────────────────────────────────────────────────────
  const startGame = () => {
    spawnTimerRef.current    = Date.now();
    spawnIntervalRef.current = 2200;
    setGameState({
      airplane: { x: 100, y: 250, width: 80, height: 35 },
      obstacles: [], score: 0,
      gameOver: false, gameStarted: true, gameSpeed: 1.0,
    });
    setError(''); setJustBeatHigh(false);
    startListening();
    loadHighScore();
  };

  const submitScore = async (score) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const res = await fetch(`${import.meta.env.VITE_API_URL}/games/score`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_type: 'voice', score }),
      });
      if (res.ok) {
        const d = await res.json();
        setHighScore(d.high_score || 0);
        setJustBeatHigh(!!d.is_high_score);
      }
    } catch(e) {}
  };

  // ── UI (same layout as GestureGame) ──────────────────────────────────────
  const CMD_COLORS = {
    up:    'from-cyan-500 to-blue-500',
    down:  'from-orange-500 to-red-500',
    left:  'from-purple-500 to-pink-500',
    right: 'from-green-500 to-emerald-500',
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all">
          ← Back to Game Zone
        </button>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isListening ? 'bg-green-500/30 border-green-400' : 'bg-black/30 border-white/20'}`}>
          <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="font-bold text-sm">{isListening ? '🎤 LISTENING' : 'MIC OFF'}</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-700">
        {/* Title bar — same style as GestureGame */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold">🎤 Sky Racer</h1>
              <p className="text-white/90 mt-1">Say "up" · "down" · "left" · "right"</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isListening ? 'bg-green-500/30 border-green-400' : 'bg-black/30 border-white/20'}`}>
              <div className={`w-4 h-4 rounded-full ${isListening ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="font-bold">{isListening ? '🎤 LISTENING' : 'MIC OFF'}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/70 border-l-4 border-red-500 p-4 m-4">
            <p className="text-red-200 font-bold">{error}</p>
          </div>
        )}

        <div className="p-6 bg-gray-950">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Game canvas — 2/3 */}
            <div className="lg:col-span-2 relative">
              <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H}
                className="w-full rounded-xl shadow-2xl border-4 border-gray-700" />

              {/* Command flash */}
              {lastCommand && gameState.gameStarted && !gameState.gameOver && (
                <div className={`absolute top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r ${CMD_COLORS[lastCommand]||'from-blue-500 to-purple-500'} text-white px-8 py-3 rounded-full text-2xl font-bold animate-bounce shadow-2xl`}>
                  🎤 {lastCommand.toUpperCase()}
                </div>
              )}

              {/* Game over */}
              {gameState.gameOver && (
                <div className="absolute inset-0 bg-black/90 flex items-center justify-center rounded-xl">
                  <div className="text-center space-y-5 px-8">
                    <div className="text-8xl">💥</div>
                    <h2 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">GAME OVER</h2>
                    <p className="text-3xl font-bold text-white">Score: {gameState.score}</p>
                    <p className="text-2xl text-yellow-400">Best: {highScore}</p>
                    {justBeatHigh && <p className="text-xl text-yellow-400 animate-pulse">🏆 NEW HIGH SCORE!</p>}
                    <button onClick={startGame}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-10 py-4 rounded-full font-bold text-xl transition-all hover:scale-105">
                      🚀 PLAY AGAIN
                    </button>
                  </div>
                </div>
              )}

              {/* Start screen */}
              {!gameState.gameStarted && !gameState.gameOver && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 to-purple-900/95 flex items-center justify-center rounded-xl backdrop-blur-sm">
                  <div className="text-center space-y-6 px-8">
                    <div className="text-8xl animate-bounce">✈️</div>
                    <h2 className="text-4xl font-bold text-white">Ready for Takeoff?</h2>
                    {highScore > 0 && (
                      <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-3">
                        <p className="text-yellow-400 text-xl font-bold">High Score: {highScore}</p>
                      </div>
                    )}
                    <button onClick={startGame}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 text-white px-12 py-4 rounded-full font-bold text-xl transition-all shadow-2xl">
                      🚀 START GAME
                    </button>
                    <p className="text-gray-300 text-sm">Mic starts automatically when game begins!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar — same structure as GestureGame */}
            <div className="space-y-4">
              {/* Mic status card */}
              <div className="bg-gray-800 rounded-xl p-4 border-2 border-blue-500">
                <h3 className="text-lg font-bold mb-3 text-blue-400">🎤 Voice Status</h3>
                <div className={`w-full aspect-video rounded-lg flex flex-col items-center justify-center gap-3 border-2 ${isListening ? 'bg-green-900/30 border-green-500' : 'bg-gray-700 border-gray-600'}`}>
                  <div className={`text-6xl ${isListening ? 'animate-pulse' : ''}`}>
                    {isListening ? '🎤' : '🔇'}
                  </div>
                  <p className={`font-bold text-lg ${isListening ? 'text-green-400' : 'text-gray-400'}`}>
                    {isListening ? 'Listening...' : 'Not listening'}
                  </p>
                  {lastCommand && (
                    <div className={`bg-gradient-to-r ${CMD_COLORS[lastCommand]||'from-blue-500 to-purple-500'} px-4 py-1 rounded-full text-sm font-bold`}>
                      Heard: {lastCommand.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mic:</span>
                    <span className={`font-bold ${isListening ? 'text-green-400' : 'text-red-400'}`}>
                      {isListening ? '✅ Active' : '❌ Off'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last command:</span>
                    <span className="font-bold text-blue-400 uppercase">{lastCommand || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="bg-gradient-to-br from-blue-700 to-purple-700 p-4 rounded-xl">
                <h3 className="font-bold mb-3">🎤 Voice Commands</h3>
                <div className="space-y-2 text-sm">
                  {[['☝️','Say "UP"','Airplane moves up'],['👇','Say "DOWN"','Airplane moves down'],
                    ['👈','Say "LEFT"','Airplane moves left'],['👉','Say "RIGHT"','Airplane moves right']].map(([e,l,d])=>(
                    <div key={l} className="bg-white/20 px-3 py-2 rounded flex gap-2 items-center">
                      <span>{e}</span>
                      <div><strong>{l}</strong><span className="text-white/70"> — {d}</span></div>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-3 text-white/70">💡 Speak clearly and naturally — works best in Chrome!</p>
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

export default VoiceGame;