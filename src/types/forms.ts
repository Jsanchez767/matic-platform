/**
 * Form Types for Matic Platform
 * Based on database schema in 001_initial_schema.sql
 */

export type FormStatus = 'draft' | 'published' | 'archived' | 'paused'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'url'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'datetime'
  | 'time'
  | 'file'
  | 'image'
  | 'signature'
  | 'rating'
  | 'divider'
  | 'heading'
  | 'paragraph'

export type FieldWidth = 'full' | 'half' | 'third' | 'quarter'

export interface FormField {
  id: string
  form_id: string
  name: string
  label: string
  placeholder?: string
  description?: string
  field_type: FieldType
  settings: Record<string, any>
  validation: Record<string, any>
  options: Array<{ label: string; value: string }>
  position: number
  width: FieldWidth
  is_visible: boolean
  created_at: string
  updated_at: string
}

export interface Form {
  id: string
  workspace_id: string
  name: string
  description?: string
  slug: string
  settings: Record<string, any>
  submit_settings: Record<string, any>
  status: FormStatus
  version: number
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
  published_at?: string
  fields?: FormField[]
}

export interface FormSubmission {
  id: string
  form_id: string
  data: Record<string, any>
  metadata: Record<string, any>
  status: 'submitted' | 'reviewed' | 'approved' | 'rejected'
  submitted_by?: string
  email?: string
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
}

export interface FormCreate {
  workspace_id: string
  name: string
  description?: string
  slug: string
  settings?: Record<string, any>
  submit_settings?: Record<string, any>
  status?: FormStatus
  is_public?: boolean
}

export interface FormUpdate {
  name?: string
  description?: string
  slug?: string
  settings?: Record<string, any>
  submit_settings?: Record<string, any>
  status?: FormStatus
  is_public?: boolean
}
