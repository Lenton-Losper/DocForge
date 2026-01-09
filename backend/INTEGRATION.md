# Frontend Integration Guide

## API Endpoints

### Base URL
```
http://localhost:8000/api
```

### 1. Analyze Document

**Endpoint:** `POST /api/analyze`

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (File upload)

**Response:**
```typescript
interface LintReport {
  score: number;           // 0-100
  summary: {
    errors: number;
    warnings: number;
  };
  issues: Array<{
    id: string;
    severity: "ERROR" | "WARN";
    message: string;
    page: number | null;
    penalty: number;
  }>;
}
```

**Example Frontend Code:**
```typescript
const analyzeDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:8000/api/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Analysis failed');
  }

  return await response.json();
};
```

### 2. Suggest Fixes (Phase 2)

**Endpoint:** `POST /api/suggest-fixes?enabled=true`

**Request:**
```json
{
  "issues": [...],      // From /analyze response
  "document": {...}     // Full document structure (optional)
}
```

**Query Parameters:**
- `enabled`: boolean (default: false)

**Response:**
```typescript
interface FixSuggestionsResponse {
  suggestions: Array<{
    issue_id: string;
    original: string;
    suggested: string;
    confidence: number;  // 0.0 - 1.0
  }>;
}
```

## Error Handling

The API returns standard HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid file type, missing data)
- `500`: Server error

Error response format:
```json
{
  "detail": "Error message"
}
```

## CORS

CORS is configured for:
- `http://localhost:5173` (Vite)
- `http://localhost:3000` (React)

Update `main.py` to add additional origins if needed.

## Example: Complete Upload Flow

```typescript
// 1. Upload and analyze
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

try {
  const report = await analyzeDocument(file);
  
  // 2. Display results
  console.log(`Score: ${report.score}/100`);
  console.log(`Errors: ${report.summary.errors}`);
  console.log(`Warnings: ${report.summary.warnings}`);
  
  // 3. Show issues
  report.issues.forEach(issue => {
    console.log(`${issue.severity}: ${issue.message}`);
  });
  
  // 4. Optional: Get AI fixes (Phase 2)
  if (report.issues.length > 0) {
    const fixes = await fetch('http://localhost:8000/api/suggest-fixes?enabled=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issues: report.issues,
        document: null  // Optional: include full document for better context
      })
    });
    
    const fixData = await fixes.json();
    console.log('AI Suggestions:', fixData.suggestions);
  }
} catch (error) {
  console.error('Upload failed:', error);
}
```
