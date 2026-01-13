/**
 * Centralized OpenAI configuration.
 * This ensures environment variables are loaded before the client is created.
 * 
 * STRICT REQUIREMENT: Throws error on startup if OPENAI_API_KEY is missing.
 * This prevents silent failures and ensures generation is disabled if misconfigured.
 */
import 'dotenv/config';
import OpenAI from 'openai';

// Validate that OPENAI_API_KEY is present - THROW ERROR if missing
if (!process.env.OPENAI_API_KEY) {
  const error = new Error('OPENAI_API_KEY missing — generation disabled');
  console.error('[OPENAI] ❌ CRITICAL: OPENAI_API_KEY is missing in backend environment');
  console.error('[OPENAI] Make sure backend/.env exists and contains OPENAI_API_KEY');
  console.error('[OPENAI] Backend will not start without this key.');
  throw error;
}

// Create OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

console.log('[OPENAI] ✅ Client initialized successfully');
