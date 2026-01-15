/** Express application setup. */
import 'dotenv/config'; // Load environment variables FIRST, before any other imports
import express from 'express';
import cors from 'cors';
import analyzeRoutes from './routes/analyze.route.js';
import docRoutes from './routes/doc.route.js';
import documentsRoutes from './routes/documents.route.js';
import repositoriesRoutes from './routes/repositories.route.js';
import generateDocsRoutes from './routes/generateDocs.route.js';
import accountRoutes from './routes/account.route.js';
import aiRoutes from './routes/ai.routes.js';

const app = express();

// Middleware - CORS Configuration
// Allow multiple development ports since Vite randomly assigns ports
const ALLOWED_ORIGINS = [
  'http://localhost:3000',   // React default
  'http://localhost:5173',   // Vite default
  'http://localhost:5174',   // Vite alternative
  'http://localhost:5175',   // Vite alternative
  'http://localhost:5176',   // Vite alternative
  'http://localhost:8080',   // Common alternative
  'http://127.0.0.1:3000',   // Localhost alternative
  'http://127.0.0.1:5173',   // Localhost alternative
  'http://127.0.0.1:5174',   // Localhost alternative
  'http://127.0.0.1:5175',   // Localhost alternative
  'http://127.0.0.1:5176',   // Localhost alternative
];

console.log('[CORS] Development mode - allowing multiple origins');
console.log(`[CORS] Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['*']
}));

app.use(express.json({ limit: '50mb' })); // Increase limit for file uploads

// Public routes (no auth required)
app.use('/api', analyzeRoutes);
app.use('/api', docRoutes);

// Protected routes (require authentication)
app.use('/api', documentsRoutes);
app.use('/api', repositoriesRoutes);
app.use('/api', generateDocsRoutes);
app.use('/api', accountRoutes);
app.use('/api/ai', aiRoutes);
console.log('✅ AI routes registered at /api/ai');

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'DocDocs API' });
});

// Root
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DocDocs API',
    version: '1.0.0',
    endpoints: {
      analyze: 'POST /api/analyze',
      validateDocs: 'POST /api/validate-docs',
      generateDocs: 'POST /api/generate-docs'
    }
  });
});

export default app;
