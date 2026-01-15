/** Repository analyzer - Fetches and analyzes actual code files from GitHub. */
import { Octokit } from '@octokit/rest';

export interface FileContent {
  path: string;
  content: string;
  type: string;
  size: number;
}

export interface RepoStructure {
  files: FileContent[];
  packageJson?: any;
  readme?: string;
  hasTypeScript: boolean;
  hasJavaScript: boolean;
  hasPython: boolean;
  mainLanguage: string;
}

export async function analyzeRepository(
  owner: string,
  repo: string,
  githubToken: string
): Promise<RepoStructure> {
  const octokit = new Octokit({ auth: githubToken });

  try {
    // 1. Get repository tree from root
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const { data: tree } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: repoData.default_branch,
      recursive: '1'
    });

    // Log all discovered files for tracking
    const allDiscoveredFiles = tree.tree
      .filter(item => item.type === 'blob' && item.path)
      .map(item => item.path!);
    console.log(`[REPO_SCAN] Discovered ${allDiscoveredFiles.length} total files in repository`);

    // 2. Filter relevant files - ensure package.json is ALWAYS included if it exists
    const relevantExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rb'];
    const configFiles = ['package.json', 'requirements.txt', 'pom.xml', 'go.mod'];
    const docFiles = ['README.md', 'README.rst'];

    // First, check if package.json exists in the tree
    const packageJsonPath = allDiscoveredFiles.find(path => 
      path.toLowerCase() === 'package.json' || path.toLowerCase().endsWith('/package.json')
    );

    // Build list of files to fetch
    const filesToFetch = tree.tree.filter(item => {
      if (item.type !== 'blob' || !item.path) return false;
      const ext = item.path.split('.').pop()?.toLowerCase();
      return (
        relevantExtensions.some(e => item.path!.toLowerCase().endsWith(e)) ||
        configFiles.some(c => item.path!.toLowerCase().includes(c.toLowerCase())) ||
        docFiles.some(d => item.path!.toLowerCase().includes(d.toLowerCase()))
      );
    });

    // CRITICAL: If package.json exists, ensure it's in the fetch list
    if (packageJsonPath && !filesToFetch.some(f => f.path === packageJsonPath)) {
      const pkgItem = tree.tree.find(item => item.path === packageJsonPath);
      if (pkgItem) {
        filesToFetch.unshift(pkgItem); // Add to beginning for priority
        console.log(`[REPO_SCAN] Added package.json to fetch list: ${packageJsonPath}`);
      }
    }

    // Limit to 50 files but prioritize config files
    const prioritizedFiles = filesToFetch.sort((a, b) => {
      const aIsConfig = configFiles.some(c => a.path?.toLowerCase().includes(c.toLowerCase()));
      const bIsConfig = configFiles.some(c => b.path?.toLowerCase().includes(c.toLowerCase()));
      if (aIsConfig && !bIsConfig) return -1;
      if (!aIsConfig && bIsConfig) return 1;
      return 0;
    }).slice(0, 50);

    // 3. Fetch file contents
    const files: FileContent[] = [];
    const fetchedPaths = new Set<string>(); // Track what we've fetched to avoid duplicates

    for (const file of prioritizedFiles) {
      if (!file.path || fetchedPaths.has(file.path)) continue;

      try {
        const { data: fileData } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path
        });

        if ('content' in fileData && fileData.content) {
          const content = Buffer.from(fileData.content, 'base64').toString('utf8');
          
          // Only include files under 10KB to avoid token limits
          if (content.length < 10000) {
            files.push({
              path: file.path,
              content,
              type: file.path.split('.').pop() || 'unknown',
              size: fileData.size
            });
            fetchedPaths.add(file.path);
          }
        }
      } catch (err) {
        console.error(`[REPO_SCAN] Failed to fetch ${file.path}:`, err);
      }
    }

    // Log what we fetched
    console.log(`[REPO_SCAN] Successfully fetched ${files.length} files`);
    if (packageJsonPath) {
      const pkgFound = files.some(f => f.path === packageJsonPath);
      console.log(`[REPO_SCAN] package.json exists: ${pkgFound ? 'YES (fetched)' : 'NO (not found in files)'}`);
    }

    // 4. Extract package.json - MUST be present if it exists in tree
    let packageJson = null;
    const pkgFile = files.find(f => {
      const path = f.path.toLowerCase();
      return path === 'package.json' || path.endsWith('/package.json');
    });
    
    if (pkgFile) {
      try {
        packageJson = JSON.parse(pkgFile.content);
        console.log(`[REPO_SCAN] Successfully parsed package.json`);
      } catch (e) {
        console.error('[REPO_SCAN] Failed to parse package.json:', e);
      }
    } else if (packageJsonPath) {
      // SAFEGUARD: If package.json exists in tree but wasn't fetched, log warning
      console.warn(`[REPO_SCAN] WARNING: package.json exists in tree (${packageJsonPath}) but was not fetched!`);
    }

    // 5. Extract README
    let readme = null;
    const readmeFile = files.find(f => f.path.toLowerCase().includes('readme'));
    if (readmeFile) {
      readme = readmeFile.content;
    }

    // 6. Detect languages - ONLY from actual file evidence
    const hasTypeScript = files.some(f => {
      const ext = f.path.split('.').pop()?.toLowerCase();
      return ext === 'ts' || ext === 'tsx';
    });
    const hasJavaScript = files.some(f => {
      const ext = f.path.split('.').pop()?.toLowerCase();
      return ext === 'js' || ext === 'jsx';
    });
    const hasPython = files.some(f => {
      const ext = f.path.split('.').pop()?.toLowerCase();
      return ext === 'py';
    });

    // Language detection must be backed by file evidence
    let mainLanguage = 'Unknown';
    if (hasTypeScript) {
      mainLanguage = 'TypeScript';
      console.log(`[REPO_SCAN] Detected TypeScript (evidence: .ts/.tsx files)`);
    } else if (hasJavaScript) {
      mainLanguage = 'JavaScript';
      console.log(`[REPO_SCAN] Detected JavaScript (evidence: .js/.jsx files)`);
    } else if (hasPython) {
      mainLanguage = 'Python';
      console.log(`[REPO_SCAN] Detected Python (evidence: .py files)`);
    }

    return {
      files,
      packageJson,
      readme,
      hasTypeScript,
      hasJavaScript,
      hasPython,
      mainLanguage
    };
  } catch (error) {
    console.error('[REPO_SCAN] Repository analysis error:', error);
    throw new Error('Failed to analyze repository');
  }
}
