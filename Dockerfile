FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire backend folder
COPY backend/ ./backend/

# Expose port
EXPOSE 10000

# Run the application
CMD ["uvicorn", "backend.api:app", "--host", "0.0.0.0", "--port", "10000"]