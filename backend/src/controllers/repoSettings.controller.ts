/** Repository settings controller - Handles per-repository settings persistence. */
import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class RepoSettingsController {
  /**
   * GET /repositories/:id/settings
   * Get settings for a specific repository
   */
  async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const repositoryId = req.params.id;
      const userId = req.user!.id;

      // Verify repository belongs to user
      const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .select('id, user_id')
        .eq('id', repositoryId)
        .eq('user_id', userId)
        .single();

      if (repoError || !repo) {
        res.status(404).json({ error: 'Repository not found' });
        return;
      }

      // Get or create settings
      let { data: settings, error: settingsError } = await supabase
        .from('repo_settings')
        .select('*')
        .eq('repository_id', repositoryId)
        .single();

      // If no settings exist, create default ones
      if (settingsError && settingsError.code === 'PGRST116') {
        const { data: newSettings, error: createError } = await supabase
          .from('repo_settings')
          .insert({
            user_id: userId,
            repository_id: repositoryId,
            auto_regenerate_on_push: false
          })
          .select()
          .single();

        if (createError) {
          console.error('[SETTINGS] Error creating default settings:', createError);
          res.status(500).json({ error: 'Failed to create settings' });
          return;
        }

        settings = newSettings;
      } else if (settingsError) {
        console.error('[SETTINGS] Error fetching settings:', settingsError);
        res.status(500).json({ error: 'Failed to fetch settings' });
        return;
      }

      res.json({
        success: true,
        settings: {
          auto_regenerate_on_push: settings?.auto_regenerate_on_push ?? false
        }
      });
    } catch (error) {
      console.error('[SETTINGS] Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /repositories/:id/settings
   * Update settings for a specific repository (instant persistence, no save button)
   */
  async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const repositoryId = req.params.id;
      const userId = req.user!.id;
      const { auto_regenerate_on_push } = req.body;

      // Validate input
      if (typeof auto_regenerate_on_push !== 'boolean') {
        res.status(400).json({ error: 'auto_regenerate_on_push must be a boolean' });
        return;
      }

      // Verify repository belongs to user
      const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .select('id, user_id')
        .eq('id', repositoryId)
        .eq('user_id', userId)
        .single();

      if (repoError || !repo) {
        res.status(404).json({ error: 'Repository not found' });
        return;
      }

      // Upsert settings (insert or update)
      const { data: settings, error: upsertError } = await supabase
        .from('repo_settings')
        .upsert({
          user_id: userId,
          repository_id: repositoryId,
          auto_regenerate_on_push,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'repository_id'
        })
        .select()
        .single();

      if (upsertError) {
        console.error('[SETTINGS] Error upserting settings:', upsertError);
        res.status(500).json({ error: 'Failed to update settings' });
        return;
      }

      res.json({
        success: true,
        settings: {
          auto_regenerate_on_push: settings.auto_regenerate_on_push
        }
      });
    } catch (error) {
      console.error('[SETTINGS] Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
