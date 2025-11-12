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
   * Get a single request hub by ID (with integrated forms and tables)
   */
  async getRequestHubById(hubId: string) {
    const { data, error } = await supabase
      .from('request_hubs')
      .select(`
        *,
        tabs:request_hub_tabs(*),
        forms:request_hub_forms(
          *,
          form:forms(*)
        ),
        tables:request_hub_tables(
          *,
          table:data_tables(*)
        )
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
  },

  // =====================================================
  // INTEGRATED SCHEMA METHODS
  // =====================================================

  /**
   * Link a form to a request hub
   */
  async linkForm(hubId: string, formData: {
    form_id: string
    request_type_name: string
    request_type_slug: string
    workflow_enabled?: boolean
    approval_steps?: any[]
    auto_create_table_row?: boolean
    target_table_id?: string
  }) {
    const { data, error } = await supabase
      .from('request_hub_forms')
      .insert({
        hub_id: hubId,
        ...formData
      })
      .select(`
        *,
        form:forms(*)
      `)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get all forms linked to a hub
   */
  async getLinkedForms(hubId: string) {
    const { data, error } = await supabase
      .from('request_hub_forms')
      .select(`
        *,
        form:forms(*)
      `)
      .eq('hub_id', hubId)
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (error) throw error
    return data
  },

  /**
   * Update a linked form configuration
   */
  async updateLinkedForm(linkId: string, updates: any) {
    const { data, error } = await supabase
      .from('request_hub_forms')
      .update(updates)
      .eq('id', linkId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Unlink a form from a hub
   */
  async unlinkForm(linkId: string) {
    const { error } = await supabase
      .from('request_hub_forms')
      .delete()
      .eq('id', linkId)

    if (error) throw error
  },

  /**
   * Link a table to a request hub
   */
  async linkTable(hubId: string, tableData: {
    table_id: string
    purpose: 'requests_storage' | 'approvals_queue' | 'analytics_source' | 'custom'
    config?: any
    is_primary?: boolean
  }) {
    const { data, error } = await supabase
      .from('request_hub_tables')
      .insert({
        hub_id: hubId,
        ...tableData
      })
      .select(`
        *,
        table:data_tables(*)
      `)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Get all tables linked to a hub
   */
  async getLinkedTables(hubId: string) {
    const { data, error } = await supabase
      .from('request_hub_tables')
      .select(`
        *,
        table:data_tables(*)
      `)
      .eq('hub_id', hubId)

    if (error) throw error
    return data
  },

  /**
   * Get primary storage table for a hub
   */
  async getPrimaryTable(hubId: string) {
    const { data, error } = await supabase
      .from('request_hub_tables')
      .select(`
        *,
        table:data_tables(*)
      `)
      .eq('hub_id', hubId)
      .eq('is_primary', true)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a linked table configuration
   */
  async updateLinkedTable(linkId: string, updates: any) {
    const { data, error } = await supabase
      .from('request_hub_tables')
      .update(updates)
      .eq('id', linkId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Unlink a table from a hub
   */
  async unlinkTable(linkId: string) {
    const { error } = await supabase
      .from('request_hub_tables')
      .delete()
      .eq('id', linkId)

    if (error) throw error
  },

  /**
   * Get request templates
   */
  async getTemplates(category?: string) {
    let query = supabase
      .from('request_templates')
      .select('*')
      .eq('is_public', true)

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query.order('name', { ascending: true })

    if (error) throw error
    return data
  },

  /**
   * Create a request template
   */
  async createTemplate(templateData: {
    name: string
    description?: string
    category?: string
    form_template: any
    table_schema: any
    workflow_template?: any[]
    is_public?: boolean
  }) {
    const { data, error } = await supabase
      .from('request_templates')
      .insert(templateData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Submit a request through a hub
   * This creates a form submission and optionally creates a table row
   */
  async submitRequest(hubFormLinkId: string, formData: any, userId: string) {
    // Get the hub form configuration
    const { data: hubForm, error: configError } = await supabase
      .from('request_hub_forms')
      .select('*')
      .eq('id', hubFormLinkId)
      .single()

    if (configError) throw configError

    // Create form submission (using existing forms module)
    const { data: submission, error: submitError } = await supabase
      .from('form_submissions')
      .insert({
        form_id: hubForm.form_id,
        data: formData,
        submitted_by: userId,
        status: 'submitted'
      })
      .select()
      .single()

    if (submitError) throw submitError

    // If auto-create table row is enabled, create the row
    if (hubForm.auto_create_table_row && hubForm.target_table_id) {
      const { error: rowError } = await supabase
        .from('table_rows')
        .insert({
          table_id: hubForm.target_table_id,
          data: {
            ...formData,
            submission_id: submission.id,
            status: 'pending',
            submitted_by: userId,
            submitted_at: new Date().toISOString(),
            request_type: hubForm.request_type_name
          }
        })

      if (rowError) throw rowError
    }

    return submission
  },

  /**
   * Get requests from a hub (using linked table)
   */
  async getRequests(hubId: string, filters?: {
    userId?: string
    status?: string
    requestType?: string
  }) {
    // Get primary table
    const { data: hubTable, error: tableError } = await supabase
      .from('request_hub_tables')
      .select('table_id')
      .eq('hub_id', hubId)
      .eq('is_primary', true)
      .single()

    if (tableError) throw tableError

    // Build query
    let query = supabase
      .from('table_rows')
      .select('*')
      .eq('table_id', hubTable.table_id)

    // Apply filters
    if (filters?.userId) {
      query = query.eq('data->>submitted_by', filters.userId)
    }
    if (filters?.status) {
      query = query.eq('data->>status', filters.status)
    }
    if (filters?.requestType) {
      query = query.eq('data->>request_type', filters.requestType)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}
