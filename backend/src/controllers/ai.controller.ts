/**
 * AI Controller
 *
 * Handles AI-powered features using Ollama through the unified aiProvider.
 * All endpoints require authentication (except health).
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { aiProvider } from '../services/aiProvider.js';

export class AIController {
  /**
   * POST /api/ai/improve-readme
   * Improve README content using AI
   */
  async improveReadme(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Validate request body early
    const { readme, projectInfo } = req.body || {};

    if (!readme || typeof readme !== 'string') {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'readme field is required and must be a string'
      });
      return;
    }

    if (!projectInfo || typeof projectInfo !== 'object') {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'projectInfo field is required and must be an object'
      });
      return;
    }

    // Check AI health before generation
    const health = await aiProvider.healthCheck();
    if (!health.healthy) {
      res.status(503).json({
        error: 'AI_UNAVAILABLE',
        message: 'Local AI is not running. Start Ollama to enable this feature.'
      });
      return;
    }

    console.log('[AI] Improving README for project:', projectInfo.name || 'Unknown');

    try {
      const systemPrompt = `You are a senior technical writer and documentation expert. Your job is to take existing README files and transform them into professional, comprehensive, and engaging documentation.

Guidelines:
1. Keep all existing factual information accurate
2. Expand sections that are too brief
3. Add missing standard sections if not present:
   - Clear project description
   - Features list
   - Installation instructions (step-by-step)
   - Usage examples with code
   - Configuration details
   - API documentation (if applicable)
   - Contributing guidelines
   - License information
4. Use professional but friendly tone
5. Add proper markdown formatting (headings, code blocks, lists)
6. Include badges for build status, version, license if appropriate
7. Make it scannable with clear section headers
8. Add emojis sparingly for visual appeal (✨ 🚀 📦 ⚙️)

Output ONLY the improved README in markdown format. Do not add meta-commentary or explanations.`;

      const languages = projectInfo.languages?.join(', ') || 'Unknown';
      const directories = projectInfo.directories?.join(', ') || 'None';
      
      const userPrompt = `Transform this README into a professional, comprehensive documentation:

**Project Name:** ${projectInfo.name || 'Unknown'}
**Tech Stack:** ${languages}
**Dependencies:** ${projectInfo.dependencies || 'Unknown'}
**Main Directories:** ${directories}
**Version:** ${projectInfo.version || '1.0.0'}

**Current README:**
${readme}

**Instructions:**
- Enhance the existing content, don't replace it
- Make it professional and complete
- Add code examples and clear instructions
- Organize with proper markdown sections
- Make it easy to understand for new contributors
- Keep all accurate technical details

Generate the improved README now:`;

      const prompt = `${systemPrompt}\n\n${userPrompt}`;
      const improved = await aiProvider.generateText(prompt);

      res.json({
        success: true,
        content: improved,
        metadata: {
          originalLength: readme.length,
          improvedLength: improved.length,
          provider: 'ollama',
          model: process.env.OLLAMA_MODEL || 'llama3'
        }
      });
    } catch (error) {
      // Fallback: return original README content (graceful degradation)
      console.error('[AI] Ollama error:', error);
      res.json({
        success: false,
        content: readme,
        error: 'AI_GENERATION_FAILED',
        message: 'AI failed to improve README. Returning original content.',
        metadata: {
          provider: 'ollama',
          model: process.env.OLLAMA_MODEL || 'llama3',
          fallback: true
        }
      });
    }
  }

  /**
   * POST /api/ai/generate-description
   * Generate project description
   */
  async generateDescription(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { projectInfo } = req.body || {};

    if (!projectInfo || typeof projectInfo !== 'object') {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'projectInfo field is required and must be an object'
      });
      return;
    }

    const health = await aiProvider.healthCheck();
    if (!health.healthy) {
      res.status(503).json({
        error: 'AI_UNAVAILABLE',
        message: 'Local AI is not running. Start Ollama to enable this feature.'
      });
      return;
    }

    console.log('[AI] Generating description for project:', projectInfo.name || 'Unknown');

    try {
      const systemPrompt =
        'You are a technical writer. Create concise project descriptions (2-3 sentences). Focus on what the project does, who it is for, and key technologies. Output ONLY the description, no meta-commentary.';

      const userPrompt = `Generate a project description for:

- Name: ${projectInfo.name || 'Unknown'}
- Languages: ${projectInfo.languages?.join(', ') || 'Unknown'}
- Dependencies: ${projectInfo.dependencies || 0}
- Structure: ${projectInfo.directories?.join(', ') || 'None'}
- Type: ${projectInfo.type || 'Application'}

Create a 2-3 sentence description.`;

      const description = await aiProvider.generateText(`${systemPrompt}\n\n${userPrompt}`);

      res.json({
        success: true,
        content: description,
        metadata: {
          provider: 'ollama',
          model: process.env.OLLAMA_MODEL || 'llama3'
        }
      });
    } catch (error) {
      console.error('[AI] Ollama error:', error);
      res.json({
        success: false,
        content:
          'Project description is temporarily unavailable because the local AI failed. Please try again after restarting Ollama.',
        error: 'AI_GENERATION_FAILED',
        metadata: {
          provider: 'ollama',
          model: process.env.OLLAMA_MODEL || 'llama3',
          fallback: true
        }
      });
    }
  }

  /**
   * POST /api/ai/generate-setup
   * Generate setup/installation guide
   */
  async generateSetupGuide(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { projectInfo } = req.body || {};

    if (!projectInfo || typeof projectInfo !== 'object') {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'projectInfo field is required and must be an object'
      });
      return;
    }

    const health = await aiProvider.healthCheck();
    if (!health.healthy) {
      res.status(503).json({
        error: 'AI_UNAVAILABLE',
        message: 'Local AI is not running. Start Ollama to enable this feature.'
      });
      return;
    }

    console.log('[AI] Generating setup guide for project:', projectInfo.name || 'Unknown');

    try {
      const systemPrompt =
        'You are a technical documentation expert. Create clear, step-by-step installation and setup guides. Include prerequisites, installation steps, configuration, and verification. Output ONLY the guide in markdown format.';

      const userPrompt = `Create a setup guide for:

- Name: ${projectInfo.name || 'Project'}
- Languages: ${projectInfo.languages?.join(', ') || 'Unknown'}
- Package Manager: ${projectInfo.packageManager || 'npm'}
- Dependencies: ${projectInfo.dependencies || 0}
- Has Docker: ${projectInfo.hasDocker ? 'Yes' : 'No'}
- Has Tests: ${projectInfo.hasTests ? 'Yes' : 'No'}

Provide a complete installation and setup guide.`;

      const guide = await aiProvider.generateText(`${systemPrompt}\n\n${userPrompt}`);

      res.json({
        success: true,
        content: guide,
        metadata: {
          provider: 'ollama',
          model: process.env.OLLAMA_MODEL || 'llama3'
        }
      });
    } catch (error) {
      console.error('[AI] Ollama error:', error);
      res.json({
        success: false,
        content:
          '# Installation & Setup Guide\n\nSetup guide could not be generated by the local AI. Please try again later or follow the repository README.',
        error: 'AI_GENERATION_FAILED',
        metadata: {
          provider: 'ollama',
          model: process.env.OLLAMA_MODEL || 'llama3',
          fallback: true
        }
      });
    }
  }

  /**
   * POST /api/ai/generate-api-docs
   * Generate API documentation
   */
  async generateApiDocs(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { endpoints } = req.body || {};

    if (!Array.isArray(endpoints) || endpoints.length === 0) {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'endpoints field is required and must be a non-empty array'
      });
      return;
    }

    const health = await aiProvider.healthCheck();
    if (!health.healthy) {
      res.status(503).json({
        error: 'AI_UNAVAILABLE',
        message: 'Local AI is not running. Start Ollama to enable this feature.'
      });
      return;
    }

    console.log('[AI] Generating API docs for', endpoints.length, 'endpoints');

    try {
      const systemPrompt =
        'You are an API documentation expert. Create comprehensive API documentation with endpoint descriptions, request/response formats, examples, and error codes. Output ONLY the documentation in markdown format.';

      const endpointsText = endpoints
        .map(
          (ep: any, i: number) =>
            `${i + 1}. ${ep.method || 'GET'} ${ep.path || 'Unknown'}: ${
              ep.description || 'No description'
            }`
        )
        .join('\n');

      const userPrompt = `Generate API documentation for these endpoints:

${endpointsText}

Create comprehensive documentation with:
- Endpoint descriptions
- Request/response formats
- Code examples
- Error handling`;

      const docs = await aiProvider.generateText(`${systemPrompt}\n\n${userPrompt}`);

      res.json({
        success: true,
        content: docs,
        metadata: {
          endpointCount: endpoints.length,
          provider: 'ollama',
          model: process.env.OLLAMA_MODEL || 'llama3'
        }
      });
    } catch (error) {
      console.error('[AI] Ollama error:', error);
      res.json({
        success: false,
        content:
          '# API Reference\n\nAPI documentation could not be generated by the local AI. Please try again later.',
        error: 'AI_GENERATION_FAILED',
        metadata: {
          endpointCount: endpoints.length,
          provider: 'ollama',
          model: process.env.OLLAMA_MODEL || 'llama3',
          fallback: true
        }
      });
    }
  }

  /**
   * POST /api/ai/generate-diagram
   * Generate Mermaid diagram code
   */
  async generateDiagram(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { type, data } = req.body || {};

    if (!type || !['architecture', 'dependency', 'flow'].includes(type)) {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'type field is required and must be one of: architecture, dependency, flow'
      });
      return;
    }

    if (!data || typeof data !== 'object') {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'data field is required and must be an object'
      });
      return;
    }

    const health = await aiProvider.healthCheck();
    if (!health.healthy) {
      res.status(503).json({
        error: 'AI_UNAVAILABLE',
        message: 'Local AI is not running. Start Ollama to enable this feature.'
      });
      return;
    }

    console.log('[AI] Generating', type, 'diagram');

    try {
      const systemPrompt =
        'You are a diagramming expert. Generate valid Mermaid diagram syntax. Output ONLY the Mermaid code, no markdown code blocks, no explanations. The output must be valid Mermaid syntax that can be directly rendered.';

      let userPrompt = '';

      if (type === 'architecture') {
        userPrompt = `Generate a Mermaid flowchart diagram showing the architecture:

Components: ${data.components?.join(', ') || 'Unknown'}
Connections: ${JSON.stringify(data.connections || [])}
Type: ${data.type || 'flowchart'}

Create a flowchart diagram.`;
      } else if (type === 'dependency') {
        userPrompt = `Generate a Mermaid graph diagram showing dependencies:

Dependencies: ${JSON.stringify(data.dependencies || [])}
Type: ${data.type || 'graph'}

Create a dependency graph.`;
      } else {
        userPrompt = `Generate a Mermaid flowchart showing the flow:

Steps: ${data.steps?.join(' -> ') || 'Unknown'}
Type: ${data.type || 'flowchart'}

Create a flowchart.`;
      }

      const raw = await aiProvider.generateText(`${systemPrompt}\n\n${userPrompt}`);

      // Remove markdown code fences if model adds them
      const diagram = raw.replace(/```mermaid\s*/gi, '').replace(/```\s*/g, '').trim();

      res.json({
        success: true,
        content: diagram,
        metadata: {
          type,
          provider: 'ollama',
          model: process.env.OLLAMA_MODEL || 'llama3'
        }
      });
    } catch (error) {
      console.error('[AI] Ollama error:', error);

      // Fallback: return textual architecture summary instead of Mermaid
      let fallbackSummary = 'Diagram generation failed.';
      if (type === 'architecture') {
        fallbackSummary = `Architecture overview:\n\nComponents: ${data.components?.join(
          ', '
        ) || 'Unknown'}\nConnections: ${JSON.stringify(data.connections || [])}`;
      } else if (type === 'dependency') {
        fallbackSummary = `Dependency graph overview:\n\nDependencies: ${JSON.stringify(
          data.dependencies || []
        )}`;
      } else if (type === 'flow') {
        fallbackSummary = `Flow overview:\n\nSteps: ${data.steps?.join(' -> ') || 'Unknown'}`;
      }

      res.json({
        success: false,
        content: fallbackSummary,
        error: 'AI_GENERATION_FAILED',
        message:
          'AI failed to generate a diagram. Returning a textual architecture summary instead.',
        metadata: {
          type,
          provider: 'ollama',
          model: process.env.OLLAMA_MODEL || 'llama3',
          fallback: true
        }
      });
    }
  }

  /**
   * POST /api/ai/analyze-quality
   * Analyze code quality and return suggestions
   */
  async analyzeQuality(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { codeStructure } = req.body || {};

    if (!codeStructure || typeof codeStructure !== 'object') {
      res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'codeStructure field is required and must be an object'
      });
      return;
    }

    const health = await aiProvider.healthCheck();
    if (!health.healthy) {
      res.status(503).json({
        error: 'AI_UNAVAILABLE',
        message: 'Local AI is not running. Start Ollama to enable this feature.'
      });
      return;
    }

    console.log('[AI] Analyzing code quality');

    try {
      const systemPrompt =
        'You are a code quality expert. Analyze code structure and provide actionable suggestions for improvement. Output ONLY a numbered list of suggestions, one per line. Be specific and practical.';

      const userPrompt = `Analyze this code structure:

- Files: ${codeStructure.files || 0}
- Languages: ${codeStructure.languages?.join(', ') || 'Unknown'}
- Has Tests: ${codeStructure.hasTests ? 'Yes' : 'No'}
- Has Linting: ${codeStructure.hasLinting ? 'Yes' : 'No'}
- Has CI/CD: ${codeStructure.hasCI ? 'Yes' : 'No'}
- Dependencies: ${codeStructure.dependencies || 0}
- Structure: ${codeStructure.structure || 'Unknown'}

Provide 5-10 specific, actionable suggestions for improving code quality.`;

      const raw = await aiProvider.generateText(`${systemPrompt}\n\n${userPrompt}`);

      const suggestions = raw
        .split('\n')
        .filter((line) => line.trim().match(/^\d+[\.\)]/))
        .map((line) => line.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter((line) => line.length > 0);

      res.json({
        success: true,
        content: suggestions,
        metadata: {
          suggestionCount: suggestions.length,
          provider: 'ollama',
          model: process.env.OLLAMA_MODEL || 'llama3'
        }
      });
    } catch (error) {
      console.error('[AI] Ollama error:', error);
      res.json({
        success: false,
        content: [
          'Enable the local AI (Ollama) to receive detailed, AI-generated code quality suggestions.',
          'In the meantime, add tests, linting, and CI to improve baseline code quality.'
        ],
        error: 'AI_GENERATION_FAILED',
        metadata: {
          provider: 'ollama',
          model: process.env.OLLAMA_MODEL || 'llama3',
          fallback: true
        }
      });
    }
  }

  /**
   * GET /api/ai/health
   * Check AI provider health.
   * Note: This endpoint is public (no auth required) for easier debugging.
   * It ALWAYS returns 200 OK with a structured JSON payload.
   */
  async health(req: any, res: Response): Promise<void> {
    const health = await aiProvider.healthCheck();
    
    // Get list of available models from Ollama
    let models: string[] = [];
    try {
      const response = await fetch(`${process.env.OLLAMA_URL || 'http://127.0.0.1:11434'}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        models = Array.isArray(data.models) 
          ? data.models.map((m: any) => m.name || m.model).filter(Boolean)
          : [];
      }
    } catch (error) {
      console.error('[AI] Failed to fetch models list:', error);
    }

    res.status(200).json({
      healthy: health.healthy,
      provider: 'ollama',
      model: health.model || process.env.OLLAMA_MODEL || 'llama3',
      models: models,
      baseUrl: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
      ...(typeof health.latencyMs === 'number' ? { latencyMs: health.latencyMs } : {}),
      ...(health.reason ? { reason: health.reason } : {})
    });
  }
}
