/**
 * Workspaces Supabase API Client
 * Temporary compatibility layer during migration to FastAPI
 * TODO: Migrate all usages to workspaces-client.ts
 */

import { supabase } from '@/lib/supabase'

export const workspacesSupabase = {
  /**
   * Get all workspaces for an organization
   */
  async getWorkspacesByOrganization(organizationId: string) {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get all workspaces for current user
   */
  async getWorkspacesForUser(userId: string) {
    const { data, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get a single workspace by ID
   */
  async getWorkspaceById(workspaceId: string) {
    const { data, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        organization:organizations(*),
        tables:data_tables(count),
        forms:forms(count)
      `)
      .eq('id', workspaceId)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get a workspace by slug
   */
  async getWorkspaceBySlug(slug: string) {
    const { data, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        organization:organizations(*),
        tables:data_tables(*),
        forms:forms(*)
      `)
      .eq('slug', slug)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create a new workspace
   */
  async createWorkspace(workspaceData: any) {
    const { data, error } = await supabase
      .from('workspaces')
      .insert(workspaceData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a workspace
   */
  async updateWorkspace(workspaceId: string, updates: any) {
    const { data, error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', workspaceId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a workspace
   */
  async deleteWorkspace(workspaceId: string) {
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)

    if (error) throw error
  },

  /**
   * Get workspace stats (tables, forms, etc.)
   */
  async getWorkspaceStats(workspaceId: string) {
    const [tables, forms] = await Promise.all([
      supabase
        .from('data_tables')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
      supabase
        .from('forms')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
    ])

    if (tables.error) throw tables.error
    if (forms.error) throw forms.error

    return {
      tableCount: tables.count || 0,
      formCount: forms.count || 0
    }
  }
}
