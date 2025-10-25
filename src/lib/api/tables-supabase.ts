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
        columns:table_columns!table_columns_table_id_fkey(*)
      `)
      .eq('id', tableId)
      .single()

    if (error) {
      console.error('Error fetching table:', error)
      throw new Error(error.message)
    }

    // Sort columns by position on the client side
    if (data && data.columns) {
      data.columns.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
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
        columns:table_columns!table_columns_table_id_fkey(*)
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

    // Sort columns by position for each table
    if (data) {
      data.forEach((table: any) => {
        if (table.columns) {
          table.columns.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
        }
      })
    }

    return (data || []) as DataTable[]
  },

  /**
   * Create a new table with columns
   */
  async create(tableData: DataTableCreate): Promise<DataTable> {
    // Extract columns from table data
    const { columns, ...tableFields } = tableData as any
    
    // Step 1: Create the table
    const { data: table, error: tableError } = await supabase
      .from('data_tables')
      .insert(tableFields)
      .select('*')
      .single()

    if (tableError) {
      console.error('Error creating table:', tableError)
      throw new Error(tableError.message)
    }

    // Step 2: Create columns if provided
    if (columns && columns.length > 0) {
      const columnsWithTableId = columns.map((col: any) => ({
        ...col,
        table_id: table.id
      }))

      const { error: columnsError } = await supabase
        .from('table_columns')
        .insert(columnsWithTableId)

      if (columnsError) {
        console.error('Error creating columns:', columnsError)
        // Try to clean up the table
        await supabase.from('data_tables').delete().eq('id', table.id)
        throw new Error(columnsError.message)
      }
    }

    // Step 3: Fetch the complete table with columns
    const { data: completeTable, error: fetchError } = await supabase
      .from('data_tables')
      .select(`
        *,
        columns:table_columns!table_columns_table_id_fkey(*)
      `)
      .eq('id', table.id)
      .single()

    if (fetchError) {
      console.error('Error fetching complete table:', fetchError)
      throw new Error(fetchError.message)
    }

    // Sort columns by position
    if (completeTable && completeTable.columns) {
      completeTable.columns.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
    }

    return completeTable as DataTable
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
        columns:table_columns!table_columns_table_id_fkey(*)
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
