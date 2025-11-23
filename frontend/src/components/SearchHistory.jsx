import { useState, useEffect } from "react";
import SearchCard from "./SearchCard";

const API_URL = "http://127.0.0.1:8000";

function SearchHistory({ onViewDetails }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/history`);
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setHistory(data.history);
    } catch (err) {
      setError("Failed to load history");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (searchId) => {
    try {
      const response = await fetch(`${API_URL}/save/${searchId}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to save search");
      
      alert("✅ Search saved successfully!");
      fetchHistory(); // Refresh to remove from history
    } catch (err) {
      alert("❌ Failed to save search");
      console.error(err);
    }
  };

  const handleDelete = async (searchId) => {
    if (!confirm("Delete this search from history?")) return;
    
    try {
      const response = await fetch(`${API_URL}/history/${searchId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      
      setHistory(history.filter((s) => s.id !== searchId));
    } catch (err) {
      alert("❌ Failed to delete search");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-400">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        <p className="text-4xl mb-4">❌</p>
        <p>{error}</p>
        <button
          onClick={fetchHistory}
          className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-4">📭</p>
        <p className="text-xl">No search history yet</p>
        <p className="text-sm mt-2">Your recent searches will appear here (kept for 7 days)</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Recent Searches</h2>
        <p className="text-sm text-gray-400">{history.length} searches</p>
      </div>

      <div className="grid gap-4">
        {history.map((search) => (
          <SearchCard
            key={search.id}
            search={search}
            onSave={handleSave}
            onDelete={handleDelete}
            onViewDetails={onViewDetails}
            showInHistory={true}
          />
        ))}
      </div>
    </div>
  );
}

export default SearchHistory;