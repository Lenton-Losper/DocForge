/**
 * Centralized OpenAI configuration.
 * This ensures environment variables are loaded before the client is created.
 */
import 'dotenv/config';
import OpenAI from 'openai';

// Validate that OPENAI_API_KEY is present
if (!process.env.OPENAI_API_KEY) {
  console.error('[OPENAI] OPENAI_API_KEY is missing in backend environment');
  console.error('[OPENAI] Make sure backend/.env exists and contains OPENAI_API_KEY');
  console.error('[OPENAI] Current env check:', {
    hasKey: !!process.env.OPENAI_API_KEY,
    valueStart: process.env.OPENAI_API_KEY?.slice(0, 7) || 'undefined'
  });
}

// Create OpenAI client (will be null if key is missing)
export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  : null;

// Log initialization status
if (openai) {
  console.log('[OPENAI] Client initialized successfully');
} else {
  console.warn('[OPENAI] Client not initialized - OPENAI_API_KEY missing');
}
