/** Knowledge graph builder. */
import {
  Entity,
  Relationship,
  EntityType,
  Service,
  ApiEndpoint,
  Role,
  FileDependency,
  AnalysisResult
} from '../types/analysis.types.js';

export class KnowledgeGraph {
  private entities: Map<string, Entity> = new Map();
  private relationships: Relationship[] = [];

  /**
   * Add entity to graph.
   */
  addEntity(
    id: string,
    type: EntityType,
    name: string,
    filePath: string,
    metadata: Record<string, unknown> = {}
  ): void {
    this.entities.set(id, {
      id,
      type,
      name,
      filePath,
      metadata
    });
  }

  /**
   * Add relationship between entities.
   */
  addRelationship(
    from: string,
    to: string,
    type: 'depends_on' | 'exposes' | 'uses' | 'imports',
    metadata?: Record<string, unknown>
  ): void {
    // Verify both entities exist
    if (!this.entities.has(from) || !this.entities.has(to)) {
      return;
    }

    this.relationships.push({
      from,
      to,
      type,
      metadata
    });
  }

  /**
   * Build graph from analysis result.
   */
  buildFromAnalysis(result: AnalysisResult): void {
    // Add services as entities
    for (const service of result.services) {
      this.addEntity(service.id, 'service', service.name, service.filePath, {
        methods: service.methods,
        dependencies: service.dependencies
      });
    }

    // Add APIs as entities
    for (const api of result.apis) {
      this.addEntity(api.id, 'api', `${api.method} ${api.path}`, api.filePath, {
        method: api.method,
        path: api.path,
        controller: api.controller,
        roles: api.roles
      });

      // Link API to controller
      if (api.controller && api.controller !== 'unknown') {
        const controllerId = `controller_${api.controller}`;
        this.addEntity(controllerId, 'controller', api.controller, api.filePath);
        this.addRelationship(api.id, controllerId, 'uses');
      }
    }

    // Add roles as entities
    for (const role of result.roles) {
      this.addEntity(role.id, 'role', role.name, role.filePath, {
        context: role.context
      });
    }

    // Add file dependencies as relationships
    for (const dep of result.dependencies) {
      const fromId = `file_${dep.from}`;
      const toId = `file_${dep.to}`;
      
      this.addEntity(fromId, 'file', dep.from, dep.from);
      this.addEntity(toId, 'file', dep.to, dep.to);
      this.addRelationship(fromId, toId, 'depends_on', { type: dep.type });
    }
  }

  /**
   * Export graph as structured data.
   */
  export(): { entities: Entity[]; relationships: Relationship[] } {
    return {
      entities: Array.from(this.entities.values()),
      relationships: this.relationships
    };
  }
}
