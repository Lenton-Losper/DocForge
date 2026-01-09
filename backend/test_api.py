"""Simple test script for the API (requires requests library)."""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_health():
    """Test health endpoint."""
    response = requests.get("http://localhost:8000/health")
    print(f"Health check: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_analyze(file_path: str):
    """Test document analysis endpoint."""
    with open(file_path, "rb") as f:
        files = {"file": (file_path.split("/")[-1], f, "application/octet-stream")}
        response = requests.post(f"{BASE_URL}/analyze", files=files)
    
    print(f"Analysis status: {response.status_code}")
    if response.status_code == 200:
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    print("DocForge API Test Script")
    print("=" * 50)
    
    # Test health
    try:
        test_health()
    except Exception as e:
        print(f"Health check failed: {e}")
        print("Make sure the server is running: python run.py")
    
    # Uncomment to test with a real file:
    # test_analyze("path/to/your/document.docx")
