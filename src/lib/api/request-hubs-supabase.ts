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
        types:request_hub_types(*)
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
        types:request_hub_types(*)
      `)
      .eq('id', hubId)
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
   * Get request hub types
   */
  async getRequestHubTypes(hubId: string) {
    const { data, error } = await supabase
      .from('request_hub_types')
      .select('*')
      .eq('request_hub_id', hubId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data
  },

  /**
   * Create a request hub type
   */
  async createRequestHubType(typeData: any) {
    const { data, error } = await supabase
      .from('request_hub_types')
      .insert(typeData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a request hub type
   */
  async updateRequestHubType(typeId: string, updates: any) {
    const { data, error } = await supabase
      .from('request_hub_types')
      .update(updates)
      .eq('id', typeId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a request hub type
   */
  async deleteRequestHubType(typeId: string) {
    const { error } = await supabase
      .from('request_hub_types')
      .delete()
      .eq('id', typeId)

    if (error) throw error
  }
}
