/**
 * API client for barcode scan history endpoints
 */

import type { ScanHistoryCreate, ScanHistoryRecord } from '@/types/scan-history'
import { fetchWithRetry, isBackendSleeping, showBackendSleepingMessage } from '@/lib/api-utils'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `API Error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    if (isBackendSleeping(error)) {
      showBackendSleepingMessage()
    }
    throw error
  }
}

export const scanHistoryAPI = {
  /**
   * Record a new scan event
   */
  create: async (data: ScanHistoryCreate): Promise<ScanHistoryRecord> => {
    return fetchAPI<ScanHistoryRecord>('/scans', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * List scan events for a table/column
   */
  list: async (
    params: {
      tableId: string
      columnId?: string | null
      columnName?: string | null
      limit?: number
    }
  ): Promise<ScanHistoryRecord[]> => {
    const searchParams = new URLSearchParams({
      table_id: params.tableId,
      limit: String(params.limit ?? 100),
    })

    if (params.columnId) {
      searchParams.set('column_id', params.columnId)
    } else if (params.columnName) {
      searchParams.set('column_name', params.columnName)
    }

    return fetchAPI<ScanHistoryRecord[]>(`/scans?${searchParams.toString()}`)
  },
}
