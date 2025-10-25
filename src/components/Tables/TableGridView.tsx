'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, ChevronDown, Trash2, Copy, Settings, EyeOff, Grid3x3, Kanban, Calendar as CalendarIcon, Image as ImageIcon, List, Search, ScanLine, BarChart3 } from 'lucide-react'
import { ColumnEditorModal } from './ColumnEditorModal'
import { RealTimeLinkField } from './RealTimeLinkField'
import { BarcodeScanModal } from './BarcodeScanModal'
import { EnablePulseButton } from '@/components/Pulse/EnablePulseButton'
import { pulseClient, type PulseEnabledTable } from '@/lib/api/pulse-client'
import { tablesSupabase } from '@/lib/api/tables-supabase'
import { rowsSupabase } from '@/lib/api/rows-supabase'
import { useTableRealtime } from '@/hooks/useTableRealtime'
import { fetchWithRetry, isBackendSleeping, showBackendSleepingMessage } from '@/lib/api-utils'
import type { TableRow } from '@/types/data-tables'

// @ts-ignore - Next.js injects env vars at build time
// API Configuration - Always use production backend on Render
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not configured. Set it in .env.local')
}

interface Column {
  id: string
  name: string
  label: string
  column_type: string
  width: number
  is_visible: boolean
  position: number
  linked_table_id?: string
  settings?: {
    options?: string[] | { value: string; color?: string }[]
    [key: string]: any
  }
}

interface Row {
  id: string
  data: Record<string, any>
  position: number
}

interface TableGridViewProps {
  tableId: string
  workspaceId: string
}

const VIEW_OPTIONS = [
  { value: 'grid', label: 'Grid', icon: Grid3x3, description: 'Spreadsheet-like table view' },
  { value: 'kanban', label: 'Kanban', icon: Kanban, description: 'Card-based workflow' },
  { value: 'calendar', label: 'Calendar', icon: CalendarIcon, description: 'Date-based timeline' },
  { value: 'gallery', label: 'Gallery', icon: ImageIcon, description: 'Visual card layout' },
  { value: 'list', label: 'List', icon: List, description: 'Compact list view' },
]

