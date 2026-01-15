/**
 * Unified AI provider service for Ollama.
 *
 * Responsibilities:
 * - Talk to local Ollama via HTTP (no extra deps)
 * - Provide simple text generation
 * - Provide a robust health check
 * - NEVER let errors go unlogged or unhandled by callers
 */

const DEFAULT_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3';

export interface AIHealth {
  healthy: boolean;
  reason?: string;
  model?: string;
  latencyMs?: number;
}

class AIProvider {
  private baseUrl: string;
  private model: string;
  private timeoutMs: number;

  constructor() {
    this.baseUrl = DEFAULT_BASE_URL.replace(/\/+$/, '');
    this.model = DEFAULT_MODEL;
    this.timeoutMs = 60_000; // 60 seconds

    console.log('[AI] Provider initialized', {
      provider: 'ollama',
      baseUrl: this.baseUrl,
      model: this.model
    });
  }

  /**
   * Low-level helper to perform a JSON HTTP request with timeout and logging.
   */
  private async jsonRequest<TResponse>(
    path: string,
    options: RequestInit & { timeoutMs?: number } = {}
  ): Promise<TResponse> {
    const url = `${this.baseUrl}${path}`;
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        const reason = `HTTP ${response.status}: ${response.statusText}`;
        console.error('[AI] Ollama error:', {
          provider: 'ollama',
          url,
          status: response.status,
          statusText: response.statusText,
          body: text
        });
        throw new Error(reason);
      }

      const data = (await response.json().catch((err) => {
        console.error('[AI] Ollama error: failed to parse JSON response', err);
        throw new Error('Invalid JSON response from Ollama');
      })) as TResponse;

      return data;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.error('[AI] Ollama error:', {
          provider: 'ollama',
          url,
          error: 'Request timed out',
          timeoutMs
        });
        throw new Error('Ollama request timed out');
      }

      console.error('[AI] Ollama error:', error);
      throw error instanceof Error ? error : new Error('Unknown Ollama error');
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Generate text from a prompt using Ollama.
   *
   * Uses the required request format:
   * {
   *   "model": "llama3",
   *   "prompt": "...",
   *   "stream": false
   * }
   */
  async generateText(prompt: string): Promise<string> {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt must be a non-empty string');
    }

    const body = {
      model: this.model,
      prompt,
      stream: false
    };

    const data = await this.jsonRequest<{ response?: unknown }>('/api/generate', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    const text = typeof data.response === 'string' ? data.response : '';

    if (!text) {
      console.error('[AI] Ollama error:', {
        provider: 'ollama',
        error: 'Missing or invalid response field from Ollama'
      });
      throw new Error('Invalid response from Ollama');
    }

    console.log('[AI] Generation succeeded');
    return text.trim();
  }

  /**
   * Health check for Ollama.
   *
   * Requirements for healthy = true:
   * - Ollama server is reachable
   * - Target model exists
   * - A minimal test prompt succeeds
   *
   * This NEVER throws. It always returns a structured health object.
   */
  async healthCheck(): Promise<AIHealth> {
    const started = Date.now();

    try {
      // 1) Check server reachability and model availability
      const tags = await this.jsonRequest<{ models?: Array<{ name?: string }> }>(
        '/api/tags',
        {
          method: 'GET',
          timeoutMs: 5_000
        }
      );

      const models = Array.isArray(tags.models) ? tags.models : [];
      const hasModel = models.some((m) => typeof m.name === 'string' && m.name === this.model);

      if (!hasModel) {
        const reason = `Model "${this.model}" not found in Ollama tags`;
        console.error('[AI] Ollama error:', { provider: 'ollama', error: reason });
        return {
          healthy: false,
          reason,
          model: this.model
        };
      }

      // 2) Minimal generation probe to verify end-to-end pipeline
      const probeBody = {
        model: this.model,
        prompt: 'Health check: respond with the single word READY.',
        stream: false
      };

      const gen = await this.jsonRequest<{ response?: unknown }>('/api/generate', {
        method: 'POST',
        timeoutMs: 8_000,
        body: JSON.stringify(probeBody)
      });

      const text = typeof gen.response === 'string' ? gen.response.trim() : '';
      if (!text) {
        const reason = 'Ollama health probe returned empty response';
        console.error('[AI] Ollama error:', { provider: 'ollama', error: reason });
        return {
          healthy: false,
          reason,
          model: this.model
        };
      }

      const latencyMs = Date.now() - started;
      return {
        healthy: true,
        model: this.model,
        latencyMs
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error contacting Ollama';

      // Do not throw – callers rely on this being safe.
      console.error('[AI] Ollama error:', error);
      return {
        healthy: false,
        reason: message,
        model: this.model
      };
    }
  }
}

export const aiProvider = new AIProvider();

