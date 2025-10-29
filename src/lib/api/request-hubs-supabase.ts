/**
 * Request Hub Supabase API Client
 * Manages request hubs and their tabs
 */

import { supabase } from '@/lib/supabase'
import type {
  RequestHub,
  RequestHubTab,
  RequestHubCreate,
  RequestHubUpdate,
  RequestHubTabCreate,
  RequestHubTabUpdate,
} from '@/types/request-hub'

export const requestHubsSupabase = {
  /**
   * List all request hubs in a workspace
   */
  async list(workspaceId: string): Promise<RequestHub[]> {
    const { data, error } = await supabase
      .from('request_hubs')
      .select(`
        *,
        tabs:request_hub_tabs(*)
      `)
      .eq('workspace_id', workspaceId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching request hubs:', error)
      throw new Error(error.message)
    }

    // Sort tabs by position
    if (data) {
      data.forEach((hub: any) => {
        if (hub.tabs) {
          hub.tabs.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
        }
      })
    }

    return (data || []) as RequestHub[]
  },

  /**
   * Get a single request hub with its tabs
   */
  async get(hubId: string): Promise<RequestHub> {
    const { data, error } = await supabase
      .from('request_hubs')
      .select(`
        *,
        tabs:request_hub_tabs(*)
      `)
      .eq('id', hubId)
      .single()

    if (error) {
      console.error('Error fetching request hub:', error)
      throw new Error(error.message)
    }

    // Sort tabs by position
    if (data && data.tabs) {
      data.tabs.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
    }

    return data as RequestHub
  },

  /**
   * Get request hub by slug
   */
  async getBySlug(workspaceId: string, slug: string): Promise<RequestHub> {
    const { data, error } = await supabase
      .from('request_hubs')
      .select(`
        *,
        tabs:request_hub_tabs(*)
      `)
      .eq('workspace_id', workspaceId)
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching request hub by slug:', error)
      throw new Error(error.message)
    }

    // Sort tabs by position
    if (data && data.tabs) {
      data.tabs.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
    }

    return data as RequestHub
  },

  /**
   * Create a new request hub
   */
  async create(hubData: RequestHubCreate): Promise<RequestHub> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('request_hubs')
      .insert({
        ...hubData,
        created_by: user.id,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating request hub:', error)
      throw new Error(error.message)
    }

    return data as RequestHub
  },

  /**
   * Update a request hub
   */
  async update(hubId: string, updates: RequestHubUpdate): Promise<RequestHub> {
    const { data, error } = await supabase
      .from('request_hubs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', hubId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating request hub:', error)
      throw new Error(error.message)
    }

    return data as RequestHub
  },

  /**
   * Delete a request hub (soft delete by setting is_active = false)
   */
  async delete(hubId: string): Promise<void> {
    const { error } = await supabase
      .from('request_hubs')
      .update({ is_active: false })
      .eq('id', hubId)

    if (error) {
      console.error('Error deleting request hub:', error)
      throw new Error(error.message)
    }
  },

  // ==================== Hub Tabs ====================

  /**
   * Get tabs for a hub
   */
  async getTabs(hubId: string): Promise<RequestHubTab[]> {
    const { data, error } = await supabase
      .from('request_hub_tabs')
      .select('*')
      .eq('hub_id', hubId)
      .eq('is_visible', true)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching hub tabs:', error)
      throw new Error(error.message)
    }

    return (data || []) as RequestHubTab[]
  },

  /**
   * Create a new tab
   */
  async createTab(tabData: RequestHubTabCreate): Promise<RequestHubTab> {
    const { data, error } = await supabase
      .from('request_hub_tabs')
      .insert(tabData)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating hub tab:', error)
      throw new Error(error.message)
    }

    return data as RequestHubTab
  },

  /**
   * Update a tab
   */
  async updateTab(tabId: string, updates: RequestHubTabUpdate): Promise<RequestHubTab> {
    const { data, error } = await supabase
      .from('request_hub_tabs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tabId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating hub tab:', error)
      throw new Error(error.message)
    }

    return data as RequestHubTab
  },

  /**
   * Delete a tab (soft delete by setting is_visible = false)
   */
  async deleteTab(tabId: string): Promise<void> {
    const { error } = await supabase
      .from('request_hub_tabs')
      .update({ is_visible: false })
      .eq('id', tabId)

    if (error) {
      console.error('Error deleting hub tab:', error)
      throw new Error(error.message)
    }
  },

  /**
   * Reorder tabs
   */
  async reorderTabs(hubId: string, tabIds: string[]): Promise<void> {
    const updates = tabIds.map((id, index) => ({
      id,
      position: index,
    }))

    for (const update of updates) {
      await this.updateTab(update.id, { position: update.position })
    }
  },
}
