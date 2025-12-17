function Profile({ currentUser }) {
  // Mock data - will be replaced with real data from backend
  const badges = [
    { id: 1, name: 'First Flight', icon: '✈️', description: 'Completed first flight search', unlocked: true },
    { id: 2, name: 'Deal Hunter', icon: '🎯', description: 'Found 10 great deals', unlocked: true },
    { id: 3, name: 'Game Master', icon: '🎮', description: 'Played 5 different games', unlocked: false },
    { id: 4, name: 'Voice Wizard', icon: '🎤', description: 'Won 3 voice-controlled games', unlocked: false },
    { id: 5, name: 'Gesture Pro', icon: '👋', description: 'Won 3 gesture-controlled games', unlocked: false },
    { id: 6, name: 'High Scorer', icon: '🏆', description: 'Reached 1000 points in any game', unlocked: false },
  ];

  const gameStats = [
    { game: 'Snake', highScore: 0, played: 0 },
    { game: 'Flappy Bird', highScore: 0, played: 0 },
    { game: 'Pong', highScore: 0, played: 0 },
    { game: 'Memory Game', highScore: 0, played: 0 },
  ];

  const flightStats = {
    totalSearches: 0,
    savedSearches: 0,
    bestDealFound: 'N/A',
  };

  const getProfilePicture = () => {
    return currentUser?.profile_picture || currentUser?.picture || null;
  };

  const getUserDisplayName = () => {
    const fullName = currentUser?.full_name || currentUser?.name || 'User';
    return fullName;
  };

  const profilePicture = getProfilePicture();

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-6 shadow-2xl">
        <div className="flex items-center gap-6">
          {profilePicture ? (
            <img
              src={profilePicture}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-4xl font-bold text-blue-600 border-4 border-white shadow-lg">
              {getUserDisplayName()[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-1">{getUserDisplayName()}</h1>
            <p className="text-blue-100 mb-2">{currentUser?.email}</p>
            <div className="flex gap-4 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">
                Member since {new Date(currentUser?.created_at).toLocaleDateString()}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full">
                🏆 {badges.filter(b => b.unlocked).length}/{badges.length} Badges
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Badges Section */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>🏅</span>
            <span>Badges & Achievements</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-lg text-center transition-all ${
                  badge.unlocked
                    ? 'bg-gradient-to-br from-yellow-600 to-orange-600 shadow-lg'
                    : 'bg-gray-700 opacity-50'
                }`}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <p className="font-bold text-sm">{badge.name}</p>
                <p className="text-xs text-gray-300 mt-1">{badge.description}</p>
                {badge.unlocked && (
                  <div className="mt-2 text-xs bg-white/20 rounded-full py-1">
                    ✓ Unlocked
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Game Stats Section */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>🎮</span>
            <span>Game Statistics</span>
          </h2>
          <div className="space-y-4">
            {gameStats.map((stat, idx) => (
              <div key={idx} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{stat.game}</span>
                  <span className="text-sm text-gray-400">{stat.played} plays</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">High Score:</span>
                  <span className="text-xl font-bold text-yellow-400">{stat.highScore}</span>
                </div>
                <div className="mt-2 bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${stat.highScore > 0 ? (stat.highScore / 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Play Count Summary */}
          <div className="mt-6 bg-blue-900/30 border border-blue-700 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Games Played:</span>
              <span className="text-2xl font-bold text-blue-400">
                {gameStats.reduce((sum, stat) => sum + stat.played, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Flight Search Stats */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl md:col-span-2">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>✈️</span>
            <span>Flight Search Activity</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-center">
              <p className="text-3xl font-bold mb-2">{flightStats.totalSearches}</p>
              <p className="text-blue-100">Total Searches</p>
            </div>
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-center">
              <p className="text-3xl font-bold mb-2">{flightStats.savedSearches}</p>
              <p className="text-purple-100">Saved Searches</p>
            </div>
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 text-center">
              <p className="text-2xl font-bold mb-2">{flightStats.bestDealFound}</p>
              <p className="text-green-100">Best Deal Found</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="mt-6 bg-gray-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span>⚙️</span>
          <span>Account Information</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-4 text-gray-300">
          <div>
            <p className="text-sm text-gray-400 mb-1">Email</p>
            <p className="font-semibold">{currentUser?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Full Name</p>
            <p className="font-semibold">{getUserDisplayName()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Account Type</p>
            <p className="font-semibold">
              {currentUser?.google_id ? '🔗 Google Account' : '📧 Email Account'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Member Since</p>
            <p className="font-semibold">
              {new Date(currentUser?.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;