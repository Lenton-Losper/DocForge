/**
 * AI Routes
 * 
 * Routes for AI-powered features using Ollama.
 * Health check is public, all other routes require authentication.
 */

import { Router } from 'express';
import { AIController } from '../controllers/ai.controller.js';
import { verifyAuth } from '../middleware/auth.js';

const router = Router();
const aiController = new AIController();

// Health check is public (no auth required) for easier debugging
router.get('/health', (req, res) => aiController.health(req, res));

// All other AI routes require authentication
router.post('/improve-readme', verifyAuth, (req, res) => aiController.improveReadme(req, res));
router.post('/generate-description', verifyAuth, (req, res) => aiController.generateDescription(req, res));
router.post('/generate-setup', verifyAuth, (req, res) => aiController.generateSetupGuide(req, res));
router.post('/generate-api-docs', verifyAuth, (req, res) => aiController.generateApiDocs(req, res));
router.post('/generate-diagram', verifyAuth, (req, res) => aiController.generateDiagram(req, res));
router.post('/analyze-quality', verifyAuth, (req, res) => aiController.analyzeQuality(req, res));

export default router;
