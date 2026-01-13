# OpenAI Setup - Quick Guide

## ✅ Code Updated

The backend has been updated to use OpenAI instead of Anthropic.

## 🔑 Add OpenAI API Key

Create `backend/.env` file with:

```bash
# Supabase Configuration
SUPABASE_URL=https://afcgapmhwnxeposwbhdu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI API (for AI documentation generation)
OPENAI_API_KEY=your-openai-api-key-here

# Optional: Personal GitHub token as fallback
GITHUB_TOKEN=optional-fallback-token
```

## 📦 Install Dependencies

```bash
cd backend
npm install
```

This will install `openai` package (already updated in package.json).

## ✅ Verify

1. Start backend:
   ```bash
   npm run dev
   ```

2. Should start without errors about missing OpenAI.

## 🎯 What Changed

- ✅ Replaced `@anthropic-ai/sdk` with `openai` package
- ✅ Updated all AI generation functions to use OpenAI API
- ✅ Changed model from `claude-sonnet-4-20250514` to `gpt-4o`
- ✅ Updated environment variable from `ANTHROPIC_API_KEY` to `OPENAI_API_KEY`

## 🔒 Security Note

⚠️ **Never commit `.env` file to git!** The `.gitignore` already excludes it.
