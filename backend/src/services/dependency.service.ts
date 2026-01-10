/** Dependency analysis service. */
import { FileDependency } from '../types/analysis.types.js';
import { ASTService } from './ast.service.js';
import path from 'path';

export class DependencyService {
  private astService: ASTService;

  constructor(astService: ASTService) {
    this.astService = astService;
  }

  /**
   * Build dependency graph from imports.
   */
  buildDependencyGraph(repoPath: string): FileDependency[] {
    const dependencies: FileDependency[] = [];
    const sourceFiles = this.astService.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath();
      const relativePath = filePath.replace(repoPath, '').replace(/^[\\/]/, '');

      // Get imports
      for (const importDecl of sourceFile.getImportDeclarations()) {
        const moduleSpecifier = importDecl.getModuleSpecifierValue();
        
        if (!moduleSpecifier) continue;

        // Skip external dependencies (node_modules)
        if (!moduleSpecifier.startsWith('.') && !moduleSpecifier.startsWith('/')) {
          continue;
        }

        // Resolve relative import
        const dir = path.dirname(filePath);
        let resolvedPath: string;
        
        try {
          resolvedPath = path.resolve(dir, moduleSpecifier);
          // Normalize to relative path from repo root
          const relativeTo = resolvedPath.replace(repoPath, '').replace(/^[\\/]/, '');
          
          // Try to find the actual file (handle extensions)
          const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
          let found = false;
          
          for (const ext of extensions) {
            const candidate = relativeTo + ext;
            if (sourceFiles.some(sf => {
              const sfPath = sf.getFilePath().replace(repoPath, '').replace(/^[\\/]/, '');
              return sfPath === candidate;
            })) {
              dependencies.push({
                from: relativePath,
                to: candidate,
                type: 'import'
              });
              found = true;
              break;
            }
          }
        } catch {
          // Skip invalid paths
          continue;
        }
      }
    }

    return dependencies;
  }
}
