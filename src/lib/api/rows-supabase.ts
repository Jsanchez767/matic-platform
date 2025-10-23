/**
 * Supabase Direct API for table row operations
 * Used for barcode matching, row lookups, and data queries
 */

import { supabase } from '@/lib/supabase'

export interface TableRow {
  id: string
  table_id: string
  data: Record<string, any>
  metadata_?: Record<string, any>
  is_archived: boolean
  position?: number
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

export const rowsSupabase = {
  /**
   * Get a single row by ID
   */
  async get(tableId: string, rowId: string): Promise<TableRow> {
    const { data, error } = await supabase
      .from('table_rows')
      .select('*')
      .eq('table_id', tableId)
      .eq('id', rowId)
      .single()

    if (error) {
      console.error('Error fetching row:', error)
      throw new Error(error.message)
    }

    return data as TableRow
  },

  /**
   * List rows for a table
   */
  async list(
    tableId: string,
    options?: {
      limit?: number
      offset?: number
      archived?: boolean
    }
  ): Promise<TableRow[]> {
    let query = supabase
      .from('table_rows')
      .select('*')
      .eq('table_id', tableId)

    if (options?.archived !== undefined) {
      query = query.eq('is_archived', options.archived)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 100) - 1)
    }

    query = query.order('position', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching rows:', error)
      throw new Error(error.message)
    }

    return (data || []) as TableRow[]
  },

  /**
   * Search for rows by barcode in a specific column
   * Used by scanner to match barcodes
   */
  async searchByBarcode(
    tableId: string,
    columnId: string,
    barcode: string
  ): Promise<TableRow[]> {
    const { data, error } = await supabase
      .from('table_rows')
      .select('*')
      .eq('table_id', tableId)
      .eq('is_archived', false)

    if (error) {
      console.error('Error searching rows:', error)
      throw new Error(error.message)
    }

    // Filter in memory since we need to search JSONB data field
    const matches = (data || []).filter((row: any) => {
      const value = row.data?.[columnId]
      if (!value) return false
      
      // Handle different value types
      if (typeof value === 'string') {
        return value === barcode || value.includes(barcode)
      }
      if (Array.isArray(value)) {
        return value.some(v => String(v) === barcode)
      }
      return String(value) === barcode
    })

    return matches as TableRow[]
  },

  /**
   * Search for rows by column name (when column_id not available)
   */
  async searchByColumnName(
    tableId: string,
    columnName: string,
    searchValue: string
  ): Promise<TableRow[]> {
    // First get the column_id from column name
    const { data: column, error: columnError } = await supabase
      .from('table_columns')
      .select('id')
      .eq('table_id', tableId)
      .eq('name', columnName)
      .single()

    if (columnError || !column) {
      console.error('Error finding column:', columnError)
      return []
    }

    // Now search by that column_id
    return this.searchByBarcode(tableId, column.id, searchValue)
  },

  /**
   * Get rows matching multiple criteria
   */
  async search(
    tableId: string,
    filters: Record<string, any>
  ): Promise<TableRow[]> {
    const { data, error } = await supabase
      .from('table_rows')
      .select('*')
      .eq('table_id', tableId)
      .eq('is_archived', false)

    if (error) {
      console.error('Error searching rows:', error)
      throw new Error(error.message)
    }

    // Filter in memory for JSONB data matching
    const matches = (data || []).filter((row: any) => {
      return Object.entries(filters).every(([columnId, value]) => {
        const rowValue = row.data?.[columnId]
        if (Array.isArray(value)) {
          return value.includes(rowValue)
        }
        return rowValue === value
      })
    })

    return matches as TableRow[]
  },
}
