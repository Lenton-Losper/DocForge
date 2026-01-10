/** Main analysis orchestration service. */
import { AnalysisResult, Service } from '../types/analysis.types.js';
import { RepoService } from './repo.service.js';
import { ASTService } from './ast.service.js';
import { DependencyService } from './dependency.service.js';
import { ApiExtractorService } from './api-extractor.service.js';
import { RoleDetectorService } from './role-detector.service.js';
import { KnowledgeGraph } from '../graph/knowledge-graph.js';
import { getSourceFiles } from '../utils/file.utils.js';

export class AnalyzeService {
  /**
   * Analyze a repository and return structured results.
   */
  async analyzeRepository(repoPath: string): Promise<AnalysisResult> {
    // Initialize services
    const repoService = new RepoService(repoPath);
    const astService = new ASTService();
    
    // Get all source files
    const sourceFiles = await getSourceFiles(repoPath);
    astService.addSourceFiles(sourceFiles);

    // Run analyses in parallel where possible
    const [files, dependencies, apis, roles] = await Promise.all([
      repoService.analyzeFiles(repoPath),
      Promise.resolve(new DependencyService(astService).buildDependencyGraph(repoPath)),
      Promise.resolve(new ApiExtractorService(astService).extractApis(repoPath)),
      Promise.resolve(new RoleDetectorService(astService).detectRoles(repoPath))
    ]);

    // Extract services from classes
    const services = this.extractServices(astService, repoPath);

    // Build knowledge graph
    const graph = new KnowledgeGraph();
    const result: AnalysisResult = {
      services,
      apis,
      roles,
      dependencies,
      files,
      entities: [],
      relationships: []
    };

    graph.buildFromAnalysis(result);
    const graphData = graph.export();
    result.entities = graphData.entities;
    result.relationships = graphData.relationships;

    return result;
  }

  /**
   * Extract services from classes (classes with "Service" suffix or in services directory).
   */
  private extractServices(astService: ASTService, repoPath: string): Service[] {
    const services: Service[] = [];
    const classes = astService.getClasses();

    for (const classDecl of classes) {
      const className = classDecl.getName();
      if (!className) continue;

      const filePath = classDecl.getSourceFile().getFilePath();
      const relativePath = filePath.replace(repoPath, '').replace(/^[\\/]/, '');

      // Check if it's a service (name ends with Service or in services directory)
      const isService = className.endsWith('Service') || 
                       relativePath.toLowerCase().includes('service');

      if (isService) {
        // Extract methods
        const methods = classDecl.getMethods().map(m => m.getName());
        
        // Extract dependencies (imports)
        const imports = astService.getImports(filePath);

        services.push({
          id: `service_${services.length}_${className}`,
          name: className,
          filePath: relativePath,
          methods,
          dependencies: imports
        });
      }
    }

    return services;
  }
}
