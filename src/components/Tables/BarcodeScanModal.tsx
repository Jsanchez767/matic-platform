'use client'

import { useState, useEffect } from 'react'
import { X, ScanLine } from 'lucide-react'
import { Button } from '@/ui-components/button'
import { Dialog, DialogContent } from '@/ui-components/dialog'
import type { TableColumn } from '@/types/data-tables'

interface BarcodeScanModalProps {
  isOpen: boolean
  onClose: () => void
  tableId: string
  workspaceId: string
  columns: TableColumn[]
  onRowFound?: (rowId: string, rowData: any) => void
}

type ScanStep = 'column-selection' | 'scanning' | 'results'

export function BarcodeScanModal({
  isOpen,
  onClose,
  tableId,
  workspaceId,
  columns,
  onRowFound
}: BarcodeScanModalProps) {
  const [currentStep, setCurrentStep] = useState<ScanStep>('column-selection')
  const [selectedColumn, setSelectedColumn] = useState<TableColumn | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('column-selection')
      setSelectedColumn(null)
    }
  }, [isOpen])

  // Get visible columns that can be used for barcode lookup
  const visibleColumns = columns.filter(col => 
    col.is_visible && ['text', 'number', 'barcode'].includes(col.column_type)
  )

  const handleColumnSelected = (column: TableColumn) => {
    setSelectedColumn(column)
    setCurrentStep('scanning')
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-6">
      <div className={`flex items-center space-x-2 ${
        currentStep === 'column-selection' ? 'text-purple-600' : 'text-gray-400'
      }`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
          currentStep === 'column-selection' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          1
        </div>
        <span className="text-sm font-medium">Select Column</span>
      </div>
      
      <div className="w-8 h-px bg-gray-300" />
      
      <div className={`flex items-center space-x-2 ${
        currentStep === 'scanning' ? 'text-purple-600' : 'text-gray-400'
      }`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
          currentStep === 'scanning' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          2
        </div>
        <span className="text-sm font-medium">Scan Barcode</span>
      </div>
      
      <div className="w-8 h-px bg-gray-300" />
      
      <div className={`flex items-center space-x-2 ${
        currentStep === 'results' ? 'text-purple-600' : 'text-gray-400'
      }`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
          currentStep === 'results' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          3
        </div>
        <span className="text-sm font-medium">Results</span>
      </div>
    </div>
  )

  const renderColumnSelection = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Select Column for Barcode Lookup
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Choose which column contains the barcode values to search for
        </p>
      </div>

      <div className="space-y-2">
        {visibleColumns.length > 0 ? (
          visibleColumns.map((column) => (
            <button
              key={column.id}
              onClick={() => handleColumnSelected(column)}
              className="w-full p-4 text-left border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{column.label}</h4>
                  <p className="text-sm text-gray-500 capitalize">{column.column_type} field</p>
                </div>
                <div className="text-purple-600">
                  <ScanLine className="w-5 h-5" />
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No suitable columns found for barcode lookup.</p>
            <p className="text-sm text-gray-400 mt-2">
              Add text, number, or barcode columns to enable scanning.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )

  const renderScanning = () => (
    <div className="text-center space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Scan Barcode in Column: {selectedColumn?.label}
        </h3>
        <p className="text-sm text-gray-500">
          Barcode scanning feature coming soon...
        </p>
      </div>

      <div className="bg-gray-100 rounded-lg p-8">
        <ScanLine className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">Barcode scanner will be integrated here</p>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep('column-selection')}>
          Back
        </Button>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (currentStep) {
      case 'column-selection':
        return renderColumnSelection()
      case 'scanning':
        return renderScanning()
      default:
        return renderColumnSelection()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ScanLine className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold">Barcode Scan & Lookup</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div>
          {renderStepIndicator()}
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}