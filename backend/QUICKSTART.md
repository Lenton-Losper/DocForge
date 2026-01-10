# Quick Start Guide

## Installation

```bash
cd backend
npm install
```

## Development

```bash
# Start dev server with hot reload
npm run dev
```

Server runs on `http://localhost:8000`

## Test the API

```bash
# Health check
curl http://localhost:8000/health

# Analyze a repository
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"repoPath": "/path/to/your/repo"}'
```

## Example Request

```json
POST /api/analyze
{
  "repoPath": "C:\\Users\\me\\my-project"
}
```

## Output

Analysis results are saved to:
- `output/analysis.json` (file)
- API response (JSON)

## Phase 2 TODO

- Rules Engine for documentation validation
- LLM Fix Engine for generating missing docs
- Documentation Generator
