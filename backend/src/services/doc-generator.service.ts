/** Documentation generator service. */
import { AnalysisResult } from '../types/analysis.types.js';
import { RulesResult } from '../types/rules.types.js';
import { FixSuggestion } from './llm-fix.service.js';

export type DocFormat = 'markdown' | 'html' | 'json';

export interface GeneratedDocumentation {
  format: DocFormat;
  content: string;
  metadata: {
    generatedAt: string;
    servicesCount: number;
    apisCount: number;
    rolesCount: number;
  };
}

export class DocGeneratorService {
  /**
   * Generate documentation from analysis results.
   */
  generateDocumentation(
    analysis: AnalysisResult,
    rules?: RulesResult,
    fixes?: FixSuggestion[],
    format: DocFormat = 'markdown'
  ): GeneratedDocumentation {
    switch (format) {
      case 'markdown':
        return this.generateMarkdown(analysis, rules, fixes);
      case 'html':
        return this.generateHTML(analysis, rules, fixes);
      case 'json':
        return this.generateJSON(analysis, rules, fixes);
      default:
        return this.generateMarkdown(analysis, rules, fixes);
    }
  }

  /**
   * Generate Markdown documentation.
   */
  private generateMarkdown(
    analysis: AnalysisResult,
    rules?: RulesResult,
    fixes?: FixSuggestion[]
  ): GeneratedDocumentation {
    let content = '# API Documentation\n\n';
    content += `*Generated from repository analysis*\n\n`;
    content += `**Generated:** ${new Date().toISOString()}\n\n`;

    // Summary
    content += '## Summary\n\n';
    content += `- **Services:** ${analysis.services.length}\n`;
    content += `- **APIs:** ${analysis.apis.length}\n`;
    content += `- **Roles:** ${analysis.roles.length}\n`;
    content += `- **Files Analyzed:** ${analysis.files.length}\n\n`;

    if (rules) {
      content += `- **Documentation Issues:** ${rules.summary.errors + rules.summary.warnings} (${rules.summary.errors} errors, ${rules.summary.warnings} warnings)\n\n`;
    }

    // APIs Section
    if (analysis.apis.length > 0) {
      content += '## API Endpoints\n\n';
      
      // Group by controller
      const apisByController = new Map<string, typeof analysis.apis>();
      for (const api of analysis.apis) {
        const controller = api.controller || 'unknown';
        if (!apisByController.has(controller)) {
          apisByController.set(controller, []);
        }
        apisByController.get(controller)!.push(api);
      }

      for (const [controller, apis] of apisByController) {
        content += `### ${controller}\n\n`;
        
        for (const api of apis) {
          content += `#### \`${api.method} ${api.path}\`\n\n`;
          content += `- **Controller:** ${api.controller}\n`;
          content += `- **File:** \`${api.filePath}\`\n`;
          if (api.roles && api.roles.length > 0) {
            content += `- **Roles:** ${api.roles.join(', ')}\n`;
          }
          content += '\n';
        }
      }
    }

    // Services Section
    if (analysis.services.length > 0) {
      content += '## Services\n\n';
      
      for (const service of analysis.services) {
        content += `### ${service.name}\n\n`;
        content += `- **File:** \`${service.filePath}\`\n`;
        content += `- **Methods:** ${service.methods.join(', ')}\n`;
        if (service.dependencies.length > 0) {
          content += `- **Dependencies:** ${service.dependencies.slice(0, 5).join(', ')}${service.dependencies.length > 5 ? '...' : ''}\n`;
        }
        content += '\n';
      }
    }

    // Roles Section
    if (analysis.roles.length > 0) {
      content += '## Roles\n\n';
      
      const rolesByFile = new Map<string, typeof analysis.roles>();
      for (const role of analysis.roles) {
        if (!rolesByFile.has(role.filePath)) {
          rolesByFile.set(role.filePath, []);
        }
        rolesByFile.get(role.filePath)!.push(role);
      }

      for (const [filePath, roles] of rolesByFile) {
        content += `### ${filePath}\n\n`;
        for (const role of roles) {
          content += `- **${role.name}** (${role.context})\n`;
        }
        content += '\n';
      }
    }

    // Rules Violations
    if (rules && rules.violations.length > 0) {
      content += '## Documentation Issues\n\n';
      
      const errors = rules.violations.filter(v => v.severity === 'error');
      const warnings = rules.violations.filter(v => v.severity === 'warning');
      
      if (errors.length > 0) {
        content += '### Errors\n\n';
        for (const violation of errors) {
          content += `- **${violation.ruleName}:** ${violation.message}\n`;
          if (violation.suggestion) {
            content += `  - *Suggestion:* ${violation.suggestion}\n`;
          }
        }
        content += '\n';
      }

      if (warnings.length > 0) {
        content += '### Warnings\n\n';
        for (const violation of warnings) {
          content += `- **${violation.ruleName}:** ${violation.message}\n`;
          if (violation.suggestion) {
            content += `  - *Suggestion:* ${violation.suggestion}\n`;
          }
        }
        content += '\n';
      }
    }

    // Fix Suggestions
    if (fixes && fixes.length > 0) {
      content += '## Suggested Fixes\n\n';
      
      for (const fix of fixes) {
        content += `### ${fix.entityType}: ${fix.entityId}\n\n`;
        content += `**File:** \`${fix.filePath}\`\n\n`;
        content += '**Suggested Documentation:**\n\n';
        content += '```typescript\n';
        content += fix.suggested;
        content += '\n```\n\n';
        content += `*Confidence: ${(fix.confidence * 100).toFixed(0)}%*\n\n`;
      }
    }

    // Dependency Graph
    if (analysis.dependencies.length > 0) {
      content += '## Dependency Graph\n\n';
      content += '```\n';
      
      const depsByFile = new Map<string, string[]>();
      for (const dep of analysis.dependencies) {
        if (!depsByFile.has(dep.from)) {
          depsByFile.set(dep.from, []);
        }
        depsByFile.get(dep.from)!.push(dep.to);
      }

      for (const [from, tos] of depsByFile) {
        for (const to of tos.slice(0, 10)) { // Limit to 10 per file
          content += `${from} -> ${to}\n`;
        }
      }
      
      content += '```\n\n';
    }

    return {
      format: 'markdown',
      content,
      metadata: {
        generatedAt: new Date().toISOString(),
        servicesCount: analysis.services.length,
        apisCount: analysis.apis.length,
        rolesCount: analysis.roles.length
      }
    };
  }

