'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState, Suspense, useRef } from 'react'
import { ArrowLeft, Search, Download, RefreshCw, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/ui-components/button'
import { Input } from '@/ui-components/input'
import { Card } from '@/ui-components/card'
import { Badge } from '@/ui-components/badge'
import { rowsAPI, tablesAPI } from '@/lib/api/data-tables-client'
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
    
    // Listen for new scans from mobile devices
    channel.on('broadcast', { event: 'barcode_scanned' }, ({ payload }) => {
      console.log('📱 Received new scan via real-time:', payload)
      
      if (payload.tableId === tableId && payload.column === columnName) {
        // Use the complete scan result data from mobile
        const newScanResult: ScanResult = {
          id: payload.scanResult?.id || Date.now().toString(),
          barcode: payload.barcode,
          timestamp: new Date(payload.timestamp),
          success: payload.foundRows && payload.foundRows.length > 0,
          foundRows: payload.foundRows || [],
          column: columnName,
          tableId: tableId
        }
        
        console.log('✅ Adding real-time scan result:', newScanResult)
        setScanResults(prev => {
          // Check if this scan already exists to avoid duplicates
          const exists = prev.some(existing => 
            existing.barcode === newScanResult.barcode && 
            Math.abs(new Date(existing.timestamp).getTime() - new Date(newScanResult.timestamp).getTime()) < 5000
          )
          
          if (exists) {
            console.log('⚠️ Duplicate scan detected, skipping')
            return prev
          }
          
          return [newScanResult, ...prev]
        })
        
        // Also update localStorage for persistence
        const existingResults = JSON.parse(localStorage.getItem(`scan_results_${tableId}_${columnName}`) || '[]')
        const isDuplicate = existingResults.some((existing: any) => 
          existing.barcode === newScanResult.barcode && 
          Math.abs(new Date(existing.timestamp).getTime() - new Date(newScanResult.timestamp).getTime()) < 5000
        )
        
        if (!isDuplicate) {
          existingResults.unshift(newScanResult)
          localStorage.setItem(`scan_results_${tableId}_${columnName}`, JSON.stringify(existingResults.slice(0, 100)))
          console.log('💾 Saved scan result to localStorage')
        }
      }
    })

    channel.subscribe((status) => {
      console.log('📺 Scan results real-time subscription status:', status)
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
      const tableData = await tablesAPI.get(tableId)
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

  const loadScanResults = async () => {
    try {
      setIsLoading(true)
      
      // First, load scan results from localStorage for immediate display
      const storedResults = localStorage.getItem(`scan_results_${tableId}_${columnName}`)
      if (storedResults) {
        const results = JSON.parse(storedResults).map((result: any) => ({
          ...result,
          timestamp: new Date(result.timestamp)
        }))
        setScanResults(results)
        console.log(`📊 Loaded ${results.length} scan results from localStorage`)
      }
      
      // TODO: In the future, we could also load scan history from the database
      // This would allow scan results to persist across devices and sessions
      // const scanHistory = await scanHistoryAPI.list(tableId, columnName)
      
    } catch (error) {
      console.error('Error loading scan results:', error)
      setScanResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh every 5 seconds to pick up new scans
  useEffect(() => {
    if (!tableId || !columnName) return

    const interval = setInterval(() => {
      loadScanResults()
    }, 5000)

    return () => clearInterval(interval)
  }, [tableId, columnName])

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / 60000)
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return timestamp.toLocaleDateString()
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
              <h1 className="text-xl font-semibold text-gray-900">Scan Results</h1>
              <p className="text-sm text-gray-600">
                Column: <span className="font-medium">{columnName}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={loadScanResults}>
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
                    Time
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
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatTimestamp(result.timestamp)}
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