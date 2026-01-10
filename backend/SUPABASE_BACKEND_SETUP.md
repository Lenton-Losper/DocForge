# Supabase Backend Integration Guide

This guide shows how to connect your Node.js/Express backend to Supabase.

## Step 1: Get Your Service Role Key

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Settings** → **API**
4. Scroll to **Project API keys** section
5. Copy the **service_role** key (secret) - this has admin access
6. ⚠️ **NEVER expose this key in frontend code!**

## Step 2: Create Backend .env File

Create `backend/.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://afcgapmhwnxeposwbhdu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Server Configuration
PORT=8000
NODE_ENV=development
```

## Step 3: Install Dependencies

```bash
cd backend
npm install
```

The `@supabase/supabase-js` package is already in `package.json`.

## Step 4: Create Database Tables

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy and paste the contents of `DATABASE_SCHEMA.sql`
3. Click **Run** to create tables and policies

This creates:
- `documents` table - for uploaded documents
- `repositories` table - for connected GitHub repos
- `analysis_results` table - for analysis history
- Row Level Security (RLS) policies

## Step 5: Create Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Name: `documents`
4. Make it **Private** (not public)
5. Click **Create bucket**

## Step 6: Update Frontend to Send Tokens

Update your frontend API calls to include the JWT token:

```typescript
// Example: Upload document
const uploadDocument = async (file: File) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:8000/api/documents/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    },
    body: formData
  });

  return await response.json();
};
```

## Step 7: Test the Integration

1. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test authentication:**
   ```bash
   # Get token from frontend (after login)
   curl -X GET http://localhost:8000/api/documents \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## API Endpoints

### Protected Endpoints (Require Auth)

**POST `/api/documents/upload`**
- Upload document to Supabase Storage
- Save metadata to database
- Requires: JWT token in Authorization header

**GET `/api/documents`**
- Get all user's documents
- Requires: JWT token

**GET `/api/documents/:id`**
- Get specific document
- Requires: JWT token

**DELETE `/api/documents/:id`**
- Delete document
- Requires: JWT token

**POST `/api/repositories/connect`**
- Connect GitHub repository
- Requires: JWT token, body: `{ repo_url, github_token? }`

**GET `/api/repositories`**
- Get all user's repositories
- Requires: JWT token

### Public Endpoints (No Auth)

**POST `/api/analyze`**
- Analyze repository (existing endpoint)
- No auth required (or make it optional)

**POST `/api/validate-docs`**
- Validate documentation (existing endpoint)
- No auth required (or make it optional)

## Security Notes

1. **Service Role Key:**
   - Only use in backend
   - Never commit to git
   - Has admin access - bypasses RLS

2. **JWT Tokens:**
   - Frontend sends JWT in Authorization header
   - Backend verifies with Supabase
   - Tokens expire - frontend should refresh

3. **Row Level Security:**
   - Database policies ensure users only see their data
   - Backend uses service_role key (bypasses RLS)
   - Frontend uses anon key (respects RLS)

## Troubleshooting

**"Missing Supabase environment variables"**
- Check `backend/.env` file exists
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Restart backend server

**"Invalid token"**
- Check frontend is sending token in Authorization header
- Verify token hasn't expired
- Check token format: `Bearer <token>`

**"Storage bucket not found"**
- Create `documents` bucket in Supabase Storage
- Make sure it's private

**"Table does not exist"**
- Run `DATABASE_SCHEMA.sql` in Supabase SQL Editor
- Check table names match exactly

## Next Steps

- [ ] Add file upload handling (multer or similar)
- [ ] Integrate document linting with upload
- [ ] Add repository analysis integration
- [ ] Implement file download endpoints
- [ ] Add pagination for document/repo lists
