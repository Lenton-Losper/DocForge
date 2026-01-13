# Audit-Based Documentation Generation

## Overview

This system generates **evidence-based, auditable documentation** that strictly follows a checklist schema and prevents hallucination.

## Key Features

### 1. Evidence-First Approach
- Scans repository for actual evidence (files, code, configs)
- Only documents what exists
- Links every claim to concrete evidence

### 2. Confidence Classification
Each section is classified as:
- **verified** → Directly supported by code or config
- **inferred** → Deduced from structure or naming
- **unverified** → AI-generated with insufficient evidence
- **missing** → Required evidence not found

### 3. Checklist Schema
Follows a strict JSON schema (`documentationChecklist.json`) that defines:
- Required vs optional sections
- Evidence requirements per section
- Whether AI generation is allowed

### 4. Anti-Hallucination System
- Low temperature (0.2) for factual accuracy
- Explicit prompts: "Don't invent", "Only document what exists"
- Source attribution: Every paragraph cites files
- Self-check mechanism before output

## Architecture

```
┌─────────────────────┐
│  Repository         │
│  (GitHub API)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Repository Analyzer│
│  - Fetches files    │
│  - Extracts content │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Evidence Analyzer  │
│  - Matches evidence │
│  - Scores sections  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Audit Doc Generator│
│  - Processes schema │
│  - Generates content│
│  - Returns JSON     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Database           │
│  - Saves markdown   │
│  - Stores audit     │
└─────────────────────┘
```

## Output Format

Returns structured JSON:

```json
{
  "project_id": "owner/repo",
  "overall_score": 85,
  "sections": [
    {
      "id": "project_overview",
      "title": "Project Overview",
      "status": "complete",
      "confidence": "verified",
      "evidence": ["README.md", "package.json"],
      "content": "# Project Overview\n\n...\n\nGenerated from: README.md, package.json",
      "missing_reason": null
    }
  ]
}
```

## Scoring System

- **Starting score**: 100
- **Missing required section**: -10 points
- **Partial required section**: -5 points
- **Optional sections**: No penalty

## Files

- `schemas/documentationChecklist.json` - Checklist schema
- `services/evidenceAnalyzer.ts` - Evidence matching logic
- `services/auditDocGenerator.ts` - Main generation service
- `services/repositoryAnalyzer.ts` - Repository file fetching

## Usage

The system is automatically used when:
1. User connects a repository
2. Documentation generation is triggered
3. Backend processes the repository

## Testing

1. Connect a repository
2. Check backend logs for `[AUDIT]` messages
3. View generated docs in project detail page
4. Verify evidence citations in content
5. Check confidence levels match evidence

## Benefits

✅ **No Hallucination** - Only documents what exists
✅ **Auditable** - Every claim has evidence
✅ **Transparent** - Confidence levels visible
✅ **Re-runnable** - Can re-audit as code changes
✅ **Trustworthy** - Source citations included
