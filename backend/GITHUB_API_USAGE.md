# GitHub API Endpoint - Usage Guide

## 📍 Endpoint

**POST** `/api/github/repos`

## 🔐 Authentication

Requires Supabase JWT token in Authorization header.

## 📥 Request

### Headers
```
Authorization: Bearer <SUPABASE_JWT_TOKEN>
Content-Type: application/json
```

### Body
```json
{
  "github_token": "ghp_xxxxxxxxxxxx"
}
```

## 📤 Response

### Success (200 OK)
```json
{
  "repos": [
    {
      "id": 123456789,
      "name": "my-repo",
      "full_name": "username/my-repo",
      "private": false,
      "description": "My awesome repository",
      "default_branch": "main",
      "html_url": "https://github.com/username/my-repo"
    }
  ]
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "detail": "Invalid GitHub token. Please reconnect your GitHub account."
}
```

#### 403 Forbidden
```json
{
  "detail": "Insufficient GitHub token permissions. Token may need 'repo' scope."
}
```

#### 429 Too Many Requests
```json
{
  "detail": "GitHub API rate limit exceeded. Please try again later."
}
```

#### 500 Internal Server Error
```json
{
  "detail": "Failed to fetch GitHub repositories: <error message>"
}
```

## 🧪 Testing

### Using cURL
```bash
curl -X POST http://localhost:8000/api/github/repos \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -H "Content-Type: application/json" \
  -d '{"github_token": "YOUR_GITHUB_TOKEN"}'
```

### Using Python
```python
import requests

response = requests.post(
    "http://localhost:8000/api/github/repos",
    headers={
        "Authorization": "Bearer YOUR_SUPABASE_JWT",
        "Content-Type": "application/json"
    },
    json={
        "github_token": "YOUR_GITHUB_TOKEN"
    }
)

print(response.json())
```

### Using JavaScript/Frontend
```javascript
const response = await fetch('http://localhost:8000/api/github/repos', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseJWT}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    github_token: githubToken
  })
});

const data = await response.json();
console.log(data.repos);
```

## 🔑 Getting Tokens

### Supabase JWT Token
1. Log in to your frontend app
2. Open browser DevTools (F12)
3. Go to Network tab
4. Make any authenticated request
5. Check the `Authorization` header: `Bearer <token>`

Or use Supabase client:
```javascript
const { data: { session } } = await supabase.auth.getSession();
const jwt = session?.access_token;
```

### GitHub Token (provider_token)
After connecting GitHub via OAuth in Supabase:
1. Go to Supabase Dashboard
2. Navigate to Authentication → Users
3. Find your user
4. Check the `provider_token` field in user metadata

Or get it from the session:
```javascript
const { data: { session } } = await supabase.auth.getSession();
const githubToken = session?.provider_token;
```

## 📋 Frontend Integration Example

```typescript
async function fetchGitHubRepos() {
  // 1. Get Supabase JWT
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  
  // 2. Get GitHub token
  const githubToken = session.provider_token;
  if (!githubToken) {
    throw new Error('GitHub not connected. Please connect in Settings.');
  }
  
  // 3. Call backend API
  const response = await fetch('http://localhost:8000/api/github/repos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      github_token: githubToken
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch repositories');
  }
  
  const data = await response.json();
  return data.repos;
}
```

## 🛡️ Security Notes

- ✅ GitHub token is **never stored** in the database
- ✅ Token is only used for API calls, then discarded
- ✅ All requests are authenticated via Supabase JWT
- ✅ Token is never logged (only preview shown in logs)
- ✅ Backend validates both tokens before making GitHub API calls

## 🐛 Troubleshooting

### "Invalid GitHub token"
- Make sure you're using the `provider_token` from Supabase session
- Verify GitHub OAuth is connected in Settings
- Try reconnecting GitHub account

### "Insufficient permissions"
- GitHub token needs `repo` scope
- Reconnect GitHub with proper scopes in Supabase OAuth settings

### "Rate limit exceeded"
- GitHub API has rate limits (5000 requests/hour for authenticated users)
- Wait a bit and try again
- Consider caching repository data

### Connection errors
- Make sure backend server is running: `python run.py`
- Check backend logs for detailed error messages
- Verify network connectivity to GitHub API
