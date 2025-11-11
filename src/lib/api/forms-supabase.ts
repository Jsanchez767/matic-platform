/**
 * Forms Supabase API Client
 * Temporary compatibility layer during migration to FastAPI
 * TODO: Migrate all usages to forms-client.ts
 */

import { supabase } from '@/lib/supabase'

export const formsSupabase = {
  /**
   * Get all forms for a workspace
   */
  async getFormsByWorkspace(workspaceId: string) {
    const { data, error } = await supabase
      .from('forms')
      .select(`
        *,
        fields:form_fields(*),
        submissions:form_submissions(count)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get a single form by ID
   */
  async getFormById(formId: string) {
    const { data, error } = await supabase
      .from('forms')
      .select(`
        *,
        fields:form_fields(*),
        submissions:form_submissions(*),
        table_connections:form_table_connections(*)
      `)
      .eq('id', formId)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create a new form
   */
  async createForm(formData: any) {
    const { data, error } = await supabase
      .from('forms')
      .insert(formData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a form
   */
  async updateForm(formId: string, updates: any) {
    const { data, error } = await supabase
      .from('forms')
      .update(updates)
      .eq('id', formId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a form
   */
  async deleteForm(formId: string) {
    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', formId)

    if (error) throw error
  },

  /**
   * Get form fields
   */
  async getFormFields(formId: string) {
    const { data, error } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', formId)
      .order('position', { ascending: true })

    if (error) throw error
    return data
  },

  /**
   * Create a form field
   */
  async createFormField(fieldData: any) {
    const { data, error } = await supabase
      .from('form_fields')
      .insert(fieldData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a form field
   */
  async updateFormField(fieldId: string, updates: any) {
    const { data, error } = await supabase
      .from('form_fields')
      .update(updates)
      .eq('id', fieldId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a form field
   */
  async deleteFormField(fieldId: string) {
    const { error } = await supabase
      .from('form_fields')
      .delete()
      .eq('id', fieldId)

    if (error) throw error
  },

  /**
   * Get form submissions
   */
  async getFormSubmissions(formId: string) {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Create a form submission
   */
  async createFormSubmission(submissionData: any) {
    const { data, error } = await supabase
      .from('form_submissions')
      .insert(submissionData)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
