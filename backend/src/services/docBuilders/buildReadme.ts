/**
 * Deterministic README Builder
 * 
 * Generates README documentation from verifiable evidence only.
 * Uses confidence tags: ✅ Verified, ⚠️ Inferred, ❌ Missing
 */

import { RepoEvidence } from '../evidenceExtractor.js';

export function buildReadme(evidence: RepoEvidence): string {
  const sections: string[] = [];

  // Title
  const title = evidence.meta.name || 'Project';
  sections.push(`# ${title}\n`);

  // ============================================================================
  // SUGGESTED IMPROVEMENTS (Auto-detected) - At the top for visibility
  // ============================================================================
  const suggestions: string[] = [];
  
  // Detect gaps and create actionable suggestions
  if (!evidence.meta.description) {
    suggestions.push('Add a project description to `package.json` to improve overview quality');
  }
  
  if (!evidence.files.hasLicense) {
    suggestions.push('Add a LICENSE file to clarify usage rights');
  }
  
  if (!evidence.files.hasTests) {
    suggestions.push('Add basic test files to improve project maturity');
  }
  
  if (!evidence.files.hasReadme) {
    suggestions.push('Create a README.md file with project information');
  }
  
  if (!evidence.files.hasEnvExample && (evidence.files.hasPackageJson || evidence.stack.backend)) {
    suggestions.push('Add a `.env.example` file to document required environment variables');
  }
  
  if (!evidence.files.hasGitignore) {
    suggestions.push('Add a `.gitignore` file to exclude unnecessary files from version control');
  }

  if (suggestions.length > 0) {
    sections.push(`## Suggested Improvements (Auto-detected)\n\n`);
    suggestions.forEach((suggestion, index) => {
      sections.push(`${index + 1}. ${suggestion}\n`);
    });
    sections.push(`\n`);
  }

  // Description
  if (evidence.meta.description) {
    sections.push(`## Description ✅\n\n${evidence.meta.description}\n`);
  } else {
    sections.push(`## Description ⚠️\n\n*No description found in repository.*\n\nTo add a description:\n- Add a \`description\` field to \`package.json\`\n- Or create a \`README.md\` file with project information\n`);
  }

  // Features / Stack
  if (evidence.meta.languages.length > 0 || Object.keys(evidence.stack).length > 0) {
    sections.push(`## Technology Stack ✅\n\n`);
    
    if (evidence.meta.languages.length > 0) {
      sections.push(`**Languages:** ${evidence.meta.languages.join(', ')}\n`);
    }
    
    if (evidence.stack.frontend && evidence.stack.frontend.length > 0) {
      sections.push(`**Frontend:** ${evidence.stack.frontend.join(', ')}\n`);
    }
    
    if (evidence.stack.backend && evidence.stack.backend.length > 0) {
      sections.push(`**Backend:** ${evidence.stack.backend.join(', ')}\n`);
    }
    
    if (evidence.stack.database && evidence.stack.database.length > 0) {
      sections.push(`**Database:** ${evidence.stack.database.join(', ')}\n`);
    }
    
    sections.push(`\n`);
  }

  // ============================================================================
  // MULTI-SIGNAL STATUS REPORT (Replaces single checkmark)
  // ============================================================================
  sections.push(`## Project Status\n\n`);
  
  // Repository scanned - always true if we got here
  sections.push(`**Repository scanned** ✅\n`);
  sections.push(`*All files discovered and analyzed*\n\n`);
  
  // Documentation generated - always true if we're generating
  sections.push(`**Documentation generated** ✅\n`);
  sections.push(`*This documentation was automatically generated*\n\n`);
  
  // Configuration completeness
  const configItems: string[] = [];
  if (evidence.files.hasPackageJson) configItems.push('package.json');
  if (evidence.files.hasReadme) configItems.push('README.md');
  if (evidence.files.hasGitignore) configItems.push('.gitignore');
  if (evidence.files.hasEnvExample) configItems.push('.env.example');
  
  if (configItems.length >= 2) {
    sections.push(`**Configuration completeness** ✅\n`);
    sections.push(`*Found: ${configItems.join(', ')}*\n\n`);
  } else if (configItems.length === 1) {
    sections.push(`**Configuration completeness** ⚠️\n`);
    sections.push(`*Found: ${configItems.join(', ')}. Consider adding more configuration files.*\n\n`);
  } else {
    sections.push(`**Configuration completeness** ⚠️\n`);
    sections.push(`*Minimal configuration detected. Consider adding package.json, README.md, or .gitignore.*\n\n`);
  }
  
  // Production readiness
  const productionReadiness: string[] = [];
  if (evidence.files.hasPackageJson) productionReadiness.push('Package configuration');
  if (evidence.files.hasTests) productionReadiness.push('Test files');
  if (evidence.files.hasDocker) productionReadiness.push('Docker configuration');
  if (evidence.files.hasLicense) productionReadiness.push('License file');
  
  if (productionReadiness.length >= 3) {
    sections.push(`**Production readiness** ✅\n`);
    sections.push(`*Ready for production: ${productionReadiness.join(', ')}*\n\n`);
  } else if (productionReadiness.length >= 1) {
    sections.push(`**Production readiness** ⚠️\n`);
    sections.push(`*Partially ready: ${productionReadiness.join(', ')}. Consider adding tests and license.*\n\n`);
  } else {
    sections.push(`**Production readiness** ❌\n`);
    sections.push(`*Not ready for production. Missing: package configuration, tests, license.*\n\n`);
  }

  // Repository Information
  if (evidence.meta.version) {
    sections.push(`**Version:** ${evidence.meta.version} ✅\n\n`);
  }
  
  if (evidence.meta.license) {
    sections.push(`**License:** ${evidence.meta.license} ✅\n\n`);
  } else if (evidence.files.hasLicense) {
    sections.push(`**License:** See LICENSE file ✅\n\n`);
  } else {
    sections.push(`**License:** ❌ No license information found\n\n`);
  }

  // Structure Overview
  if (evidence.structure.folders.length > 0 || evidence.structure.entryFiles.length > 0) {
    sections.push(`## Project Structure ✅\n\n`);
    
    if (evidence.structure.entryFiles.length > 0) {
      sections.push(`**Entry Points:**\n`);
      evidence.structure.entryFiles.forEach(file => {
        sections.push(`- \`${file}\`\n`);
      });
      sections.push(`\n`);
    }
    
    if (evidence.structure.folders.length > 0) {
      sections.push(`**Main Directories:**\n`);
      evidence.structure.folders.slice(0, 10).forEach(folder => {
        sections.push(`- \`${folder}/\`\n`);
      });
      sections.push(`\n`);
    }
  }

  // ============================================================================
  // OPTIONAL IMPROVEMENTS DETECTED (Replaces "Missing Components")
  // ============================================================================
  const requiredItems: string[] = [];
  const optionalItems: string[] = [];
  
  // Required components (block generation if missing for Node projects)
  const isNodeProject = evidence.meta.languages.some(l => 
    ['Node.js', 'JavaScript', 'TypeScript'].includes(l)
  );
  
  if (isNodeProject && !evidence.files.hasPackageJson) {
    requiredItems.push('package.json (required for Node.js projects)');
  }
  
  // Optional components (informational only, never mark project as broken)
  if (!evidence.files.hasReadme) {
    optionalItems.push('README.md (improves project discoverability)');
  }
  
  if (!evidence.files.hasTests) {
    optionalItems.push('Test files (improves code quality and maintainability)');
  }
  
  if (!evidence.files.hasLicense) {
    optionalItems.push('LICENSE file (clarifies usage rights)');
  }
  
  if (!evidence.files.hasGitignore) {
    optionalItems.push('.gitignore (prevents committing unnecessary files)');
  }
  
  if (!evidence.files.hasEnvExample && (evidence.files.hasPackageJson || evidence.stack.backend)) {
    optionalItems.push('.env.example (documents required environment variables)');
  }
  
  // Only show required items if they exist (should be rare)
  if (requiredItems.length > 0) {
    sections.push(`## Required Components Missing ❌\n\n`);
    sections.push(`The following required components were not found. Documentation may be incomplete:\n\n`);
    requiredItems.forEach(item => {
      sections.push(`- ${item}\n`);
    });
    sections.push(`\n`);
  }
  
  // Show optional improvements (never marks project as broken)
  if (optionalItems.length > 0) {
    sections.push(`## ⚠️ Optional Improvements Detected\n\n`);
    sections.push(`The following components would improve project quality but are not required:\n\n`);
    optionalItems.forEach(item => {
      sections.push(`- ${item}\n`);
    });
    sections.push(`\n`);
  }

  return sections.join('\n');
}
