/** Documentation routes. */
import { Router } from 'express';
import { DocController } from '../controllers/doc.controller.js';

const router = Router();
const controller = new DocController();

// Note: /generate-docs is now handled by generateDocs.route.ts (repository-based)
// This route is kept for backward compatibility but should not be used
// router.post('/generate-docs', (req, res) => controller.generateDocs(req, res));
router.post('/validate-docs', (req, res) => controller.validateDocs(req, res));

export default router;
