# DocDocs Backend

Automated repository analyzer backend - Phase 1 & Phase 2.

## Overview

DocDocs analyzes Git repositories to extract:
- **Services**: Classes with service patterns
- **APIs**: REST endpoints (Express/Fastify routes)
- **Roles**: Role strings and patterns
- **Dependencies**: File-to-file import graph
- **Files**: Change frequency analysis

**Phase 1**: Repository analysis and knowledge graph building  
**Phase 2**: Documentation validation, LLM-powered fixes, and documentation generation

## Supabase Integration

The backend is now connected to Supabase for:
- ✅ JWT authentication verification
- ✅ Document storage (Supabase Storage)
- ✅ Database storage (PostgreSQL via Supabase)
- ✅ User-specific data isolation

See `SUPABASE_BACKEND_SETUP.md` for setup instructions.

## Architecture

```
backend/src/
├── server.ts              # Server entry point
├── app.ts                 # Express app setup
├── config/
│   └── supabase.ts        # Supabase client (service_role)
├── middleware/
│   └── auth.ts            # JWT verification middleware
├── routes/
│   ├── analyze.route.ts   # Analysis routes (public)
│   ├── doc.route.ts       # Documentation routes (public)
│   ├── documents.route.ts # Document routes (protected)
│   └── repositories.route.ts # Repository routes (protected)
├── controllers/
│   ├── analyze.controller.ts
│   ├── doc.controller.ts
│   ├── documents.controller.ts  # Document management
│   └── repositories.controller.ts # Repository management
├── services/
│   ├── repo.service.ts        # Git repository analysis
│   ├── ast.service.ts         # TypeScript AST parsing (ts-morph)
│   ├── dependency.service.ts  # Dependency graph builder
│   ├── api-extractor.service.ts # REST API detection
│   ├── role-detector.service.ts # Role pattern detection
│   ├── analyze.service.ts     # Main orchestration
│   ├── rules.service.ts       # Rules engine (Phase 2)
│   ├── llm-fix.service.ts     # LLM fix engine (Phase 2)
│   └── doc-generator.service.ts # Documentation generator (Phase 2)
├── graph/
│   └── knowledge-graph.ts     # Entity-relationship graph
├── types/
│   ├── analysis.types.ts     # TypeScript definitions
│   └── rules.types.ts        # Rules engine types (Phase 2)
└── utils/
    └── file.utils.ts          # File utilities
```

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Create `.env` file:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=8000
```

3. **Set up database:**
   - Run `DATABASE_SCHEMA.sql` in Supabase SQL Editor
   - Create `documents` storage bucket in Supabase

4. **Build TypeScript:**
```bash
npm run build
```

5. **Run development server:**
```bash
npm run dev
```

6. **Run production server:**
```bash
npm start
```

## API Endpoints

### Public Endpoints (No Auth Required)

#### POST `/api/analyze`
Analyze a Git repository.

#### POST `/api/validate-docs`
Validate documentation completeness.

#### POST `/api/generate-docs`
Generate documentation from analysis.

### Protected Endpoints (Require JWT Token)

#### POST `/api/documents/upload`
Upload a document to Supabase Storage.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request:**
- FormData with file and metadata

**Response:**
```json
{
  "success": true,
  "document": { ... },
  "message": "Document uploaded successfully"
}
```

#### GET `/api/documents`
Get all user's documents.

#### GET `/api/documents/:id`
Get specific document.

#### DELETE `/api/documents/:id`
Delete a document.

#### POST `/api/repositories/connect`
Connect a GitHub repository.

**Request:**
```json
{
  "repo_url": "https://github.com/user/repo",
  "github_token": "optional-token"
}
```

#### GET `/api/repositories`
Get all user's repositories.

## Frontend Integration

Use the API client in `src/lib/api.ts`:

```typescript
import { uploadDocument, getDocuments, connectRepository } from './lib/api';

// Upload document
const result = await uploadDocument(file);

// Get documents
const { documents } = await getDocuments();

// Connect repository
const { repository } = await connectRepository('https://github.com/user/repo');
```

## Tech Stack

- **Node.js** + **TypeScript**
- **Express** for REST API
- **Supabase** for auth, database, and storage
- **ts-morph** for TypeScript AST parsing
- **simple-git** for Git repository access

## Development

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## CORS

CORS is configured for:
- `http://localhost:5173` (Vite)
- `http://localhost:3000` (React)

Update `src/app.ts` to add additional origins.
