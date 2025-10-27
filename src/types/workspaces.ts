// Workspace types
export interface Workspace {
  id: string
  organization_id: string
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
  logo_url?: string
  settings: Record<string, any>
  is_archived: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface WorkspaceSummary {
  id: string
  name: string
  slug: string
  color?: string
  icon?: string
}

export interface WorkspaceCreate {
  organization_id: string
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
  settings?: Record<string, any>
}

export interface WorkspaceUpdate {
  name?: string
  description?: string
  color?: string
  icon?: string
  logo_url?: string
  settings?: Record<string, any>
  is_archived?: boolean
}
