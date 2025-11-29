FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy only backend requirements first
COPY backend/requirements.txt ./requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy only backend folder
COPY backend/ ./backend/

# Set working directory to backend
WORKDIR /app/backend

# Expose port
EXPOSE 10000

# Run the application from backend folder
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "10000"]