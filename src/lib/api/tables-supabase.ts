/**
 * Supabase Direct API for table operations
 * Handles both reads and writes with RLS security
 */

import { supabase } from '@/lib/supabase'
import type { DataTable, TableColumn, DataTableCreate, DataTableUpdate } from '@/types/data-tables'

export const tablesSupabase = {
  /**
   * Get a single table with its columns
   */
  async get(tableId: string): Promise<DataTable> {
    const { data, error } = await supabase
      .from('data_tables')
      .select(`
        *,
        columns:table_columns(*)
      `)
      .eq('id', tableId)
      .order('order', { foreignTable: 'table_columns', ascending: true })
      .single()

    if (error) {
      console.error('Error fetching table:', error)
      throw new Error(error.message)
    }

    return data as DataTable
  },

  /**
   * List tables in a workspace
   */
  async list(workspaceId: string, includeArchived = false): Promise<DataTable[]> {
    let query = supabase
      .from('data_tables')
      .select(`
        *,
        columns:table_columns(*)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (!includeArchived) {
      query = query.eq('is_archived', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching tables:', error)
      throw new Error(error.message)
    }

    return (data || []) as DataTable[]
  },

  /**
   * Create a new table
   */
  async create(tableData: DataTableCreate): Promise<DataTable> {
    const { data, error } = await supabase
      .from('data_tables')
      .insert(tableData)
      .select(`
        *,
        columns:table_columns(*)
      `)
      .single()

    if (error) {
      console.error('Error creating table:', error)
      throw new Error(error.message)
    }

    return data as DataTable
  },

  /**
   * Update a table
   */
  async update(tableId: string, updates: DataTableUpdate): Promise<DataTable> {
    const { data, error } = await supabase
      .from('data_tables')
      .update(updates)
      .eq('id', tableId)
      .select(`
        *,
        columns:table_columns(*)
      `)
      .single()

    if (error) {
      console.error('Error updating table:', error)
      throw new Error(error.message)
    }

    return data as DataTable
  },

  /**
   * Delete a table (soft delete - set is_archived)
   */
  async delete(tableId: string): Promise<{ message: string }> {
    const { error } = await supabase
      .from('data_tables')
      .update({ is_archived: true })
      .eq('id', tableId)

    if (error) {
      console.error('Error deleting table:', error)
      throw new Error(error.message)
    }

    return { message: 'Table archived successfully' }
  },

  /**
   * Get column by name
   */
  async getColumnByName(tableId: string, columnName: string): Promise<TableColumn | null> {
    const { data, error } = await supabase
      .from('table_columns')
      .select('*')
      .eq('table_id', tableId)
      .eq('name', columnName)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      console.error('Error fetching column:', error)
      throw new Error(error.message)
    }

    return data as TableColumn
  },
}