  /**
   * Generate HTML documentation.
   */
  private generateHTML(
    analysis: AnalysisResult,
    rules?: RulesResult,
    fixes?: FixSuggestion[]
  ): GeneratedDocumentation {
    const markdown = this.generateMarkdown(analysis, rules, fixes);
    
    // Simple markdown to HTML conversion (for production, use a proper markdown parser)
    let html = '<!DOCTYPE html>\n<html>\n<head>\n';
    html += '<meta charset="UTF-8">\n';
    html += '<title>API Documentation</title>\n';
    html += '<style>body{font-family:sans-serif;max-width:1200px;margin:0 auto;padding:20px;}</style>\n';
    html += '</head>\n<body>\n';
    
    // Convert markdown to HTML (basic conversion)
    html += markdown.content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n/g, '<br>\n');
    
    html += '\n</body>\n</html>';

    return {
      format: 'html',
      content: html,
      metadata: markdown.metadata
    };
  }

  /**
   * Generate JSON documentation.
   */
  private generateJSON(
    analysis: AnalysisResult,
    rules?: RulesResult,
    fixes?: FixSuggestion[]
  ): GeneratedDocumentation {
    return {
      format: 'json',
      content: JSON.stringify({
        analysis,
        rules,
        fixes,
        generatedAt: new Date().toISOString()
      }, null, 2),
      metadata: {
        generatedAt: new Date().toISOString(),
        servicesCount: analysis.services.length,
        apisCount: analysis.apis.length,
        rolesCount: analysis.roles.length
      }
    };
  }
}
