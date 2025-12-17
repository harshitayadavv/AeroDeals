import { useState, useEffect, useRef } from 'react';

function VoiceGame({ onBack }) {
  const [gameState, setGameState] = useState({
    airplane: { x: 100, y: 250, width: 80, height: 35 },
    obstacles: [],
    score: 0,
    gameOver: false,
    gameStarted: false,
    gameSpeed: 1.0
  });
  
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [highScore, setHighScore] = useState(0);
  const [justBeatHigh, setJustBeatHigh] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingScore, setIsLoadingScore] = useState(true);
  
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const lastObstacleTimeRef = useRef(Date.now());
  const obstacleSpawnInterval = useRef(2500); // Even slower spawn
  const gameStateRef = useRef(gameState);
  const airplaneImageRef = useRef(null);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const MOVE_AMOUNT = 50;
  
  // Safe boundaries - airplane won't go outside
  const BOUNDARY_TOP = 30;
  const BOUNDARY_BOTTOM = 30;
  const BOUNDARY_LEFT = 20;
  const BOUNDARY_RIGHT = 20;

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Load high score on mount AND after game over
  useEffect(() => {
    loadHighScore();
  }, []);

 
  useEffect(() => {
    if (gameState.gameOver) {
      setTimeout(() => loadHighScore(), 1000);
    }
  }, [gameState.gameOver]);

  const loadHighScore = async () => {
  try {
    setIsLoadingScore(true);
    
    // DEBUG: Try to get token from different sources
    let token = localStorage.getItem('auth_token');
    
    if (!token) {
      token = localStorage.getItem('access_token'); // Try alternate name
    }
    
    if (!token) {
      // Check sessionStorage too
      token = sessionStorage.getItem('token');
    }
    
    console.log('🔑 Token found:', token ? 'YES' : 'NO');
    
    if (!token) {
      console.log('❌ NO TOKEN - Cannot load high score');
      console.log('🔍 All localStorage keys:', Object.keys(localStorage));
      setIsLoadingScore(false);
      setHighScore(0);
      return;
    }
      
      console.log('📊 Loading high score...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/games/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Stats received:', data);
        
        if (data.stats && data.stats.voice) {
          const newHighScore = data.stats.voice.high_score || 0;
          console.log('🏆 Setting high score to:', newHighScore);
          setHighScore(newHighScore);
        } else {
          console.log('📊 No voice stats yet, setting to 0');
          setHighScore(0);
        }
      } else {
        console.error('❌ Stats fetch failed:', response.status);
      }
    } catch (err) {
      console.error('❌ High score load error:', err);
    } finally {
      setIsLoadingScore(false);
    }
  };

  // Initialize speech recognition with BETTER settings
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('⚠️ Speech recognition not supported. Use Chrome or Edge!');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognizer = new SpeechRecognition();
    
    // OPTIMAL SETTINGS FOR SPEED
    recognizer.continuous = true;
    recognizer.interimResults = false; // Changed to false to prevent duplicates
    recognizer.lang = 'en-US';
    recognizer.maxAlternatives = 1;

    let lastProcessedCommand = '';

let lastProcessedTime = 0;

