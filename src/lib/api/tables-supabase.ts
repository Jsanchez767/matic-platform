/**
 * Supabase Direct API for reading table metadata
 * Use this for read-only table operations (scanner, forms, etc.)
 */

import { createClient } from '@/lib/supabase'
import type { DataTable, TableColumn } from '@/types/data-tables'

export const tablesSupabase = {
  /**
   * Get a single table with its columns
   */
  async get(tableId: string): Promise<DataTable> {
    const supabase = createClient()
    
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
  async list(workspaceId: string): Promise<DataTable[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('data_tables')
      .select(`
        *,
        columns:table_columns(*)
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tables:', error)
      throw new Error(error.message)
    }

    return (data || []) as DataTable[]
  },

  /**
   * Get column by name
   */
  async getColumnByName(tableId: string, columnName: string): Promise<TableColumn | null> {
    const supabase = createClient()
    
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
