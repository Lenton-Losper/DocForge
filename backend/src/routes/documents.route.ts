/** Document management routes. */
import { Router } from 'express';
import { DocumentsController } from '../controllers/documents.controller.js';
import { verifyAuth } from '../middleware/auth.js';

const router = Router();
const controller = new DocumentsController();

// All document routes require authentication
router.post('/documents/upload', verifyAuth, (req, res) => controller.upload(req, res));
router.get('/documents', verifyAuth, (req, res) => controller.getDocuments(req, res));
router.get('/documents/:id', verifyAuth, (req, res) => controller.getDocument(req, res));
router.delete('/documents/:id', verifyAuth, (req, res) => controller.deleteDocument(req, res));

export default router;
