import { useState, useEffect } from "react";
import { fetchWithAuth } from "../utils/auth";

const API_URL = "http://127.0.0.1:8000";

function FlightDetails({ searchId, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDetails();
  }, [searchId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetchWithAuth(`${API_URL}/search/${searchId}`);
      if (!response.ok) throw new Error("Failed to fetch details");
      const data = await response.json();
      setDetails(data);
    } catch (err) {
      setError("Failed to load flight details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-400">Loading details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="text-center text-red-400">
            <p className="text-4xl mb-4">❌</p>
            <p>{error}</p>
            <div className="flex gap-2 justify-center mt-4">
              <button
                onClick={fetchDetails}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-bold text-blue-400">
              {details.origin} → {details.destination}
            </h2>
            <p className="text-gray-400 mt-1">
              {details.start_date} to {details.end_date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Analysis */}
        <div className="bg-gray-700 p-4 rounded-lg mb-6 grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-400">Lowest Price</p>
            <p className="text-2xl font-bold text-green-400">
              ${details.analysis.min_price}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Average Price</p>
            <p className="text-2xl font-bold text-blue-400">
              ${details.analysis.avg_price.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Flights</p>
            <p className="text-2xl font-bold text-purple-400">
              {details.analysis.total_flights}
            </p>
          </div>
        </div>

        {/* Flights List */}
        <div>
          <h3 className="text-xl font-semibold mb-4">All Flights</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {details.flights.map((flight, idx) => (
              <div key={idx} className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-bold text-lg text-blue-300">{flight.airline}</p>
                    <p className="text-sm text-gray-400 mt-1">📅 {flight.date}</p>
                    <p className="text-gray-300 mt-2">
                      🛫 {flight.departure} → 🛬 {flight.arrival}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">⏱️ {flight.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">{flight.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 py-3 rounded font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default FlightDetails;