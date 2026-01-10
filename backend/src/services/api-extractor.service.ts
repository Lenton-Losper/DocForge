/** API endpoint extraction service. */
import { ApiEndpoint } from '../types/analysis.types.js';
import { ASTService } from './ast.service.js';
import { SourceFile, Node, SyntaxKind } from 'ts-morph';

export class ApiExtractorService {
  private astService: ASTService;

  constructor(astService: ASTService) {
    this.astService = astService;
  }

  /**
   * Extract REST API endpoints from Express/Fastify routes.
   */
  extractApis(repoPath: string): ApiEndpoint[] {
    const apis: ApiEndpoint[] = [];
    const sourceFiles = this.astService.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath();
      const relativePath = filePath.replace(repoPath, '').replace(/^[\\/]/, '');

      // Look for Express/Fastify route patterns
      // Pattern: app.get('/path', handler) or router.post('/path', handler)
      this.extractRoutesFromFile(sourceFile, relativePath, apis);
    }

    return apis;
  }

  /**
   * Extract routes from a source file.
   */
  private extractRoutesFromFile(
    sourceFile: SourceFile,
    filePath: string,
    apis: ApiEndpoint[]
  ): void {
    const httpMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
    
    // Find all call expressions
    sourceFile.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKind(SyntaxKind.CallExpression);
        if (!callExpr) return;

        const expression = callExpr.getExpression();
        const expressionText = expression.getText();

        // Check if it's a route method call (app.get, router.post, etc.)
        for (const method of httpMethods) {
          const methodPattern = new RegExp(`\\.${method}\\s*\\(|^${method}\\s*\\(`, 'i');
          if (methodPattern.test(expressionText)) {
            const args = callExpr.getArguments();
            
            if (args.length >= 1) {
              const pathArg = args[0];
              const pathText = pathArg.getText().replace(/['"]/g, '');
              
              // Extract controller/function name
              const parent = callExpr.getParent();
              let controllerName = 'unknown';
              
              if (parent) {
                const func = parent.getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) ||
                            parent.getFirstAncestorByKind(SyntaxKind.ArrowFunction) ||
                            parent.getFirstAncestorByKind(SyntaxKind.MethodDeclaration);
                
                if (func) {
                  const nameNode = func.getFirstChildByKind(SyntaxKind.Identifier);
                  if (nameNode) {
                    controllerName = nameNode.getText();
                  }
                }
              }

              apis.push({
                id: `${method.toUpperCase()}_${pathText}_${apis.length}`,
                method: method.toUpperCase(),
                path: pathText,
                controller: controllerName,
                filePath: filePath
              });
            }
          }
        }
      }
    });
  }
}
