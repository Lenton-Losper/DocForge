/** Document management controller. */
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

export class DocumentsController {
  /**
   * Upload a document to Supabase Storage and save metadata.
   */
  async upload(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Handle file upload from FormData
      // Note: For production, use multer middleware for proper file handling
      const { fileName, fileSize, fileType } = req.body;
      const fileBuffer = req.body.fileBuffer || req.body.file;

      if (!fileName) {
        res.status(400).json({ error: 'Missing file name' });
        return;
      }

      if (!fileBuffer) {
        res.status(400).json({ error: 'Missing file data' });
        return;
      }

      // Convert file buffer to appropriate format
      // In production, use multer which handles this automatically
      let fileData: Buffer | Uint8Array | ArrayBuffer;
      if (Buffer.isBuffer(fileBuffer)) {
        fileData = fileBuffer;
      } else if (fileBuffer instanceof ArrayBuffer) {
        fileData = Buffer.from(fileBuffer);
      } else if (fileBuffer instanceof Uint8Array) {
        fileData = Buffer.from(fileBuffer);
      } else {
        // Try to convert if it's a plain object/array
        fileData = Buffer.from(JSON.stringify(fileBuffer));
      }

      // 1. Upload file to Supabase Storage
      const filePath = `${userId}/${Date.now()}_${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, fileData, {
          contentType: fileType || 'application/octet-stream',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        res.status(500).json({ error: 'Failed to upload file', details: uploadError.message });
        return;
      }

      // 2. Save metadata to database
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          file_name: fileName,
          file_size: fileSize || 0,
          file_type: fileType || 'unknown',
          file_path: filePath,
          quality_score: 0, // Will update after linting
          status: 'uploaded'
        })
        .select()
        .single();

      if (docError) {
        console.error('Database insert error:', docError);
        // Try to clean up uploaded file
        await supabase.storage.from('documents').remove([filePath]);
        res.status(500).json({ error: 'Failed to save document metadata', details: docError.message });
        return;
      }

      // 3. TODO: Run linting logic here
      // const lintingResults = await lintDocument(fileBuffer);

      res.json({
        success: true,
        document: docData,
        message: 'Document uploaded successfully'
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all documents for the authenticated user.
   */
  async getDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ documents: data || [] });
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({
        error: 'Failed to fetch documents',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get a specific document by ID.
   */
  async getDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      res.json({ document: data });
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({
        error: 'Failed to fetch document',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete a document.
   */
  async deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Get document to find file path
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (fetchError || !document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      // Delete from storage
      if (document.file_path) {
        await supabase.storage.from('documents').remove([document.file_path]);
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) {
        res.status(500).json({ error: deleteError.message });
        return;
      }

      res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({
        error: 'Failed to delete document',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
