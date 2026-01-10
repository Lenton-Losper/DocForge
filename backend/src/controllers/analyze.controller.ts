/** Analysis controller. */
import { Request, Response } from 'express';
import { AnalyzeService } from '../services/analyze.service.js';
import { pathExists } from '../utils/file.utils.js';
import { writeJson } from '../utils/file.utils.js';
import path from 'path';

export class AnalyzeController {
  private analyzeService: AnalyzeService;

  constructor() {
    this.analyzeService = new AnalyzeService();
  }

  /**
   * Handle POST /analyze request.
   */
  async analyze(req: Request, res: Response): Promise<void> {
    try {
      const { repoPath } = req.body;

      if (!repoPath || typeof repoPath !== 'string') {
        res.status(400).json({
          error: 'Missing or invalid repoPath in request body'
        });
        return;
      }

      // Validate path exists
      if (!(await pathExists(repoPath))) {
        res.status(400).json({
          error: `Repository path does not exist: ${repoPath}`
        });
        return;
      }

      // Run analysis
      const result = await this.analyzeService.analyzeRepository(repoPath);

      // Save to output file
      const outputPath = path.join(process.cwd(), 'output', 'analysis.json');
      await writeJson(outputPath, result);

      // Return result
      res.json({
        success: true,
        result,
        outputPath
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
