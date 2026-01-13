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

  // Description
  if (evidence.meta.description) {
    sections.push(`## Description ✅\n\n${evidence.meta.description}\n`);
  } else {
    sections.push(`## Description ❌\n\n*No description found in repository.*\n\nTo add a description:\n- Add a \`description\` field to \`package.json\`\n- Or create a \`README.md\` file with project information\n`);
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

  // Project Status
  sections.push(`## Project Status ✅\n\n`);
  
  const statusItems: string[] = [];
  if (evidence.files.hasReadme) statusItems.push('✅ README file present');
  if (evidence.files.hasPackageJson) statusItems.push('✅ Package configuration found');
  if (evidence.files.hasTests) statusItems.push('✅ Test files detected');
  if (evidence.files.hasDocker) statusItems.push('✅ Docker configuration found');
  if (evidence.files.hasGitignore) statusItems.push('✅ .gitignore present');
  if (evidence.files.hasLicense) statusItems.push('✅ License file found');
  
  if (statusItems.length > 0) {
    sections.push(statusItems.join('\n') + '\n');
  } else {
    sections.push('*Basic project structure detected*\n');
  }
  
  sections.push(`\n`);

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

  // Missing Sections Warning
  const missingItems: string[] = [];
  if (!evidence.files.hasReadme) missingItems.push('README.md');
  if (!evidence.files.hasPackageJson && evidence.meta.languages.includes('JavaScript') || evidence.meta.languages.includes('TypeScript')) {
    missingItems.push('package.json');
  }
  if (!evidence.files.hasTests) missingItems.push('Test files');
  
  if (missingItems.length > 0) {
    sections.push(`## Missing Components ❌\n\n`);
    sections.push(`The following components were not found:\n`);
    missingItems.forEach(item => {
      sections.push(`- ${item}\n`);
    });
    sections.push(`\n`);
  }

  return sections.join('\n');
}
