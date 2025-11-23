// Popular airports/cities database
export const airports = [
  // India
  { code: "DEL", city: "Delhi", country: "India", name: "Indira Gandhi International" },
  { code: "BOM", city: "Mumbai", country: "India", name: "Chhatrapati Shivaji International" },
  { code: "BLR", city: "Bangalore", country: "India", name: "Kempegowda International" },
  { code: "MAA", city: "Chennai", country: "India", name: "Chennai International" },
  { code: "HYD", city: "Hyderabad", country: "India", name: "Rajiv Gandhi International" },
  { code: "CCU", city: "Kolkata", country: "India", name: "Netaji Subhas Chandra Bose International" },
  { code: "GOI", city: "Goa", country: "India", name: "Goa International" },
  { code: "PNQ", city: "Pune", country: "India", name: "Pune Airport" },
  { code: "AMD", city: "Ahmedabad", country: "India", name: "Sardar Vallabhbhai Patel International" },
  { code: "JAI", city: "Jaipur", country: "India", name: "Jaipur International" },
  { code: "COK", city: "Kochi", country: "India", name: "Cochin International" },
  { code: "IXC", city: "Chandigarh", country: "India", name: "Chandigarh International" },
  { code: "TRV", city: "Trivandrum", country: "India", name: "Trivandrum International" },
  { code: "LKO", city: "Lucknow", country: "India", name: "Chaudhary Charan Singh International" },
  { code: "VNS", city: "Varanasi", country: "India", name: "Lal Bahadur Shastri International" },
  
  // USA
  { code: "JFK", city: "New York", country: "USA", name: "John F. Kennedy International" },
  { code: "LAX", city: "Los Angeles", country: "USA", name: "Los Angeles International" },
  { code: "ORD", city: "Chicago", country: "USA", name: "O'Hare International" },
  { code: "MIA", city: "Miami", country: "USA", name: "Miami International" },
  { code: "SFO", city: "San Francisco", country: "USA", name: "San Francisco International" },
  { code: "LAS", city: "Las Vegas", country: "USA", name: "Harry Reid International" },
  { code: "SEA", city: "Seattle", country: "USA", name: "Seattle-Tacoma International" },
  { code: "BOS", city: "Boston", country: "USA", name: "Logan International" },
  { code: "ATL", city: "Atlanta", country: "USA", name: "Hartsfield-Jackson Atlanta International" },
  { code: "DFW", city: "Dallas", country: "USA", name: "Dallas/Fort Worth International" },
  
  // Europe
  { code: "LHR", city: "London", country: "UK", name: "Heathrow" },
  { code: "CDG", city: "Paris", country: "France", name: "Charles de Gaulle" },
  { code: "FRA", city: "Frankfurt", country: "Germany", name: "Frankfurt Airport" },
  { code: "AMS", city: "Amsterdam", country: "Netherlands", name: "Schiphol" },
  { code: "MAD", city: "Madrid", country: "Spain", name: "Adolfo Suárez Madrid-Barajas" },
  { code: "FCO", city: "Rome", country: "Italy", name: "Leonardo da Vinci-Fiumicino" },
  { code: "IST", city: "Istanbul", country: "Turkey", name: "Istanbul Airport" },
  
  // Asia-Pacific
  { code: "DXB", city: "Dubai", country: "UAE", name: "Dubai International" },
  { code: "SIN", city: "Singapore", country: "Singapore", name: "Changi Airport" },
  { code: "HKG", city: "Hong Kong", country: "Hong Kong", name: "Hong Kong International" },
  { code: "NRT", city: "Tokyo", country: "Japan", name: "Narita International" },
  { code: "ICN", city: "Seoul", country: "South Korea", name: "Incheon International" },
  { code: "BKK", city: "Bangkok", country: "Thailand", name: "Suvarnabhumi Airport" },
  { code: "KUL", city: "Kuala Lumpur", country: "Malaysia", name: "Kuala Lumpur International" },
  { code: "SYD", city: "Sydney", country: "Australia", name: "Sydney Kingsford Smith" },
];

// Search function - matches city name or airport code
export const searchAirports = (query) => {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase();
  
  return airports.filter(airport => 
    airport.city.toLowerCase().includes(searchTerm) ||
    airport.code.toLowerCase().includes(searchTerm) ||
    airport.country.toLowerCase().includes(searchTerm)
  ).slice(0, 8); // Limit to 8 results
};

// Get airport by code
export const getAirportByCode = (code) => {
  return airports.find(airport => airport.code === code.toUpperCase());
};