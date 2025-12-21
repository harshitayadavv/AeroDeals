import { useState, useEffect, useRef } from 'react';

function GestureGame({ onBack }) {
  const [gameState, setGameState] = useState({
    airplane: { x: 100, y: 250, width: 80, height: 35 },
    obstacles: [],
    score: 0,
    gameOver: false,
    gameStarted: false,
    gameSpeed: 1.0
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [currentGesture, setCurrentGesture] = useState('none');
  const [lastCommand, setLastCommand] = useState('');
  const [highScore, setHighScore] = useState(0);
  const [justBeatHigh, setJustBeatHigh] = useState(false);
  const [error, setError] = useState('');
  const [webcamReady, setWebcamReady] = useState(false);
  const [processedFrame, setProcessedFrame] = useState('');
  const [gestureDescription, setGestureDescription] = useState('');
  
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const wsRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const gameStateRef = useRef(gameState);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Load high score
  useEffect(() => {
    loadHighScore();
  }, []);

  const loadHighScore = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setHighScore(0);
        return;
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/games/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.stats && data.stats.gesture) {
          setHighScore(data.stats.gesture.high_score || 0);
        }
      }
    } catch (err) {
      console.error('High score load error:', err);
    }
  };

  // Initialize webcam
  useEffect(() => {
    initWebcam();
    return () => {
      console.log('🧹 Component unmounting - cleaning up webcam');
      stopWebcam();
    };
  }, []);

  const initWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setWebcamReady(true);
        setError('');
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setError('🎥 Camera access denied! Please allow camera permissions.');
      setWebcamReady(false);
    }
  };

  const stopWebcam = () => {
    console.log('📹 Stopping webcam...');
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log('🛑 Track stopped:', track.kind);
      });
      videoRef.current.srcObject = null;
      setWebcamReady(false);
      console.log('✅ Webcam fully stopped');
    }
  };

  // Initialize WebSocket
  const initWebSocket = async () => {
    try {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('❌ Not logged in');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/games/gesture/session`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      const wsUrl = `${import.meta.env.VITE_API_URL.replace('http', 'ws')}${data.websocket_url}`;
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        setIsConnected(true);
        setError('');
        
        ws.send(JSON.stringify({ type: 'start' }));
        startFrameCapture();
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'game_started') {
            console.log('🎮 GAME STARTED:', data);
            if (data.state) {
              console.log('✅ Setting initial game state:', data.state);
              setGameState(data.state);
            }
          }
          else if (data.type === 'game_state') {
            // Update game state from server
            console.log('🔄 Game state update:', data.state.airplane.x, data.state.airplane.y);
            setGameState(data.state);
            // DON'T update handDetected here - it comes from video_frame
            
            const gesture = data.gesture;
            if (gesture && gesture !== 'none') {
              setCurrentGesture(gesture);
              setLastCommand(gesture);
              setTimeout(() => setLastCommand(''), 800);
            } else {
              setCurrentGesture('none');
            }
            
            if (data.state.gameOver && !gameStateRef.current.gameOver) {
              submitScore(data.state.score);
              stopFrameCapture();
            }
          }
          else if (data.type === 'video_frame') {
            // Update processed video frame
            setProcessedFrame(data.frame);
            setHandDetected(data.hand_detected); // ✅ THIS is where we update hand detection
            setGestureDescription(data.description || '');
            
            const gesture = data.gesture;
            if (gesture && gesture !== 'none') {
              setCurrentGesture(gesture);
            } else {
              setCurrentGesture('none');
            }
          }
        } catch (err) {
          console.error('Parse error:', err);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Connection error');
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        stopFrameCapture();
      };
      
    } catch (err) {
      console.error('WebSocket init error:', err);
      setError('Failed to connect to server');
    }
  };

  const startFrameCapture = () => {
    if (!videoRef.current || !wsRef.current) return;
    
    frameIntervalRef.current = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) return;
      
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0);
        
        const frameData = canvas.toDataURL('image/jpeg', 0.8);
        
        wsRef.current.send(JSON.stringify({
          type: 'frame',
          frame: frameData
        }));
      } catch (err) {
        console.error('Frame capture error:', err);
      }
    }, 100);
  };

  const stopFrameCapture = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  };

  const startGame = () => {
    if (!webcamReady) {
      setError('⚠️ Waiting for camera...');
      return;
    }
    
    setGameState({
      airplane: { x: 100, y: 250, width: 80, height: 35 },
      obstacles: [],
      score: 0,
      gameOver: false,
      gameStarted: true,
      gameSpeed: 1.0
    });
    setError('');
    setJustBeatHigh(false);
    
    initWebSocket();
  };

  const submitScore = async (score) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/games/score`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ game_type: 'gesture', score })
      });
      
      if (response.ok) {
        const data = await response.json();
        setHighScore(data.high_score || 0);
        setJustBeatHigh(!!data.is_high_score);
      }
    } catch (err) {
      console.error('Submit error:', err);
    }
  };

  // Canvas rendering
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    console.log('🎨 Rendering canvas - Airplane at:', gameState.airplane.x, gameState.airplane.y);

    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, '#0f172a');
    skyGradient.addColorStop(0.5, '#1e40af');
    skyGradient.addColorStop(1, '#38bdf8');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Animated clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    for (let i = 0; i < 6; i++) {
      const x = ((i * 180 + Date.now() * 0.015) % (CANVAS_WIDTH + 150)) - 75;
      const y = 60 + i * 25;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.arc(x + 25, y - 5, 28, 0, Math.PI * 2);
      ctx.arc(x + 50, y, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw airplane
    const { airplane } = gameState;
    const px = airplane.x;
    const py = airplane.y;
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    const fuselageGradient = ctx.createLinearGradient(px, py, px, py + 35);
    fuselageGradient.addColorStop(0, '#e5e7eb');
    fuselageGradient.addColorStop(0.5, '#9ca3af');
    fuselageGradient.addColorStop(1, '#6b7280');
    ctx.fillStyle = fuselageGradient;
    ctx.beginPath();
    ctx.ellipse(px + 40, py + 17, 38, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const windowGradient = ctx.createRadialGradient(px + 58, py + 12, 2, px + 58, py + 12, 12);
    windowGradient.addColorStop(0, '#93c5fd');
    windowGradient.addColorStop(0.7, '#3b82f6');
    windowGradient.addColorStop(1, '#1e40af');
    ctx.fillStyle = windowGradient;
    ctx.beginPath();
    ctx.ellipse(px + 58, py + 15, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const wingGradient = ctx.createLinearGradient(px - 5, py, px - 5, py + 15);
    wingGradient.addColorStop(0, '#ef4444');
    wingGradient.addColorStop(0.6, '#dc2626');
    wingGradient.addColorStop(1, '#991b1b');
    ctx.fillStyle = wingGradient;
    ctx.beginPath();
    ctx.moveTo(px + 25, py + 17);
    ctx.lineTo(px - 8, py - 2);
    ctx.lineTo(px - 2, py + 10);
    ctx.lineTo(px + 5, py + 17);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();

    // Draw obstacles
    gameState.obstacles.forEach(obs => {
      if (obs.type === 'bird') {
        const wingFlap = Math.sin(Date.now() * 0.015 + obs.id) * 6;
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(obs.x + 25, obs.y + 20, 14, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.ellipse(obs.x + 8, obs.y + 18 + wingFlap, 18, 7, -0.4, 0, Math.PI * 2);
        ctx.ellipse(obs.x + 42, obs.y + 18 + wingFlap, 18, 7, 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'cloud') {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(obs.x + 12, obs.y + 20, 15, 0, Math.PI * 2);
        ctx.arc(obs.x + 28, obs.y + 14, 18, 0, Math.PI * 2);
        ctx.arc(obs.x + 42, obs.y + 20, 15, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'thunder') {
        // Lightning bolt
        const gradient = ctx.createLinearGradient(obs.x, obs.y, obs.x, obs.y + obs.height);
        gradient.addColorStop(0, '#fef08a');
        gradient.addColorStop(0.5, '#fbbf24');
        gradient.addColorStop(1, '#f59e0b');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.moveTo(obs.x + 15, obs.y);
        ctx.lineTo(obs.x + 22, obs.y + 25);
        ctx.lineTo(obs.x + 12, obs.y + 25);
        ctx.lineTo(obs.x + 18, obs.y + 45);
        ctx.lineTo(obs.x + 10, obs.y + 45);
        ctx.lineTo(obs.x + 15, obs.y + 70);
        ctx.lineTo(obs.x + 8, obs.y + 40);
        ctx.lineTo(obs.x + 16, obs.y + 40);
        ctx.lineTo(obs.x + 10, obs.y + 20);
        ctx.lineTo(obs.x + 15, obs.y);
        ctx.fill();
        
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (obs.type === 'ufo') {
        // UFO saucer
        ctx.save();
        
        // Bottom disc
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.ellipse(obs.x + 25, obs.y + 20, 24, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Top dome
        const domeGradient = ctx.createRadialGradient(obs.x + 25, obs.y + 15, 5, obs.x + 25, obs.y + 15, 15);
        domeGradient.addColorStop(0, '#a5b4fc');
        domeGradient.addColorStop(1, '#818cf8');
        ctx.fillStyle = domeGradient;
        ctx.beginPath();
        ctx.arc(obs.x + 25, obs.y + 14, 14, 0, Math.PI, true);
        ctx.fill();
        
        // Lights
        const colors = ['#ef4444', '#22c55e', '#3b82f6', '#fbbf24'];
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = colors[i];
          ctx.shadowColor = colors[i];
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(obs.x + 10 + i * 10, obs.y + 24, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        
        ctx.restore();
      }
    });

    // UI
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(10, 10, 220, 120);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 220, 120);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(gameState.score, 25, 50);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('SCORE', 25, 70);
    
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(String(highScore), 25, 100);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('HIGH SCORE', 25, 115);
    
    ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
    ctx.fillRect(CANVAS_WIDTH - 160, 15, 145, 35);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`⚡ ${(gameState.gameSpeed || 1.0).toFixed(1)}x`, CANVAS_WIDTH - 150, 40);
  }, [gameState, highScore]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
        >
          <span>←</span>
          <span>Back to Game Zone</span>
        </button>
        
        {webcamReady && (
          <button
            onClick={() => {
              console.log('🛑 MANUAL STOP clicked');
              stopFrameCapture();
              stopWebcam();
              if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
              }
              setIsConnected(false);
              setWebcamReady(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
          >
            <span>🛑</span>
            <span>Force Stop Camera</span>
          </button>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-700">
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <span>✋</span>
                <span>Gesture Racer</span>
              </h1>
              <p className="text-white/90 mt-2 text-lg">
                Move your hand to different zones - TOP: up, BOTTOM: down, LEFT: left, RIGHT: right
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-full">
                <div className={`w-4 h-4 rounded-full ${handDetected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-lg font-bold">{handDetected ? '✋ DETECTED' : 'NO HAND'}</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/70 border-l-4 border-red-500 p-4 m-6">
            <p className="text-red-200 font-bold">{error}</p>
          </div>
        )}

        {/* Hidden raw webcam video */}
        <video ref={videoRef} style={{ display: 'none' }} />

        <div className="p-6 bg-gray-950">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Game Canvas - 2/3 width */}
            <div className="lg:col-span-2 relative">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="w-full rounded-xl shadow-2xl border-4 border-gray-700"
              />
              
              {lastCommand && gameState.gameStarted && !gameState.gameOver && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full text-3xl font-bold animate-bounce shadow-2xl border-2 border-white">
                  ✋ {lastCommand.toUpperCase()}
                </div>
              )}
              
              {gameState.gameOver && (
                <div className="absolute inset-0 bg-black/90 flex items-center justify-center rounded-xl">
                  <div className="text-center space-y-6 px-8">
                    <div className="text-8xl mb-4">💥</div>
                    <h2 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                      GAME OVER
                    </h2>
                    <div className="space-y-2">
                      <p className="text-3xl font-bold text-white">Score: {gameState.score}</p>
                      <p className="text-2xl text-yellow-400">Best: {highScore}</p>
                      {justBeatHigh && (
                        <p className="text-2xl text-yellow-400 animate-pulse">🏆 NEW HIGH SCORE! 🏆</p>
                      )}
                    </div>
                    <button
                      onClick={startGame}
                      className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-12 py-4 rounded-full font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
                    >
                      ✋ PLAY AGAIN
                    </button>
                  </div>
                </div>
              )}

              {(!gameState.gameStarted && !isConnected) && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 to-pink-900/95 flex items-center justify-center rounded-xl backdrop-blur-sm">
                  <div className="text-center space-y-8 px-8">
                    <div className="text-8xl animate-bounce">✋</div>
                    <h2 className="text-5xl font-bold text-white">Ready for Gesture Control?</h2>
                    {highScore > 0 && (
                      <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-4">
                        <p className="text-yellow-400 text-2xl font-bold">High Score: {highScore}</p>
                      </div>
                    )}
                    <button
                      onClick={startGame}
                      disabled={!webcamReady}
                      className={`${webcamReady ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700' : 'bg-gray-600 cursor-not-allowed'} text-white px-12 py-5 rounded-full font-bold text-2xl transition-all transform hover:scale-110 shadow-2xl`}
                    >
                      {webcamReady ? '✋ START GAME' : '⏳ Waiting for camera...'}
                    </button>
                    <p className="text-gray-300">{webcamReady ? 'Camera ready! Show your hand to start.' : 'Please allow camera access'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Live Video Feed - 1/3 width */}
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-xl p-4 border-2 border-purple-500">
                <h3 className="text-xl font-bold mb-3 text-purple-400">📹 Live Camera</h3>
                {processedFrame ? (
                  <img 
                    src={processedFrame} 
                    alt="Hand tracking" 
                    className="w-full rounded-lg border-2 border-green-500"
                  />
                ) : (
                  <div className="w-full aspect-video bg-gray-700 rounded-lg flex items-center justify-center border-2 border-gray-600">
                    <p className="text-gray-400">Waiting for video...</p>
                  </div>
                )}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Hand Status:</span>
                    <span className={`font-bold ${handDetected ? 'text-green-400' : 'text-red-400'}`}>
                      {handDetected ? '✅ Detected' : '❌ Not Found'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Current Gesture:</span>
                    <span className="font-bold text-purple-400">{currentGesture.toUpperCase()}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {gestureDescription || 'Waiting for gesture...'}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-4 rounded-xl">
                <h3 className="text-lg font-bold mb-2">✋ How to Play</h3>
                <div className="space-y-2 text-sm">
                  <div className="bg-white/20 px-3 py-2 rounded">
                    <strong>☝️ TOP zone</strong> → Move UP
                  </div>
                  <div className="bg-white/20 px-3 py-2 rounded">
                    <strong>👇 BOTTOM zone</strong> → Move DOWN
                  </div>
                  <div className="bg-white/20 px-3 py-2 rounded">
                    <strong>👈 LEFT zone</strong> → Move LEFT
                  </div>
                  <div className="bg-white/20 px-3 py-2 rounded">
                    <strong>👉 RIGHT zone</strong> → Move RIGHT
                  </div>
                </div>
                <p className="text-xs mt-3 text-white/80">
                  💡 Just move your hand to any zone - no need to count fingers!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-900 border-t-2 border-gray-700">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-3">✋ Simple Controls</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-white/20 px-3 py-2 rounded-lg">
                  <strong>Move hand to TOP</strong> → Airplane goes UP
                </div>
                <div className="bg-white/20 px-3 py-2 rounded-lg">
                  <strong>Move hand to BOTTOM</strong> → Airplane goes DOWN
                </div>
                <div className="bg-white/20 px-3 py-2 rounded-lg">
                  <strong>Move hand to LEFT</strong> → Airplane goes LEFT
                </div>
                <div className="bg-white/20 px-3 py-2 rounded-lg">
                  <strong>Move hand to RIGHT</strong> → Airplane goes RIGHT
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-3">🎯 Obstacles</h3>
              <div className="space-y-2 text-sm">
                <div>🦅 Birds - Avoid flying creatures</div>
                <div>☁️ Clouds - Navigate through</div>
                <div>⚡ Thunder - Watch out!</div>
                <div>🛸 UFOs - Dodge alien ships</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GestureGame;