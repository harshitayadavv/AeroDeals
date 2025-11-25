import { useState, useEffect } from "react";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Tabs from "./components/Tabs";
import SearchHistory from "./components/SearchHistory";
import SavedSearches from "./components/SavedSearches";
import FlightDetails from "./components/FlightDetails";
import AirportSearch from "./components/AirportSearch";
import Login from "./components/Login";
import Signup from "./components/Signup";
import { isAuthenticated, getCurrentUser, logout, fetchWithAuth } from "./utils/auth";

const API_URL = "http://127.0.0.1:8000";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("search");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedSearchId, setSelectedSearchId] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check authentication on mount
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

  const handleSearch = async () => {
    setErrorMsg("");
    setResults(null);

    if (!origin || !destination || !startDate || !endDate) {
      setErrorMsg("Please fill in all fields");
      return;
    }

    if (endDate < startDate) {
      setErrorMsg("End date cannot be earlier than start date");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth(
        `${API_URL}/search?origin=${origin}&destination=${destination}&start_date=${startDate}&end_date=${endDate}`
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching flights:", error);
      setErrorMsg("Failed to fetch flights. Please try again later.");
    }
    setLoading(false);
  };

  const handleSaveCurrentSearch = async () => {
    if (!results || !results.search_id) {
      alert("No search to save");
      return;
    }

    try {
      const response = await fetchWithAuth(`${API_URL}/save/${results.search_id}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to save");
      
      alert("✅ Search saved successfully! Check the Saved tab.");
    } catch (err) {
      alert("❌ Failed to save search");
      console.error(err);
    }
  };

  const handleViewDetails = (searchId) => {
    setSelectedSearchId(searchId);
  };

  // Show loading while checking authentication
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

  // Show login/signup if not authenticated
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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header with User Info */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">✈️ AeroDeals</h1>
            <p className="text-gray-400 italic">Find the best flights between your chosen dates</p>
          </div>
          <div className="flex items-center gap-4">
            {currentUser?.profile_picture && (
              <img
                src={currentUser.profile_picture}
                alt="Profile"
                className="w-10 h-10 rounded-full"
              />
            )}
            <div className="text-right">
              <p className="text-sm text-gray-400">Welcome back,</p>
              <p className="font-semibold">{currentUser?.full_name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Search Tab */}
        {activeTab === "search" && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
              <h2 className="text-2xl font-bold mb-4">Search Flights</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <AirportSearch
                  label="Origin"
                  value={origin}
                  onChange={setOrigin}
                  placeholder="e.g., Delhi, DEL, Mumbai..."
                />

                <AirportSearch
                  label="Destination"
                  value={destination}
                  onChange={setDestination}
                  placeholder="e.g., Mumbai, BOM, Goa..."
                />

                <div>
                  <label className="block mb-1 text-sm font-semibold">Start Date</label>
                  <input
                    type="date"
                    className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-semibold">End Date</label>
                  <input
                    type="date"
                    className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-red-500 font-semibold text-center mt-4">{errorMsg}</p>
              )}

              <button
                className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded text-white font-semibold mt-6 transition-all"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? "🔍 Searching..." : "🔍 Find Flights"}
              </button>
            </div>

            {/* Search Results */}
            {results && !errorMsg && (
              <div className="bg-gray-800 p-6 rounded-lg mt-6 shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">Best Deals Found</h2>
                  <button
                    onClick={handleSaveCurrentSearch}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold"
                  >
                    ⭐ Save This Search
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-400">Lowest Price</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${results.analysis.min_price}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-400">Average Price</p>
                    <p className="text-2xl font-bold text-blue-400">
                      ${results.analysis.avg_price.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded">
                    <p className="text-sm text-gray-400">Total Flights</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {results.analysis.total_flights}
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-3">Top Flights:</h3>
                <ul className="space-y-3 max-h-96 overflow-y-auto">
                  {results.flights.slice(0, 10).map((flight, idx) => (
                    <li key={idx} className="bg-gray-700 p-4 rounded hover:bg-gray-600 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg">{flight.airline}</p>
                          <p className="text-sm text-gray-400 mt-1">📅 {flight.date}</p>
                          <p className="text-gray-300 mt-2">
                            🛫 {flight.departure} → 🛬 {flight.arrival} | ⏱️ {flight.duration}
                          </p>
                        </div>
                        <p className="text-xl font-bold text-green-400">{flight.price}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                {results.flights.length > 10 && (
                  <p className="text-center text-gray-400 mt-4 text-sm">
                    Showing top 10 of {results.flights.length} flights
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <SearchHistory onViewDetails={handleViewDetails} />
        )}

        {/* Saved Tab */}
        {activeTab === "saved" && (
          <SavedSearches onViewDetails={handleViewDetails} />
        )}
      </div>

      {/* Flight Details Modal */}
      {selectedSearchId && (
        <FlightDetails
          searchId={selectedSearchId}
          onClose={() => setSelectedSearchId(null)}
        />
      )}
    </div>
  );
}

export default App;