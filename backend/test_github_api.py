"""Test script for GitHub API endpoint."""
import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"
ENDPOINT = f"{BASE_URL}/api/github/repos"

# Replace with your actual tokens
SUPABASE_JWT = "YOUR_SUPABASE_JWT_TOKEN_HERE"
GITHUB_TOKEN = "YOUR_GITHUB_ACCESS_TOKEN_HERE"


def test_github_repos():
    """Test the GitHub repositories endpoint."""
    headers = {
        "Authorization": f"Bearer {SUPABASE_JWT}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "github_token": GITHUB_TOKEN
    }
    
    print(f"Testing: POST {ENDPOINT}")
    print(f"Headers: Authorization: Bearer ***")
    print(f"Payload: {{'github_token': '***'}}")
    print("-" * 50)
    
    try:
        response = requests.post(ENDPOINT, headers=headers, json=payload)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print("-" * 50)
        
        if response.status_code == 200:
            data = response.json()
            repos = data.get("repos", [])
            print(f"✅ Success! Found {len(repos)} repositories:")
            print()
            for repo in repos[:5]:  # Show first 5
                print(f"  - {repo['full_name']}")
                print(f"    Description: {repo.get('description', 'N/A')}")
                print(f"    Private: {repo['private']}")
                print(f"    URL: {repo['html_url']}")
                print()
            if len(repos) > 5:
                print(f"  ... and {len(repos) - 5} more")
        else:
            print(f"❌ Error: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error Details: {json.dumps(error_data, indent=2)}")
            except:
                print(f"Error Text: {response.text}")
    
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the backend server is running!")
        print(f"   Start it with: cd backend && python run.py")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")


if __name__ == "__main__":
    print("=" * 50)
    print("GitHub API Endpoint Test")
    print("=" * 50)
    print()
    
    if SUPABASE_JWT == "YOUR_SUPABASE_JWT_TOKEN_HERE":
        print("⚠️  Please set SUPABASE_JWT in the script")
        print("   Get it from: Frontend → Login → Check browser DevTools → Network → Authorization header")
    elif GITHUB_TOKEN == "YOUR_GITHUB_ACCESS_TOKEN_HERE":
        print("⚠️  Please set GITHUB_TOKEN in the script")
        print("   Get it from: Supabase → Auth → Users → Your user → provider_token")
    else:
        test_github_repos()
