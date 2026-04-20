import os
from dotenv import load_dotenv
from api import app

def main():
    load_dotenv()  # Load environment variables if needed
    print("SkyRacer Backend - Game Server")
    print("To start the server, run: uvicorn main:app --reload")

if __name__ == "__main__":
    main()

# Export app for uvicorn
__all__ = ["app"]
