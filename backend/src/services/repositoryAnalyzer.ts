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
    // 1. Get repository tree
    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const { data: tree } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: repoData.default_branch,
      recursive: '1'
    });

    // 2. Filter relevant files
    const relevantExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rb'];
    const configFiles = ['package.json', 'requirements.txt', 'pom.xml', 'go.mod'];
    const docFiles = ['README.md', 'README.rst'];

    const filesToFetch = tree.tree.filter(item => {
      if (item.type !== 'blob') return false;
      const ext = item.path?.split('.').pop();
      return (
        relevantExtensions.some(e => item.path?.endsWith(e)) ||
        configFiles.some(c => item.path?.includes(c)) ||
        docFiles.some(d => item.path?.includes(d))
      );
    }).slice(0, 50); // Limit to 50 files to avoid rate limits

    // 3. Fetch file contents
    const files: FileContent[] = [];
    for (const file of filesToFetch) {
      if (!file.path) continue;

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
          }
        }
      } catch (err) {
        console.error(`Failed to fetch ${file.path}:`, err);
      }
    }

    // 4. Extract package.json
    let packageJson = null;
    const pkgFile = files.find(f => f.path.includes('package.json'));
    if (pkgFile) {
      try {
        packageJson = JSON.parse(pkgFile.content);
      } catch (e) {
        console.error('Failed to parse package.json');
      }
    }

    // 5. Extract README
    let readme = null;
    const readmeFile = files.find(f => f.path.toLowerCase().includes('readme'));
    if (readmeFile) {
      readme = readmeFile.content;
    }

    // 6. Detect languages
    const hasTypeScript = files.some(f => f.type === 'ts' || f.type === 'tsx');
    const hasJavaScript = files.some(f => f.type === 'js' || f.type === 'jsx');
    const hasPython = files.some(f => f.type === 'py');

    let mainLanguage = 'Unknown';
    if (hasTypeScript) mainLanguage = 'TypeScript';
    else if (hasJavaScript) mainLanguage = 'JavaScript';
    else if (hasPython) mainLanguage = 'Python';

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
    console.error('Repository analysis error:', error);
    throw new Error('Failed to analyze repository');
  }
}
