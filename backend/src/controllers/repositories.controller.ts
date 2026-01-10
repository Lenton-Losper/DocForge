/** Repository management controller. */
import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

export class RepositoriesController {
  /**
   * Connect a GitHub repository.
   */
  async connect(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { repo_url, github_token } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!repo_url) {
        res.status(400).json({ error: 'Missing repo_url' });
        return;
      }

      // Parse repository URL
      const urlParts = repo_url.split('/');
      const repoName = urlParts.pop()?.replace('.git', '') || '';
      const repoOwner = urlParts.pop() || '';

      const { data, error } = await supabase
        .from('repositories')
        .insert({
          user_id: userId,
          repo_url: repo_url,
          repo_name: repoName,
          repo_owner: repoOwner,
          github_token: github_token || null, // Should be encrypted in production
          status: 'connected'
        })
        .select()
        .single();

      if (error) {
        console.error('Repository insert error:', error);
        res.status(500).json({ error: 'Failed to connect repository', details: error.message });
        return;
      }

      res.json({
        success: true,
        repository: data
      });
    } catch (error) {
      console.error('Connect repository error:', error);
      res.status(500).json({
        error: 'Failed to connect repository',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all repositories for the authenticated user.
   */
  async getRepositories(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ repositories: data || [] });
    } catch (error) {
      console.error('Get repositories error:', error);
      res.status(500).json({
        error: 'Failed to fetch repositories',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get a specific repository by ID.
   */
  async getRepository(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { data, error } = await supabase
        .from('repositories')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error) {
        res.status(404).json({ error: 'Repository not found' });
        return;
      }

      res.json({ repository: data });
    } catch (error) {
      console.error('Get repository error:', error);
      res.status(500).json({
        error: 'Failed to fetch repository',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete a repository connection.
   */
  async deleteRepository(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { error } = await supabase
        .from('repositories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ success: true, message: 'Repository disconnected' });
    } catch (error) {
      console.error('Delete repository error:', error);
      res.status(500).json({
        error: 'Failed to delete repository',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
