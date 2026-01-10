/** Analysis routes. */
import { Router } from 'express';
import { AnalyzeController } from '../controllers/analyze.controller.js';

const router = Router();
const controller = new AnalyzeController();

router.post('/analyze', (req, res) => controller.analyze(req, res));

export default router;
