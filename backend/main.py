from src.flight_scraper import FlightScraper
from src.data_processor import FlightDataProcessor
from src.utils import validate_date_format
import os
from dotenv import load_dotenv

def main():
    load_dotenv()  # Load environment variables if needed

    # Initialize the scraper
    scraper = FlightScraper()
    
    # Get flight search parameters
    origin = input("Enter origin city (e.g., NYC): ")
    destination = input("Enter destination city (e.g., LAX): ")
    start_date = input("Enter start date (YYYY-MM-DD): ")
    end_date = input("Enter end date (YYYY-MM-DD): ")
    
    # Validate dates
    if not all(validate_date_format(date) for date in [start_date, end_date]):
        print("Invalid date format. Please use YYYY-MM-DD")
        return
    
    print(f"\nSearching for flights from {origin} to {destination}...")
    flights = scraper.find_best_deals(origin, destination, start_date, end_date)
    
    if flights.empty:
        print("No flights found for the specified criteria.")
        return
    
    # Analyze the deals
    analysis = FlightDataProcessor.analyze_deals(flights)

    if not analysis:
        print("Could not analyze flight deals.")
        return
    
    print("\nBest Deals Found:")
    print(f"Lowest Price: {analysis['min_price']}")
    print(f"Average Price: {analysis['avg_price']:.2f}")
    print(f"Total Flights Found: {analysis['total_flights']}")
    
    # Export results
    export_file = f"flights_{origin}_{destination}_{start_date}_{end_date}.csv"
    FlightDataProcessor.export_to_csv(flights, export_file)
    print(f"\nResults exported to {export_file}")

if __name__ == "__main__":
    main()
