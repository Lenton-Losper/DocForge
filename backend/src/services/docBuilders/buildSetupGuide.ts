/**
 * Deterministic Setup Guide Builder
 * 
 * Generates installation and setup instructions from verifiable evidence.
 */

import { RepoEvidence } from '../evidenceExtractor.js';

export function buildSetupGuide(evidence: RepoEvidence): string {
  const sections: string[] = [];

  sections.push(`# Installation & Setup Guide\n\n`);

  // Prerequisites
  sections.push(`## Prerequisites ✅\n\n`);
  
  const prerequisites: string[] = [];
  if (evidence.meta.languages.includes('Node.js') || evidence.meta.languages.includes('JavaScript') || evidence.meta.languages.includes('TypeScript')) {
    prerequisites.push('Node.js (version 14 or higher recommended)');
    prerequisites.push('npm or yarn package manager');
  }
  if (evidence.meta.languages.includes('Python')) {
    prerequisites.push('Python 3.7 or higher');
    prerequisites.push('pip package manager');
  }
  if (evidence.stack.database && evidence.stack.database.length > 0) {
    prerequisites.push('Database server (see Database section below)');
  }
  
  if (prerequisites.length > 0) {
    prerequisites.forEach(req => {
      sections.push(`- ${req}\n`);
    });
  } else {
    sections.push(`*No specific prerequisites detected.*\n`);
  }
  
  sections.push(`\n`);

  // Installation Steps
  sections.push(`## Installation ✅\n\n`);

  if (evidence.files.hasPackageJson) {
    sections.push(`### Using npm\n\n`);
    sections.push(`\`\`\`bash\n`);
    sections.push(`# Clone the repository\n`);
    sections.push(`git clone <repository-url>\n`);
    sections.push(`cd ${evidence.meta.name || 'project'}\n\n`);
    sections.push(`# Install dependencies\n`);
    sections.push(`npm install\n`);
    sections.push(`\`\`\`\n\n`);

    if (evidence.dependencies.length > 0) {
      sections.push(`**Dependencies installed:** ${evidence.dependencies.length} packages ✅\n\n`);
    }
  } else if (evidence.meta.languages.includes('Python')) {
    sections.push(`### Using pip\n\n`);
    sections.push(`\`\`\`bash\n`);
    sections.push(`# Clone the repository\n`);
    sections.push(`git clone <repository-url>\n`);
    sections.push(`cd ${evidence.meta.name || 'project'}\n\n`);
    sections.push(`# Install dependencies\n`);
    sections.push(`pip install -r requirements.txt\n`);
    sections.push(`\`\`\`\n\n`);
  } else {
    sections.push(`### Basic Setup ❌\n\n`);
    sections.push(`*No package configuration file detected.*\n\n`);
    sections.push(`To enable automatic dependency installation:\n`);
    sections.push(`- For Node.js projects: Create a \`package.json\` file\n`);
    sections.push(`- For Python projects: Create a \`requirements.txt\` file\n`);
    sections.push(`\n`);
  }

  // Environment Configuration
  if (evidence.files.hasEnvExample) {
    sections.push(`## Environment Configuration ✅\n\n`);
    sections.push(`1. Copy the example environment file:\n\n`);
    sections.push(`\`\`\`bash\n`);
    sections.push(`cp .env.example .env\n`);
    sections.push(`\`\`\`\n\n`);
    sections.push(`2. Edit \`.env\` and configure the required variables.\n\n`);
  } else {
    sections.push(`## Environment Configuration ❌\n\n`);
    sections.push(`*No \`.env.example\` file found.*\n\n`);
    sections.push(`To enable environment configuration:\n`);
    sections.push(`- Create a \`.env.example\` file with required environment variables\n`);
    sections.push(`- Document each variable's purpose and default values\n`);
    sections.push(`\n`);
  }

  // Database Setup
  if (evidence.stack.database && evidence.stack.database.length > 0) {
    sections.push(`## Database Setup ✅\n\n`);
    sections.push(`This project uses the following database technologies:\n`);
    evidence.stack.database.forEach(db => {
      sections.push(`- ${db}\n`);
    });
    sections.push(`\n`);
    sections.push(`**Setup Instructions:**\n`);
    sections.push(`- Install and configure the database server\n`);
    sections.push(`- Update database connection settings in \`.env\` file\n`);
    sections.push(`- Run database migrations if applicable\n`);
    sections.push(`\n`);
  }

  // Available Scripts
  if (evidence.scripts.length > 0) {
    sections.push(`## Available Scripts ✅\n\n`);
    sections.push(`The following scripts are available:\n\n`);
    evidence.scripts.forEach(script => {
      sections.push(`- \`npm run ${script}\` - Run ${script} script\n`);
    });
    sections.push(`\n`);
  }

  // Docker Setup
  if (evidence.files.hasDocker) {
    sections.push(`## Docker Setup ✅\n\n`);
    sections.push(`This project includes Docker configuration.\n\n`);
    sections.push(`\`\`\`bash\n`);
    sections.push(`# Build the Docker image\n`);
    sections.push(`docker build -t ${evidence.meta.name || 'project'} .\n\n`);
    sections.push(`# Run the container\n`);
    sections.push(`docker run -p 3000:3000 ${evidence.meta.name || 'project'}\n`);
    sections.push(`\`\`\`\n\n`);
  }

  // Running the Project
  sections.push(`## Running the Project\n\n`);
  
  if (evidence.scripts.includes('start') || evidence.scripts.includes('dev')) {
    const startScript = evidence.scripts.includes('dev') ? 'dev' : 'start';
    sections.push(`\`\`\`bash\n`);
    sections.push(`npm run ${startScript}\n`);
    sections.push(`\`\`\`\n\n`);
  } else if (evidence.structure.entryFiles.length > 0) {
    const entryFile = evidence.structure.entryFiles[0];
    sections.push(`\`\`\`bash\n`);
    if (entryFile.endsWith('.ts')) {
      sections.push(`npx ts-node ${entryFile}\n`);
    } else {
      sections.push(`node ${entryFile}\n`);
    }
    sections.push(`\`\`\`\n\n`);
  } else {
    sections.push(`*No start script or entry point detected.*\n\n`);
    sections.push(`To run this project:\n`);
    sections.push(`- Add a \`start\` or \`dev\` script to \`package.json\`\n`);
    sections.push(`- Or specify the main entry point file\n`);
    sections.push(`\n`);
  }

  // Troubleshooting
  sections.push(`## Troubleshooting\n\n`);
  sections.push(`### Common Issues\n\n`);
  
  if (!evidence.files.hasEnvExample) {
    sections.push(`**Missing environment variables:**\n`);
    sections.push(`- Create a \`.env\` file based on your project's requirements\n`);
    sections.push(`\n`);
  }
  
  if (!evidence.files.hasPackageJson && (evidence.meta.languages.includes('JavaScript') || evidence.meta.languages.includes('TypeScript'))) {
    sections.push(`**No package.json found:**\n`);
    sections.push(`- Initialize npm: \`npm init\`\n`);
    sections.push(`- Install required dependencies manually\n`);
    sections.push(`\n`);
  }

  return sections.join('\n');
}
