/**
 * Request Hub Types
 * Customizable request management system using data tables
 */

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
  tabs?: RequestHubTab[]
}

export interface RequestHubSettings {
  theme?: {
    primary_color?: string
    logo_url?: string
  }
  notifications?: {
    email_on_submit?: boolean
    email_on_approve?: boolean
    slack_webhook?: string
  }
  permissions?: {
    can_submit?: string[] // user roles
    can_approve?: string[] // user roles
    can_admin?: string[] // user roles
  }
}

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

export type RequestHubTabType = 
  | 'dashboard'      // Metrics and charts
  | 'my-requests'    // User's submitted requests
  | 'new-request'    // Form submission
  | 'approvals'      // Approval queue
  | 'all-requests'   // All requests in system
  | 'analytics'      // Advanced analytics
  | 'custom'         // Custom tab with table view

export interface RequestHubTabConfig {
  // For 'new-request' type
  form_table_id?: string        // Which table to submit to
  form_fields?: string[]         // Which columns to show in form
  
  // For 'my-requests', 'all-requests', 'approvals' type
  source_table_id?: string       // Which table to read from
  filters?: RequestHubFilter[]   // Filters to apply
  columns?: string[]             // Which columns to display
  sort_by?: string               // Column to sort by
  sort_order?: 'asc' | 'desc'
  
  // For 'dashboard' type
  metrics?: DashboardMetric[]
  charts?: DashboardChart[]
  
  // For 'custom' type
  custom_query?: string          // Custom SQL/query
  custom_component?: string      // Custom React component name
}

export interface RequestHubFilter {
  column_id: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty'
  value?: string
  use_current_user?: boolean  // Filter by current user ID
}

export interface DashboardMetric {
  id: string
  name: string
  type: 'count' | 'sum' | 'average' | 'percentage'
  table_id: string
  column_id?: string
  filters?: RequestHubFilter[]
  icon?: string
  color?: string
}

export interface DashboardChart {
  id: string
  name: string
  type: 'bar' | 'line' | 'pie' | 'donut'
  table_id: string
  x_axis_column?: string
  y_axis_column?: string
  group_by_column?: string
  filters?: RequestHubFilter[]
}

export interface RequestHubCreate {
  workspace_id: string
  name: string
  slug: string
  description?: string
  settings?: RequestHubSettings
  created_by: string
}

export interface RequestHubUpdate {
  name?: string
  description?: string
  settings?: RequestHubSettings
  is_active?: boolean
}

export interface RequestHubTabCreate {
  hub_id: string
  name: string
  slug: string
  type: RequestHubTabType
  icon?: string
  position: number
  config: RequestHubTabConfig
}

export interface RequestHubTabUpdate {
  name?: string
  icon?: string
  position?: number
  is_visible?: boolean
  config?: RequestHubTabConfig
}

// Request status workflow
export interface RequestWorkflowStep {
  id: string
  name: string
  status_value: string
  requires_approval: boolean
  approver_roles?: string[]
  approver_user_ids?: string[]
  next_steps?: string[]  // IDs of possible next steps
  notification_template?: string
}

export interface ApprovalAction {
  action: 'approve' | 'reject' | 'return'
  comments?: string
  next_step_id?: string
}
