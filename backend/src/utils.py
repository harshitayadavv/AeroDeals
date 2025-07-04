import os
from datetime import datetime, timedelta

def validate_date_format(date_str):
    """Validate date string format (YYYY-MM-DD)"""
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False

def create_date_range(start_date, days):
    """Create a range of dates starting from start_date"""
    start = datetime.strptime(start_date, '%Y-%m-%d')
    dates = []
    for i in range(days):
        date = start + timedelta(days=i)
        dates.append(date.strftime('%Y-%m-%d'))
    return dates

def format_price(price):
    """Format price with currency symbol"""
    return f"${price:,.2f}"