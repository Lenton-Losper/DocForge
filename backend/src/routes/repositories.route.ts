/** Repository management routes. */
import { Router } from 'express';
import { RepositoriesController } from '../controllers/repositories.controller.js';
import { verifyAuth } from '../middleware/auth.js';

const router = Router();
const controller = new RepositoriesController();

// All repository routes require authentication
router.post('/repositories/connect', verifyAuth, (req, res) => controller.connect(req, res));
router.get('/repositories', verifyAuth, (req, res) => controller.getRepositories(req, res));
router.get('/repositories/:id', verifyAuth, (req, res) => controller.getRepository(req, res));
router.delete('/repositories/:id', verifyAuth, (req, res) => controller.deleteRepository(req, res));

export default router;
