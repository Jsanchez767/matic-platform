/**
 * Supabase Direct API for table row operations
 * Handles reads and writes with RLS security
 */

import { supabase } from '@/lib/supabase'
import type { TableRow, TableRowCreate, TableRowUpdate } from '@/types/data-tables'

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
   * @param tableId - The table UUID
   * @param columnIdOrName - Can be column UUID or column name
   * @param barcode - The barcode value to search for
   */
  async searchByBarcode(
    tableId: string,
    columnIdOrName: string,
    barcode: string
  ): Promise<TableRow[]> {
    // First, try to get the column name if columnIdOrName is a UUID
    let columnName = columnIdOrName
    
    // Check if it looks like a UUID (has dashes)
    if (columnIdOrName.includes('-')) {
      try {
        const { data: column } = await supabase
          .from('table_columns')
          .select('name')
          .eq('id', columnIdOrName)
          .single()
        
        if (column?.name) {
          columnName = column.name
          console.log(`🔍 Resolved column ID ${columnIdOrName} to name: ${columnName}`)
        }
      } catch (err) {
        console.warn('Could not resolve column ID, using as-is:', err)
      }
    }

    const { data, error } = await supabase
      .from('table_rows')
      .select('*')
      .eq('table_id', tableId)
      .eq('is_archived', false)

    if (error) {
      console.error('Error searching rows:', error)
      throw new Error(error.message)
    }

    console.log(`🔍 Searching ${data?.length || 0} rows for barcode "${barcode}" in column "${columnName}"`)

    // Filter in memory since we need to search JSONB data field
    const matches = (data || []).filter((row: any) => {
      const value = row.data?.[columnName]
      if (!value) return false
      
      // Handle different value types
      if (typeof value === 'string') {
        const matches = value === barcode || value.includes(barcode)
        if (matches) console.log(`✅ Found match in row ${row.id}: ${value}`)
        return matches
      }
      if (Array.isArray(value)) {
        return value.some(v => String(v) === barcode)
      }
      return String(value) === barcode
    })

    console.log(`🎯 Search complete: ${matches.length} matches found`)
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

  /**
   * Create a new row
   */
  async create(tableId: string, rowData: TableRowCreate): Promise<TableRow> {
    const { data, error } = await supabase
      .from('table_rows')
      .insert({
        ...rowData,
        table_id: tableId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating row:', error)
      throw new Error(error.message)
    }

    return data as TableRow
  },

  /**
   * Update a row
   */
  async update(tableId: string, rowId: string, updates: TableRowUpdate): Promise<TableRow> {
    const { data, error } = await supabase
      .from('table_rows')
      .update(updates)
      .eq('id', rowId)
      .eq('table_id', tableId)
      .select()
      .single()

    if (error) {
      console.error('Error updating row:', error)
      throw new Error(error.message)
    }

    return data as TableRow
  },

  /**
   * Delete a row (soft delete - set is_archived)
   */
  async delete(tableId: string, rowId: string): Promise<{ message: string }> {
    const { error } = await supabase
      .from('table_rows')
      .update({ is_archived: true })
      .eq('id', rowId)
      .eq('table_id', tableId)

    if (error) {
      console.error('Error deleting row:', error)
      throw new Error(error.message)
    }

    return { message: 'Row archived successfully' }
  },
}
