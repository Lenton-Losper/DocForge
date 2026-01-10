/** Documentation routes. */
import { Router } from 'express';
import { DocController } from '../controllers/doc.controller.js';

const router = Router();
const controller = new DocController();

router.post('/generate-docs', (req, res) => controller.generateDocs(req, res));
router.post('/validate-docs', (req, res) => controller.validateDocs(req, res));

export default router;
