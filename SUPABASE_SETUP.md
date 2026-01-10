# Supabase Setup Guide for DocDocs

This guide will help you connect DocDocs to Supabase for authentication and database.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: DocDocs (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project" (takes 1-2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll see:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Important**: Never commit `.env` to git (it's already in `.gitignore`)

## Step 4: Enable Email Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize welcome email, password reset, etc.

## Step 5: Set Up Database Schema (Optional)

If you want to store user data, create tables:

1. Go to **SQL Editor** in Supabase dashboard
2. Run this SQL to create a `profiles` table:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

## Step 6: Test the Integration

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Click "Upload Documentation" or "Connect GitHub"
3. The sign-up modal should appear
4. Create an account with a real email
5. Check your email for the confirmation link (if email confirmation is enabled)
6. After sign-up, you should be redirected to `/dashboard`

## Step 7: Configure Email Confirmation (Optional)

By default, Supabase requires email confirmation. To disable for development:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle off "Confirm email" (for development only)
3. **Important**: Re-enable for production!

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env` file exists in the project root
- Check that variables start with `VITE_` (required for Vite)
- Restart your dev server after adding `.env`

### "Invalid API key"
- Double-check your `VITE_SUPABASE_ANON_KEY` in `.env`
- Make sure you're using the **anon/public** key, not the service_role key

### "Email already registered"
- User already exists, try logging in instead
- Or reset password in Supabase dashboard

### Authentication not working
- Check browser console for errors
- Verify Supabase project is active (not paused)
- Check network tab for API calls

## Next Steps

### Add Protected Routes

Create a route guard for authenticated pages:

```typescript
// src/components/ProtectedRoute.tsx
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/" replace />;

  return <>{children}</>;
};
```

### Add User Profile

Update Navigation to show user info:

```typescript
const { user, signOut } = useAuth();

// Show user email in nav
{user && <span>{user.email}</span>}
```

### Store User Preferences

Use Supabase database to store:
- User preferences
- Document history
- Connected repositories
- Settings

## Production Checklist

- [ ] Enable email confirmation
- [ ] Set up custom email domain (optional)
- [ ] Configure CORS in Supabase settings
- [ ] Set up Row Level Security policies
- [ ] Add rate limiting
- [ ] Set up database backups
- [ ] Monitor usage in Supabase dashboard

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase React Guide](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)
