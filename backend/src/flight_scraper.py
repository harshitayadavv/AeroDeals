import pandas as pd
from datetime import datetime, timedelta

class FlightScraper:
    def __init__(self):
        pass

    def search_flights(self, origin, destination, date):
        """Simulated flight data for development"""
        flights = [
            {'airline': 'IndiGo', 'departure': '08:00', 'arrival': '11:00', 'price': '$199', 'duration': '3h'},
            {'airline': 'Air India', 'departure': '14:00', 'arrival': '17:00', 'price': '$250', 'duration': '3h'},
            {'airline': 'SpiceJet', 'departure': '19:00', 'arrival': '22:30', 'price': '$175', 'duration': '3.5h'}
        ]
        df = pd.DataFrame(flights)
        df['date'] = date
        return df

    def find_best_deals(self, origin, destination, start_date, end_date):
        current = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')
        all_flights = []

        while current <= end:
            date_str = current.strftime('%Y-%m-%d')
            flights = self.search_flights(origin, destination, date_str)
            if not flights.empty:
                all_flights.append(flights)
            current += timedelta(days=1)

        if all_flights:
            combined_flights = pd.concat(all_flights)
            combined_flights['price_num'] = combined_flights['price'].str.replace('$', '').astype(float)
            return combined_flights.sort_values('price_num')
        return pd.DataFrame()
