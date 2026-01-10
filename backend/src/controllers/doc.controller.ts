/** Documentation generation controller. */
import { Request, Response } from 'express';
import { AnalyzeService } from '../services/analyze.service.js';
import { RulesService } from '../services/rules.service.js';
import { LLMFixService } from '../services/llm-fix.service.js';
import { DocGeneratorService, DocFormat } from '../services/doc-generator.service.js';
import { pathExists } from '../utils/file.utils.js';
import { writeJson } from '../utils/file.utils.js';
import { writeFile } from 'fs/promises';
import path from 'path';

export class DocController {
  private analyzeService: AnalyzeService;
  private docGenerator: DocGeneratorService;

  constructor() {
    this.analyzeService = new AnalyzeService();
    this.docGenerator = new DocGeneratorService();
  }

  /**
   * Handle POST /api/generate-docs request.
   */
  async generateDocs(req: Request, res: Response): Promise<void> {
    try {
      const { repoPath, format = 'markdown', runRules = true, generateFixes = false, llmApiKey, llmProvider = 'mock' } = req.body;

      if (!repoPath || typeof repoPath !== 'string') {
        res.status(400).json({
          error: 'Missing or invalid repoPath in request body'
        });
        return;
      }

      if (!(await pathExists(repoPath))) {
        res.status(400).json({
          error: `Repository path does not exist: ${repoPath}`
        });
        return;
      }

      // Run analysis
      const analysis = await this.analyzeService.analyzeRepository(repoPath);

      // Run rules if requested
      let rules;
      let fixes;
      
      if (runRules) {
        const { getSourceFiles } = await import('../utils/file.utils.js');
        const { ASTService } = await import('../services/ast.service.js');
        
        const sourceFiles = await getSourceFiles(repoPath);
        const astService = new ASTService();
        astService.addSourceFiles(sourceFiles);
        
        const rulesService = new RulesService(astService);
        rules = rulesService.validateDocumentation(analysis, repoPath);

        // Generate fixes if requested
        if (generateFixes) {
          const llmService = new LLMFixService(true, llmApiKey, llmProvider);
          fixes = await llmService.generateFixes(rules.violations, analysis);
        }
      }

      // Generate documentation
      const doc = this.docGenerator.generateDocumentation(
        analysis,
        rules,
        fixes,
        format as DocFormat
      );

      // Save documentation
      const extension = format === 'html' ? 'html' : format === 'json' ? 'json' : 'md';
      const outputPath = path.join(process.cwd(), 'output', `documentation.${extension}`);
      await writeFile(outputPath, doc.content, 'utf-8');

      // Return result
      res.json({
        success: true,
        format: doc.format,
        metadata: doc.metadata,
        outputPath,
        contentLength: doc.content.length
      });
    } catch (error) {
      console.error('Documentation generation error:', error);
      res.status(500).json({
        error: 'Documentation generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Handle POST /api/validate-docs request.
   */
  async validateDocs(req: Request, res: Response): Promise<void> {
    try {
      const { repoPath } = req.body;

      if (!repoPath || typeof repoPath !== 'string') {
        res.status(400).json({
          error: 'Missing or invalid repoPath in request body'
        });
        return;
      }

      if (!(await pathExists(repoPath))) {
        res.status(400).json({
          error: `Repository path does not exist: ${repoPath}`
        });
        return;
      }

      // Run analysis
      const analysis = await this.analyzeService.analyzeRepository(repoPath);

      // Run rules
      const { getSourceFiles } = await import('../utils/file.utils.js');
      const { ASTService } = await import('../services/ast.service.js');
      
      const sourceFiles = await getSourceFiles(repoPath);
      const astService = new ASTService();
      astService.addSourceFiles(sourceFiles);

      const rulesService = new RulesService(astService);
      const rules = rulesService.validateDocumentation(analysis, repoPath);

      // Return validation results
      res.json({
        success: true,
        rules
      });
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        error: 'Validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
