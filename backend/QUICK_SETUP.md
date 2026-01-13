# Quick Supabase Backend Setup

## Step 1: Get Service Role Key

1. Go to: https://app.supabase.com/dashboard/project/afcgapmhwnxeposwbhdu/settings/api
2. Scroll to **Project API keys**
3. Copy the **service_role** key (the secret one, not publishable)
4. It starts with `sb_secret_...`

## Step 2: Create Backend .env

Create `backend/.env` file:

```env
SUPABASE_URL=https://afcgapmhwnxeposwbhdu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your-service-role-key-here
PORT=8000
```

⚠️ **Replace `sb_secret_your-service-role-key-here` with your actual service_role key!**

## Step 3: Install Dependencies

```bash
cd backend
npm install
```

## Step 4: Create Database Tables

1. Go to: https://app.supabase.com/dashboard/project/afcgapmhwnxeposwbhdu/sql/new
2. Copy contents of `DATABASE_SCHEMA.sql`
3. Paste and click **Run**

## Step 5: Create Storage Bucket

1. Go to: https://app.supabase.com/dashboard/project/afcgapmhwnxeposwbhdu/storage/buckets
2. Click **New bucket**
3. Name: `documents`
4. Make it **Private**
5. Click **Create**

## Step 6: Test It

```bash
cd backend
npm run dev
```

Backend should start without errors!

## Done! ✅

Your backend is now connected to Supabase with:
- ✅ JWT authentication
- ✅ Database tables
- ✅ Storage bucket
- ✅ Protected API endpoints

See `SUPABASE_BACKEND_SETUP.md` for detailed docs.
