/**
 * Supabase Direct API for forms
 * Handles form CRUD operations with RLS security
 */

import { supabase } from '@/lib/supabase'
import type { Form, FormField, FormCreate, FormUpdate, FormSubmission } from '@/types/forms'

export const formsSupabase = {
  /**
   * List forms in a workspace
   */
  async list(workspaceId: string, includeArchived = false): Promise<Form[]> {
    let query = supabase
      .from('forms')
      .select(`
        *,
        fields:form_fields(*)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (!includeArchived) {
      query = query.neq('status', 'archived')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching forms:', error)
      throw new Error(error.message)
    }

    // Sort fields by position for each form
    if (data) {
      data.forEach((form: any) => {
        if (form.fields) {
          form.fields.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
        }
      })
    }

    return (data || []) as Form[]
  },

  /**
   * Get a single form with its fields
   */
  async get(formId: string): Promise<Form> {
    const { data, error } = await supabase
      .from('forms')
      .select(`
        *,
        fields:form_fields(*)
      `)
      .eq('id', formId)
      .single()

    if (error) {
      console.error('Error fetching form:', error)
      throw new Error(error.message)
    }

    // Sort fields by position
    if (data && data.fields) {
      data.fields.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
    }

    return data as Form
  },

  /**
   * Get form by slug
   */
  async getBySlug(workspaceId: string, slug: string): Promise<Form> {
    const { data, error } = await supabase
      .from('forms')
      .select(`
        *,
        fields:form_fields(*)
      `)
      .eq('workspace_id', workspaceId)
      .eq('slug', slug)
      .single()

    if (error) {
      console.error('Error fetching form by slug:', error)
      throw new Error(error.message)
    }

    // Sort fields by position
    if (data && data.fields) {
      data.fields.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
    }

    return data as Form
  },

  /**
   * Create a new form
   */
  async create(formData: FormCreate): Promise<Form> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('forms')
      .insert({
        ...formData,
        created_by: user.id,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating form:', error)
      throw new Error(error.message)
    }

    return data as Form
  },

  /**
   * Update a form
   */
  async update(formId: string, updates: FormUpdate): Promise<Form> {
    const { data, error } = await supabase
      .from('forms')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', formId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating form:', error)
      throw new Error(error.message)
    }

    return data as Form
  },

  /**
   * Delete a form
   */
  async delete(formId: string): Promise<void> {
    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', formId)

    if (error) {
      console.error('Error deleting form:', error)
      throw new Error(error.message)
    }
  },

  /**
   * Get submissions for a form
   */
  async getSubmissions(formId: string): Promise<FormSubmission[]> {
    const { data, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('Error fetching submissions:', error)
      throw new Error(error.message)
    }

    return (data || []) as FormSubmission[]
  },

  /**
   * Submit a form (public endpoint)
   */
  async submit(formId: string, data: Record<string, any>, email?: string): Promise<FormSubmission> {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: submission, error } = await supabase
      .from('form_submissions')
      .insert({
        form_id: formId,
        data,
        submitted_by: user?.id || null,
        email: email || user?.email || null,
        metadata: {
          user_agent: navigator.userAgent,
          submitted_from: window.location.href,
        },
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error submitting form:', error)
      throw new Error(error.message)
    }

    return submission as FormSubmission
  },
}
