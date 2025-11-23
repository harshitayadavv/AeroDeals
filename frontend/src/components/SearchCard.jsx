import { useState } from "react";

function SearchCard({ search, onSave, onDelete, onViewDetails, isSaved = false, showInHistory = false }) {
  const [showFlights, setShowFlights] = useState(false);

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-blue-400">
              {search.origin} → {search.destination}
            </h3>
            {search.is_saved && showInHistory && (
              <span className="bg-yellow-600 text-xs px-2 py-1 rounded font-semibold">
                ⭐ Saved
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {search.start_date} to {search.end_date}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(search.created_at).toLocaleDateString()} at{" "}
            {new Date(search.created_at).toLocaleTimeString()}
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-2xl font-bold text-green-400">${search.min_price}</p>
          <p className="text-xs text-gray-400">{search.total_flights} flights</p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onViewDetails(search.id)}
          className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm font-semibold"
        >
          📊 View Details
        </button>
        
        {showInHistory ? (
          // In History tab - show Save button or "Already Saved" indicator
          <>
            {!search.is_saved ? (
              <button
                onClick={() => onSave(search.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold"
              >
                ⭐ Save
              </button>
            ) : (
              <button
                disabled
                className="flex-1 bg-gray-600 px-4 py-2 rounded text-sm font-semibold cursor-not-allowed opacity-60"
              >
                ✅ Saved
              </button>
            )}
            <button
              onClick={() => onDelete(search.id)}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold"
            >
              🗑️
            </button>
          </>
        ) : (
          // In Saved tab - only show delete
          <button
            onClick={() => onDelete(search.id)}
            className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-semibold"
          >
            🗑️ Remove
          </button>
        )}
      </div>

      {showInHistory && search.expires_at && (
        <p className="text-xs text-yellow-500 mt-2">
          ⏰ Expires: {new Date(search.expires_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

export default SearchCard;