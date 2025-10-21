export type ScanStatus = 'success' | 'failure'

export interface ScanHistoryRecord {
  id: string
  workspace_id: string
  table_id: string
  column_id?: string | null
  column_name?: string | null
  barcode: string
  status: ScanStatus
  matched_row_ids: string[]
  matched_rows: Array<Record<string, any>>
  source: string
  metadata?: Record<string, any>
  created_by?: string | null
  created_at: string
}

export interface ScanHistoryCreate {
  workspace_id: string
  table_id: string
  column_id?: string | null
  column_name?: string | null
  barcode: string
  status: ScanStatus
  matched_row_ids?: string[]
  matched_rows?: Array<Record<string, any>>
  source?: string
  metadata?: Record<string, any>
  created_by?: string | null
}
