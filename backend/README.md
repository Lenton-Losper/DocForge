# DocForge Backend API

FastAPI backend for AI-powered documentation linting.

## Architecture

```
backend/
├── main.py                 # FastAPI app entry point
├── api/
│   ├── analyze.py          # Document upload + analysis endpoint
│   └── suggest_fixes.py    # AI fix suggestions (Phase 2)
├── parsing/
│   ├── docx_parser.py      # DOCX file parser
│   └── pdf_parser.py       # PDF file parser
├── models/
│   ├── document_model.py   # Normalized document structure
│   └── issue_model.py      # Lint issues and reports
├── rules/
│   ├── required_sections.py # Required section checks
│   ├── image_rules.py      # Image caption validation
│   ├── heading_rules.py    # Heading structure checks
│   └── scoring.py          # Quality scoring system
└── ai/
    └── fixer.py            # AI fix engine (Phase 2, disabled by default)
```

## Setup

1. Create virtual environment:
```bash
python -m venv .venv
```

2. Activate virtual environment:
```bash
# Windows
.venv\Scripts\activate

# Linux/Mac
source .venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run development server:
```bash
uvicorn main:app --reload --port 8000
```

API will be available at `http://localhost:8000`

## API Endpoints

### POST `/api/analyze`
Upload and analyze a documentation file.

**Request:**
- `file`: Multipart file upload (.docx, .pdf, .doc, .md)

**Response:**
```json
{
  "score": 68,
  "summary": {
    "errors": 4,
    "warnings": 12
  },
  "issues": [
    {
      "id": "MISSING_SECTION_INTRODUCTION",
      "severity": "ERROR",
      "message": "Missing required section: Introduction",
      "page": null,
      "penalty": 15
    }
  ]
}
```

### POST `/api/suggest-fixes`
Generate AI-powered fix suggestions (Phase 2, disabled by default).

**Request:**
```json
{
  "issues": [...],
  "document": {...}
}
```

**Query Parameters:**
- `enabled`: boolean (default: false) - Enable AI fix generation

**Response:**
```json
{
  "suggestions": [
    {
      "issue_id": "...",
      "original": "",
      "suggested": "### Safety Warnings\n...",
      "confidence": 0.92
    }
  ]
}
```

## Phase 1 Features (Implemented)

- ✅ DOCX and PDF parsing
- ✅ Document structure normalization
- ✅ Required section validation
- ✅ Image caption checking
- ✅ Heading sequence validation
- ✅ Quality scoring (0-100)

## Phase 2 Features (Scaffolded)

- ⚠️ AI fix engine (placeholder, requires LLM integration)
- ⚠️ Fix suggestions endpoint (disabled by default)

## Development

The backend uses:
- **FastAPI** for REST API
- **python-docx** for DOCX parsing
- **pdfplumber** for PDF parsing
- **Pydantic** for data validation

## CORS

CORS is configured for frontend integration on:
- `http://localhost:5173` (Vite default)
- `http://localhost:3000` (React default)

Update `main.py` to add additional origins.
