import { useState, useEffect, useCallback } from 'react'
import { Search, X, Plus, Link2 } from 'lucide-react'
import { useRealTimeTableLinks } from '@/hooks/useRealTimeTableLinks'

interface LinkedRecord {
  id: string
  display_name: string
  data: Record<string, any>
}

interface RealTimeLinkFieldProps {
  tableId: string
  rowId: string
  columnId: string
  columnName: string
  linkedTableId: string
  value: string[] // Array of linked record IDs
  onChange: (newValue: string[]) => void
  onCellEdit: (rowId: string, columnName: string, value: string[]) => void
}

export function RealTimeLinkField({
  tableId,
  rowId,
  columnId,
  columnName,
  linkedTableId,
  value = [],
  onChange,
  onCellEdit
}: RealTimeLinkFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [search, setSearch] = useState('')
  const [availableRecords, setAvailableRecords] = useState<LinkedRecord[]>([])
  const [linkedRecords, setLinkedRecords] = useState<LinkedRecord[]>([])
  const [loading, setLoading] = useState(false)
  
  // Use the real-time links hook
  const { getLinkedRecords, createRowLink, removeRowLink } = useRealTimeTableLinks(tableId)

  // Load linked records when value changes
  useEffect(() => {
    if (value.length > 0) {
      loadLinkedRecords()
    } else {
      setLinkedRecords([])
    }
  }, [value])

  // Load available records when editing starts
  useEffect(() => {
    if (isEditing) {
      loadAvailableRecords()
    }
  }, [isEditing, search])

  const loadLinkedRecords = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/tables/${tableId}/rows/${rowId}/links?column_id=${columnId}`
      )
      const data = await response.json()
      setLinkedRecords(data.records || [])
    } catch (error) {
      console.error('Error loading linked records:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableRecords = async () => {
    try {
      setLoading(true)
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : ''
      const response = await fetch(
        `/api/tables/${tableId}/columns/${columnId}/available-records?limit=20${searchParam}`
      )
      const data = await response.json()
      setAvailableRecords(data.records || [])
    } catch (error) {
      console.error('Error loading available records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLinkRecord = async (targetRecordId: string) => {
    try {
      // Optimistic update
      const newValue = [...value, targetRecordId]
      onChange(newValue)
      onCellEdit(rowId, columnName, newValue)

      // Create the actual link via API
      await fetch(`/api/tables/${tableId}/rows/${rowId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          column_id: columnId,
          target_row_id: targetRecordId
        })
      })

      // Real-time subscription will handle the UI update
    } catch (error) {
      console.error('Error linking record:', error)
      // Revert optimistic update on error
      onChange(value)
    }
  }

  const handleUnlinkRecord = async (targetRecordId: string) => {
    try {
      // Optimistic update
      const newValue = value.filter(id => id !== targetRecordId)
      onChange(newValue)
      onCellEdit(rowId, columnName, newValue)

      // Remove the actual link via API
      await fetch(
        `/api/tables/${tableId}/rows/${rowId}/links/${targetRecordId}?column_id=${columnId}`,
        { method: 'DELETE' }
      )

      // Real-time subscription will handle the UI update
    } catch (error) {
      console.error('Error unlinking record:', error)
      // Revert optimistic update on error
      onChange(value)
    }
  }

  const handleStartEditing = () => {
    setIsEditing(true)
    setSearch('')
  }

  const handleStopEditing = () => {
    setIsEditing(false)
    setSearch('')
  }

  if (isEditing) {
    return (
      <div className="relative" style={{ position: 'relative' }}>
        {/* Backdrop to close dropdown */}
        <div
          className="fixed inset-0 z-40"
          onClick={handleStopEditing}
        />
        
        {/* Dropdown for selecting linked records */}
        <div className="absolute left-0 top-0 z-50 w-96 bg-white border border-gray-200 rounded-lg shadow-xl">
          {/* Current linked records */}
          <div className="p-3 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Linked Records:</div>
            <div className="flex flex-wrap gap-2">
              {linkedRecords.map((record) => (
                <span 
                  key={record.id} 
                  className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-md"
                >
                  <Link2 className="w-3 h-3" />
                  {record.display_name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnlinkRecord(record.id)
                    }}
                    className="hover:text-purple-900 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {linkedRecords.length === 0 && (
                <span className="text-gray-400 text-sm">No records linked</span>
              )}
            </div>
          </div>
          
          {/* Search for records to link */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search records to link..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          {/* Available records from linked table */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Loading records...
              </div>
            ) : availableRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                {search ? 'No matching records found' : 'No records available'}
              </div>
            ) : (
              <div className="py-2">
                {availableRecords.map((record) => {
                  const isLinked = value.includes(record.id)
                  
                  return (
                    <label 
                      key={record.id} 
                      className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer ${
                        isLinked ? 'bg-purple-50' : ''
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isLinked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleLinkRecord(record.id)
                          } else {
                            handleUnlinkRecord(record.id)
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">
                          {record.display_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {record.id.substring(0, 8)}...
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Quick actions */}
          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {linkedRecords.length} record(s) linked
              </span>
              <button
                onClick={handleStopEditing}
                className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Display mode
  return (
    <div
      className="px-3 py-2 cursor-pointer hover:bg-purple-50 min-h-[40px] flex items-center"
      onClick={handleStartEditing}
    >
      {linkedRecords.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {linkedRecords.map((record) => (
            <span 
              key={record.id} 
              className="inline-flex items-center px-2.5 py-1 text-sm bg-purple-100 text-purple-700 rounded-md"
            >
              <Link2 className="w-3 h-3 mr-1" />
              {record.display_name}
            </span>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-gray-400">
          <Plus className="w-4 h-4" />
          <span className="text-sm">Link records...</span>
        </div>
      )}
    </div>
  )
}