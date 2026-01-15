/**
 * AI API Client
 * 
 * Client for interacting with AI endpoints powered by Ollama.
 * Uses Supabase auth for JWT tokens.
 */

import { supabase } from './supabase.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const REQUEST_TIMEOUT = 120000; // 2 minutes

/**
 * Get authentication token from Supabase session
 */
async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || '';
}

/**
 * Make authenticated API request with timeout
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  console.log(`📡 [aiApi] Request: ${endpoint}`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log(`📡 [aiApi] Response: ${response.status}`);
    
    let json: any = {};
    try {
      const text = await response.text();
      if (text) {
        json = JSON.parse(text);
      }
    } catch (e) {
      // If JSON parsing fails, use the text as the message
      json = { message: await response.text().catch(() => 'Unknown error') };
    }

    if (!response.ok) {
      console.error(`📡 [aiApi] Error response:`, {
        status: response.status,
        statusText: response.statusText,
        body: json
      });
      // Normalize backend AI errors into a structured object the UI can surface cleanly
      const errorMessage = json.detail || json.message || json.error || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return json as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('📡 [aiApi] Request timeout after 2 minutes');
          throw new Error('Request timeout - AI is taking too long to respond');
        }
        console.error('📡 [aiApi] Request failed:', error.message);
        throw error;
      }
      // If error is an object (from structured error above), convert to Error
      if (typeof error === 'object' && error !== null && 'message' in error) {
        throw new Error(String(error.message));
      }
      throw new Error('Unknown error occurred');
    }
}

export const aiApi = {
  /**
   * Improve README content
   */
  async improveReadme(readme: string, projectInfo: any): Promise<any> {
    console.log('✨ [aiApi] Improving README...');
    console.log('✨ [aiApi] README length:', readme.length);
    console.log('✨ [aiApi] Project:', projectInfo.name);
    
    try {
      const result = await apiRequest('/api/ai/improve-readme', {
        method: 'POST',
        body: JSON.stringify({ readme, projectInfo })
      });
      
      console.log('✨ [aiApi] ✅ README improved successfully');
      return result;
    } catch (error) {
      console.error('✨ [aiApi] ❌ Failed to improve README:', error);
      throw error;
    }
  },

  /**
   * Generate project description
   */
  async generateDescription(projectInfo: any): Promise<any> {
    return apiRequest('/api/ai/generate-description', {
      method: 'POST',
      body: JSON.stringify({ projectInfo })
    });
  },

  /**
   * Generate setup/installation guide
   */
  async generateSetupGuide(projectInfo: any): Promise<any> {
    return apiRequest('/api/ai/generate-setup', {
      method: 'POST',
      body: JSON.stringify({ projectInfo })
    });
  },

  /**
   * Generate API documentation
   */
  async generateApiDocs(endpoints: any[]): Promise<any> {
    return apiRequest('/api/ai/generate-api-docs', {
      method: 'POST',
      body: JSON.stringify({ endpoints })
    });
  },

  /**
   * Generate Mermaid diagram
   */
  async generateDiagram(type: string, data: any): Promise<any> {
    console.log('📊 [aiApi] Generating diagram:', type);
    
    try {
      const result = await apiRequest('/api/ai/generate-diagram', {
        method: 'POST',
        body: JSON.stringify({ type, data })
      });
      
      console.log('📊 [aiApi] ✅ Diagram generated');
      return result;
    } catch (error) {
      console.error('📊 [aiApi] ❌ Failed to generate diagram:', error);
      throw error;
    }
  },

  /**
   * Analyze code quality
   */
  async analyzeQuality(codeStructure: any): Promise<any> {
    return apiRequest('/api/ai/analyze-quality', {
      method: 'POST',
      body: JSON.stringify({ codeStructure })
    });
  },

  /**
   * Check Ollama health status
   * Note: Health endpoint is public (no auth required)
   */
  async checkHealth(): Promise<any> {
    console.log('💚 [aiApi] Checking health...');
    
    try {
      // Don't use apiRequest because health check shouldn't need auth
      // Increased timeout to 10 seconds to account for slow backend/Ollama responses
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_URL}/api/ai/health`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error('💚 [aiApi] Health check failed:', response.status);
        return { healthy: false, models: [], baseUrl: API_URL };
      }
      
      const data = await response.json();
      console.log('💚 [aiApi] Health result:', data);
      return data;
    } catch (error) {
      console.error('💚 [aiApi] Health check error:', error);
      // If it's a timeout, provide a helpful message
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('💚 [aiApi] Health check timed out - backend may be slow or not responding');
      }
      return { healthy: false, models: [], baseUrl: API_URL };
    }
  }
};