export function TableGridView({ tableId, workspaceId }: TableGridViewProps) {
  const [columns, setColumns] = useState<Column[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState<{ rowId: string; columnId: string } | null>(null)
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnId: string } | null>(null)
  const [activeColumnMenu, setActiveColumnMenu] = useState<string | null>(null)
  const [tableName, setTableName] = useState('')
  const [isColumnEditorOpen, setIsColumnEditorOpen] = useState(false)
  const [editingColumn, setEditingColumn] = useState<Column | null>(null)
  const [currentView, setCurrentView] = useState<'grid' | 'kanban' | 'calendar' | 'gallery' | 'list'>('grid')
  const [showViewMenu, setShowViewMenu] = useState(false)
  const [multiselectSearch, setMultiselectSearch] = useState<string>('')
  const [isEditingTableName, setIsEditingTableName] = useState(false)
  const [tempTableName, setTempTableName] = useState('')
  const [linkedRecords, setLinkedRecords] = useState<{ [tableId: string]: Row[] }>({})
  const [loadingLinkedRecords, setLoadingLinkedRecords] = useState<{ [tableId: string]: boolean }>({})
  const [isBarcodeScanModalOpen, setIsBarcodeScanModalOpen] = useState(false)
  const [highlightedRows, setHighlightedRows] = useState<Set<string>>(new Set())
  const [scanResultPopover, setScanResultPopover] = useState<{
    rowId: string
    barcode: string
    position: { x: number; y: number }
  } | null>(null)
  const [pulseConfig, setPulseConfig] = useState<PulseEnabledTable | null>(null)
  const [isPulseEnabled, setIsPulseEnabled] = useState(false)
  
  const gridRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const tableNameInputRef = useRef<HTMLInputElement>(null)

  // WebSocket for real-time updates
  const handleRealtimeUpdate = useCallback((update: any) => {
    console.log('Received real-time update:', update)
    
    if (update.type === 'row_updated') {
      setRows(prevRows => 
        prevRows.map(row => 
          row.id === update.row_id 
            ? { ...row, data: update.data }
            : row
        )
      )
    } else if (update.type === 'scan_highlight') {
      // Handle scan highlights from other users
      console.log('🔄 Received scan highlight from collaborator:', update)
      
      const rowId = update.rowId
      if (rowId) {
        setHighlightedRows(prev => new Set([...prev, rowId]))
        
        // Auto-clear highlight after 3 seconds for collaborative highlights
        setTimeout(() => {
          setHighlightedRows(prev => {
            const newSet = new Set(prev)
            newSet.delete(rowId)
            return newSet
          })
        }, 3000)
      }
    }
  }, [])

  const { send: broadcastUpdate, isConnected, connectionStatus } = useTableRealtime(tableId, handleRealtimeUpdate)

  // Debug logging
  useEffect(() => {
    console.log('TableGridView: WebSocket connection status changed:', connectionStatus)
  }, [connectionStatus])

  useEffect(() => {
    loadTableData()
    loadPulseConfig()
  }, [tableId])

  // Load Pulse configuration
  const loadPulseConfig = async () => {
    try {
      const config = await pulseClient.getPulseConfig(tableId)
      if (config && config.enabled) {
        setPulseConfig(config)
        setIsPulseEnabled(true)
        console.log('✅ Pulse enabled for this table:', config)
      } else {
        setPulseConfig(null)
        setIsPulseEnabled(false)
      }
    } catch (error) {
      // Pulse not enabled - that's ok
      setPulseConfig(null)
      setIsPulseEnabled(false)
    }
  }

  // Preload linked records when columns change
  useEffect(() => {
    columns.forEach(column => {
      if (column.column_type === 'link' && column.linked_table_id) {
        loadLinkedRecords(column.linked_table_id)
      }
    })
  }, [columns])

  const loadTableData = async () => {
    try {
      setLoading(true)
      
      const tableData = await tablesSupabase.get(tableId)
      setTableName(tableData.name)
      setColumns(tableData.columns as any || [])
      
      const rowsData = await rowsSupabase.list(tableId)
      setRows(rowsData as any)
    } catch (error) {
      console.error('Error loading table data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartEditingTableName = () => {
    setTempTableName(tableName)
    setIsEditingTableName(true)
    // Focus the input after state update
    setTimeout(() => {
      tableNameInputRef.current?.focus()
      tableNameInputRef.current?.select()
    }, 0)
  }

  const handleSaveTableName = async () => {
    if (!tempTableName.trim() || tempTableName === tableName) {
      setIsEditingTableName(false)
      return
    }

    try {
      await tablesSupabase.update(tableId, { name: tempTableName })
      setTableName(tempTableName)
      setIsEditingTableName(false)
    } catch (error) {
      console.error('Error updating table name:', error)
      alert('Failed to update table name')
      setIsEditingTableName(false)
    }
  }

  const loadLinkedRecords = async (linkedTableId: string) => {
    if (linkedRecords[linkedTableId] || loadingLinkedRecords[linkedTableId]) {
      return // Already loaded or loading
    }

    setLoadingLinkedRecords(prev => ({ ...prev, [linkedTableId]: true }))
    
    try {
      const records = await rowsSupabase.list(linkedTableId)
      // Convert TableRow[] to Row[] format
      const convertedRecords: Row[] = records.map((record: TableRow) => ({
        id: record.id || '',
        data: record.data || {},
        position: record.position || 0
      }))
      setLinkedRecords(prev => ({ ...prev, [linkedTableId]: convertedRecords }))
    } catch (error) {
      console.error('Error loading linked records:', error)
    } finally {
      setLoadingLinkedRecords(prev => ({ ...prev, [linkedTableId]: false }))
    }
  }

  const handleTableNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveTableName()
    } else if (e.key === 'Escape') {
      setIsEditingTableName(false)
    }
  }

  const handleAddRow = async () => {
    try {
      // Get current user ID
      const { getCurrentUser } = await import('@/lib/supabase')
      const user = await getCurrentUser()
      
      if (!user) {
        console.error('No user found')
        alert('You must be logged in to add rows')
        return
      }

      console.log('Adding row with user:', user.id)
      const rowData = { 
        data: {}, 
        metadata: {},
        position: rows.length,
        created_by: user.id
      }
      console.log('Sending row data:', JSON.stringify(rowData))
      
      const response = await fetch(`${API_BASE_URL}/tables/${tableId}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowData),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        console.error('Failed to add row:', response.status, errorData)
        alert(`Failed to add row: ${JSON.stringify(errorData)}`)
        return
      }
      
      const newRow = await response.json()
      console.log('Row added successfully:', newRow)
      setRows([...rows, newRow])
    } catch (error) {
      console.error('Error adding row:', error)
      alert(`Error adding row: ${error}`)
    }
  }

  const handleCellEdit = async (rowId: string, columnName: string, value: any) => {
    try {
      const row = rows.find(r => r.id === rowId)
      if (!row) return

      // Optimistic update - update UI immediately
      const updatedData = { ...row.data, [columnName]: value }
      setRows(prevRows => 
        prevRows.map(r => 
          r.id === rowId ? { ...r, data: updatedData } : r
        )
      )

      // Broadcast to other clients immediately
      broadcastUpdate({
        type: 'row_updated',
        table_id: tableId,
        row_id: rowId,
        data: updatedData,
        updated_by: null, // Will be filled by backend
        optimistic: true // Mark as optimistic update
      })

      // Get current user ID
      const { getCurrentUser } = await import('@/lib/supabase')
      const user = await getCurrentUser()
      
      if (!user) {
        console.error('No user found')
        // Revert optimistic update
        setRows(prevRows => 
          prevRows.map(r => r.id === rowId ? row : r)
        )
        alert('You must be logged in to edit cells')
        return
      }

      console.log('Updating cell:', { rowId, columnName, value, userId: user.id })
      
      const response = await fetch(`${API_BASE_URL}/tables/${tableId}/rows/${rowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: updatedData,
          updated_by: user.id
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        console.error('Failed to update cell:', response.status, errorData)
        
        // Revert optimistic update on error
        setRows(prevRows => 
          prevRows.map(r => r.id === rowId ? row : r)
        )
        
        alert(`Failed to update cell: ${JSON.stringify(errorData)}`)
        return
      }
      
      console.log('Cell updated successfully')
      // Note: We don't update local state here since optimistic update already did it
      // The WebSocket will broadcast the authoritative update from the server
    } catch (error) {
      console.error('Error updating cell:', error)
      alert(`Error updating cell: ${error}`)
    }
  }

  const handleDeleteRow = async (rowId: string) => {
    if (!confirm('Are you sure you want to delete this row?')) return
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableId}/rows/${rowId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete row')
      setRows(rows.filter(r => r.id !== rowId))
    } catch (error) {
      console.error('Error deleting row:', error)
    }
  }

  const handleDuplicateRow = async (rowId: string) => {
    try {
      const row = rows.find(r => r.id === rowId)
      if (!row) return
      const response = await fetch(`${API_BASE_URL}/tables/${tableId}/rows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: row.data, position: rows.length }),
      })
      if (!response.ok) throw new Error('Failed to duplicate row')
      const newRow = await response.json()
      setRows([...rows, newRow])
    } catch (error) {
      console.error('Error duplicating row:', error)
    }
  }

  const handleAddColumn = () => {
    setEditingColumn(null)
    setIsColumnEditorOpen(true)
    setActiveColumnMenu(null)
  }

  const handleEditColumn = (column: Column) => {
    setEditingColumn(column)
    setIsColumnEditorOpen(true)
    setActiveColumnMenu(null)
  }

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm('Delete this field? All data will be lost.')) return
    try {
      const response = await fetch(`${API_BASE_URL}/tables/${tableId}/columns/${columnId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete column')
      await loadTableData()
    } catch (error) {
      console.error('Error deleting column:', error)
    }
    setActiveColumnMenu(null)
  }

  const handleSaveColumn = async (columnData: any) => {
    try {
      console.log('Saving column data:', columnData)
      let response
      if (editingColumn) {
        const url = `${API_BASE_URL}/tables/${tableId}/columns/${editingColumn.id}`
        console.log('PATCH URL:', url)
        response = await fetchWithRetry(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(columnData),
        }, {
          onRetry: (attempt) => console.log(`Retrying column update, attempt ${attempt}...`)
        })
      } else {
        const url = `${API_BASE_URL}/tables/${tableId}/columns`
        const payload = { ...columnData, table_id: tableId, position: columns.length }
        console.log('POST URL:', url)
        console.log('POST payload:', payload)
        response = await fetchWithRetry(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }, {
          onRetry: (attempt) => console.log(`Retrying column creation, attempt ${attempt}...`)
        })
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        console.error('Column save failed:', response.status, errorData)
        alert(`Failed to save column (${response.status}): ${JSON.stringify(errorData)}`)
        return
      }
      
      const savedColumn = await response.json()
      console.log('Column saved successfully:', savedColumn)
      
      // Update columns locally without reloading entire table
      if (editingColumn) {
        setColumns(columns.map(col => col.id === editingColumn.id ? savedColumn : col))
      } else {
        setColumns([...columns, savedColumn])
      }
      
      setIsColumnEditorOpen(false)
      setEditingColumn(null)
    } catch (error) {
      console.error('Error saving column:', error)
      
      if (isBackendSleeping(error)) {
        showBackendSleepingMessage()
      } else {
        alert(`Error saving column: ${error}`)
      }
    }
  }

  // Barcode scanning handlers
  const handleBarcodeRowSelect = (row: TableRow) => {
    console.log('Barcode scan selected row:', row)
    
    // Highlight the found row
    if (row.id) {
      setSelectedCell({ rowId: row.id, columnId: columns[0]?.id || '' })
    }
    
    // Close the modal
    setIsBarcodeScanModalOpen(false)
  }

  const handleScanSuccess = (result: { row: TableRow; barcode: string; columnName: string }) => {
    console.log('🎯 Barcode scan success:', result)
    
    const rowId = result.row.id
    if (!rowId) return
    
    // Add the row to highlighted set
    setHighlightedRows(prev => new Set([...prev, rowId]))
    
    // Show success popover (you can implement this later)
    // For now, just highlight and select the row
    setSelectedCell({ 
      rowId: rowId, 
      columnId: columns.find(col => col.name === result.columnName)?.id || columns[0]?.id || '' 
    })
    
    // Auto-clear highlight after 5 seconds
    setTimeout(() => {
      setHighlightedRows(prev => {
        const newSet = new Set(prev)
        newSet.delete(rowId)
        return newSet
      })
    }, 5000)
    
    // Broadcast the scan result to other users (for collaborative highlighting)
    broadcastUpdate({
      type: 'scan_highlight',
      rowId: rowId,
      barcode: result.barcode,
      columnName: result.columnName,
      timestamp: new Date().toISOString()
    })
  }

  const renderCell = (row: Row, column: Column) => {
    const value = row.data[column.name]
    const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id
    const isSelected = selectedCell?.rowId === row.id && selectedCell?.columnId === column.id

    // Link column type - use real-time link field component
    if (column.column_type === 'link') {
      const linkedRecordIds = Array.isArray(value) ? value : []
      
      return (
        <RealTimeLinkField
          tableId={tableId}
          rowId={row.id}
          columnId={column.id}
          columnName={column.name}
          linkedTableId={column.linked_table_id || ''}
          value={linkedRecordIds}
          onChange={(newValue) => {
            // Update the local state immediately
            const updatedRows = rows.map(r => 
              r.id === row.id 
                ? { ...r, data: { ...r.data, [column.name]: newValue } }
                : r
            )
            setRows(updatedRows)
          }}
          onCellEdit={handleCellEdit}
        />
      )
    }

    // Multi-select column type
    if (column.column_type === 'multiselect') {
      const selectedOptions = Array.isArray(value) ? value : []
      const options = column.settings?.options || []
      const filteredOptions = multiselectSearch 
        ? options.filter((opt: any) => {
            const optValue = typeof opt === 'string' ? opt : opt.value
            return optValue.toLowerCase().includes(multiselectSearch.toLowerCase())
          })
        : options
      
      if (isEditing) {
        return (
          <div className="relative" style={{ position: 'relative' }}>
            {/* Invisible overlay to close dropdown */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setEditingCell(null)
                setMultiselectSearch('')
              }}
            />
            
            {/* Dropdown */}
            <div
              ref={dropdownRef}
              className="absolute left-0 top-0 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-xl"
            >
              {/* Selected chips */}
              <div className="p-3 border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {selectedOptions.map((opt: string) => (
                    <span key={opt} className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md">
                      {opt}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const newValue = selectedOptions.filter((o: string) => o !== opt)
                          handleCellEdit(row.id, column.name, newValue)
                        }}
                        className="hover:text-blue-900 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                    onClick={(e) => {
                      e.stopPropagation()
                      // Could add "create new option" functionality here
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              
              {/* Search input */}
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={multiselectSearch}
                    onChange={(e) => setMultiselectSearch(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              
              {/* Options list */}
              <div className="max-h-64 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    {multiselectSearch ? 'No matching options' : 'No options available'}
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredOptions.map((option: any) => {
                      const optionValue = typeof option === 'string' ? option : option.value
                      const isOptionSelected = selectedOptions.includes(optionValue)
                      return (
                        <label 
                          key={optionValue} 
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isOptionSelected}
                            onChange={(e) => {
                              const newValue = e.target.checked
                                ? [...selectedOptions, optionValue]
                                : selectedOptions.filter((o: string) => o !== optionValue)
                              handleCellEdit(row.id, column.name, newValue)
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{optionValue}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      return (
        <div
          className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}`}
          onClick={() => {
            setSelectedCell({ rowId: row.id, columnId: column.id })
            setEditingCell({ rowId: row.id, columnId: column.id })
            setMultiselectSearch('')
          }}
        >
          {selectedOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedOptions.map((opt: string) => (
                <span key={opt} className="inline-flex items-center px-2.5 py-1 text-sm bg-blue-100 text-blue-700 rounded-md">
                  {opt}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400 text-sm">Empty</span>
          )}
        </div>
      )
    }

    // Single select column type
    if (column.column_type === 'select') {
      const options = column.settings?.options || []
      
      if (isEditing) {
        return (
          <select
            value={value || ''}
            autoFocus
            onChange={(e) => {
              handleCellEdit(row.id, column.name, e.target.value)
              setEditingCell(null)
            }}
            onBlur={() => setEditingCell(null)}
            className="w-full h-full px-2 py-1 border-2 border-blue-500 rounded focus:outline-none"
          >
            <option value="">Select...</option>
            {options.map((option: any) => {
              const optionValue = typeof option === 'string' ? option : option.value
              return (
                <option key={optionValue} value={optionValue}>
                  {optionValue}
                </option>
              )
            })}
          </select>
        )
      }

      return (
        <div
          className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => {
            setSelectedCell({ rowId: row.id, columnId: column.id })
            setEditingCell({ rowId: row.id, columnId: column.id })
          }}
        >
          {value ? (
            <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded">
              {value}
            </span>
          ) : (
            <span className="text-gray-400">Empty</span>
          )}
        </div>
      )
    }

    // Default text input for other types
    if (isEditing) {
      return (
        <input
          type="text"
          defaultValue={value || ''}
          autoFocus
          onBlur={(e) => {
            handleCellEdit(row.id, column.name, e.target.value)
            setEditingCell(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCellEdit(row.id, column.name, e.currentTarget.value)
              setEditingCell(null)
            } else if (e.key === 'Escape') {
              setEditingCell(null)
            }
          }}
          className="w-full h-full px-2 py-1 border-2 border-blue-500 rounded focus:outline-none"
        />
      )
    }

    return (
      <div
        className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        onClick={() => setSelectedCell({ rowId: row.id, columnId: column.id })}
        onDoubleClick={() => setEditingCell({ rowId: row.id, columnId: column.id })}
      >
        {value || <span className="text-gray-400">Empty</span>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading table...</p>
        </div>
      </div>
    )
  }

  if (currentView !== 'grid') {
    const CurrentViewIcon = VIEW_OPTIONS.find(v => v.value === currentView)?.icon || Grid3x3
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {isEditingTableName ? (
              <input
                ref={tableNameInputRef}
                type="text"
                value={tempTableName}
                onChange={(e) => setTempTableName(e.target.value)}
                onBlur={handleSaveTableName}
                onKeyDown={handleTableNameKeyDown}
                className="text-lg font-semibold text-gray-900 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <h2 
                className="text-lg font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                onClick={handleStartEditingTableName}
              >
                {tableName}
              </h2>
            )}
            <div className="relative">
              <button 
                onClick={() => setShowViewMenu(!showViewMenu)}
                className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <CurrentViewIcon className="w-4 h-4" />
                {VIEW_OPTIONS.find(v => v.value === currentView)?.label}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showViewMenu && (
                <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  {VIEW_OPTIONS.map((view) => {
                    const Icon = view.icon
                    return (
                      <button
                        key={view.value}
                        onClick={() => {
                          setCurrentView(view.value as any)
                          setShowViewMenu(false)
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-start gap-3 ${
                          currentView === view.value ? 'bg-blue-50' : ''
                        }`}
                      >
                        <Icon className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{view.label}</div>
                          <div className="text-xs text-gray-500">{view.description}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Placeholder */}
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <CurrentViewIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {VIEW_OPTIONS.find(v => v.value === currentView)?.label} View
            </h3>
            <p className="text-gray-600 mb-4">
              {VIEW_OPTIONS.find(v => v.value === currentView)?.description}
            </p>
            <p className="text-sm text-gray-500">Coming soon</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {isEditingTableName ? (
            <input
              ref={tableNameInputRef}
              type="text"
              value={tempTableName}
              onChange={(e) => setTempTableName(e.target.value)}
              onBlur={handleSaveTableName}
              onKeyDown={handleTableNameKeyDown}
              className="text-lg font-semibold text-gray-900 border border-blue-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <h2 
              className="text-lg font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors"
              onClick={handleStartEditingTableName}
            >
              {tableName}
            </h2>
          )}
          <div className="relative">
            <button 
              onClick={() => setShowViewMenu(!showViewMenu)}
              className="px-3 py-1.5 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <Grid3x3 className="w-4 h-4" />
              Grid view
              <ChevronDown className="w-4 h-4" />
            </button>
            {showViewMenu && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                {VIEW_OPTIONS.map((view) => {
                  const Icon = view.icon
                  return (
                    <button
                      key={view.value}
                      onClick={() => {
                        setCurrentView(view.value as any)
                        setShowViewMenu(false)
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-start gap-3 ${
                        currentView === view.value ? 'bg-blue-50' : ''
                      }`}
                    >
                      <Icon className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{view.label}</div>
                        <div className="text-xs text-gray-500">{view.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection status - Enhanced visibility */}
          <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border">
            <div 
              className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' :
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-green-500'
              }`}
            />
            <span className="font-medium">
              {connectionStatus === 'connected' ? 'Live (WebSocket)' : 
               connectionStatus === 'connecting' ? 'Connecting...' :
               connectionStatus === 'error' ? 'Connection Error' : 'Live (Supabase)'}
            </span>
            {connectionStatus === 'disconnected' && (
              <span className="text-xs text-gray-400" title="Using Supabase Realtime for live updates">
                (DB Sync)
              </span>
            )}
          </div>
          
          <button
            onClick={() => setIsBarcodeScanModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <ScanLine className="w-4 h-4" />
            Scan & Lookup
          </button>
          
          <button
            onClick={() => {
              // Find a column to use for scan results (prefer 'email' or first text column)
              const emailColumn = columns.find(col => col.name.toLowerCase() === 'email')
              const firstColumn = columns.find(col => col.column_type === 'text') || columns[0]
              const targetColumn = emailColumn || firstColumn
              
              if (targetColumn) {
                // Open scan results in new tab using workspace tab system
                const scanResultsUrl = `/scan-results?table=${tableId}&column=${targetColumn.name}`
                window.open(scanResultsUrl, '_blank')
              } else {
                alert('No columns available for scanning. Please add a column first.')
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            title="View scan history and results"
          >
            <BarChart3 className="w-4 h-4" />
            Scan Results
          </button>
          
          <EnablePulseButton tableId={tableId} workspaceId={workspaceId} />
          
          <button
            onClick={handleAddRow}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50">
              <th className="w-12 border-r border-b border-gray-300 bg-gray-100"></th>
              {columns.filter(c => c.is_visible).map((column) => (
                <th
                  key={column.id}
                  className="border-r border-b border-gray-300 bg-gray-50 p-0 relative group"
                  style={{ minWidth: column.width }}
                >
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm font-medium text-gray-700 truncate">{column.label}</span>
                    <button
                      onClick={() => setActiveColumnMenu(activeColumnMenu === column.id ? null : column.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  {activeColumnMenu === column.id && (
                    <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
                      <button 
                        onClick={() => handleEditColumn(column)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Edit field
                      </button>
                      <button 
                        onClick={() => handleDeleteColumn(column.id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete field
                      </button>
                    </div>
                  )}
                </th>
              ))}
              <th className="border-b border-gray-300 bg-gray-50 p-2 w-12">
                <button 
                  onClick={handleAddColumn}
                  className="w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const isHighlighted = highlightedRows.has(row.id)
              return (
              <tr 
                key={row.id} 
                className={`group hover:bg-gray-50 ${
                  isHighlighted 
                    ? 'bg-green-100 border-green-300 animate-pulse' 
                    : ''
                }`}
              >
                <td className="border-r border-b border-gray-200 bg-gray-50 text-center text-xs text-gray-500">
                  <div className="flex items-center justify-center h-full">
                    <span className="group-hover:hidden">{rowIndex + 1}</span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicateRow(row.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </td>
                {columns.filter(c => c.is_visible).map((column) => (
                  <td
                    key={column.id}
                    className="border-r border-b border-gray-200"
                    style={{ minWidth: column.width }}
                  >
                    {renderCell(row, column)}
                  </td>
                ))}
                <td className="border-b border-gray-200"></td>
              </tr>
            )
            })}
            <tr>
              <td colSpan={columns.filter(c => c.is_visible).length + 2} className="border-b border-gray-200">
                <button
                  onClick={handleAddRow}
                  className="w-full py-2 text-left px-3 text-sm text-gray-500 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add row
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No rows yet</h3>
            <p className="text-gray-600 mb-4">Add your first row to get started</p>
            <button
              onClick={handleAddRow}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Row
            </button>
          </div>
        </div>
      )}

      <ColumnEditorModal
        isOpen={isColumnEditorOpen}
        onClose={() => {
          setIsColumnEditorOpen(false)
          setEditingColumn(null)
        }}
        onSubmit={handleSaveColumn}
        column={editingColumn}
        mode={editingColumn ? 'edit' : 'create'}
        workspaceId={workspaceId}
        currentTableId={tableId}
      />

      <BarcodeScanModal
        isOpen={isBarcodeScanModalOpen}
        onClose={() => setIsBarcodeScanModalOpen(false)}
        tableId={tableId}
        workspaceId={workspaceId}
        columns={columns.map(col => ({
          id: col.id,
          name: col.name,
          label: col.label,
          column_type: col.column_type as any, // Cast to satisfy type
          is_visible: col.is_visible,
          position: col.position,
          width: col.width,
          is_primary: false, // Add missing required field
          linked_table_id: col.linked_table_id,
          settings: col.settings
        }))}
        onRowSelect={handleBarcodeRowSelect}
        onScanSuccess={handleScanSuccess}
        pulseEnabled={isPulseEnabled}
        pulseTableId={pulseConfig?.id}
      />
    </div>
  )
}
