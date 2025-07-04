import { useState } from "react";

function App() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async () => {
    setErrorMsg(""); // Clear previous errors
    
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
      const response = await fetch(
        `http://127.0.0.1:8000/search?origin=${origin}&destination=${destination}&start_date=${startDate}&end_date=${endDate}`
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-1">✈️ AeroDeals</h1>
      <p className="text-center text-gray-400 mb-6 italic">
        Find the best flights between your chosen dates
      </p>

      <div className="max-w-xl mx-auto space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Origin</label>
            <input
              type="text"
              className="w-full p-2 rounded bg-gray-800 text-white"
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              placeholder="e.g., DEL"
            />
          </div>

          <div>
            <label className="block mb-1">Destination</label>
            <input
              type="text"
              className="w-full p-2 rounded bg-gray-800 text-white"
              value={destination}
              onChange={(e) => setDestination(e.target.value.toUpperCase())}
              placeholder="e.g., BOM"
            />
          </div>

          <div>
            <label className="block mb-1">Start Date</label>
            <input
              type="date"
              className="w-full p-2 rounded bg-gray-800 text-white"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1">End Date</label>
            <input
              type="date"
              className="w-full p-2 rounded bg-gray-800 text-white"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {errorMsg && (
          <p className="text-red-500 font-semibold text-center">{errorMsg}</p>
        )}

        <button
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-white font-semibold"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? "Searching..." : "Find Flights"}
        </button>

        {results && !errorMsg && (
          <div className="bg-gray-800 p-4 rounded mt-6">
            <h2 className="text-xl font-bold mb-2">Best Deals</h2>
            <p>
              <strong>Lowest Price:</strong> ${results.analysis.min_price}
            </p>
            <p>
              <strong>Average Price:</strong> ${results.analysis.avg_price.toFixed(2)}
            </p>
            <p>
              <strong>Total Flights:</strong> {results.analysis.total_flights}
            </p>

            <h3 className="text-lg font-semibold mt-4">Flights:</h3>
            <ul className="mt-2 space-y-2 max-h-96 overflow-y-auto">
              {results.flights.map((flight, idx) => (
                <li key={idx} className="bg-gray-700 p-3 rounded">
                  <p>
                    <strong>{flight.airline}</strong> - {flight.date}
                  </p>
                  <p>
                    {flight.departure} → {flight.arrival} | {flight.duration} | {flight.price}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
