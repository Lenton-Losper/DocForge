/** Role detection service. */
import { Role } from '../types/analysis.types.js';
import { ASTService } from './ast.service.js';
import { SourceFile } from 'ts-morph';

export class RoleDetectorService {
  private astService: ASTService;

  constructor(astService: ASTService) {
    this.astService = astService;
  }

  /**
   * Detect role strings in codebase.
   */
  detectRoles(repoPath: string): Role[] {
    const roles: Role[] = [];
    const sourceFiles = this.astService.getSourceFiles();
    const rolePatterns = [
      /['"](admin|administrator)['"]/gi,
      /['"](user|users?)['"]/gi,
      /['"](manager|managers?)['"]/gi,
      /Role\.(Admin|User|Manager|Guest)/gi,
      /role\s*[=:]\s*['"]([^'"]+)['"]/gi
    ];

    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath();
      const relativePath = filePath.replace(repoPath, '').replace(/^[\\/]/, '');
      const text = sourceFile.getFullText();

      // Search for role patterns
      for (const pattern of rolePatterns) {
        const matches = text.matchAll(pattern);
        
        for (const match of matches) {
          let roleName = match[1] || match[0];
          
          // Clean up role name
          roleName = roleName.replace(/['"]/g, '').trim();
          
          if (roleName && roleName.length > 0 && roleName.length < 50) {
            // Check if we already found this role
            const existing = roles.find(r => 
              r.name.toLowerCase() === roleName.toLowerCase() && 
              r.filePath === relativePath
            );
            
            if (!existing) {
              roles.push({
                id: `role_${roles.length}_${roleName}`,
                name: roleName,
                filePath: relativePath,
                context: this.extractContext(sourceFile, match.index || 0)
              });
            }
          }
        }
      }
    }

    return roles;
  }

  /**
   * Extract context around a match (line number, function name, etc.).
   */
  private extractContext(sourceFile: SourceFile, position: number): string {
    const lineAndColumn = sourceFile.getLineAndColumnAtPos(position);
    return `Line ${lineAndColumn.line}`;
  }
}
