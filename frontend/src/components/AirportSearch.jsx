import { useState, useEffect, useRef } from "react";
import { searchAirports, getAirportByCode } from "../data/airports";

function AirportSearch({ label, value, onChange, placeholder }) {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // Initialize input with city name if code exists
  useEffect(() => {
    if (value) {
      const airport = getAirportByCode(value);
      if (airport) {
        setInputValue(`${airport.city} (${airport.code})`);
      }
    }
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const query = e.target.value;
    setInputValue(query);
    
    if (query.length >= 2) {
      const results = searchAirports(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectAirport = (airport) => {
    setInputValue(`${airport.city} (${airport.code})`);
    onChange(airport.code);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block mb-1 text-sm font-semibold">{label}</label>
      <input
        type="text"
        className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
        placeholder={placeholder}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {suggestions.map((airport) => (
            <button
              key={airport.code}
              onClick={() => handleSelectAirport(airport)}
              className="w-full text-left px-4 py-3 hover:bg-gray-600 transition-colors border-b border-gray-600 last:border-b-0"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">{airport.city}</p>
                  <p className="text-xs text-gray-400">{airport.name}</p>
                </div>
                <span className="text-blue-400 font-bold text-sm">{airport.code}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{airport.country}</p>
            </button>
          ))}
        </div>
      )}
      
      {showSuggestions && suggestions.length === 0 && inputValue.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl p-4 text-center text-gray-400">
          No airports found. Try searching by city name or code.
        </div>
      )}
    </div>
  );
}

export default AirportSearch;