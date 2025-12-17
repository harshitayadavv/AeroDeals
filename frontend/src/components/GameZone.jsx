import { useState } from 'react';
import VoiceGame from './VoiceGame';

function GameZone() {
  const [gameType, setGameType] = useState(null); // null, 'gesture', 'voice'
  const [selectedGame, setSelectedGame] = useState(null); // 'airplane', etc.

  // Reset to main menu
  const handleBack = () => {
    setGameType(null);
    setSelectedGame(null);
  };

  // Game type selection screen
  if (!gameType) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🎮 Game Zone</h1>
          <p className="text-gray-400">Choose your gaming experience</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Gesture Controlled Games */}
          <div
            onClick={() => setGameType('gesture')}
            className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 rounded-2xl shadow-2xl cursor-pointer transform hover:scale-105 transition-all"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">👋</div>
              <h2 className="text-2xl font-bold mb-2">Gesture Controlled</h2>
              <p className="text-gray-200 mb-4">
                Play games using hand gestures detected by your camera
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Computer Vision</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">MediaPipe</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Real-time</span>
              </div>
              <div className="mt-4 text-yellow-400 text-sm">Coming Soon!</div>
            </div>
          </div>

          {/* Voice Controlled Games */}
          <div
            onClick={() => setGameType('voice')}
            className="bg-gradient-to-br from-green-600 to-teal-600 p-8 rounded-2xl shadow-2xl cursor-pointer transform hover:scale-105 transition-all"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🎤</div>
              <h2 className="text-2xl font-bold mb-2">Voice Controlled</h2>
              <p className="text-gray-200 mb-4">
                Control games with your voice using speech recognition
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Speech AI</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Voice Commands</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">WebSocket</span>
              </div>
              <div className="mt-4 bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                ✅ Available Now!
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-bold mb-3">🎯 Available Games</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <span>✈️</span>
                <span>Airplane Obstacle Game</span>
              </h4>
              <p className="text-sm text-gray-300 mb-2">
                Navigate your plane through obstacles using voice commands
              </p>
              <div className="flex gap-2">
                <span className="bg-green-600 px-2 py-1 rounded text-xs">Voice ✓</span>
                <span className="bg-gray-600 px-2 py-1 rounded text-xs">Gesture (Soon)</span>
              </div>
            </div>
            <div className="bg-gray-700/30 p-4 rounded-lg opacity-60">
              <h4 className="font-bold mb-2 flex items-center gap-2">
                <span>🎯</span>
                <span>More Games Coming</span>
              </h4>
              <p className="text-sm text-gray-300">
                Snake, Pong, and more exciting games!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Voice game selected
  if (gameType === 'voice') {
    return <VoiceGame onBack={handleBack} />;
  }

  // Gesture game selected (coming soon)
  if (gameType === 'gesture') {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-all"
        >
          <span>←</span>
          <span>Back to Game Zone</span>
        </button>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">👋</div>
            <h1 className="text-3xl font-bold mb-2">Gesture Controlled Games</h1>
            <p className="text-gray-400">Use your webcam to control games with hand gestures</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-12 text-center border-2 border-dashed border-gray-600">
            <p className="text-2xl text-gray-500 mb-4">🚧</p>
            <p className="text-xl text-gray-400 mb-2">Coming Soon!</p>
            <p className="text-gray-500">
              Gesture controlled games are currently in development
            </p>
          </div>

          <div className="mt-6 bg-purple-900/30 border border-purple-700 rounded-lg p-4">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <span>📋</span>
              <span>Planned Features:</span>
            </h3>
            <ul className="text-sm text-gray-300 space-y-1 ml-6 list-disc">
              <li>Hand gesture detection using MediaPipe</li>
              <li>Real-time webcam processing</li>
              <li>Multiple gesture controls (open hand, fist, fingers)</li>
              <li>Same airplane game with gesture controls</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default GameZone;