import { useState, useEffect } from "react";
import SearchCard from "./SearchCard";

const API_URL = "http://127.0.0.1:8000";

function SavedSearches({ onViewDetails }) {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/saved`);
      if (!response.ok) throw new Error("Failed to fetch saved searches");
      const data = await response.json();
      setSaved(data.saved);
    } catch (err) {
      setError("Failed to load saved searches");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (searchId) => {
    if (!confirm("Remove this search from saved?")) return;
    
    try {
      const response = await fetch(`${API_URL}/saved/${searchId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      
      setSaved(saved.filter((s) => s.id !== searchId));
    } catch (err) {
      alert("❌ Failed to remove search");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-400">Loading saved searches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        <p className="text-4xl mb-4">❌</p>
        <p>{error}</p>
        <button
          onClick={fetchSaved}
          className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (saved.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-4">⭐</p>
        <p className="text-xl">No saved searches yet</p>
        <p className="text-sm mt-2">Save your favorite searches to access them anytime</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Saved Searches</h2>
        <p className="text-sm text-gray-400">{saved.length} saved</p>
      </div>

      <div className="grid gap-4">
        {saved.map((search) => (
          <SearchCard
            key={search.id}
            search={search}
            onDelete={handleDelete}
            onViewDetails={onViewDetails}
            isSaved={true}
          />
        ))}
      </div>
    </div>
  );
}

export default SavedSearches;