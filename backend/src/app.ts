/** Express application setup. */
import express from 'express';
import cors from 'cors';
import analyzeRoutes from './routes/analyze.route.js';
import docRoutes from './routes/doc.route.js';
import documentsRoutes from './routes/documents.route.js';
import repositoriesRoutes from './routes/repositories.route.js';
import generateDocsRoutes from './routes/generateDocs.route.js';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' })); // Increase limit for file uploads

// Public routes (no auth required)
app.use('/api', analyzeRoutes);
app.use('/api', docRoutes);

// Protected routes (require authentication)
app.use('/api', documentsRoutes);
app.use('/api', repositoriesRoutes);
app.use('/api', generateDocsRoutes);

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
