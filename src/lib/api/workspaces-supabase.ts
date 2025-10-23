/**
 * Supabase Direct API for workspace queries
 * Read-only operations for navigation and workspace discovery
 */

import { supabase } from '@/lib/supabase'
import type { Workspace } from '@/types/workspaces'

export const workspacesSupabase = {
  /**
   * List all workspaces the current user has access to
   */
  async list(): Promise<Workspace[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        workspace_members!inner(user_id)
      `)
      .eq('workspace_members.user_id', user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching workspaces:', error)
      throw new Error(error.message)
    }

    return (data || []) as Workspace[]
  },

  /**
   * Get a single workspace by ID
   */
  async get(workspaceId: string): Promise<Workspace> {
    const { data, error} = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single()

    if (error) {
      console.error('Error fetching workspace:', error)
      throw new Error(error.message)
    }

    return data as Workspace
  },

  /**
   * Get workspace by slug
   */
  async getBySlug(slug: string, organizationId: string): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('slug', slug)
      .eq('organization_id', organizationId)
      .single()

    if (error) {
      console.error('Error fetching workspace by slug:', error)
      throw new Error(error.message)
    }

    return data as Workspace
  },
}
