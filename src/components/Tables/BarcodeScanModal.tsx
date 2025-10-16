'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ScanLine, ExternalLink } from 'lucide-react'
import { Button } from '@/ui-components/button'
import { Dialog, DialogContent } from '@/ui-components/dialog'
import { BarcodeScanner } from './BarcodeScanner'
import { ScanResults } from './ScanResults'
import { useBarcodeScanning } from '@/hooks/useBarcodeScanning'
import type { TableColumn, TableRow } from '@/types/data-tables'

interface BarcodeScanModalProps {
  isOpen: boolean
  onClose: () => void
  tableId: string
  columns: TableColumn[]
  onRowSelect?: (row: TableRow) => void
}

type Step = 'column-selection' | 'scanning' | 'results'

interface ScanResult {
  id: string
  barcode: string
  timestamp: Date
  success: boolean
  foundRows: TableRow[]
  errorMessage?: string
}

export function BarcodeScanModal({
  isOpen,
  onClose,
  tableId,
  columns,
  onRowSelect
}: BarcodeScanModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('column-selection')
  const [selectedColumn, setSelectedColumn] = useState<TableColumn | null>(null)
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const {
    isScanning,
    isConnected,
    connectedDevices,
    scanResults: hookScanResults,
    startScanning,
    stopScanning,
    lookupBarcode
  } = useBarcodeScanning(tableId, selectedColumn?.name)

  // Filter columns that are suitable for barcode lookup
  const suitableColumns = columns.filter(column => {
    const type = column.column_type
    return ['text', 'number', 'email', 'url', 'phone'].includes(type) && !column.is_primary
  })

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('column-selection')
      setSelectedColumn(null)
      setScanResults([])
      setIsLoading(false)
    }
  }, [isOpen])

  // Watch for scan results from the hook and switch to results view
  useEffect(() => {
    if (hookScanResults.length > 0 && currentStep === 'scanning') {
      // Convert hook results to our format and switch to results
      const convertedResults = hookScanResults.map(result => ({
        id: result.id,
        barcode: result.barcode,
        timestamp: result.timestamp,
        success: result.found,
        foundRows: result.rowData ? [result.rowData] : [],
        errorMessage: result.error
      }))
      setScanResults(convertedResults)
      setCurrentStep('results')
    }
  }, [hookScanResults, currentStep])

  // Handle successful barcode scan
  const handleScanSuccess = async (barcode: string) => {
    if (!selectedColumn) return
    
    setIsLoading(true)
    
    try {
      const foundRows = await lookupBarcode(barcode)
      
      const result: ScanResult = {
        id: crypto.randomUUID(),
        barcode,
        timestamp: new Date(),
        success: true,
        foundRows: Array.isArray(foundRows) ? foundRows : []
      }
      
      setScanResults(prev => [result, ...prev])
      setCurrentStep('results')
    } catch (error) {
      const result: ScanResult = {
        id: crypto.randomUUID(),
        barcode,
        timestamp: new Date(),
        success: false,
        foundRows: [],
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred'
      }
      
      setScanResults(prev => [result, ...prev])
      setCurrentStep('results')
    } finally {
      setIsLoading(false)
    }
  }

  const handleColumnSelect = (column: TableColumn) => {
    setSelectedColumn(column)
    setCurrentStep('scanning')
  }

  const handleBackToColumnSelection = () => {
    setCurrentStep('column-selection')
    setSelectedColumn(null)
    if (isScanning) {
      stopScanning()
    }
  }

  const handleBackToScanning = () => {
    setCurrentStep('scanning')
  }

  const handleScanAnother = () => {
    setCurrentStep('scanning')
  }

  const handleClearHistory = () => {
    setScanResults([])
  }

  const handleViewFullResults = () => {
    if (selectedColumn) {
      const resultsUrl = `/scan-results?table=${tableId}&column=${selectedColumn.name}`
      window.open(resultsUrl, '_blank')
    }
  }

  const getStepIndicator = () => {
    const steps = [
      { key: 'column-selection', label: 'Select Column', active: currentStep === 'column-selection' },
      { key: 'scanning', label: 'Scan Barcode', active: currentStep === 'scanning' },
      { key: 'results', label: 'View Results', active: currentStep === 'results' }
    ]

    return (
      <div className="flex items-center justify-center space-x-2 mb-6">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step.active 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index + 1}
            </div>
            <span className={`ml-2 text-sm ${
              step.active ? 'text-purple-600 font-medium' : 'text-gray-500'
            }`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-400 mx-3" />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'column-selection':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <ScanLine className="w-12 h-12 mx-auto text-purple-600 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Choose Lookup Column
              </h3>
              <p className="text-sm text-gray-600">
                Select the column to search when a barcode is scanned
              </p>
            </div>

            {suitableColumns.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {suitableColumns.map((column) => (
                  <div
                    key={column.id}
                    onClick={() => handleColumnSelect(column)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{column.label}</div>
                        <div className="text-sm text-gray-500 capitalize">{column.column_type} column</div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  No suitable columns found for barcode lookup
                </div>
                <p className="text-sm text-gray-400">
                  You need text, number, email, URL, or phone columns to use barcode scanning
                </p>
              </div>
            )}
          </div>
        )

      case 'scanning':
        return selectedColumn ? (
          <BarcodeScanner
            tableId={tableId}
            selectedColumn={selectedColumn}
            isScanning={isScanning}
            isConnected={isConnected}
            connectedDevices={connectedDevices}
            onStartScanning={startScanning}
            onStopScanning={stopScanning}
            onBack={handleBackToColumnSelection}
            onScanSuccess={handleScanSuccess}
          />
        ) : null

      case 'results':
        return selectedColumn ? (
          <div className="space-y-4">
            <ScanResults
              tableId={tableId}
              selectedColumn={selectedColumn}
              results={scanResults}
              isLoading={isLoading}
              onBack={handleBackToScanning}
              onScanAnother={handleScanAnother}
              onClearHistory={handleClearHistory}
              onRowSelect={onRowSelect}
            />
            
            {scanResults.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleViewFullResults}
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Full Results Table
                </Button>
              </div>
            )}
          </div>
        ) : null

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Scan & Lookup</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="py-4">
          {getStepIndicator()}
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}