recognizer.onresult = (event) => {
  const lastIndex = event.results.length - 1;
  const result = event.results[lastIndex];
  
  if (!result.isFinal) return; // Only process final results
  
  const transcript = result[0].transcript.toLowerCase().trim();
  const now = Date.now();
  
  console.log('🎤 Final:', transcript);
  
  // Prevent duplicates within 500ms
  if (transcript === lastProcessedCommand && (now - lastProcessedTime) < 500) {
    console.log('⏭️ Skipping duplicate');
    return;
  }
  
  if (transcript.includes('up') || transcript.includes('down') || 
      transcript.includes('left') || transcript.includes('right')) {
    
    console.log('✅ Processing:', transcript);
    lastProcessedCommand = transcript;
    lastProcessedTime = now;
    
    setLastCommand(transcript);
    processVoiceCommand(transcript);
    setTimeout(() => setLastCommand(''), 1000);
  }
};

    recognizer.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('🎤 Microphone blocked! Please allow access.');
        setIsListening(false);
      } else if (event.error !== 'no-speech') {
        console.error('Speech error:', event.error);
      }
    };

    recognizer.onend = () => {
      // Instant restart
      if (isListening && gameStateRef.current.gameStarted && !gameStateRef.current.gameOver) {
        try {
          recognizer.start();
        } catch (e) {}
      }
    };

    setRecognition(recognizer);

    return () => {
      if (recognizer) {
        try { recognizer.stop(); } catch (e) {}
      }
    };
  }, []);

  // Auto-start listening
  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver && !isListening) {
      setIsListening(true);
    }
  }, [gameState.gameStarted, gameState.gameOver]);

  useEffect(() => {
    if (!recognition) return;

    if (isListening) {
      try {
        recognition.start();
        console.log('🎤 Started');
        setError('');
      } catch (e) {}
    } else {
      try {
        recognition.stop();
      } catch (e) {}
    }
  }, [isListening, recognition]);

  // INSTANT movement processing with BOUNDARIES
  const processVoiceCommand = (command) => {
    const currentState = gameStateRef.current;
    
    if (currentState.gameOver || !currentState.gameStarted) {
      return;
    }

    // IMMEDIATE state update with SAFE boundaries
    setGameState(prev => {
      if (prev.gameOver || !prev.gameStarted) return prev;
      
      const airplane = { ...prev.airplane };
      const maxY = CANVAS_HEIGHT - airplane.height - BOUNDARY_BOTTOM;
      const maxX = CANVAS_WIDTH - airplane.width - BOUNDARY_RIGHT;

      if (command.includes('up')) {
        airplane.y = Math.max(BOUNDARY_TOP, airplane.y - MOVE_AMOUNT);
        console.log('⬆️ UP:', airplane.y);
      } 
      
      if (command.includes('down')) {
        airplane.y = Math.min(maxY, airplane.y + MOVE_AMOUNT);
        console.log('⬇️ DOWN:', airplane.y);
      } 
      
      if (command.includes('left')) {
        airplane.x = Math.max(BOUNDARY_LEFT, airplane.x - MOVE_AMOUNT);
        console.log('⬅️ LEFT:', airplane.x);
      } 
      
      if (command.includes('right')) {
        airplane.x = Math.min(maxX, airplane.x + MOVE_AMOUNT);
        console.log('➡️ RIGHT:', airplane.x);
      }

      return { ...prev, airplane };
    });
  };

  // Game loop
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      return;
    }

    const gameLoop = () => {
      setGameState(prev => {
        const newState = { ...prev };
        
        const now = Date.now();
        if (now - lastObstacleTimeRef.current > obstacleSpawnInterval.current) {
          const types = ['bird', 'thunder', 'cloud', 'ufo'];
          const type = types[Math.floor(Math.random() * types.length)];
          
          newState.obstacles.push({
            id: Math.random(),
            x: CANVAS_WIDTH,
            y: Math.random() * (CANVAS_HEIGHT - 140) + 70,
            width: type === 'thunder' ? 30 : 50,
            height: type === 'thunder' ? 70 : 50,
            speed: 3.5 * newState.gameSpeed, // Slower obstacles
            type
          });
          
          lastObstacleTimeRef.current = now;
        }

        const airplane = newState.airplane;
        newState.obstacles = newState.obstacles
          .map(obs => ({ ...obs, x: obs.x - obs.speed }))
          .filter(obs => {
            if (obs.x + obs.width < 0) {
              newState.score += 10;
              
              if (newState.score % 50 === 0) {
                newState.gameSpeed += 0.05;
                obstacleSpawnInterval.current = Math.max(1500, obstacleSpawnInterval.current - 50);
              }
              
              return false;
            }
            
            // More forgiving collision
            const padding = 8;
            if (
              airplane.x + padding < obs.x + obs.width - padding &&
              airplane.x + airplane.width - padding > obs.x + padding &&
              airplane.y + padding < obs.y + obs.height - padding &&
              airplane.y + airplane.height - padding > obs.y + padding
            ) {
              newState.gameOver = true;
              submitScore(newState.score);
              setIsListening(false);
            }
            
            return true;
          });

        return newState;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.gameStarted, gameState.gameOver]);

  // REALISTIC AIRPLANE DRAWING
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

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

    // ULTRA REALISTIC AIRPLANE
    const { airplane } = gameState;
    const px = airplane.x;
    const py = airplane.y;
    
    ctx.save();
    
    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    
    // Main fuselage (metallic silver)
    const fuselageGradient = ctx.createLinearGradient(px, py, px, py + 35);
    fuselageGradient.addColorStop(0, '#e5e7eb');
    fuselageGradient.addColorStop(0.5, '#9ca3af');
    fuselageGradient.addColorStop(1, '#6b7280');
    ctx.fillStyle = fuselageGradient;
    ctx.beginPath();
    ctx.ellipse(px + 40, py + 17, 38, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Cockpit window (blue tinted)
    const windowGradient = ctx.createRadialGradient(px + 58, py + 12, 2, px + 58, py + 12, 12);
    windowGradient.addColorStop(0, '#93c5fd');
    windowGradient.addColorStop(0.7, '#3b82f6');
    windowGradient.addColorStop(1, '#1e40af');
    ctx.fillStyle = windowGradient;
    ctx.beginPath();
    ctx.ellipse(px + 58, py + 15, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Window frame
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Main wings (top)
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
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Main wings (bottom)
    ctx.fillStyle = wingGradient;
    ctx.beginPath();
    ctx.moveTo(px + 25, py + 17);
    ctx.lineTo(px - 8, py + 36);
    ctx.lineTo(px - 2, py + 24);
    ctx.lineTo(px + 5, py + 17);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Tail wing
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 17);
    ctx.lineTo(px - 2, py + 5);
    ctx.lineTo(px + 3, py + 8);
    ctx.lineTo(px + 10, py + 14);
    ctx.closePath();
    ctx.fill();
    
    // Engine cowling
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.ellipse(px + 72, py + 17, 8, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Spinning propeller
    const propAngle = Date.now() * 0.03;
    ctx.save();
    ctx.translate(px + 78, py + 17);
    ctx.rotate(propAngle);
    
    // Propeller blades
    ctx.fillStyle = 'rgba(100, 116, 139, 0.7)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Propeller hub
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Red stripe detail
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px + 15, py + 17);
    ctx.lineTo(px + 55, py + 17);
    ctx.stroke();
    
    // Fuselage highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(px + 45, py + 10, 15, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();

    // Draw obstacles with detail
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
        
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.moveTo(obs.x + 32, obs.y + 22);
        ctx.lineTo(obs.x + 38, obs.y + 24);
        ctx.lineTo(obs.x + 32, obs.y + 26);
        ctx.closePath();
        ctx.fill();
      } else if (obs.type === 'thunder') {
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
      } else if (obs.type === 'cloud') {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(obs.x + 12, obs.y + 20, 15, 0, Math.PI * 2);
        ctx.arc(obs.x + 28, obs.y + 14, 18, 0, Math.PI * 2);
        ctx.arc(obs.x + 42, obs.y + 20, 15, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'ufo') {
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.ellipse(obs.x + 25, obs.y + 20, 24, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const domeGradient = ctx.createRadialGradient(obs.x + 25, obs.y + 15, 5, obs.x + 25, obs.y + 15, 15);
        domeGradient.addColorStop(0, '#a5b4fc');
        domeGradient.addColorStop(1, '#818cf8');
        ctx.fillStyle = domeGradient;
        ctx.beginPath();
        ctx.arc(obs.x + 25, obs.y + 14, 14, 0, Math.PI, true);
        ctx.fill();
        
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
      }
    });

    // Modern UI with CURRENT high score
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
    console.log('Canvas drawing high score:', highScore);
    // Speed
    ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
    ctx.fillRect(CANVAS_WIDTH - 160, 15, 145, 35);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(`⚡ ${gameState.gameSpeed.toFixed(1)}x`, CANVAS_WIDTH - 150, 40);

  }, [gameState, highScore]);

  const startGame = () => {
    setGameState({
      airplane: { x: 100, y: 250, width: 80, height: 35 },
      obstacles: [],
      score: 0,
      gameOver: false,
      gameStarted: true,
      gameSpeed: 1.0
    });
    lastObstacleTimeRef.current = Date.now();
    obstacleSpawnInterval.current = 2500;
    setError('');
    setIsListening(true);
    setJustBeatHigh(false);
     // Reload at start too
     loadHighScore(); // Add this line

    // Force re-check after delay
    setTimeout(() => {
      console.log('🔄 Re-checking high score after game start');
      loadHighScore();
    }, 500);
  };

  const submitScore = async (score) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.warn('⚠️ No token');
        return;
      }

      console.log('💾 Submitting score:', score);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/games/score`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ game_type: 'voice', score })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Score saved! Response:', data);
        console.log('🏆 High score from response:', data.high_score);
        
        // FORCE update with new value
        const newHigh = data.high_score || 0;
        console.log('🎯 FORCING high score update to:', newHigh);
        setHighScore(newHigh);

// Force a second update after delay to ensure re-render
        setTimeout(() => {
            console.log('🔄 Double-checking high score:', newHigh);
            setHighScore(newHigh);
        }, 100);

        // Mark if this submission produced a new high
        setJustBeatHigh(!!data.is_high_score);

        // Refresh stats from server to ensure consistency
        try {
          await loadHighScore();
        } catch (e) {
          console.warn('Failed to reload stats after submit', e);
        }

        
        // Force re-render by reloading stats
        // setTimeout(async () => {
        //   console.log('🔄 Reloading high score...');
        //   await loadHighScore();
        // }, 800);
      } else {
        console.error('❌ Score failed:', response.status);
      }
    } catch (err) {
      console.error('❌ Submit error:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
      >
        <span>←</span>
        <span>Back to Game Zone</span>
      </button>

      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-700">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold flex items-center gap-3">
                <span>✈️</span>
                <span>Sky Racer</span>
              </h1>
              <p className="text-white/90 mt-2 text-lg">
                Just speak - "up", "down", "left", "right" - INSTANT response!
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-full">
                <div className={`w-4 h-4 rounded-full ${isListening ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-lg font-bold">{isListening ? '🎤 LISTENING' : 'MIC OFF'}</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/70 border-l-4 border-red-500 p-4 m-6">
            <p className="text-red-200 font-bold">{error}</p>
          </div>
        )}

        <div className="p-6 bg-gray-950">
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full rounded-xl shadow-2xl border-4 border-gray-700"
            />
            
            {lastCommand && gameState.gameStarted && !gameState.gameOver && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-full text-3xl font-bold animate-bounce shadow-2xl border-2 border-white">
                🎤 {lastCommand.toUpperCase()}
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
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-12 py-4 rounded-full font-bold text-xl transition-all transform hover:scale-105 shadow-lg"
                  >
                    🚀 PLAY AGAIN
                  </button>
                </div>
              </div>
            )}

            {!gameState.gameStarted && (
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 to-purple-900/95 flex items-center justify-center rounded-xl backdrop-blur-sm">
                <div className="text-center space-y-8 px-8">
                  <div className="text-8xl animate-bounce">✈️</div>
                  <h2 className="text-5xl font-bold text-white">Ready for Takeoff?</h2>
                  {highScore > 0 && (
                    <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-lg p-4">
                      <p className="text-yellow-400 text-2xl font-bold">High Score: {highScore}</p>
                    </div>
                  )}
                  <button
                    onClick={startGame}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-12 py-5 rounded-full font-bold text-2xl transition-all transform hover:scale-110 shadow-2xl"
                  >
                    🚀 START GAME
                  </button>
                  <p className="text-gray-300">Voice recognition starts automatically!</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-gray-900 border-t-2 border-gray-700">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-600 to-teal-600 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-3">🎤 Controls</h3>
              <div className="space-y-2 text-sm">
                <div className="bg-white/20 px-3 py-2 rounded-lg">"up" → Instant Up</div>
                <div className="bg-white/20 px-3 py-2 rounded-lg">"down" → Instant Down</div>
                <div className="bg-white/20 px-3 py-2 rounded-lg">"left" → Instant Left</div>
                <div className="bg-white/20 px-3 py-2 rounded-lg">"right" → Instant Right</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-3">🎯 Obstacles</h3>
              <div className="space-y-2 text-sm">
                <div>🦅 Birds</div>
                <div>⚡ Lightning</div>
                <div>☁️ Clouds</div>
                <div>🛸 UFOs</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-600 to-red-600 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-3">💡 Tips</h3>
              <div className="space-y-1 text-sm">
                <p>✅ Mic auto-starts</p>
                <p>✅ Speak naturally</p>
                <p>✅ Instant movement</p>
                <p>✅ Beat your record!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoiceGame;