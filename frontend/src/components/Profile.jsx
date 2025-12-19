import { useState, useEffect } from 'react';

function Profile({ currentUser }) {
  const [gameStats, setGameStats] = useState(null);
  const [flightStats, setFlightStats] = useState({
    totalSearches: 0,
    savedSearches: 0,
  });
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [isLoadingFlight, setIsLoadingFlight] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load stats on mount and when refreshKey changes
  useEffect(() => {
    loadGameStats();
    loadFlightStats();
  }, [refreshKey]);

  // Auto-refresh stats every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing profile stats...');
      loadGameStats();
      loadFlightStats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadGameStats = async () => {
    try {
      setIsLoadingGame(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('⚠️ No token found');
        setIsLoadingGame(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/games/stats`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Game stats loaded:', data);
        
        if (data.stats) {
          setGameStats(data.stats);
        } else {
          setGameStats({});
        }
      }
    } catch (err) {
      console.error('❌ Error loading game stats:', err);
    } finally {
      setIsLoadingGame(false);
    }
  };

  const loadFlightStats = async () => {
    try {
      setIsLoadingFlight(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const [historyRes, savedRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/history`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        }),
        fetch(`${import.meta.env.VITE_API_URL}/saved`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        })
      ]);

      if (historyRes.ok && savedRes.ok) {
        const historyData = await historyRes.json();
        const savedData = await savedRes.json();
        
        setFlightStats({
          totalSearches: historyData.count || 0,
          savedSearches: savedData.count || 0,
        });
      }
    } catch (err) {
      console.error('Error loading flight stats:', err);
    } finally {
      setIsLoadingFlight(false);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    setRefreshKey(prev => prev + 1);
  };

  const voiceStats = gameStats?.voice || { high_score: 0, total_games: 0, average_score: 0 };
  const gestureStats = gameStats?.gesture || { high_score: 0, total_games: 0, average_score: 0 };
  
  const totalGames = voiceStats.total_games + gestureStats.total_games;
  const highestScore = Math.max(voiceStats.high_score, gestureStats.high_score);

  const badges = [
    { 
      id: 1, 
      name: 'First Flight', 
      icon: '✈️', 
      description: 'Completed first flight search', 
      unlocked: flightStats.totalSearches > 0,
      category: 'flight'
    },
    { 
      id: 2, 
      name: 'Sky Racer', 
      icon: '🎮', 
      description: 'Played Sky Racer', 
      unlocked: totalGames > 0,
      category: 'game'
    },
    { 
      id: 3, 
      name: 'Voice Master', 
      icon: '🎤', 
      description: 'Won 5 voice games', 
      unlocked: voiceStats.total_games >= 5,
      category: 'voice'
    },
    { 
      id: 4, 
      name: 'Gesture Pro', 
      icon: '✋', 
      description: 'Won 5 gesture games', 
      unlocked: gestureStats.total_games >= 5,
      category: 'gesture'
    },
    { 
      id: 5, 
      name: 'High Scorer', 
      icon: '🏆', 
      description: 'Reached 100 points', 
      unlocked: highestScore >= 100,
      category: 'game'
    },
    { 
      id: 6, 
      name: 'Pro Pilot', 
      icon: '⭐', 
      description: 'Reached 500 points', 
      unlocked: highestScore >= 500,
      category: 'game'
    },
    { 
      id: 7, 
      name: 'Voice Legend', 
      icon: '👑', 
      description: 'Voice: 1000 points', 
      unlocked: voiceStats.high_score >= 1000,
      category: 'voice'
    },
    { 
      id: 8, 
      name: 'Gesture Legend', 
      icon: '💎', 
      description: 'Gesture: 1000 points', 
      unlocked: gestureStats.high_score >= 1000,
      category: 'gesture'
    },
  ];

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
            <div className="flex gap-4 text-sm flex-wrap">
              <span className="bg-white/20 px-3 py-1 rounded-full">
                Member since {new Date(currentUser?.created_at).toLocaleDateString()}
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full">
                🏆 {badges.filter(b => b.unlocked).length}/{badges.length} Badges
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full">
                🎮 {totalGames} Games Played
              </span>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
            title="Refresh stats"
          >
            <span className={isLoadingGame ? 'animate-spin' : ''}>🔄</span>
            <span className="hidden md:inline">Refresh</span>
          </button>
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
                    ? badge.category === 'voice' 
                      ? 'bg-gradient-to-br from-green-600 to-teal-600 shadow-lg'
                      : badge.category === 'gesture'
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg'
                      : 'bg-gradient-to-br from-yellow-600 to-orange-600 shadow-lg'
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

        {/* Voice Game Stats */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>🎤</span>
            <span>Voice Control Stats</span>
          </h2>
          
          {isLoadingGame ? (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-spin text-4xl mb-2">⏳</div>
              <p>Loading stats...</p>
            </div>
          ) : voiceStats.total_games === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎤</div>
              <p className="text-gray-400 mb-2">No voice games yet</p>
              <p className="text-sm text-gray-500">Try Voice Control mode!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-green-600 to-teal-600 rounded-lg p-6 text-center">
                <div className="text-5xl font-bold mb-2">{voiceStats.high_score}</div>
                <div className="text-sm text-white/90">🏆 High Score</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {voiceStats.total_games}
                  </div>
                  <div className="text-xs text-gray-400">Total Games</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-teal-400 mb-1">
                    {Math.round(voiceStats.average_score) || 0}
                  </div>
                  <div className="text-xs text-gray-400">Average Score</div>
                </div>
              </div>

              {voiceStats.last_played && (
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400">Last Played</div>
                  <div className="text-sm text-gray-300 font-semibold">
                    {new Date(voiceStats.last_played).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gesture Game Stats */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>✋</span>
            <span>Gesture Control Stats</span>
          </h2>
          
          {isLoadingGame ? (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-spin text-4xl mb-2">⏳</div>
              <p>Loading stats...</p>
            </div>
          ) : gestureStats.total_games === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✋</div>
              <p className="text-gray-400 mb-2">No gesture games yet</p>
              <p className="text-sm text-gray-500">Try Gesture Control mode!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg p-6 text-center">
                <div className="text-5xl font-bold mb-2">{gestureStats.high_score}</div>
                <div className="text-sm text-white/90">🏆 High Score</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-1">
                    {gestureStats.total_games}
                  </div>
                  <div className="text-xs text-gray-400">Total Games</div>
                </div>
                <div className="bg-gray-700 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-pink-400 mb-1">
                    {Math.round(gestureStats.average_score) || 0}
                  </div>
                  <div className="text-xs text-gray-400">Average Score</div>
                </div>
              </div>

              {gestureStats.last_played && (
                <div className="bg-gray-700 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400">Last Played</div>
                  <div className="text-sm text-gray-300 font-semibold">
                    {new Date(gestureStats.last_played).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Combined Progress */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Overall Progress</span>
          </h2>
          
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Voice Legend Progress</span>
                <span className="text-green-400 font-bold">
                  {Math.min(100, Math.round((voiceStats.high_score / 1000) * 100))}%
                </span>
              </div>
              <div className="bg-gray-600 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (voiceStats.high_score / 1000) * 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-400 mt-1 text-center">
                {voiceStats.high_score < 1000 
                  ? `${1000 - voiceStats.high_score} points to Voice Legend! 👑` 
                  : 'Voice Legend achieved! 👑'}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Gesture Legend Progress</span>
                <span className="text-purple-400 font-bold">
                  {Math.min(100, Math.round((gestureStats.high_score / 1000) * 100))}%
                </span>
              </div>
              <div className="bg-gray-600 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (gestureStats.high_score / 1000) * 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-400 mt-1 text-center">
                {gestureStats.high_score < 1000 
                  ? `${1000 - gestureStats.high_score} points to Gesture Legend! 💎` 
                  : 'Gesture Legend achieved! 💎'}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold mb-1">{highestScore}</div>
              <div className="text-sm text-white/90">Highest Score Overall</div>
            </div>
          </div>
        </div>

        {/* Flight Search Stats */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl md:col-span-2">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span>🔍</span>
            <span>Flight Search Activity</span>
          </h2>
          
          {isLoadingFlight ? (
            <div className="text-center py-8 text-gray-400">
              <div className="animate-spin text-4xl mb-2">⏳</div>
              <p>Loading flight stats...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-center">
                <p className="text-4xl font-bold mb-2">{flightStats.totalSearches}</p>
                <p className="text-blue-100">Recent Searches</p>
                <p className="text-xs text-blue-200 mt-1">(Last 7 days)</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 text-center">
                <p className="text-4xl font-bold mb-2">{flightStats.savedSearches}</p>
                <p className="text-purple-100">Saved Searches</p>
                <p className="text-xs text-purple-200 mt-1">(Permanent)</p>
              </div>
            </div>
          )}
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