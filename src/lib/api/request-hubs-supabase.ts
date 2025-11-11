/**
 * Request Hubs Supabase API Client
 * Temporary compatibility layer during migration to FastAPI
 * TODO: Migrate all usages to request-hubs-client.ts
 */

import { supabase } from '@/lib/supabase'

export const requestHubsSupabase = {
  /**
   * Get all request hubs for a workspace
   */
  async getRequestHubsByWorkspace(workspaceId: string) {
    const { data, error } = await supabase
      .from('request_hubs')
      .select(`
        *,
        tabs:request_hub_tabs(*)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get a single request hub by ID
   */
  async getRequestHubById(hubId: string) {
    const { data, error } = await supabase
      .from('request_hubs')
      .select(`
        *,
        tabs:request_hub_tabs(*)
      `)
      .eq('id', hubId)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get a request hub by slug
   */
  async getRequestHubBySlug(workspaceId: string, slug: string) {
    const { data, error } = await supabase
      .from('request_hubs')
      .select(`
        *,
        tabs:request_hub_tabs(*)
      `)
      .eq('workspace_id', workspaceId)
      .eq('slug', slug)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create a new request hub
   */
  async createRequestHub(hubData: any) {
    const { data, error } = await supabase
      .from('request_hubs')
      .insert(hubData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a request hub
   */
  async updateRequestHub(hubId: string, updates: any) {
    const { data, error } = await supabase
      .from('request_hubs')
      .update(updates)
      .eq('id', hubId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a request hub
   */
  async deleteRequestHub(hubId: string) {
    const { error } = await supabase
      .from('request_hubs')
      .delete()
      .eq('id', hubId)

    if (error) throw error
  },

  /**
   * Get request hub tabs
   */
  async getRequestHubTabs(hubId: string) {
    const { data, error } = await supabase
      .from('request_hub_tabs')
      .select('*')
      .eq('hub_id', hubId)
      .order('position', { ascending: true })

    if (error) throw error
    return data
  },

  /**
   * Create a request hub tab
   */
  async createTab(tabData: any) {
    const { data, error } = await supabase
      .from('request_hub_tabs')
      .insert(tabData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a request hub tab
   */
  async updateTab(tabId: string, updates: any) {
    const { data, error } = await supabase
      .from('request_hub_tabs')
      .update(updates)
      .eq('id', tabId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a request hub tab
   */
  async deleteTab(tabId: string) {
    const { error } = await supabase
      .from('request_hub_tabs')
      .delete()
      .eq('id', tabId)

    if (error) throw error
  }
}
