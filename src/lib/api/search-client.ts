import { getSessionToken } from '../supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export interface SearchResult {
  id: string
  title: string
  subtitle?: string
  description?: string
  type: 'table' | 'form' | 'request-hub' | 'row' | 'submission' | 'column' | 'field'
  category: string
  url: string
  workspaceId: string
  metadata?: {
    tableName?: string
    formName?: string
    hubName?: string
    rowData?: Record<string, any>
    columnCount?: number
    fieldCount?: number
    submissionCount?: number
    lastUpdated?: string
    createdAt?: string
    createdBy?: string
  }
  highlights?: string[]
  score: number
  path?: string // e.g., "Workspace / Customers Table / Contact Info"
}

export interface SearchFilters {
  types?: string[] // Filter by entity type
  workspaceId?: string
  includeArchived?: boolean
  dateFrom?: string
  dateTo?: string
  createdBy?: string
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  took: number // milliseconds
  suggestions?: string[]
}

class SearchClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await getSessionToken()
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Search failed' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  /**
   * Search across all workspace entities
   */
  async search(
    query: string,
    workspaceId: string,
    filters?: SearchFilters
  ): Promise<SearchResponse> {
    const params = new URLSearchParams({
      q: query,
      workspace_id: workspaceId,
      ...(filters?.types && { types: filters.types.join(',') }),
      ...(filters?.includeArchived !== undefined && { 
        include_archived: String(filters.includeArchived) 
      }),
      ...(filters?.dateFrom && { date_from: filters.dateFrom }),
      ...(filters?.dateTo && { date_to: filters.dateTo }),
      ...(filters?.createdBy && { created_by: filters.createdBy }),
    })

    return this.request<SearchResponse>(`/search?${params}`)
  }

  /**
   * Search within a specific table's rows
   */
  async searchTableRows(
    tableId: string,
    query: string,
    options?: {
      columns?: string[] // Search only specific columns
      limit?: number
    }
  ): Promise<SearchResponse> {
    const params = new URLSearchParams({
      q: query,
      ...(options?.columns && { columns: options.columns.join(',') }),
      ...(options?.limit && { limit: String(options.limit) }),
    })

    return this.request<SearchResponse>(`/tables/${tableId}/search?${params}`)
  }

  /**
   * Search form submissions
   */
  async searchFormSubmissions(
    formId: string,
    query: string,
    options?: {
      fields?: string[]
      limit?: number
    }
  ): Promise<SearchResponse> {
    const params = new URLSearchParams({
      q: query,
      ...(options?.fields && { fields: options.fields.join(',') }),
      ...(options?.limit && { limit: String(options.limit) }),
    })

    return this.request<SearchResponse>(`/forms/${formId}/search?${params}`)
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(
    query: string,
    workspaceId: string,
    limit: number = 5
  ): Promise<string[]> {
    const params = new URLSearchParams({
      q: query,
      workspace_id: workspaceId,
      limit: String(limit),
    })

    const response = await this.request<{ suggestions: string[] }>(
      `/search/suggestions?${params}`
    )
    
    return response.suggestions
  }

  /**
   * Get recent searches for a workspace
   */
  async getRecentSearches(workspaceId: string, limit: number = 10): Promise<string[]> {
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      limit: String(limit),
    })

    const response = await this.request<{ searches: string[] }>(
      `/search/recent?${params}`
    )
    
    return response.searches
  }

  /**
   * Save search to history
   */
  async saveSearch(workspaceId: string, query: string): Promise<void> {
    await this.request('/search/history', {
      method: 'POST',
      body: JSON.stringify({
        workspace_id: workspaceId,
        query,
      }),
    })
  }

  /**
   * Get popular searches in workspace
   */
  async getPopularSearches(workspaceId: string, limit: number = 5): Promise<{
    query: string
    count: number
  }[]> {
    const params = new URLSearchParams({
      workspace_id: workspaceId,
      limit: String(limit),
    })

    const response = await this.request<{ searches: { query: string; count: number }[] }>(
      `/search/popular?${params}`
    )
    
    return response.searches
  }
}

export const searchClient = new SearchClient()
