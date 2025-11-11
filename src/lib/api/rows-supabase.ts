/**
 * Rows Supabase API Client
 * Temporary compatibility layer during migration to FastAPI
 * TODO: Migrate all usages to rows-client.ts
 */

import { supabase } from '@/lib/supabase'

export const rowsSupabase = {
  /**
   * Get all rows for a table
   */
  async getRowsByTable(tableId: string) {
    const { data, error } = await supabase
      .from('table_rows')
      .select('*')
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  /**
   * Get a single row by ID
   */
  async getRowById(rowId: string) {
    const { data, error } = await supabase
      .from('table_rows')
      .select('*')
      .eq('id', rowId)
      .single()

    if (error) throw error
    return data
  },

  /**
   * Create a new row
   */
  async createRow(rowData: any) {
    const { data, error } = await supabase
      .from('table_rows')
      .insert(rowData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update a row
   */
  async updateRow(rowId: string, updates: any) {
    const { data, error } = await supabase
      .from('table_rows')
      .update(updates)
      .eq('id', rowId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a row
   */
  async deleteRow(rowId: string) {
    const { error } = await supabase
      .from('table_rows')
      .delete()
      .eq('id', rowId)

    if (error) throw error
  },

  /**
   * Bulk create rows
   */
  async createRows(rows: any[]) {
    const { data, error } = await supabase
      .from('table_rows')
      .insert(rows)
      .select()

    if (error) throw error
    return data
  },

  /**
   * Bulk update rows
   */
  async updateRows(updates: { id: string; data: any }[]) {
    const promises = updates.map(({ id, data }) =>
      supabase
        .from('table_rows')
        .update(data)
        .eq('id', id)
        .select()
        .single()
    )

    const results = await Promise.all(promises)
    const errors = results.filter(r => r.error)
    
    if (errors.length > 0) {
      throw new Error(`Failed to update ${errors.length} rows`)
    }

    return results.map(r => r.data)
  },

  /**
   * Bulk delete rows
   */
  async deleteRows(rowIds: string[]) {
    const { error } = await supabase
      .from('table_rows')
      .delete()
      .in('id', rowIds)

    if (error) throw error
  },

  /**
   * Search rows by column value
   */
  async searchRows(tableId: string, columnName: string, searchValue: any) {
    const { data, error } = await supabase
      .from('table_rows')
      .select('*')
      .eq('table_id', tableId)

    if (error) throw error

    // Filter in memory since JSONB querying can be complex
    return data.filter(row => {
      const value = row.data?.[columnName]
      if (typeof searchValue === 'string') {
        return String(value).toLowerCase().includes(searchValue.toLowerCase())
      }
      return value === searchValue
    })
  }
}
