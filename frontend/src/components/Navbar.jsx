import { useState } from 'react';

function Navbar({ activeSection, setActiveSection, currentUser, onLogout }) {
  const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);

  // Get profile picture - check both possible field names
  const getProfilePicture = () => {
    if (!currentUser) return null;
    return currentUser.profile_picture || currentUser.picture || null;
  };

  // Get user's first name
  const getUserDisplayName = () => {
    if (!currentUser) return "User";
    const fullName = currentUser.full_name || currentUser.name || currentUser.email;
    return fullName.split(' ')[0];
  };

  const profilePicture = getProfilePicture();

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'gamezone', label: 'Game Zone', icon: '🎮', hasDropdown: true },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="bg-gray-800 border-b-2 border-blue-500 shadow-lg mb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="text-3xl">✈️</span>
              <span className="text-xl font-bold text-white">AeroDeals</span>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <div key={item.id} className="relative">
                  {item.hasDropdown ? (
                    // Game Zone with Dropdown
                    <div
                      className="relative"
                      onMouseEnter={() => setIsGameDropdownOpen(true)}
                      onMouseLeave={() => setIsGameDropdownOpen(false)}
                    >
                      <button
                        onClick={() => setActiveSection('gamezone')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                          activeSection === 'gamezone'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                        <span className="text-xs">▼</span>
                      </button>

                      {/* Dropdown Menu */}
                      {isGameDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-56 bg-gray-700 rounded-lg shadow-xl py-2 z-50 border border-gray-600">
                          <button
                            onClick={() => {
                              setActiveSection('gamezone-gesture');
                              setIsGameDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-600 hover:text-white transition-all flex items-center gap-2"
                          >
                            <span>👋</span>
                            <span>Gesture Controlled Games</span>
                          </button>
                          <button
                            onClick={() => {
                              setActiveSection('gamezone-voice');
                              setIsGameDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-600 hover:text-white transition-all flex items-center gap-2"
                          >
                            <span>🎤</span>
                            <span>Voice Controlled Games</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular Nav Items
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        activeSection === item.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* User Section - Right Side */}
          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="hidden md:flex items-center gap-3">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-blue-500"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold border-2 border-blue-500">
                  {getUserDisplayName()[0].toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <p className="text-xs text-gray-400">Welcome back,</p>
                <p className="text-sm font-semibold text-white">{getUserDisplayName()}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold text-white transition-all flex items-center gap-2"
            >
              <span>🚪</span>
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <div key={item.id}>
                {item.hasDropdown ? (
                  <div>
                    <button
                      onClick={() => setIsGameDropdownOpen(!isGameDropdownOpen)}
                      className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-between ${
                        activeSection.startsWith('gamezone')
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </span>
                      <span className="text-xs">{isGameDropdownOpen ? '▲' : '▼'}</span>
                    </button>
                    {isGameDropdownOpen && (
                      <div className="ml-4 mt-2 space-y-2">
                        <button
                          onClick={() => {
                            setActiveSection('gamezone-gesture');
                            setIsGameDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                        >
                          <span>👋</span>
                          <span>Gesture Controlled</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveSection('gamezone-voice');
                            setIsGameDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 flex items-center gap-2"
                        >
                          <span>🎤</span>
                          <span>Voice Controlled</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                      activeSection === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;