/**
 * API client for barcode scan history endpoints
 * Using Supabase direct connection for simplicity and reliability
 */

import type { ScanHistoryCreate, ScanHistoryRecord } from '@/types/scan-history'
import { supabase } from '@/lib/supabase'

export const scanHistoryAPI = {
  /**
   * Record a new scan event
   */
  create: async (data: ScanHistoryCreate): Promise<ScanHistoryRecord> => {
    const { data: scan, error } = await supabase
      .from('scan_history')
      .insert({
        workspace_id: data.workspace_id,
        table_id: data.table_id,
        column_id: data.column_id,
        column_name: data.column_name,
        barcode: data.barcode,
        status: data.status,
        matched_row_ids: data.matched_row_ids,
        matched_rows: data.matched_rows,
        source: data.source,
        metadata: data.metadata,
        created_by: data.created_by,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating scan history:', error)
      throw new Error(error.message)
    }

    return scan as ScanHistoryRecord
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
    let query = supabase
      .from('scan_history')
      .select('*')
      .eq('table_id', params.tableId)
      .order('created_at', { ascending: false })
      .limit(params.limit ?? 100)

    if (params.columnId) {
      query = query.eq('column_id', params.columnId)
    } else if (params.columnName) {
      query = query.eq('column_name', params.columnName)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching scan history:', error)
      throw new Error(error.message)
    }

    return (data || []) as ScanHistoryRecord[]
  },
}
