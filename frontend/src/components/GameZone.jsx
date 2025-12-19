import { useState } from 'react';
import VoiceGame from './VoiceGame';
import GestureGame from './GestureGame';

function GameZone() {
  const [gameType, setGameType] = useState(null);

  const handleBack = () => {
    setGameType(null);
  };

  // Render selected game
  if (gameType === 'voice') {
    return <VoiceGame onBack={handleBack} />;
  }

  if (gameType === 'gesture') {
    return <GestureGame onBack={handleBack} />;
  }
  
  // Game selection screen
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">🎮 Sky Racer</h1>
        <p className="text-gray-400">Choose your control method</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Gesture Controlled Game */}
        <div
          onClick={() => setGameType('gesture')}
          className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-2xl shadow-2xl cursor-pointer transform hover:scale-105 transition-all"
        >
          <div className="text-center">
            <div className="text-6xl mb-4">✋</div>
            <h2 className="text-2xl font-bold mb-2">Gesture Controlled</h2>
            <p className="text-gray-200 mb-4">
              Control the airplane by moving your hand to different zones on camera
            </p>
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <div className="text-sm text-white/90 mb-2 font-bold">
                Simple Zone-Based Control:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="bg-white/20 px-2 py-1 rounded">☝️ Top → Up</span>
                <span className="bg-white/20 px-2 py-1 rounded">👇 Bottom → Down</span>
                <span className="bg-white/20 px-2 py-1 rounded">👈 Left → Left</span>
                <span className="bg-white/20 px-2 py-1 rounded">👉 Right → Right</span>
              </div>
              <div className="text-xs text-white/70 mt-2">
                No finger counting needed!
              </div>
            </div>
            <div className="mt-4 bg-white text-purple-600 rounded-full px-6 py-2 text-sm font-bold inline-block">
              ✅ Play Now!
            </div>
          </div>
        </div>

        {/* Voice Controlled Game */}
        <div
          onClick={() => setGameType('voice')}
          className="bg-gradient-to-br from-green-600 to-teal-600 p-8 rounded-2xl shadow-2xl cursor-pointer transform hover:scale-105 transition-all"
        >
          <div className="text-center">
            <div className="text-6xl mb-4">🎤</div>
            <h2 className="text-2xl font-bold mb-2">Voice Controlled</h2>
            <p className="text-gray-200 mb-4">
              Control the airplane with your voice using speech recognition
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">"up" - Move Up</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">"down" - Move Down</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">"left" - Move Left</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">"right" - Move Right</span>
            </div>
            <div className="mt-4 bg-white text-green-600 rounded-full px-6 py-2 text-sm font-bold inline-block">
              ✅ Play Now!
            </div>
          </div>
        </div>
      </div>

      {/* Game Info */}
      <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
          <span>✈️</span>
          <span>About Sky Racer</span>
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold mb-2 text-blue-400">🎯 Objective</h4>
            <p className="text-sm text-gray-300 mb-3">
              Navigate your airplane through obstacles and score points by avoiding birds, lightning, clouds, and UFOs!
            </p>
            
            <h4 className="font-bold mb-2 text-purple-400">⚠️ Obstacles</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div>🦅 Birds - Flying hazards</div>
              <div>⚡ Lightning - Electrical danger</div>
              <div>☁️ Clouds - Thick fog</div>
              <div>🛸 UFOs - Alien spacecraft</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-2 text-green-400">🏆 Scoring</h4>
            <p className="text-sm text-gray-300 mb-3">
              Earn 10 points for each obstacle you pass. Speed increases every 100 points!
            </p>
            
            <h4 className="font-bold mb-2 text-yellow-400">💡 Control Tips</h4>
            <div className="text-sm text-gray-300 space-y-1">
              <div className="mb-2">
                <span className="font-bold text-purple-400">Gesture:</span>
                <div className="ml-3 mt-1">
                  ✅ Just move hand to screen zones<br/>
                  ✅ Good lighting helps detection<br/>
                  ✅ No specific gestures needed
                </div>
              </div>
              <div>
                <span className="font-bold text-green-400">Voice:</span>
                <div className="ml-3 mt-1">
                  ✅ Speak clearly: "up", "down", "left", "right"<br/>
                  ✅ Works in quiet environment<br/>
                  ✅ Instant response
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="mt-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-4 rounded-lg border border-blue-700/50">
        <h4 className="font-bold mb-2 flex items-center gap-2">
          <span>📋</span>
          <span>Requirements</span>
        </h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <span className="font-bold text-purple-400">For Gesture Control:</span>
            <div className="ml-3 mt-1 space-y-1">
              <div>✅ Webcam access</div>
              <div>✅ Good lighting</div>
              <div>✅ Modern browser (Chrome/Edge/Firefox)</div>
            </div>
          </div>
          <div>
            <span className="font-bold text-green-400">For Voice Control:</span>
            <div className="ml-3 mt-1 space-y-1">
              <div>✅ Microphone access</div>
              <div>✅ Quiet environment</div>
              <div>✅ Chrome or Edge browser (best support)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameZone;