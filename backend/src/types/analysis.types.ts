/** Type definitions for repository analysis. */

export type EntityType = 'service' | 'api' | 'role' | 'file' | 'controller' | 'function' | 'class';

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  filePath: string;
  metadata: Record<string, unknown>;
}

export interface Relationship {
  from: string; // Entity ID
  to: string; // Entity ID
  type: 'depends_on' | 'exposes' | 'uses' | 'imports';
  metadata?: Record<string, unknown>;
}

export interface Service {
  id: string;
  name: string;
  filePath: string;
  methods: string[];
  dependencies: string[];
}

export interface ApiEndpoint {
  id: string;
  method: string; // GET, POST, PUT, DELETE, etc.
  path: string;
  controller: string;
  filePath: string;
  roles?: string[];
}

export interface Role {
  id: string;
  name: string;
  filePath: string;
  context: string; // Where it was found
}

export interface FileDependency {
  from: string; // File path
  to: string; // File path
  type: 'import' | 'require';
}

export interface FileAnalysis {
  path: string;
  changeFrequency: number; // Commits in last 50
  lastModified?: string;
}

export interface AnalysisResult {
  services: Service[];
  apis: ApiEndpoint[];
  roles: Role[];
  dependencies: FileDependency[];
  files: FileAnalysis[];
  entities: Entity[];
  relationships: Relationship[];
}
