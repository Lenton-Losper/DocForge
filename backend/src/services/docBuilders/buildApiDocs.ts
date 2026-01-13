/**
 * Deterministic API Documentation Builder
 * 
 * Generates API documentation from verifiable route evidence.
 */

import { RepoEvidence } from '../evidenceExtractor.js';

export function buildApiDocs(evidence: RepoEvidence): string {
  const sections: string[] = [];

  sections.push(`# API Reference\n\n`);

  // API Overview
  if (evidence.apiEvidence.routes.length > 0 || evidence.apiEvidence.controllersFound) {
    sections.push(`## API Overview ✅\n\n`);
    
    if (evidence.apiEvidence.hasApiFolder) {
      sections.push(`API routes are organized in dedicated folders. ✅\n\n`);
    }
    
    if (evidence.apiEvidence.controllersFound) {
      sections.push(`API controllers detected. ✅\n\n`);
    }
  } else {
    sections.push(`## API Overview ❌\n\n`);
    sections.push(`*No API routes were detected in this repository.*\n\n`);
    sections.push(`### To Enable API Documentation:\n\n`);
    sections.push(`1. **Create API routes:**\n`);
    sections.push(`   - Add routes under \`/routes\`, \`/api\`, or \`/controllers\` directories\n`);
    sections.push(`   - Use standard routing patterns (Express, Fastify, etc.)\n\n`);
    sections.push(`2. **Export route handlers:**\n`);
    sections.push(`   - Export functions or classes that handle HTTP requests\n`);
    sections.push(`   - Use clear naming conventions (e.g., \`getUsers\`, \`createPost\`)\n\n`);
    sections.push(`3. **Document endpoints:**\n`);
    sections.push(`   - Add JSDoc comments to route handlers\n`);
    sections.push(`   - Include parameter types and return values\n\n`);
    return sections.join('\n');
  }

  // Detected Routes
  if (evidence.apiEvidence.routes.length > 0) {
    sections.push(`## Detected Routes ✅\n\n`);
    sections.push(`The following routes were found in the codebase:\n\n`);
    
    // Group routes by method (if we can infer from patterns)
    const getRoutes = evidence.apiEvidence.routes.filter(r => r.toLowerCase().includes('get') || !r.startsWith('/'));
    const postRoutes = evidence.apiEvidence.routes.filter(r => r.toLowerCase().includes('post'));
    const putRoutes = evidence.apiEvidence.routes.filter(r => r.toLowerCase().includes('put'));
    const deleteRoutes = evidence.apiEvidence.routes.filter(r => r.toLowerCase().includes('delete'));
    
    if (getRoutes.length > 0) {
      sections.push(`### GET Routes\n\n`);
      getRoutes.forEach(route => {
        sections.push(`- \`${route}\`\n`);
      });
      sections.push(`\n`);
    }
    
    if (postRoutes.length > 0) {
      sections.push(`### POST Routes\n\n`);
      postRoutes.forEach(route => {
        sections.push(`- \`${route}\`\n`);
      });
      sections.push(`\n`);
    }
    
    if (putRoutes.length > 0) {
      sections.push(`### PUT Routes\n\n`);
      putRoutes.forEach(route => {
        sections.push(`- \`${route}\`\n`);
      });
      sections.push(`\n`);
    }
    
    if (deleteRoutes.length > 0) {
      sections.push(`### DELETE Routes\n\n`);
      deleteRoutes.forEach(route => {
        sections.push(`- \`${route}\`\n`);
      });
      sections.push(`\n`);
    }
    
    // All routes list
    sections.push(`### All Routes\n\n`);
    evidence.apiEvidence.routes.forEach(route => {
      sections.push(`- \`${route}\`\n`);
    });
    sections.push(`\n`);
  } else if (evidence.apiEvidence.controllersFound) {
    sections.push(`## API Controllers ✅\n\n`);
    sections.push(`API controller files were detected, but specific routes could not be extracted.\n\n`);
    sections.push(`**Note:** Route extraction is based on common patterns. For complete documentation:\n`);
    sections.push(`- Review controller files manually\n`);
    sections.push(`- Add JSDoc comments to route handlers\n`);
    sections.push(`- Use OpenAPI/Swagger annotations if available\n`);
    sections.push(`\n`);
  }

  // API Structure
  if (evidence.apiEvidence.hasApiFolder) {
    sections.push(`## API Structure ✅\n\n`);
    sections.push(`API code is organized in dedicated directories:\n`);
    sections.push(`- Routes are located in \`/api\`, \`/routes\`, or \`/controllers\` folders\n`);
    sections.push(`- This structure follows common backend architecture patterns\n`);
    sections.push(`\n`);
  }

  // Backend Framework
  if (evidence.stack.backend && evidence.stack.backend.length > 0) {
    sections.push(`## Backend Framework ✅\n\n`);
    sections.push(`This API is built using:\n`);
    evidence.stack.backend.forEach(framework => {
      sections.push(`- **${framework}**\n`);
    });
    sections.push(`\n`);
  }

  // Missing API Documentation
  if (evidence.apiEvidence.routes.length === 0 && !evidence.apiEvidence.controllersFound) {
    sections.push(`## Next Steps ❌\n\n`);
    sections.push(`To generate complete API documentation:\n\n`);
    sections.push(`1. **Add route definitions** in your code:\n`);
    sections.push(`   \`\`\`javascript\n`);
    sections.push(`   // Example: Express.js route\n`);
    sections.push(`   app.get('/api/users', getUsers);\n`);
    sections.push(`   app.post('/api/users', createUser);\n`);
    sections.push(`   \`\`\`\n\n`);
    sections.push(`2. **Use standard routing patterns** that can be detected automatically\n\n`);
    sections.push(`3. **Add JSDoc comments** for better documentation:\n`);
    sections.push(`   \`\`\`javascript\n`);
    sections.push(`   /**\n`);
    sections.push(`    * @route GET /api/users\n`);
    sections.push(`    * @desc Get all users\n`);
    sections.push(`    * @access Public\n`);
    sections.push(`    */\n`);
    sections.push(`   \`\`\`\n\n`);
  }

  return sections.join('\n');
}
