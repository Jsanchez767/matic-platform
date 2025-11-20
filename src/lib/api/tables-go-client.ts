/**
 * Tables Go API Client
 * Complete replacement for tables-supabase.ts using Go backend
 */

import { goClient } from './go-client'
import type { DataTable, TableColumn, TableRow, TableView } from '@/types/data-tables'

export interface CreateTableInput {
  workspace_id: string
  name: string
  description?: string
  icon?: string
  columns?: Omit<TableColumn, 'id' | 'table_id' | 'created_at' | 'updated_at'>[]
  settings?: Record<string, any>
}

export interface UpdateTableInput {
  name?: string
  description?: string
  icon?: string
  settings?: Record<string, any>
}

export interface CreateRowInput {
  data: Record<string, any>
  position: number
}

export interface UpdateRowInput {
  data?: Record<string, any>
  position?: number
}

export interface BulkCreateRowsInput {
  rows: Record<string, any>[]
  created_by: string
}

/**
 * Tables Go API Client
 */
export const tablesGoClient = {
  // ============ Tables ============

  /**
   * Get all tables in a workspace
   */
  async getTablesByWorkspace(workspaceId: string): Promise<DataTable[]> {
    return goClient.get<DataTable[]>('/tables', { workspace_id: workspaceId })
  },

  /**
   * Get a single table by ID with columns and views
   */
  async getTableById(tableId: string): Promise<DataTable> {
    return goClient.get<DataTable>(`/tables/${tableId}`)
  },

  /**
   * Create a new table
   */
  async createTable(input: CreateTableInput, userId: string): Promise<DataTable> {
    return goClient.post<DataTable>(
      '/tables',
      {
        workspace_id: input.workspace_id,
        name: input.name,
        description: input.description || '',
        icon: input.icon || 'table',
        settings: input.settings || {},
      },
      { user_id: userId }
    )
  },

  /**
   * Update a table
   */
  async updateTable(tableId: string, input: UpdateTableInput): Promise<DataTable> {
    return goClient.patch<DataTable>(`/tables/${tableId}`, input)
  },

  /**
   * Delete a table
   */
  async deleteTable(tableId: string): Promise<void> {
    return goClient.delete<void>(`/tables/${tableId}`)
  },

  // ============ Table Columns ============

  /**
   * Get columns for a table
   */
  async getTableColumns(tableId: string): Promise<TableColumn[]> {
    const table = await this.getTableById(tableId)
    return table.columns || []
  },

  // ============ Table Rows ============

  /**
   * Get all rows for a table
   */
  async getRowsByTable(tableId: string): Promise<TableRow[]> {
    return goClient.get<TableRow[]>(`/tables/${tableId}/rows`)
  },

  /**
   * Create a new row
   */
  async createRow(tableId: string, input: CreateRowInput, userId: string): Promise<TableRow> {
    return goClient.post<TableRow>(
      `/tables/${tableId}/rows`,
      input,
      { user_id: userId }
    )
  },

  /**
   * Update a row
   */
  async updateRow(tableId: string, rowId: string, input: UpdateRowInput): Promise<TableRow> {
    return goClient.patch<TableRow>(`/tables/${tableId}/rows/${rowId}`, input)
  },

  /**
   * Delete a row
   */
  async deleteRow(tableId: string, rowId: string): Promise<void> {
    return goClient.delete<void>(`/tables/${tableId}/rows/${rowId}`)
  },

  /**
   * Bulk create rows
   */
  async bulkCreateRows(tableId: string, input: BulkCreateRowsInput): Promise<TableRow[]> {
    // Note: This endpoint doesn't exist in Go backend yet
    // You'll need to add it to go-backend/handlers/data_tables.go
    // For now, we'll create rows one at a time
    const createdRows: TableRow[] = []
    
    for (let i = 0; i < input.rows.length; i++) {
      try {
        const row = await this.createRow(
          tableId,
          { data: input.rows[i], position: i },
          input.created_by
        )
        createdRows.push(row)
      } catch (error) {
        console.error(`Failed to create row ${i}:`, error)
        // Continue with other rows even if one fails
      }
    }
    
    return createdRows
  },

  // ============ Search ============

  /**
   * Search table rows
   */
  async searchTableRows(tableId: string, query: string): Promise<TableRow[]> {
    return goClient.get<TableRow[]>(`/tables/${tableId}/search`, { q: query })
  },
}

/**
 * Backward compatibility - use tablesGoClient instead
 * @deprecated Use tablesGoClient
 */
export const tablesSupabaseCompat = tablesGoClient
