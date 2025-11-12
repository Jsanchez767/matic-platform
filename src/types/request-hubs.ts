/**
 * Request Hub Types - Integrated Schema
 * These types match the database schema in 005_request_hub_integrated.sql
 */

// =====================================================
// REQUEST HUB
// =====================================================

export interface RequestHub {
  id: string
  workspace_id: string
  name: string
  slug: string
  description?: string
  settings: RequestHubSettings
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
  
  // Relations (loaded via joins)
  tabs?: RequestHubTab[]
  forms?: RequestHubFormLink[]
  tables?: RequestHubTableLink[]
}

export interface RequestHubSettings {
  theme: {
    primary_color: string
    logo_url?: string
  }
  notifications: {
    email_on_submit: boolean
    email_on_approve: boolean
    email_on_deny: boolean
    slack_webhook?: string
  }
  features: {
    enable_approvals: boolean
    enable_analytics: boolean
    enable_comments: boolean
    allow_drafts: boolean
  }
}

export interface RequestHubCreate {
  workspace_id: string
  name: string
  slug: string
  description?: string
  settings?: Partial<RequestHubSettings>
  created_by: string
}

export interface RequestHubUpdate {
  name?: string
  description?: string
  settings?: Partial<RequestHubSettings>
  is_active?: boolean
}

// =====================================================
// REQUEST HUB TABS
// =====================================================

export type RequestHubTabType = 
  | 'dashboard'
  | 'my-requests'
  | 'new-request'
  | 'approvals'
  | 'all-requests'
  | 'analytics'
  | 'custom'

export interface RequestHubTab {
  id: string
  hub_id: string
  name: string
  slug: string
  type: RequestHubTabType
  icon?: string
  position: number
  is_visible: boolean
  config: RequestHubTabConfig
  created_at: string
  updated_at: string
}

export interface RequestHubTabConfig {
  // For 'new-request' type
  form_id?: string
  redirect_after_submit?: string
  show_form_picker?: boolean
  
  // For table-based tabs
  table_id?: string
  filters?: Array<{
    column: string
    operator: string
    value: any
  }>
  columns?: string[]
  
  // For 'dashboard' type
  metrics?: string[]
  charts?: string[]
  
  // For 'approvals' type
  approval_column?: string
}

export interface RequestHubTabCreate {
  hub_id: string
  name: string
  slug: string
  type: RequestHubTabType
  icon?: string
  position?: number
  config?: Partial<RequestHubTabConfig>
}

export interface RequestHubTabUpdate {
  name?: string
  icon?: string
  position?: number
  is_visible?: boolean
  config?: Partial<RequestHubTabConfig>
}

// =====================================================
// REQUEST HUB FORM LINKS (Integration)
// =====================================================

export interface RequestHubFormLink {
  id: string
  hub_id: string
  form_id: string
  request_type_name: string
  request_type_slug: string
  workflow_enabled: boolean
  approval_steps: ApprovalStep[]
  auto_create_table_row: boolean
  target_table_id?: string
  position: number
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relation (loaded via join)
  form?: any // Form type from forms module
}

export interface ApprovalStep {
  step: number
  role: string
  required: boolean
  auto_approve_conditions?: any
}

export interface RequestHubFormLinkCreate {
  hub_id: string
  form_id: string
  request_type_name: string
  request_type_slug: string
  workflow_enabled?: boolean
  approval_steps?: ApprovalStep[]
  auto_create_table_row?: boolean
  target_table_id?: string
  position?: number
}

export interface RequestHubFormLinkUpdate {
  request_type_name?: string
  workflow_enabled?: boolean
  approval_steps?: ApprovalStep[]
  auto_create_table_row?: boolean
  target_table_id?: string
  position?: number
  is_active?: boolean
}

// =====================================================
// REQUEST HUB TABLE LINKS (Integration)
// =====================================================

export type RequestHubTablePurpose = 
  | 'requests_storage'
  | 'approvals_queue'
  | 'analytics_source'
  | 'custom'

export interface RequestHubTableLink {
  id: string
  hub_id: string
  table_id: string
  purpose: RequestHubTablePurpose
  config: RequestHubTableConfig
  is_primary: boolean
  created_at: string
  
  // Relation (loaded via join)
  table?: any // DataTable type from tables module
}

export interface RequestHubTableConfig {
  status_column_id?: string
  priority_column_id?: string
  assigned_to_column_id?: string
  submitted_date_column_id?: string
  submitted_by_column_id?: string
  reviewed_by_column_id?: string
  reviewed_date_column_id?: string
  [key: string]: any
}

export interface RequestHubTableLinkCreate {
  hub_id: string
  table_id: string
  purpose: RequestHubTablePurpose
  config?: Partial<RequestHubTableConfig>
  is_primary?: boolean
}

export interface RequestHubTableLinkUpdate {
  purpose?: RequestHubTablePurpose
  config?: Partial<RequestHubTableConfig>
  is_primary?: boolean
}

// =====================================================
// REQUEST TEMPLATES
// =====================================================

export interface RequestTemplate {
  id: string
  name: string
  description?: string
  category?: string
  form_template: any
  table_schema: any
  workflow_template: ApprovalStep[]
  is_public: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface RequestTemplateCreate {
  name: string
  description?: string
  category?: string
  form_template: any
  table_schema: any
  workflow_template?: ApprovalStep[]
  is_public?: boolean
}

export interface RequestTemplateUpdate {
  name?: string
  description?: string
  category?: string
  form_template?: any
  table_schema?: any
  workflow_template?: ApprovalStep[]
  is_public?: boolean
}

// =====================================================
// REQUEST SUBMISSION
// =====================================================

export interface RequestSubmission {
  form_submission_id: string
  table_row_id?: string
  hub_id: string
  form_link_id: string
  request_type: string
  status: 'draft' | 'submitted' | 'pending' | 'approved' | 'denied' | 'cancelled'
  submitted_by: string
  submitted_at: string
  data: Record<string, any>
}

export interface RequestSubmissionCreate {
  hub_form_link_id: string
  data: Record<string, any>
  status?: 'draft' | 'submitted'
}

// =====================================================
// REQUEST METRICS (For Dashboard)
// =====================================================

export interface RequestHubMetrics {
  total: number
  pending: number
  approved: number
  denied: number
  draft: number
  byType: Record<string, number>
  byStatus: Record<string, number>
  overTime: Array<{
    date: string
    count: number
  }>
  averageApprovalTime?: number
}

// =====================================================
// FILTERS AND QUERIES
// =====================================================

export interface RequestFilter {
  userId?: string
  status?: string
  requestType?: string
  startDate?: string
  endDate?: string
  assignedTo?: string
}

export interface RequestSort {
  column: string
  direction: 'asc' | 'desc'
}

// =====================================================
// WORKFLOW AND APPROVALS
// =====================================================

export interface ApprovalAction {
  request_id: string
  action: 'approve' | 'deny' | 'request_changes'
  comments?: string
  approved_by: string
  approved_at: string
}

export interface WorkflowStatus {
  current_step: number
  total_steps: number
  completed_steps: ApprovalStep[]
  pending_steps: ApprovalStep[]
  is_complete: boolean
}
