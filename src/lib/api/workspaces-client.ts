import type { Workspace, WorkspaceSummary } from '@/types/workspaces'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }))
    throw new Error(error.detail || `API Error: ${response.status}`)
  }

  return response.json()
}

export const workspacesAPI = {
  // List workspaces for a user
  list: async (userId: string): Promise<Workspace[]> => {
    return fetchAPI<Workspace[]>(`/workspaces?user_id=${userId}`)
  },

  // Get workspace details
  get: async (workspaceId: string): Promise<Workspace> => {
    return fetchAPI<Workspace>(`/workspaces/${workspaceId}`)
  },

  // Get workspace by slug
  getBySlug: async (organizationId: string, slug: string): Promise<Workspace> => {
    return fetchAPI<Workspace>(`/workspaces/by-slug/${slug}?organization_id=${organizationId}`)
  },
}
