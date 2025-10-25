import { useState, useEffect, useCallback } from 'react'
import { Search, X, Plus, Link2 } from 'lucide-react'
import { rowsSupabase } from '@/lib/api/rows-supabase'

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
  const [allRecordsCache, setAllRecordsCache] = useState<LinkedRecord[]>([])

  // Load ALL records from linked table once when editing starts
  useEffect(() => {
    if (isEditing && linkedTableId && allRecordsCache.length === 0) {
      loadAllRecords()
    }
  }, [isEditing, linkedTableId])

  // Update linked records based on current value and cached data
  useEffect(() => {
    if (allRecordsCache.length > 0) {
      const linked = allRecordsCache.filter(record => value.includes(record.id))
      setLinkedRecords(linked)
    } else if (value.length > 0 && linkedTableId && !isEditing) {
      // Load linked records for display mode when cache is empty
      loadLinkedRecordsForDisplay()
    } else if (value.length === 0) {
      setLinkedRecords([])
    }
  }, [value, allRecordsCache, linkedTableId, isEditing])

  // Separate function for loading just the linked records for display
  const loadLinkedRecordsForDisplay = async () => {
    if (!linkedTableId || value.length === 0) return
    
    try {
      console.log('🎯 Loading linked records for display mode')
      const allRecords = await rowsSupabase.list(linkedTableId)
      const linkedRecordsData = allRecords.filter((record: any) => value.includes(record.id!))
      
      const formattedRecords: LinkedRecord[] = linkedRecordsData.map((record: any) => ({
        id: record.id!,
        display_name: getRecordDisplayName(record),
        data: record.data
      }))
      
      setLinkedRecords(formattedRecords)
    } catch (error) {
      console.error('Error loading linked records for display:', error)
      setLinkedRecords([])
    }
  }

  // Filter available records based on search and current selection
  useEffect(() => {
    if (allRecordsCache.length > 0) {
      let filtered = allRecordsCache
      
      if (search) {
        const searchLower = search.toLowerCase()
        filtered = allRecordsCache.filter(record => 
          record.display_name.toLowerCase().includes(searchLower)
        )
      }
      
      setAvailableRecords(filtered)
    }
  }, [search, allRecordsCache])

  const loadAllRecords = async () => {
    if (!linkedTableId) return
    
    try {
      setLoading(true)
      console.log('🔄 Loading all records from linked table (one time only)')
      
      // Fetch all records from the linked table ONCE
      const allRecords = await rowsSupabase.list(linkedTableId)
      
      // Convert to LinkedRecord format with display names
      const formattedRecords: LinkedRecord[] = allRecords.map((record: any) => ({
        id: record.id!,
        display_name: getRecordDisplayName(record),
        data: record.data
      }))
      
      setAllRecordsCache(formattedRecords)
      console.log(`✅ Loaded ${formattedRecords.length} records to cache`)
    } catch (error) {
      console.error('Error loading records:', error)
      setAllRecordsCache([])
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get a meaningful display name from a record
  const getRecordDisplayName = (record: any): string => {
    const data = record.data || {}
    
    // Try common field names for the display value
    const possibleNames = ['name', 'title', 'label', 'display_name', 'text']
    
    for (const field of possibleNames) {
      if (data[field] && typeof data[field] === 'string') {
        return data[field]
      }
    }
    
    // If no good field found, use the first string value
    const firstStringValue = Object.values(data).find(val => 
      typeof val === 'string' && val.trim().length > 0
    ) as string
    
    if (firstStringValue) {
      return firstStringValue
    }
    
    // Fallback to shortened record ID
    return `Record ${record.id?.substring(0, 8) || 'Unknown'}`
  }

  const handleLinkRecord = (targetRecordId: string) => {
    // Prevent duplicate links
    if (value.includes(targetRecordId)) return
    
    console.log('🔗 Linking record:', targetRecordId)
    
    // Optimistic update - immediately update the UI
    const newValue = [...value, targetRecordId]
    onChange(newValue)
    onCellEdit(rowId, columnName, newValue)
    
    // No need to reload data - useEffect will update linkedRecords from cache
  }

  const handleUnlinkRecord = (targetRecordId: string) => {
    console.log('❌ Unlinking record:', targetRecordId)
    
    // Optimistic update - immediately update the UI  
    const newValue = value.filter(id => id !== targetRecordId)
    onChange(newValue)
    onCellEdit(rowId, columnName, newValue)
    
    // No need to reload data - useEffect will update linkedRecords from cache
  }

  const handleStartEditing = () => {
    console.log('📝 Starting link field editing')
    setIsEditing(true)
    setSearch('')
  }

  const handleStopEditing = () => {
    console.log('✅ Stopping link field editing')  
    setIsEditing(false)
    setSearch('')
    // Keep the cache for faster subsequent edits
    // Cache will be cleared on component unmount
  }

  if (isEditing) {
    return (
      <div className="relative" style={{ position: 'relative' }}>
        {/* Backdrop to close dropdown */}
        <div
          className="fixed inset-0 z-40"
          onClick={handleStopEditing}
        />
        
        {/* Dropdown for selecting linked records - FIXED positioning to avoid clipping */}
        <div className="fixed z-50 w-96 bg-white border border-gray-200 rounded-lg shadow-2xl" style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          maxHeight: '80vh',
        }}>
          {/* Current linked records */}
          <div className="p-3 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Linked Records:</div>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
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
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 200px)' }}>
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