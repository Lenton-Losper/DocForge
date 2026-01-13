/**
 * Evidence Extraction Service
 * 
 * Scans a GitHub repository and extracts structured, verifiable evidence.
 * NO AI, NO GUESSING - only facts from actual files.
 */

import { Octokit } from '@octokit/rest';
import { RepoStructure, FileContent } from './repositoryAnalyzer.js';

export interface RepoEvidence {
  meta: {
    name?: string;
    description?: string;
    languages: string[];
    license?: string;
    version?: string;
  };
  files: {
    hasReadme: boolean;
    hasPackageJson: boolean;
    hasEnvExample: boolean;
    hasDocker: boolean;
    hasTests: boolean;
    hasGitignore: boolean;
    hasLicense: boolean;
  };
  stack: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    tools?: string[];
  };
  scripts: string[];
  dependencies: string[];
  devDependencies: string[];
  apiEvidence: {
    routes: string[];
    controllersFound: boolean;
    hasApiFolder: boolean;
  };
  structure: {
    folders: string[];
    entryFiles: string[];
    configFiles: string[];
  };
}

/**
 * Extract structured evidence from repository files.
 * This function NEVER guesses - only reports what actually exists.
 */
export function extractEvidence(repoStructure: RepoStructure, repoOwner: string, repoName: string): RepoEvidence {
  const evidence: RepoEvidence = {
    meta: {
      name: repoName,
      languages: [],
    },
    files: {
      hasReadme: false,
      hasPackageJson: false,
      hasEnvExample: false,
      hasDocker: false,
      hasTests: false,
      hasGitignore: false,
      hasLicense: false,
    },
    stack: {},
    scripts: [],
    dependencies: [],
    devDependencies: [],
    apiEvidence: {
      routes: [],
      controllersFound: false,
      hasApiFolder: false,
    },
    structure: {
      folders: [],
      entryFiles: [],
      configFiles: [],
    },
  };

  // Extract languages from file extensions
  const languageSet = new Set<string>();
  repoStructure.files.forEach(file => {
    const ext = file.path.split('.').pop()?.toLowerCase();
    if (ext) {
      if (['ts', 'tsx'].includes(ext)) {
        languageSet.add('TypeScript');
        languageSet.add('Node.js');
      } else if (['js', 'jsx'].includes(ext)) {
        languageSet.add('JavaScript');
        languageSet.add('Node.js');
      } else if (ext === 'py') languageSet.add('Python');
      else if (ext === 'java') languageSet.add('Java');
      else if (ext === 'go') languageSet.add('Go');
      else if (ext === 'rb') languageSet.add('Ruby');
      else if (ext === 'rs') languageSet.add('Rust');
    }
  });
  evidence.meta.languages = Array.from(languageSet);

  // Scan files for evidence
  repoStructure.files.forEach(file => {
    const path = file.path.toLowerCase();
    const fileName = file.path.split('/').pop()?.toLowerCase() || '';

    // File existence checks
    if (path.includes('readme')) evidence.files.hasReadme = true;
    if (fileName === 'package.json') evidence.files.hasPackageJson = true;
    if (fileName === '.env.example' || fileName === 'env.example') evidence.files.hasEnvExample = true;
    if (fileName === 'dockerfile' || fileName === 'docker-compose.yml') evidence.files.hasDocker = true;
    if (path.includes('test') || path.includes('spec')) evidence.files.hasTests = true;
    if (fileName === '.gitignore') evidence.files.hasGitignore = true;
    if (fileName === 'license' || fileName === 'license.txt' || fileName === 'license.md') evidence.files.hasLicense = true;

    // Extract package.json data
    if (fileName === 'package.json') {
      try {
        const pkg = JSON.parse(file.content);
        if (pkg.name) evidence.meta.name = pkg.name;
        if (pkg.description) evidence.meta.description = pkg.description;
        if (pkg.version) evidence.meta.version = pkg.version;
        if (pkg.license) evidence.meta.license = pkg.license;
        if (pkg.scripts) evidence.scripts = Object.keys(pkg.scripts);
        if (pkg.dependencies) evidence.dependencies = Object.keys(pkg.dependencies);
        if (pkg.devDependencies) evidence.devDependencies = Object.keys(pkg.devDependencies);

        // Infer stack from dependencies
        const deps = [...(pkg.dependencies || {}), ...(pkg.devDependencies || {})];
        const depNames = Object.keys(deps).map(d => d.toLowerCase());

        // Frontend detection
        if (depNames.some(d => ['react', 'vue', 'angular', 'svelte'].includes(d))) {
          evidence.stack.frontend = depNames.filter(d => 
            ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'vite', 'webpack'].includes(d)
          );
        }

        // Backend detection
        if (depNames.some(d => ['express', 'fastify', 'koa', 'nest'].includes(d))) {
          evidence.stack.backend = depNames.filter(d => 
            ['express', 'fastify', 'koa', 'nest', 'hapi'].includes(d)
          );
        }

        // Database detection
        if (depNames.some(d => ['mongoose', 'prisma', 'sequelize', 'typeorm'].includes(d))) {
          evidence.stack.database = depNames.filter(d => 
            ['mongoose', 'prisma', 'sequelize', 'typeorm', 'pg', 'mysql2'].includes(d)
          );
        }

        // Tools
        evidence.stack.tools = depNames.filter(d => 
          ['eslint', 'prettier', 'jest', 'mocha', 'typescript', 'webpack', 'babel'].includes(d)
        );
      } catch (e) {
        // Invalid JSON - skip
      }
    }

    // API evidence
    if (path.includes('/api/') || path.includes('/routes/') || path.includes('/controllers/')) {
      evidence.apiEvidence.hasApiFolder = true;
      if (file.path.endsWith('.ts') || file.path.endsWith('.js')) {
        evidence.apiEvidence.controllersFound = true;
        // Extract route patterns from file content
        const routeMatches = file.content.match(/(?:router|app)\.(?:get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/g);
        if (routeMatches) {
          routeMatches.forEach(match => {
            const routeMatch = match.match(/['"`]([^'"`]+)['"`]/);
            if (routeMatch && routeMatch[1]) {
              evidence.apiEvidence.routes.push(routeMatch[1]);
            }
          });
        }
      }
    }

    // Structure analysis
    const pathParts = file.path.split('/');
    if (pathParts.length > 1) {
      const folder = pathParts[0];
      if (!evidence.structure.folders.includes(folder)) {
        evidence.structure.folders.push(folder);
      }
    }

    // Entry files
    if (fileName === 'index.js' || fileName === 'index.ts' || fileName === 'main.js' || fileName === 'main.ts' || fileName === 'app.js' || fileName === 'app.ts') {
      evidence.structure.entryFiles.push(file.path);
    }

    // Config files
    if (['.env.example', 'tsconfig.json', 'webpack.config.js', 'vite.config.js', 'jest.config.js'].includes(fileName)) {
      evidence.structure.configFiles.push(file.path);
    }
  });

  // Remove duplicates
  evidence.apiEvidence.routes = [...new Set(evidence.apiEvidence.routes)];
  evidence.structure.folders = [...new Set(evidence.structure.folders)];

  return evidence;
}
