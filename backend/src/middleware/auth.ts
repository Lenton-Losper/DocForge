/** JWT verification middleware for Express. */
import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

/**
 * Verify JWT token from Authorization header.
 * Attaches user to request if valid.
 */
export async function verifyAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[AUTH] No token provided:', { 
        hasHeader: !!authHeader,
        headerValue: authHeader ? 'present' : 'missing'
      });
      res.status(401).json({ error: 'No token provided. Include Authorization: Bearer <token>' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      console.warn('[AUTH] Token is empty after Bearer prefix');
      res.status(401).json({ error: 'Invalid token format' });
      return;
    }

    // Create a client with anon key to verify user token
    // Service role key bypasses RLS, so we use anon key for user verification
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[AUTH] Missing Supabase config');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error) {
      console.warn('[AUTH] Token verification failed:', error.message);
      res.status(401).json({ 
        error: 'Invalid or expired token',
        details: error.message 
      });
      return;
    }

    if (!user) {
      console.warn('[AUTH] No user found for token');
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email
    };
    
    console.log('[AUTH] Verified user:', { id: user.id, email: user.email });
    next();
  } catch (error) {
    console.error('[AUTH] Auth verification error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
