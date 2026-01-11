/** Documentation generation service using GitHub API and AI. */
import { Octokit } from '@octokit/rest';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  : null;

export async function generateDocsForRepository(repositoryId: string) {
  try {
    console.log(`Generating docs for repository ${repositoryId}`);

    // 1. Get repository details from database
    const { data: repo, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .eq('id', repositoryId)
      .single();

    if (repoError || !repo) {
      throw new Error('Repository not found');
    }

    // 2. Get user's GitHub token
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(repo.user_id);
    
    if (userError || !user) {
      throw new Error('User not found');
    }

    // Get GitHub token from user's OAuth identity or use fallback
    // Supabase stores provider_token in the identity, but we need to access it
    // Check if user has GitHub identity
    const githubIdentity = user.identities?.find((id: any) => id.provider === 'github');
    const githubToken = githubIdentity?.identity_data?.provider_token 
      || user.user_metadata?.github_token 
      || user.user_metadata?.provider_token 
      || process.env.GITHUB_TOKEN;

    if (!githubToken) {
      throw new Error('GitHub token not available. Please reconnect your GitHub account in Settings.');
    }

    // 3. Initialize GitHub API client
    const octokit = new Octokit({ auth: githubToken });

    // 4. Fetch repository data
    const { data: repoData } = await octokit.repos.get({
      owner: repo.repo_owner,
      repo: repo.repo_name
    });

    // 5. Fetch package.json (if exists)
    let packageJson = null;
    try {
      const { data: pkgFile } = await octokit.repos.getContent({
        owner: repo.repo_owner,
        repo: repo.repo_name,
        path: 'package.json'
      });
      if ('content' in pkgFile) {
        packageJson = JSON.parse(Buffer.from(pkgFile.content, 'base64').toString());
      }
    } catch (e) {
      console.log('No package.json found');
    }

    // 6. Fetch repository structure
    let contents: any[] = [];
    try {
      const { data: repoContents } = await octokit.repos.getContent({
        owner: repo.repo_owner,
        repo: repo.repo_name,
        path: ''
      });
      contents = Array.isArray(repoContents) ? repoContents : [];
    } catch (e) {
      console.log('Unable to fetch repository structure');
    }

    // 7. Generate documentation sections
    const docs = {
      readme: await generateReadme(repoData, packageJson, repo),
      api: await generateApiDocs(repo, octokit),
      setup: await generateSetupGuide(packageJson, repo),
      architecture: await generateArchitecture(contents, repo)
    };

    // 8. Save to database
    const { data: savedDocs, error: saveError } = await supabase
      .from('generated_docs')
      .upsert({
        repository_id: repositoryId,
        readme: docs.readme,
        api_docs: docs.api,
        setup_guide: docs.setup,
        architecture: docs.architecture,
        version: '1.0.0',
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saveError) {
      throw saveError;
    }

    // 9. Update repository status
    await supabase
      .from('repositories')
      .update({
        last_synced_at: new Date().toISOString(),
        docs_generated: true
      })
      .eq('id', repositoryId);

    return { success: true, docs: savedDocs };
  } catch (error) {
    console.error('Error generating docs:', error);
    throw error;
  }
}

async function generateReadme(repoData: any, packageJson: any, repo: any): Promise<string> {
  if (!openai) {
    return `# ${repoData.name}\n\n${repoData.description || 'No description provided'}\n\n*AI documentation generation not configured. Please add OPENAI_API_KEY to backend .env*`;
  }

  const prompt = `Generate a comprehensive, professional README.md for this GitHub repository:

Repository Name: ${repoData.name}
Description: ${repoData.description || 'No description provided'}
Language: ${repoData.language || 'Unknown'}
${packageJson ? `Dependencies: ${Object.keys(packageJson.dependencies || {}).join(', ')}` : ''}
${packageJson ? `Scripts: ${Object.keys(packageJson.scripts || {}).join(', ')}` : ''}

Create a README that includes:
1. Project title and description
2. Key features (infer from description)
3. Installation instructions
4. Usage examples
5. Available scripts (if package.json exists)
6. Contributing guidelines
7. License information

Format as clean, professional markdown. Be specific and actionable. Avoid generic placeholders.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 2000,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating README:', error);
    return `# ${repoData.name}\n\n${repoData.description || 'No description provided'}\n\n*Error generating documentation*`;
  }
}

async function generateApiDocs(repo: any, octokit: Octokit): Promise<string> {
  // Fetch main code files to analyze APIs
  try {
    const { data: contents } = await octokit.repos.getContent({
      owner: repo.repo_owner,
      repo: repo.repo_name,
      path: 'src'
    });

    // For now, return placeholder
    // TODO: Integrate with your existing AST parsing service
    return '# API Documentation\n\n*API documentation will be generated from code analysis*\n\nTo generate full API docs, integrate with the AST parsing service.';
  } catch (e) {
    return '# API Documentation\n\n*No API endpoints detected*\n\nThis repository may not have a src/ directory or API endpoints.';
  }
}

async function generateSetupGuide(packageJson: any, repo: any): Promise<string> {
  if (!packageJson) {
    return '# Setup Guide\n\n*No setup instructions available*\n\nThis repository does not have a package.json file.';
  }

  if (!openai) {
    return `# Setup Guide\n\n## Installation\n\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Running\n\n\`\`\`bash\nnpm start\n\`\`\`\n\n*AI documentation generation not configured*`;
  }

  const prompt = `Create a detailed setup guide for this project:

Project: ${repo.repo_name}
Package Manager: ${packageJson.packageManager || 'npm'}
Node Version: ${packageJson.engines?.node || 'Not specified'}
Dependencies: ${Object.keys(packageJson.dependencies || {}).join(', ')}
Dev Dependencies: ${Object.keys(packageJson.devDependencies || {}).join(', ')}

Include:
1. Prerequisites (Node.js version, etc.)
2. Installation steps
3. Environment setup (if needed)
4. Running the project
5. Common troubleshooting

Be specific and actionable. Format as markdown.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 1500,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating setup guide:', error);
    return `# Setup Guide\n\n## Installation\n\n\`\`\`bash\nnpm install\n\`\`\`\n\n*Error generating documentation*`;
  }
}

async function generateArchitecture(contents: any[], repo: any): Promise<string> {
  const fileStructure = contents.length > 0
    ? contents.map(item => `${item.type === 'dir' ? '📁' : '📄'} ${item.name}`).join('\n')
    : 'Unable to read structure';

  if (!openai) {
    return `# Architecture\n\n## File Structure\n\n\`\`\`\n${fileStructure}\n\`\`\`\n\n*AI documentation generation not configured*`;
  }

  const prompt = `Generate architecture documentation for this project:

Repository: ${repo.repo_name}
Language: ${repo.language}

File Structure:
${fileStructure}

Create architecture documentation that includes:
1. High-level system overview
2. Folder structure explanation
3. Key components and their responsibilities
4. Data flow (if applicable)
5. Technology stack

Format as markdown. Be clear and technical.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 1500,
      temperature: 0.7
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating architecture:', error);
    return `# Architecture\n\n## File Structure\n\n\`\`\`\n${fileStructure}\n\`\`\`\n\n*Error generating documentation*`;
  }
}
