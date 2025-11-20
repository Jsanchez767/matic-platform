'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense, useRef } from 'react'
import { ArrowLeft, Search, Download, RefreshCw, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/ui-components/button'
import { Input } from '@/ui-components/input'
import { Card } from '@/ui-components/card'
import { Badge } from '@/ui-components/badge'
import { tablesSupabase } from '@/lib/api/tables-supabase'
import { scanHistoryAPI } from '@/lib/api/scan-history-client'
import { createClient } from '@supabase/supabase-js'

// Supabase client for real-time communication
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ScanResult {
  id: string
  barcode: string
  timestamp: Date
  success: boolean
  foundRows: any[]
  column: string
  tableId: string
  scannedBy?: string
  scannedByEmail?: string
  metadata?: any
}

function ScanResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [filteredResults, setFilteredResults] = useState<ScanResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [tableColumns, setTableColumns] = useState<any[]>([])
  const channelRef = useRef<any>(null)

  const tableId = searchParams.get('table')
  const columnName = searchParams.get('column')

  useEffect(() => {
    if (tableId && columnName) {
      loadScanResults()
      loadTableColumns()
      setupRealtimeSubscription()
    }

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
    }
  }, [tableId, columnName])

  const setupRealtimeSubscription = () => {
    if (!tableId || !columnName) return

    const channelName = `scan_results_${tableId}_${columnName}`
    console.log('📺 Setting up real-time subscription for scan results:', channelName)
    
    const channel = supabase.channel(channelName)
    
    // Listen for INSERT events on scan_history table
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'scan_history',
        filter: `table_id=eq.${tableId}`
      },
      (payload: any) => {
        console.log('🆕 New scan_history record detected:', payload.new)
        
        const newRecord = payload.new
        
        // Only add if it matches our column
        if (newRecord.column_name === columnName) {
          const newScanResult: ScanResult = {
            id: newRecord.id,
            barcode: newRecord.barcode,
            timestamp: new Date(newRecord.created_at),
            success: newRecord.status === 'success',
            foundRows: newRecord.matched_rows || [],
            column: newRecord.column_name,
            tableId: newRecord.table_id,
            scannedBy: newRecord.metadata?.scannedBy,
            scannedByEmail: newRecord.metadata?.scannedByEmail,
            metadata: newRecord.metadata
          }
          
          console.log('✅ Adding new scan result to UI:', newScanResult)
          setScanResults(prev => {
            // Check if this scan already exists to avoid duplicates
            const exists = prev.some(existing => existing.id === newScanResult.id)
            
            if (exists) {
              console.log('⚠️ Duplicate scan detected, skipping')
              return prev
            }
            
            return [newScanResult, ...prev]
          })
        }
      }
    )
    
    // Also listen for broadcast events from mobile devices (for instant feedback)
    channel.on('broadcast', { event: 'barcode_scanned' }, ({ payload }) => {
      console.log('📱 Received scan broadcast from mobile:', payload)
      
      if (payload.tableId === tableId && payload.column === columnName) {
        // Use the complete scan result data from mobile
        const newScanResult: ScanResult = {
          id: payload.scanResult?.id || `temp_${Date.now()}`,
          barcode: payload.barcode,
          timestamp: new Date(payload.timestamp),
          success: payload.foundRows && payload.foundRows.length > 0,
          foundRows: payload.foundRows || [],
          column: columnName,
          tableId: tableId
        }
        
        console.log('✅ Adding broadcast scan result:', newScanResult)
        setScanResults(prev => {
          // Check if this scan already exists to avoid duplicates
          const exists = prev.some(existing => 
            existing.barcode === newScanResult.barcode && 
            Math.abs(new Date(existing.timestamp).getTime() - new Date(newScanResult.timestamp).getTime()) < 5000
          )
          
          if (exists) {
            console.log('⚠️ Duplicate broadcast scan detected, skipping')
            return prev
          }
          
          return [newScanResult, ...prev]
        })
      }
    })

    channel.subscribe((status) => {
      console.log('📺 Real-time subscription status:', status)
    })
    
    channelRef.current = channel
  }

  useEffect(() => {
    // Filter results based on search query
    const filtered = scanResults.filter(result =>
      result.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.foundRows.some(row => 
        Object.values(row.data || {}).some(value => 
          value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    )
    setFilteredResults(filtered)
  }, [scanResults, searchQuery])

  const loadTableColumns = async () => {
    try {
      if (!tableId) return
      
      // Fetch table schema from FastAPI backend
      const tableData = await tablesSupabase.getTableById(tableId)
      if (tableData && tableData.columns) {
        setTableColumns(tableData.columns)
        console.log(`📊 Loaded ${tableData.columns.length} table columns from backend`)
      } else {
        // Fallback to default columns
        setTableColumns([
          { name: 'id', label: 'ID', type: 'text' },
          { name: columnName || 'barcode', label: columnName || 'Barcode', type: 'text' },
          { name: 'name', label: 'Name', type: 'text' },
          { name: 'description', label: 'Description', type: 'text' }
        ])
      }
    } catch (error) {
      console.error('Error loading table columns:', error)
      // Fallback to default columns on error
      setTableColumns([
        { name: 'id', label: 'ID', type: 'text' },
        { name: columnName || 'barcode', label: columnName || 'Barcode', type: 'text' },
        { name: 'name', label: 'Name', type: 'text' },
        { name: 'description', label: 'Description', type: 'text' }
      ])
    }
  }

  const loadScanResults = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      
      console.log('🔍 Loading scan results for:', { tableId, columnName })
      
      // Load scan history from database (single source of truth)
      if (tableId && columnName) {
        try {
          console.log('📡 Fetching from database with params:', {
            tableId,
            columnName,
            apiUrl: process.env.NEXT_PUBLIC_GO_API_URL || 'https://backend.maticslab.com/api/v1'
          })
          
          const scanHistory = await scanHistoryAPI.list({
            tableId: tableId,
            columnName: columnName,
            limit: 100
          })
          
          console.log(`✅ Database returned ${scanHistory.length} records:`, scanHistory)
          
          const results: ScanResult[] = scanHistory.map(scan => ({
            id: scan.id,
            barcode: scan.barcode,
            timestamp: new Date(scan.created_at),
            success: scan.status === 'success',
            foundRows: scan.matched_rows || [],
            column: scan.column_name || columnName,
            tableId: scan.table_id,
            scannedBy: scan.metadata?.scannedBy,
            scannedByEmail: scan.metadata?.scannedByEmail,
            metadata: scan.metadata
          }))
          
          console.log(`📊 Mapped ${results.length} scan results:`, results)
          setScanResults(results)
          
        } catch (dbError) {
          console.error('❌ Error loading from database:', dbError)
          console.error('❌ Error details:', {
            message: dbError instanceof Error ? dbError.message : String(dbError),
            stack: dbError instanceof Error ? dbError.stack : undefined
          })
          throw dbError
        }
      } else {
        console.warn('⚠️ Missing tableId or columnName:', { tableId, columnName })
      }
      
    } catch (error) {
      console.error('❌ Failed to load scan results:', error)
      setScanResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }
  
  const formatRelativeTime = (timestamp: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / 60000)
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const exportResults = () => {
    const csvContent = [
      ['Barcode', 'Status', 'Time', 'Found Records', ...tableColumns.map(col => col.label)],
      ...filteredResults.map(result => [
        result.barcode,
        result.success ? 'Success' : 'Failed',
        result.timestamp.toLocaleString(),
        result.foundRows.length.toString(),
        ...tableColumns.map(col => {
          const firstRow = result.foundRows[0]
          return firstRow?.data?.[col.name] || ''
        })
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scan-results-${tableId}-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading scan results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">Scan Results</h1>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                  Live
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Column: <span className="font-medium">{columnName}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => loadScanResults(true)}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportResults}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{scanResults.length}</div>
              <div className="text-sm text-gray-600">Total Scans</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {scanResults.filter(r => r.success).length}
              </div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {scanResults.filter(r => r.success && r.foundRows.length > 0).length}
              </div>
              <div className="text-sm text-gray-600">Records Found</div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by barcode or record data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Results Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barcode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scan Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scanned By
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scan Count
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Found Records
                  </th>
                  {tableColumns.slice(0, 3).map(column => (
                    <th key={column.name} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      {result.success ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Success
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {result.barcode}
                      </code>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <div className="flex flex-col">
                        <div className="flex items-center font-medium text-gray-900">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatTimestamp(result.timestamp)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(result.timestamp)}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {result.scannedBy ? (
                        <div className="flex flex-col">
                          <div className="font-medium text-gray-900">
                            {result.scannedBy}
                          </div>
                          {result.scannedByEmail && (
                            <div className="text-xs text-gray-500">
                              {result.scannedByEmail}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Unknown</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {result.foundRows.length > 0 && result.foundRows[0].data?.scan_count ? (
                          <>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {result.foundRows[0].data.scan_count}x
                            </Badge>
                            {result.foundRows[0].data?.last_scanned_at && (
                              <div className="ml-2 text-xs text-gray-500">
                                Last: {formatRelativeTime(new Date(result.foundRows[0].data.last_scanned_at))}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {result.foundRows.length} record{result.foundRows.length !== 1 ? 's' : ''}
                    </td>
                    {tableColumns.slice(0, 3).map(column => (
                      <td key={column.name} className="px-4 py-4 text-sm text-gray-900">
                        {result.foundRows.length > 0 
                          ? result.foundRows[0].data?.[column.name] || '-'
                          : '-'
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredResults.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
              <p className="text-gray-600">
                {searchQuery ? `No results match "${searchQuery}"` : 'No scan results available'}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function ScanResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ScanResultsContent />
    </Suspense>
  )
}