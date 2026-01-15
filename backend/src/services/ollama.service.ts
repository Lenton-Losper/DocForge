/**
 * Ollama Service (legacy, kept for backwards compatibility only).
 *
 * NOTE: New code should use `aiProvider` from `aiProvider.ts` instead.
 */

import axios, { AxiosInstance } from 'axios';

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
  };
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

interface OllamaTagsResponse {
  models: Array<{
    name: string;
    modified_at: string;
    size: number;
    digest: string;
  }>;
}

class OllamaService {
  private client: AxiosInstance;
  private baseUrl: string;
  private model: string;
  private isHealthy: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds

  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.2';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000, // 60 seconds
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`[OLLAMA] Service initialized with URL: ${this.baseUrl}, Model: ${this.model}`);
  }

  /**
   * Base generation method
   */
  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const request: OllamaGenerateRequest = {
        model: this.model,
        prompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40
        }
      };

      console.log(`[OLLAMA] Generating with model: ${this.model}`);
      const response = await this.client.post<OllamaGenerateResponse>('/api/generate', request);
      
      if (response.data.done && response.data.response) {
        return response.data.response.trim();
      }
      
      throw new Error('Incomplete response from Ollama');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          throw new Error('Ollama service is not available. Make sure Ollama is running.');
        }
        throw new Error(`Ollama API error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Improve README content
   */
  async improveReadme(readme: string, projectInfo: any): Promise<string> {
    const systemPrompt = `You are a technical documentation expert. Improve README files by adding clear descriptions, proper sections (Features, Installation, Usage, Project Structure, Contributing, License), better formatting, and professional tone. Output ONLY the improved README in markdown format, no meta-commentary.`;

    const userPrompt = `Improve this README file:

${readme}

Project Information:
- Name: ${projectInfo.name || 'Unknown'}
- Languages: ${projectInfo.languages?.join(', ') || 'Unknown'}
- Dependencies: ${projectInfo.dependencies || 0}
- Directories: ${projectInfo.directories?.join(', ') || 'None'}
- Version: ${projectInfo.version || '1.0.0'}

Provide an improved, professional README with all standard sections.`;

    return this.generate(userPrompt, systemPrompt);
  }

  /**
   * Generate project description (2-3 sentences)
   */
  async generateProjectDescription(projectInfo: any): Promise<string> {
    const systemPrompt = `You are a technical writer. Create concise project descriptions (2-3 sentences). Focus on what the project does, who it's for, and key technologies. Be specific and avoid generic phrases. Output ONLY the description, no meta-commentary.`;

    const userPrompt = `Generate a project description for:

- Name: ${projectInfo.name || 'Unknown'}
- Languages: ${projectInfo.languages?.join(', ') || 'Unknown'}
- Dependencies: ${projectInfo.dependencies || 0}
- Structure: ${projectInfo.directories?.join(', ') || 'None'}
- Type: ${projectInfo.type || 'Application'}

Create a 2-3 sentence description.`;

    return this.generate(userPrompt, systemPrompt);
  }

  /**
   * Generate setup/installation guide
   */
  async generateSetupGuide(projectInfo: any): Promise<string> {
    const systemPrompt = `You are a technical documentation expert. Create clear, step-by-step installation and setup guides. Include prerequisites, installation steps, configuration, and verification. Output ONLY the guide in markdown format.`;

    const userPrompt = `Create a setup guide for:

- Name: ${projectInfo.name || 'Project'}
- Languages: ${projectInfo.languages?.join(', ') || 'Unknown'}
- Package Manager: ${projectInfo.packageManager || 'npm'}
- Dependencies: ${projectInfo.dependencies || 0}
- Has Docker: ${projectInfo.hasDocker ? 'Yes' : 'No'}
- Has Tests: ${projectInfo.hasTests ? 'Yes' : 'No'}

Provide a complete installation and setup guide.`;

    return this.generate(userPrompt, systemPrompt);
  }

  /**
   * Generate API documentation
   */
  async generateApiDocs(endpoints: any[]): Promise<string> {
    const systemPrompt = `You are an API documentation expert. Create comprehensive API documentation with endpoint descriptions, request/response formats, examples, and error codes. Output ONLY the documentation in markdown format.`;

    const endpointsText = endpoints.map((ep, i) => 
      `${i + 1}. ${ep.method || 'GET'} ${ep.path || 'Unknown'}: ${ep.description || 'No description'}`
    ).join('\n');

    const userPrompt = `Generate API documentation for these endpoints:

${endpointsText}

Create comprehensive documentation with:
- Endpoint descriptions
- Request/response formats
- Code examples
- Error handling`;

    return this.generate(userPrompt, systemPrompt);
  }

  /**
   * Generate Mermaid diagram code
   */
  async generateMermaidDiagram(type: 'architecture' | 'dependency' | 'flow', data: any): Promise<string> {
    const systemPrompt = `You are a diagramming expert. Generate valid Mermaid diagram syntax. Output ONLY the Mermaid code, no markdown code blocks, no explanations. The output must be valid Mermaid syntax that can be directly rendered.`;

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

    const result = await this.generate(userPrompt, systemPrompt);
    // Remove markdown code blocks if present
    return result.replace(/```mermaid\n?/g, '').replace(/```\n?/g, '').trim();
  }

  /**
   * Analyze code quality and return suggestions
   */
  async analyzeCodeQuality(codeStructure: any): Promise<string[]> {
    const systemPrompt = `You are a code quality expert. Analyze code structure and provide actionable suggestions for improvement. Output ONLY a numbered list of suggestions, one per line. Be specific and practical.`;

    const userPrompt = `Analyze this code structure:

- Files: ${codeStructure.files || 0}
- Languages: ${codeStructure.languages?.join(', ') || 'Unknown'}
- Has Tests: ${codeStructure.hasTests ? 'Yes' : 'No'}
- Has Linting: ${codeStructure.hasLinting ? 'Yes' : 'No'}
- Has CI/CD: ${codeStructure.hasCI ? 'Yes' : 'No'}
- Dependencies: ${codeStructure.dependencies || 0}
- Structure: ${codeStructure.structure || 'Unknown'}

Provide 5-10 specific, actionable suggestions for improving code quality.`;

    const result = await this.generate(userPrompt, systemPrompt);
    // Parse numbered list into array
    return result
      .split('\n')
      .filter(line => line.trim().match(/^\d+[\.\)]/))
      .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Health check - verify Ollama is running
   */
  async healthCheck(): Promise<boolean> {
    const now = Date.now();
    
    // Cache health check for 30 seconds
    if (this.isHealthy && (now - this.lastHealthCheck) < this.healthCheckInterval) {
      return this.isHealthy;
    }

    try {
      const response = await this.client.get<OllamaTagsResponse>('/api/tags', {
        timeout: 5000 // 5 second timeout for health check
      });
      
      this.isHealthy = response.status === 200;
      this.lastHealthCheck = now;
      return this.isHealthy;
    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = now;
      console.warn('[OLLAMA] Health check failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await this.client.get<OllamaTagsResponse>('/api/tags');
      return response.data.models.map(model => model.name);
    } catch (error) {
      console.error('[OLLAMA] Failed to list models:', error);
      return [];
    }
  }
}

// Export singleton instance
export const ollamaService = new OllamaService();
