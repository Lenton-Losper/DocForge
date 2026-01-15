/**
 * Mermaid Diagram Generator
 * 
 * Generates Mermaid diagrams for API and Architecture documentation.
 * All diagrams are deterministic and based on actual evidence.
 */

import { RepoEvidence } from './evidenceExtractor.js';

export interface MermaidDiagram {
  type: 'flowchart' | 'graph' | 'sequenceDiagram';
  content: string;
  description: string;
}

/**
 * Generate API architecture diagram from evidence
 */
export function generateApiDiagram(evidence: RepoEvidence): MermaidDiagram {
  const hasApiRoutes = evidence.apiEvidence.routes.length > 0;
  const hasControllers = evidence.apiEvidence.controllersFound;
  const hasBackend = evidence.stack.backend && evidence.stack.backend.length > 0;
  const hasDatabase = evidence.stack.database && evidence.stack.database.length > 0;

  if (hasApiRoutes && hasBackend) {
    // Full API architecture
    const routes = evidence.apiEvidence.routes.slice(0, 5); // Limit to 5 for readability
    const routeNodes = routes.map((route, i) => `  Route${i + 1}["${route}"]`).join('\n');
    const routeConnections = routes.map((_, i) => `  Client --> Route${i + 1}`).join('\n');
    const backendConnections = routes.map((_, i) => `  Route${i + 1} --> Backend`).join('\n');
    const dbConnection = hasDatabase ? '  Backend --> Database' : '';

    return {
      type: 'flowchart',
      content: `flowchart TB
  Client[Client Application]
${routeNodes}
  Backend[Backend Service]
${hasDatabase ? '  Database[(Database)]' : ''}

${routeConnections}
${backendConnections}
${dbConnection}`,
      description: 'API architecture showing detected routes and backend services'
    };
  } else if (hasBackend) {
    // Generic backend architecture
    return {
      type: 'flowchart',
      content: `flowchart LR
  Client[Client] --> Backend[Backend Service]
${hasDatabase ? '  Backend --> Database[(Database)]' : ''}`,
      description: 'Backend service architecture'
    };
  } else {
    // Fallback: Generic API structure
    return {
      type: 'flowchart',
      content: `flowchart TB
  Client[Client Application]
  API[API Layer]
  Service[Service Layer]
${hasDatabase ? '  Database[(Database)]' : ''}

  Client --> API
  API --> Service
${hasDatabase ? '  Service --> Database' : ''}`,
      description: 'Generic API architecture structure'
    };
  }
}

/**
 * Generate project architecture diagram from evidence
 */
export function generateArchitectureDiagram(evidence: RepoEvidence): MermaidDiagram {
  const hasFrontend = evidence.stack.frontend && evidence.stack.frontend.length > 0;
  const hasBackend = evidence.stack.backend && evidence.stack.backend.length > 0;
  const hasDatabase = evidence.stack.database && evidence.stack.database.length > 0;
  const entryFiles = evidence.structure.entryFiles.slice(0, 3); // Limit to 3 entry points

  // Build diagram based on detected stack
  let diagram = 'flowchart TB\n';
  
  if (hasFrontend && hasBackend) {
    // Full-stack application
    diagram += '  Frontend[Frontend Application]\n';
    diagram += '  Backend[Backend Service]\n';
    if (hasDatabase) {
      diagram += '  Database[(Database)]\n';
    }
    diagram += '\n  Frontend --> Backend\n';
    if (hasDatabase) {
      diagram += '  Backend --> Database\n';
    }
    
    if (entryFiles.length > 0) {
      diagram += '\n  subgraph Entry["Entry Points"]\n';
      entryFiles.forEach((file, i) => {
        const fileName = file.split('/').pop() || file;
        diagram += `    E${i + 1}["${fileName}"]\n`;
      });
      diagram += '  end\n';
    }
  } else if (hasFrontend) {
    // Frontend-only
    diagram += '  Frontend[Frontend Application]\n';
    if (entryFiles.length > 0) {
      diagram += '\n  subgraph Entry["Entry Points"]\n';
      entryFiles.forEach((file, i) => {
        const fileName = file.split('/').pop() || file;
        diagram += `    E${i + 1}["${fileName}"]\n`;
      });
      diagram += '  end\n';
    }
  } else if (hasBackend) {
    // Backend-only
    diagram += '  Backend[Backend Service]\n';
    if (hasDatabase) {
      diagram += '  Database[(Database)]\n';
      diagram += '\n  Backend --> Database\n';
    }
    if (entryFiles.length > 0) {
      diagram += '\n  subgraph Entry["Entry Points"]\n';
      entryFiles.forEach((file, i) => {
        const fileName = file.split('/').pop() || file;
        diagram += `    E${i + 1}["${fileName}"]\n`;
      });
      diagram += '  end\n';
    }
  } else {
    // Generic structure
    diagram += '  Application[Application]\n';
    if (entryFiles.length > 0) {
      diagram += '\n  subgraph Entry["Entry Points"]\n';
      entryFiles.forEach((file, i) => {
        const fileName = file.split('/').pop() || file;
        diagram += `    E${i + 1}["${fileName}"]\n`;
      });
      diagram += '  end\n';
    }
    
    // Show folder structure if available
    if (evidence.structure.folders.length > 0) {
      diagram += '\n  subgraph Folders["Main Directories"]\n';
      evidence.structure.folders.slice(0, 5).forEach((folder, i) => {
        diagram += `    F${i + 1}["${folder}/"]\n`;
      });
      diagram += '  end\n';
    }
  }

  return {
    type: 'flowchart',
    content: diagram,
    description: 'Project architecture based on detected structure and dependencies'
  };
}

/**
 * Generate folder structure diagram
 */
export function generateFolderStructureDiagram(evidence: RepoEvidence): MermaidDiagram | null {
  if (evidence.structure.folders.length === 0) {
    return null;
  }

  const folders = evidence.structure.folders.slice(0, 10); // Limit to 10 folders
  let diagram = 'graph TD\n';
  diagram += '  Root[Project Root]\n\n';
  
  folders.forEach((folder, i) => {
    diagram += `  Root --> Folder${i + 1}["${folder}/"]\n`;
  });

  return {
    type: 'graph',
    content: diagram,
    description: 'Project folder structure'
  };
}
