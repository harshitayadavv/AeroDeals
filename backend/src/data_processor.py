import pandas as pd
from datetime import datetime

class FlightDataProcessor:
    @staticmethod
    def clean_price(price_str):
        """Clean price string and convert to float"""
        return float(price_str.replace('$', '').replace(',', ''))
    
    @staticmethod
    def analyze_deals(flights_df):
        """Analyze flight deals and return insights"""
        if flights_df.empty:
            return None
            
        flights_df['price_num'] = flights_df['price'].apply(lambda x: FlightDataProcessor.clean_price(x))
        
        analysis = {
            'best_deal': flights_df.iloc[0].to_dict(),
            'avg_price': flights_df['price_num'].mean(),
            'min_price': flights_df['price_num'].min(),
            'max_price': flights_df['price_num'].max(),
            'total_flights': len(flights_df)
        }
        
        return analysis
    
    @staticmethod
    def export_to_csv(flights_df, filename):
        """Export flight data to CSV"""
        if not flights_df.empty:
            flights_df.to_csv(filename, index=False)
            return True
        return False