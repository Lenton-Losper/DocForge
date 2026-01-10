/** AST parsing service using ts-morph. */
import { Project, SourceFile, ClassDeclaration, FunctionDeclaration } from 'ts-morph';
import path from 'path';

export class ASTService {
  private project: Project;

  constructor() {
    this.project = new Project({
      useInMemoryFileSystem: false,
      skipFileDependencyResolution: false
    });
  }

  /**
   * Add source files to project.
   */
  addSourceFiles(filePaths: string[]): void {
    this.project.addSourceFilesAtPaths(filePaths);
  }

  /**
   * Get all classes in the project.
   */
  getClasses(): ClassDeclaration[] {
    const classes: ClassDeclaration[] = [];
    
    for (const sourceFile of this.project.getSourceFiles()) {
      classes.push(...sourceFile.getClasses());
    }
    
    return classes;
  }

  /**
   * Get all functions in the project.
   */
  getFunctions(): FunctionDeclaration[] {
    const functions: FunctionDeclaration[] = [];
    
    for (const sourceFile of this.project.getSourceFiles()) {
      functions.push(...sourceFile.getFunctions());
    }
    
    return functions;
  }

  /**
   * Get source file by path.
   */
  getSourceFile(filePath: string): SourceFile | undefined {
    return this.project.getSourceFile(filePath);
  }

  /**
   * Get all source files.
   */
  getSourceFiles(): SourceFile[] {
    return this.project.getSourceFiles();
  }

  /**
   * Get imports for a file.
   */
  getImports(filePath: string): string[] {
    const sourceFile = this.getSourceFile(filePath);
    if (!sourceFile) return [];

    const imports: string[] = [];
    
    for (const importDeclaration of sourceFile.getImportDeclarations()) {
      const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
      if (moduleSpecifier && !moduleSpecifier.startsWith('.')) {
        // External dependency
        imports.push(moduleSpecifier);
      } else if (moduleSpecifier) {
        // Relative import - resolve to absolute path
        const dir = path.dirname(filePath);
        const resolved = path.resolve(dir, moduleSpecifier);
        imports.push(resolved);
      }
    }

    return imports;
  }

  /**
   * Check if a class extends or implements something.
   */
  getBaseTypes(className: string): string[] {
    const classes = this.getClasses();
    const classDecl = classes.find(c => c.getName() === className);
    
    if (!classDecl) return [];

    const baseTypes: string[] = [];
    
    // Get extended class
    const extended = classDecl.getExtends();
    if (extended) {
      const text = extended.getText();
      baseTypes.push(text);
    }

    // Get implemented interfaces
    for (const impl of classDecl.getImplements()) {
      baseTypes.push(impl.getText());
    }

    return baseTypes;
  }
}
