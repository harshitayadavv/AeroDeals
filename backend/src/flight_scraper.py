"""
Real Flight Data using Aviationstack API
"""

import requests
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)


class FlightScraper:
    def __init__(self):
        self.api_key = os.getenv("AVIATIONSTACK_API_KEY")
        self.base_url = "http://api.aviationstack.com/v1/flights"
        
        if not self.api_key:
            logger.error("❌ AVIATIONSTACK_API_KEY not found in .env!")
    
    def search_flights(self, origin, destination, date):
        """Search real flights using Aviationstack API"""
        try:
            logger.info(f"🔍 Searching: {origin} → {destination} on {date}")
            
            params = {
                'access_key': self.api_key,
                'dep_iata': origin,
                'arr_iata': destination,
                'flight_date': date,
                'limit': 50
            }
            
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'error' in data:
                logger.error(f"❌ API Error: {data['error']}")
                return self._get_fallback_data(origin, destination, date)
            
            flights = []
            for flight in data.get('data', []):
                # Extract flight info
                departure_info = flight.get('departure', {})
                arrival_info = flight.get('arrival', {})
                airline_info = flight.get('airline', {})
                flight_info = flight.get('flight', {})
                
                # Get times
                dep_time = departure_info.get('scheduled', '')
                arr_time = arrival_info.get('scheduled', '')
                
                # Format times
                if dep_time:
                    try:
                        dep_dt = datetime.fromisoformat(dep_time.replace('Z', '+00:00'))
                        dep_formatted = dep_dt.strftime('%H:%M')
                    except:
                        dep_formatted = 'N/A'
                else:
                    dep_formatted = 'N/A'
                
                if arr_time:
                    try:
                        arr_dt = datetime.fromisoformat(arr_time.replace('Z', '+00:00'))
                        arr_formatted = arr_dt.strftime('%H:%M')
                        
                        # Calculate duration
                        if dep_time:
                            duration = arr_dt - dep_dt
                            hours = duration.seconds // 3600
                            minutes = (duration.seconds % 3600) // 60
                            duration_str = f"{hours}h {minutes}m"
                        else:
                            duration_str = 'N/A'
                    except:
                        arr_formatted = 'N/A'
                        duration_str = 'N/A'
                else:
                    arr_formatted = 'N/A'
                    duration_str = 'N/A'
                
                # Aviationstack doesn't provide prices, so use estimated range
                # In production, you'd need a different API for pricing
                estimated_price = f"${150 + (len(flights) * 25)}"
                
                flights.append({
                    'airline': airline_info.get('name', 'Unknown'),
                    'flight_number': flight_info.get('iata', 'N/A'),
                    'departure': dep_formatted,
                    'arrival': arr_formatted,
                    'price': estimated_price,
                    'duration': duration_str,
                    'status': flight.get('flight_status', 'scheduled'),
                    'date': date
                })
            
            logger.info(f"✅ Found {len(flights)} flights")
            
            if not flights:
                logger.warning("⚠️ No flights found, using fallback data")
                return self._get_fallback_data(origin, destination, date)
            
            return flights
            
        except requests.exceptions.Timeout:
            logger.error("⏱️ Request timeout")
            return self._get_fallback_data(origin, destination, date)
        except Exception as e:
            logger.error(f"❌ Error: {e}")
            return self._get_fallback_data(origin, destination, date)
    
    def find_best_deals(self, origin, destination, start_date, end_date):
        """Search flights across date range"""
        try:
            current = datetime.strptime(start_date, '%Y-%m-%d')
            end = datetime.strptime(end_date, '%Y-%m-%d')
            all_flights = []
            
            logger.info(f"📅 Searching from {start_date} to {end_date}")
            
            while current <= end:
                date_str = current.strftime('%Y-%m-%d')
                flights = self.search_flights(origin, destination, date_str)
                all_flights.extend(flights)
                current += timedelta(days=1)
            
            logger.info(f"🎯 Total: {len(all_flights)} flights")
            return all_flights
            
        except Exception as e:
            logger.error(f"❌ Error in find_best_deals: {e}")
            return self._get_fallback_data(origin, destination, start_date)
    
    def _get_fallback_data(self, origin, destination, date):
        """Fallback data when API fails"""
        logger.warning("⚠️ Using fallback data")
        
        # Generate realistic fallback data
        airlines = ['IndiGo', 'Air India', 'SpiceJet', 'Vistara', 'Go First']
        base_price = 150
        
        flights = []
        for i in range(5):
            dep_hour = 6 + (i * 3)
            arr_hour = dep_hour + 2
            
            flights.append({
                'airline': airlines[i % len(airlines)],
                'flight_number': f'{airlines[i % len(airlines)][:2].upper()}{100 + i}',
                'departure': f'{dep_hour:02d}:00',
                'arrival': f'{arr_hour:02d}:30',
                'price': f'${base_price + (i * 30)}',
                'duration': '2h 30m',
                'status': 'scheduled',
                'date': date,
                'note': '⚠️ Simulated data (API unavailable)'
            })
        
        return flights


# Test
if __name__ == "__main__":
    scraper = FlightScraper()
    flights = scraper.search_flights("DEL", "BOM", "2025-12-25")
    
    print(f"\n✈️ Found {len(flights)} flights:\n")
    for flight in flights[:3]:
        print(f"  {flight['airline']} {flight.get('flight_number', '')}")
        print(f"  {flight['departure']} → {flight['arrival']}")
        print(f"  Price: {flight['price']}, Duration: {flight['duration']}")
        print()