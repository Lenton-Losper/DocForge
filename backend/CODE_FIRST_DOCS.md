# Code-First Documentation Generation

## Overview

This implementation uses **actual code files** from repositories to generate accurate, non-hallucinated documentation. The AI analyzes real code instead of guessing based on metadata.

## How It Works

### 1. Repository Analysis (`repositoryAnalyzer.ts`)

- Fetches repository tree using GitHub API
- Filters relevant files (`.ts`, `.js`, `.py`, etc.)
- Downloads actual file contents (max 50 files, 10KB each)
- Extracts `package.json` and `README.md`
- Detects programming languages

### 2. Documentation Generation (`docGenerationService.ts`)

Uses the analyzed code to generate:

- **README**: Based on actual code files, function names, and project structure
- **API Docs**: Documents real exported functions/classes from code
- **Setup Guide**: Uses actual `package.json` scripts and dependencies
- **Architecture**: Based on actual file structure

## Key Anti-Hallucination Features

1. **Code-First Approach**: Fetches actual code files, not just metadata
2. **Low Temperature (0.2-0.3)**: More factual, less creative
3. **Explicit Prompts**: "Only document what exists", "Don't invent"
4. **File Limiting**: Max 50 files, 10KB per file to avoid token limits
5. **Verification**: AI is explicitly told to use exact function names from code

## Model Used

- **gpt-4o-mini**: Cost-effective, fast, good for factual documentation
- Lower temperature = more accurate, less creative

## File Limits

- **Max 50 files** per repository (to avoid rate limits)
- **Max 10KB per file** (to avoid token limits)
- **Max 10 files** for README generation
- **Max 5 files** for API documentation

## Environment Variables

Ensure these are set in `backend/.env`:

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-api-key
GITHUB_TOKEN=your-github-token (optional fallback)
```

## Testing

1. Connect a repository in the dashboard
2. Documentation generation starts automatically
3. Check backend logs for:
   - "Analyzing repository structure..."
   - "Generating README..."
   - "Generating API docs..."
4. Wait 30-60 seconds for generation
5. View generated docs in project detail page

## Improvements Over Previous Version

### Before:
- Used only repository metadata
- AI would guess/hallucinate features
- Generic documentation

### After:
- Uses actual code files
- Documents only what exists
- Accurate function signatures
- Real npm scripts in setup guide
- Actual file structure in architecture

## Next Steps

1. **AST Parsing**: Extract function signatures more accurately
2. **Diff Review**: Show generated vs current docs
3. **Streaming**: Show generation progress in real-time
4. **Caching**: Cache results to reduce API costs
5. **Quality Scoring**: Rate documentation completeness

## Troubleshooting

### "Failed to analyze repository"
- Check GitHub token is valid
- Verify repository is accessible
- Check rate limits

### "Generation failed"
- Verify OpenAI API key is set
- Check API quota/billing
- Review backend logs for errors

### Documentation seems generic
- Ensure code files are being fetched (check logs)
- Verify file size limits aren't too restrictive
- Check that repository has actual code files
