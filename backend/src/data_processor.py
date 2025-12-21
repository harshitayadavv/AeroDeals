"""
Process and analyze flight data
"""

import logging

logger = logging.getLogger(__name__)


def process_flights(flights):
    """
    Analyze flight data and return statistics
    
    Args:
        flights: List of flight dictionaries
    
    Returns:
        Dictionary with min, max, avg prices and flight count
    """
    try:
        if not flights:
            return {
                "min_price": 0,
                "max_price": 0,
                "avg_price": 0,
                "total_flights": 0
            }
        
        # Extract prices (handle both "$150" and "150" formats)
        prices = []
        for flight in flights:
            price_str = flight.get('price', '$0')
            try:
                # Remove $ and convert to float
                price = float(price_str.replace('$', '').replace(',', ''))
                prices.append(price)
            except:
                logger.warning(f"Could not parse price: {price_str}")
                continue
        
        if not prices:
            return {
                "min_price": 0,
                "max_price": 0,
                "avg_price": 0,
                "total_flights": len(flights)
            }
        
        return {
            "min_price": min(prices),
            "max_price": max(prices),
            "avg_price": sum(prices) / len(prices),
            "total_flights": len(flights)
        }
        
    except Exception as e:
        logger.error(f"Error processing flights: {e}")
        return {
            "min_price": 0,
            "max_price": 0,
            "avg_price": 0,
            "total_flights": len(flights) if flights else 0
        }