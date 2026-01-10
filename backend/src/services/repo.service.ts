/** Repository analysis service using simple-git. */
import simpleGit, { SimpleGit } from 'simple-git';
import { FileAnalysis } from '../types/analysis.types.js';
import { getSourceFiles } from '../utils/file.utils.js';

export class RepoService {
  private git: SimpleGit;

  constructor(repoPath: string) {
    this.git = simpleGit(repoPath);
  }

  /**
   * Get file change frequency (commits in last 50).
   */
  async getFileChangeFrequency(filePath: string): Promise<number> {
    try {
      const log = await this.git.log({
        file: filePath,
        maxCount: 50
      });
      return log.total;
    } catch {
      return 0;
    }
  }

  /**
   * Analyze all files in repository.
   */
  async analyzeFiles(repoPath: string): Promise<FileAnalysis[]> {
    const sourceFiles = await getSourceFiles(repoPath);
    const analyses: FileAnalysis[] = [];

    for (const filePath of sourceFiles) {
      const relativePath = filePath.replace(repoPath, '').replace(/^[\\/]/, '');
      const frequency = await this.getFileChangeFrequency(relativePath);
      
      analyses.push({
        path: relativePath,
        changeFrequency: frequency
      });
    }

    return analyses;
  }

  /**
   * Get last commit date for a file.
   */
  async getLastModified(filePath: string): Promise<string | undefined> {
    try {
      const log = await this.git.log({
        file: filePath,
        maxCount: 1
      });
      return log.latest?.date;
    } catch {
      return undefined;
    }
  }
}
