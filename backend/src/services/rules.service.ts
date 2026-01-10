/** Rules engine for validating documentation completeness. */
import { AnalysisResult, ApiEndpoint, Service } from '../types/analysis.types.js';
import { RulesResult, RuleViolation } from '../types/rules.types.js';
import { ASTService } from './ast.service.js';
import { SourceFile } from 'ts-morph';
import path from 'path';

export class RulesService {
  private astService: ASTService;

  constructor(astService: ASTService) {
    this.astService = astService;
  }

  /**
   * Validate documentation completeness for all entities.
   */
  validateDocumentation(result: AnalysisResult, repoPath: string): RulesResult {
    const violations: RuleViolation[] = [];

    // Validate APIs
    for (const api of result.apis) {
      violations.push(...this.validateApiDocumentation(api, repoPath));
    }

    // Validate Services
    for (const service of result.services) {
      violations.push(...this.validateServiceDocumentation(service, repoPath));
    }

    // Calculate summary
    const summary = {
      errors: violations.filter(v => v.severity === 'error').length,
      warnings: violations.filter(v => v.severity === 'warning').length,
      info: violations.filter(v => v.severity === 'info').length
    };

    return {
      violations,
      summary
    };
  }

  /**
   * Validate API endpoint documentation.
   */
  private validateApiDocumentation(api: ApiEndpoint, repoPath: string): RuleViolation[] {
    const violations: RuleViolation[] = [];
    // Try to find source file - check both relative and absolute paths
    const absolutePath = path.isAbsolute(api.filePath) 
      ? api.filePath 
      : path.join(repoPath, api.filePath);
    const sourceFile = this.astService.getSourceFile(absolutePath) || 
                      this.astService.getSourceFile(api.filePath);

    if (!sourceFile) {
      violations.push({
        id: `api_no_file_${api.id}`,
        ruleName: 'API_FILE_NOT_FOUND',
        severity: 'error',
        message: `API file not found: ${api.filePath}`,
        entityId: api.id,
        entityType: 'api'
      });
      return violations;
    }

    // Check for JSDoc comments on the route handler
    const hasDocumentation = this.hasJSDocForRoute(sourceFile, api);
    
    if (!hasDocumentation) {
      violations.push({
        id: `api_no_docs_${api.id}`,
        ruleName: 'API_MISSING_DOCUMENTATION',
        severity: 'warning',
        message: `API endpoint ${api.method} ${api.path} is missing documentation`,
        entityId: api.id,
        entityType: 'api',
        suggestion: `Add JSDoc comment describing the ${api.method} ${api.path} endpoint`
      });
    }

    // Check for parameter documentation
    const hasParamDocs = this.hasParameterDocumentation(sourceFile, api);
    if (!hasParamDocs && this.hasParameters(api)) {
      violations.push({
        id: `api_no_params_${api.id}`,
        ruleName: 'API_MISSING_PARAMETER_DOCS',
        severity: 'info',
        message: `API ${api.method} ${api.path} may have parameters but no parameter documentation`,
        entityId: api.id,
        entityType: 'api',
        suggestion: 'Document request parameters and response format'
      });
    }

    return violations;
  }

  /**
   * Validate service documentation.
   */
  private validateServiceDocumentation(service: Service, repoPath: string): RuleViolation[] {
    const violations: RuleViolation[] = [];
    // Try to find source file - check both relative and absolute paths
    const absolutePath = path.isAbsolute(service.filePath) 
      ? service.filePath 
      : path.join(repoPath, service.filePath);
    const sourceFile = this.astService.getSourceFile(absolutePath) || 
                      this.astService.getSourceFile(service.filePath);

    if (!sourceFile) {
      return violations;
    }

    // Find the service class
    const classes = sourceFile.getClasses();
    const serviceClass = classes.find(c => c.getName() === service.name);

    if (!serviceClass) {
      return violations;
    }

    // Check for class-level JSDoc
    const classDocs = serviceClass.getJsDocs();
    if (classDocs.length === 0) {
      violations.push({
        id: `service_no_class_docs_${service.id}`,
        ruleName: 'SERVICE_MISSING_CLASS_DOCS',
        severity: 'warning',
        message: `Service class ${service.name} is missing class-level documentation`,
        entityId: service.id,
        entityType: 'service',
        suggestion: `Add JSDoc comment describing the ${service.name} service`
      });
    }

    // Check for method documentation
    for (const methodName of service.methods) {
      const method = serviceClass.getMethod(methodName);
      if (method) {
        const methodDocs = method.getJsDocs();
        if (methodDocs.length === 0) {
          violations.push({
            id: `service_no_method_docs_${service.id}_${methodName}`,
            ruleName: 'SERVICE_MISSING_METHOD_DOCS',
            severity: 'info',
            message: `Service method ${service.name}.${methodName} is missing documentation`,
            entityId: service.id,
            entityType: 'service',
            suggestion: `Add JSDoc comment for ${methodName} method`
          });
        }
      }
    }

    return violations;
  }

  /**
   * Check if route has JSDoc documentation.
   */
  private hasJSDocForRoute(sourceFile: SourceFile, api: ApiEndpoint): boolean {
    const text = sourceFile.getFullText();
    
    // Look for JSDoc patterns near the route definition
    // Pattern: /** ... */ before app.get/post/etc
    const routePattern = new RegExp(
      `(?:/\\*\\*[\\s\\S]*?\\*/[\\s\\S]*?)?(?:app|router)\\.${api.method.toLowerCase()}\\s*\\(\\s*['"]${api.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`,
      'i'
    );
    
    return routePattern.test(text);
  }

  /**
   * Check if route has parameter documentation.
   */
  private hasParameterDocumentation(sourceFile: SourceFile, api: ApiEndpoint): boolean {
    const text = sourceFile.getFullText();
    
    // Look for @param or @body in JSDoc
    const paramPattern = /@param|@body|@query|@header/i;
    return paramPattern.test(text);
  }

  /**
   * Check if API likely has parameters (heuristic).
   */
  private hasParameters(api: ApiEndpoint): boolean {
    // POST, PUT, PATCH typically have request bodies
    return ['POST', 'PUT', 'PATCH'].includes(api.method);
  }
}
