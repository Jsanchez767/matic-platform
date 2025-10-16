'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle, XCircle, Clock, Search, ExternalLink, RotateCcw } from 'lucide-react'
import { Button } from '@/ui-components/button'
import { Input } from '@/ui-components/input'
import { Badge } from '@/ui-components/badge'
import { Card } from '@/ui-components/card'
import { ScrollArea } from '@/ui-components/scroll-area'
import type { TableColumn, TableRow } from '@/types/data-tables'

interface ScanResult {
  id: string
  barcode: string
  timestamp: Date
  success: boolean
  foundRows: TableRow[]
  errorMessage?: string
}

interface ScanResultsProps {
  tableId: string
  selectedColumn: TableColumn
  results: ScanResult[]
  isLoading: boolean
  onBack: () => void
  onScanAnother: () => void
  onClearHistory: () => void
  onRowSelect?: (row: TableRow) => void
}

export function ScanResults({
  tableId,
  selectedColumn,
  results,
  isLoading,
  onBack,
  onScanAnother,
  onClearHistory,
  onRowSelect
}: ScanResultsProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null)

  const filteredResults = results.filter(result => 
    result.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const successfulScans = results.filter(r => r.success).length
  const totalScans = results.length

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else {
      return timestamp.toLocaleDateString()
    }
  }

  const getResultIcon = (result: ScanResult) => {
    if (result.success) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else {
      return <XCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getResultBadge = (result: ScanResult) => {
    if (result.success) {
      const count = result.foundRows.length
      if (count === 0) {
        return <Badge variant="secondary">No matches</Badge>
      } else if (count === 1) {
        return <Badge className="bg-green-100 text-green-800">1 match</Badge>
      } else {
        return <Badge className="bg-green-100 text-green-800">{count} matches</Badge>
      }
    } else {
      return <Badge variant="destructive">Error</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Scan...</h3>
          <p className="text-sm text-gray-600">
            Looking up barcode in column: <span className="font-medium">{selectedColumn.label}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Scan Results</h3>
        <p className="text-sm text-gray-600">
          Searching column: <span className="font-medium">{selectedColumn.label}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{successfulScans}</div>
          <div className="text-sm text-gray-600">Successful</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalScans}</div>
          <div className="text-sm text-gray-600">Total Scans</div>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search scan history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearHistory}
            disabled={results.length === 0}
          >
            Clear History
          </Button>
          <Button
            onClick={onScanAnother}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Scan Another
          </Button>
        </div>
      </div>

      {/* Results List */}
      {filteredResults.length > 0 ? (
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {filteredResults.map((result) => (
              <Card
                key={result.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedResult?.id === result.id 
                    ? 'ring-2 ring-purple-500 bg-purple-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedResult(result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getResultIcon(result)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {result.barcode}
                        </code>
                        {getResultBadge(result)}
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500 mb-2">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimestamp(result.timestamp)}
                      </div>

                      {result.success && result.foundRows.length > 0 && (
                        <div className="space-y-2">
                          {result.foundRows.slice(0, 2).map((row, index) => (
                            <div
                              key={row.id}
                              className="bg-white border rounded p-2 text-sm hover:bg-gray-50 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                onRowSelect?.(row)
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Row {row.id?.slice(0, 8) || 'Unknown'}...</span>
                                <ExternalLink className="w-3 h-3 text-gray-400" />
                              </div>
                              <div className="text-gray-600 truncate">
                                {Object.entries(row.data)
                                  .slice(0, 2)
                                  .map(([key, value]) => `${key}: ${value}`)
                                  .join(', ')}
                              </div>
                            </div>
                          ))}
                          
                          {result.foundRows.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{result.foundRows.length - 2} more results
                            </div>
                          )}
                        </div>
                      )}

                      {result.success && result.foundRows.length === 0 && (
                        <div className="text-sm text-gray-500 bg-gray-50 rounded p-2">
                          No matching records found for this barcode
                        </div>
                      )}

                      {!result.success && result.errorMessage && (
                        <div className="text-sm text-red-600 bg-red-50 rounded p-2">
                          {result.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-12">
          {results.length === 0 ? (
            <>
              <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">No Scans Yet</h4>
              <p className="text-gray-600 text-sm mb-4">
                Start scanning to see results here
              </p>
              <Button
                onClick={onScanAnother}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Start Scanning
              </Button>
            </>
          ) : (
            <>
              <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">No Results Found</h4>
              <p className="text-gray-600 text-sm">
                No scans match your search: "{searchQuery}"
              </p>
            </>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Columns
        </Button>
      </div>
    </div>
  )
}