import { useState, useEffect } from "react";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from "./components/Navbar";
import GameZone from "./components/GameZone";
import Profile from "./components/Profile";
import Login from "./components/Login";
import Signup from "./components/Signup";
import { isAuthenticated, getCurrentUser, logout } from "./utils/auth";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSection, setActiveSection] = useState("gamezone");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated()) {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setIsLoggedIn(true);
        }
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleSignupSuccess = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {showLogin ? (
          <Login
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignup={() => setShowLogin(false)}
          />
        ) : (
          <Signup
            onSignupSuccess={handleSignupSuccess}
            onSwitchToLogin={() => setShowLogin(true)}
          />
        )}
      </GoogleOAuthProvider>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="p-6">
        {(activeSection === "home" || activeSection === "gamezone") && (
          <GameZone />
        )}

        {activeSection === "profile" && (
          <Profile currentUser={currentUser} />
        )}
      </div>
    </div>
  );
}

export default App;
