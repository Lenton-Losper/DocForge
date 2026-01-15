/**
 * Deterministic Architecture Documentation Builder
 * 
 * Generates architecture documentation from verifiable project structure.
 */

import { RepoEvidence } from '../evidenceExtractor.js';

export function buildArchitecture(evidence: RepoEvidence): string {
  const sections: string[] = [];

  sections.push(`# Architecture & Design\n\n`);

  // Project Type
  sections.push(`## Project Type ✅\n\n`);
  
  const projectTypes: string[] = [];
  if (evidence.stack.frontend && evidence.stack.frontend.length > 0) {
    projectTypes.push('Frontend Application');
  }
  if (evidence.stack.backend && evidence.stack.backend.length > 0) {
    projectTypes.push('Backend Service');
  }
  if (evidence.stack.frontend && evidence.stack.backend) {
    projectTypes.push('Full-Stack Application');
  }
  
  if (projectTypes.length > 0) {
    sections.push(`This is a **${projectTypes.join(' + ')}**. ✅\n\n`);
  } else {
    sections.push(`*Project type could not be determined from available evidence.* ⚠️\n\n`);
  }

  // Technology Stack
  sections.push(`## Technology Stack ✅\n\n`);
  
  if (evidence.meta.languages.length > 0) {
    sections.push(`### Languages\n\n`);
    evidence.meta.languages.forEach(lang => {
      sections.push(`- **${lang}** ✅\n`);
    });
    sections.push(`\n`);
  }

  if (evidence.stack.frontend && evidence.stack.frontend.length > 0) {
    sections.push(`### Frontend Technologies\n\n`);
    evidence.stack.frontend.forEach(tech => {
      sections.push(`- **${tech}** ✅\n`);
    });
    sections.push(`\n`);
  }

  if (evidence.stack.backend && evidence.stack.backend.length > 0) {
    sections.push(`### Backend Technologies\n\n`);
    evidence.stack.backend.forEach(tech => {
      sections.push(`- **${tech}** ✅\n`);
    });
    sections.push(`\n`);
  }

  if (evidence.stack.database && evidence.stack.database.length > 0) {
    sections.push(`### Database Technologies\n\n`);
    evidence.stack.database.forEach(db => {
      sections.push(`- **${db}** ✅\n`);
    });
    sections.push(`\n`);
  }

  if (evidence.stack.tools && evidence.stack.tools.length > 0) {
    sections.push(`### Development Tools\n\n`);
    evidence.stack.tools.forEach(tool => {
      sections.push(`- **${tool}** ✅\n`);
    });
    sections.push(`\n`);
  }

  // Project Structure
  sections.push(`## Project Structure ✅\n\n`);
  
  if (evidence.structure.folders.length > 0) {
    sections.push(`### Directory Structure\n\n`);
    sections.push(`The project is organized into the following directories:\n\n`);
    evidence.structure.folders.slice(0, 15).forEach(folder => {
      sections.push(`- \`${folder}/\` ✅\n`);
    });
    sections.push(`\n`);
  } else {
    sections.push(`### Directory Structure ❌\n\n`);
    sections.push(`*No clear directory structure detected.*\n\n`);
    sections.push(`**Recommended structure:**\n`);
    sections.push(`- \`/src\` - Source code\n`);
    sections.push(`- \`/tests\` - Test files\n`);
    sections.push(`- \`/docs\` - Documentation\n`);
    sections.push(`- \`/config\` - Configuration files\n`);
    sections.push(`\n`);
  }

  // Entry Points
  if (evidence.structure.entryFiles.length > 0) {
    sections.push(`### Entry Points ✅\n\n`);
    sections.push(`The following files serve as entry points:\n\n`);
    evidence.structure.entryFiles.forEach(file => {
      sections.push(`- \`${file}\` ✅\n`);
    });
    sections.push(`\n`);
  }

  // Configuration Files
  if (evidence.structure.configFiles.length > 0) {
    sections.push(`### Configuration Files ✅\n\n`);
    evidence.structure.configFiles.forEach(file => {
      sections.push(`- \`${file}\` ✅\n`);
    });
    sections.push(`\n`);
  }

  // Architecture Patterns
  sections.push(`## Architecture Patterns ⚠️\n\n`);
  
  if (evidence.apiEvidence.hasApiFolder) {
    sections.push(`### API Layer Pattern ✅\n\n`);
    sections.push(`- API routes are separated into dedicated folders\n`);
    sections.push(`- This follows the **Layered Architecture** pattern\n`);
    sections.push(`\n`);
  }

  if (evidence.structure.folders.some(f => ['src', 'lib', 'utils'].includes(f.toLowerCase()))) {
    sections.push(`### Modular Structure ✅\n\n`);
    sections.push(`- Code is organized into logical modules\n`);
    sections.push(`- This promotes **Separation of Concerns**\n`);
    sections.push(`\n`);
  }

  // Dependencies
  if (evidence.dependencies.length > 0) {
    sections.push(`## Dependencies ✅\n\n`);
    sections.push(`### Production Dependencies\n\n`);
    sections.push(`The project uses ${evidence.dependencies.length} production dependencies:\n\n`);
    evidence.dependencies.slice(0, 20).forEach(dep => {
      sections.push(`- \`${dep}\` ✅\n`);
    });
    if (evidence.dependencies.length > 20) {
      sections.push(`\n*... and ${evidence.dependencies.length - 20} more*\n`);
    }
    sections.push(`\n`);
  }

  if (evidence.devDependencies.length > 0) {
    sections.push(`### Development Dependencies\n\n`);
    sections.push(`The project uses ${evidence.devDependencies.length} development dependencies:\n\n`);
    evidence.devDependencies.slice(0, 15).forEach(dep => {
      sections.push(`- \`${dep}\` ✅\n`);
    });
    if (evidence.devDependencies.length > 15) {
      sections.push(`\n*... and ${evidence.devDependencies.length - 15} more*\n`);
    }
    sections.push(`\n`);
  }

  // Deployment
  sections.push(`## Deployment ✅\n\n`);
  
  if (evidence.files.hasDocker) {
    sections.push(`### Docker Support ✅\n\n`);
    sections.push(`This project includes Docker configuration for containerized deployment.\n\n`);
  } else {
    sections.push(`### Docker Support ❌\n\n`);
    sections.push(`*No Docker configuration detected.*\n\n`);
    sections.push(`To enable Docker deployment:\n`);
    sections.push(`- Create a \`Dockerfile\` in the project root\n`);
    sections.push(`- Optionally add \`docker-compose.yml\` for multi-container setups\n`);
    sections.push(`\n`);
  }

  // Testing
  if (evidence.files.hasTests) {
    sections.push(`## Testing ✅\n\n`);
    sections.push(`Test files are present in the repository.\n\n`);
    if (evidence.stack.tools && evidence.stack.tools.some(t => ['jest', 'mocha', 'vitest'].includes(t.toLowerCase()))) {
      const testTool = evidence.stack.tools.find(t => ['jest', 'mocha', 'vitest'].includes(t.toLowerCase()));
      sections.push(`Testing framework: **${testTool}** ✅\n\n`);
    }
  } else {
    sections.push(`## Testing ❌\n\n`);
    sections.push(`*No test files detected.*\n\n`);
    sections.push(`To add testing:\n`);
    sections.push(`- Create a \`/tests\` or \`/__tests__\` directory\n`);
    sections.push(`- Add test files (e.g., \`.test.js\`, \`.spec.js\`)\n`);
    sections.push(`- Configure a testing framework (Jest, Mocha, etc.)\n`);
    sections.push(`\n`);
  }

  // Optional Architecture Improvements
  const optionalItems: string[] = [];
  if (evidence.structure.folders.length === 0) {
    optionalItems.push('Clear directory structure (improves code organization)');
  }
  if (evidence.structure.entryFiles.length === 0) {
    optionalItems.push('Entry point files (clarifies application startup)');
  }
  if (!evidence.files.hasPackageJson && (evidence.meta.languages.includes('JavaScript') || evidence.meta.languages.includes('TypeScript'))) {
    optionalItems.push('Package configuration (required for Node.js projects)');
  }

  if (optionalItems.length > 0) {
    sections.push(`## ⚠️ Optional Improvements Detected\n\n`);
    sections.push(`The following components would improve architecture documentation:\n\n`);
    optionalItems.forEach(item => {
      sections.push(`- ${item}\n`);
    });
    sections.push(`\n`);
  }

  return sections.join('\n');
}
