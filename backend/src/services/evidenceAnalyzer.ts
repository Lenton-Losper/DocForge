/** Evidence analyzer - Scans repository for evidence matching checklist requirements. */
import { FileContent } from './repositoryAnalyzer.js';

export interface Evidence {
  file: string;
  type: 'file' | 'content' | 'structure';
  confidence: 'verified' | 'inferred' | 'unverified';
  snippet?: string;
}

export interface SectionAnalysis {
  sectionId: string;
  evidence: Evidence[];
  hasRequiredEvidence: boolean;
  missingEvidence: string[];
}

export function analyzeEvidence(
  sectionId: string,
  evidenceRequirements: string[],
  files: FileContent[],
  fileTree: string[]
): SectionAnalysis {
  const evidence: Evidence[] = [];
  const missingEvidence: string[] = [];
  const foundFiles = new Set<string>();

  // Check each requirement
  for (const requirement of evidenceRequirements) {
    let found = false;

    // Check for exact file matches
    const exactMatch = files.find(f => 
      f.path.toLowerCase().includes(requirement.toLowerCase()) ||
      f.path.toLowerCase() === requirement.toLowerCase()
    );

    if (exactMatch) {
      evidence.push({
        file: exactMatch.path,
        type: 'file',
        confidence: 'verified',
        snippet: exactMatch.content.substring(0, 200)
      });
      foundFiles.add(exactMatch.path);
      found = true;
    }

    // Check file tree for structure matches
    if (!found) {
      const treeMatch = fileTree.find(path => 
        path.toLowerCase().includes(requirement.toLowerCase())
      );

      if (treeMatch) {
        evidence.push({
          file: treeMatch,
          type: 'structure',
          confidence: 'inferred'
        });
        found = true;
      }
    }

    // Special handling for specific requirements
    if (requirement.includes('package.json')) {
      const pkgFile = files.find(f => f.path.includes('package.json'));
      if (pkgFile) {
        found = true;
        if (!foundFiles.has(pkgFile.path)) {
          evidence.push({
            file: pkgFile.path,
            type: 'file',
            confidence: 'verified',
            snippet: pkgFile.content.substring(0, 300)
          });
          foundFiles.add(pkgFile.path);
        }
      }
    }

    if (requirement.includes('README')) {
      const readmeFile = files.find(f => 
        f.path.toLowerCase().includes('readme')
      );
      if (readmeFile) {
        found = true;
        if (!foundFiles.has(readmeFile.path)) {
          evidence.push({
            file: readmeFile.path,
            type: 'file',
            confidence: 'verified',
            snippet: readmeFile.content.substring(0, 300)
          });
          foundFiles.add(readmeFile.path);
        }
      }
    }

    if (requirement.includes('exported functions') || requirement.includes('class definitions')) {
      const codeFiles = files.filter(f => 
        ['ts', 'js', 'tsx', 'jsx', 'py'].includes(f.type)
      );
      if (codeFiles.length > 0) {
        found = true;
        // Add first few code files as evidence
        codeFiles.slice(0, 3).forEach(f => {
          if (!foundFiles.has(f.path)) {
            evidence.push({
              file: f.path,
              type: 'content',
              confidence: 'inferred',
              snippet: f.content.substring(0, 500)
            });
            foundFiles.add(f.path);
          }
        });
      }
    }

    if (!found) {
      missingEvidence.push(requirement);
    }
  }

  return {
    sectionId,
    evidence,
    hasRequiredEvidence: missingEvidence.length === 0,
    missingEvidence
  };
}
