'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ScanLine, ExternalLink } from 'lucide-react'
import { Button } from '@/ui-components/button'
import { Dialog, DialogContent } from '@/ui-components/dialog'
import { BarcodeScanner } from './BarcodeScanner'
import { ScanResults } from './ScanResults'
import { useBarcodeScanning } from '@/hooks/useBarcodeScanning'
import { pulseClient } from '@/lib/api/pulse-client'
import { rowsSupabase } from '@/lib/api/rows-supabase'
import { ScanResultPopup } from '../Pulse/ScanResultPopup'
import { WalkInModal, type WalkInData } from '../Pulse/WalkInModal'
import { toast } from 'sonner'
import type { TableColumn, TableRow, TableRowCreate } from '@/types/data-tables'

interface BarcodeScanModalProps {
  isOpen: boolean
  onClose: () => void
  tableId: string
  workspaceId?: string
  columns: TableColumn[]
  onRowSelect?: (row: TableRow) => void
  onScanSuccess?: (result: { row: TableRow; barcode: string; columnName: string }) => void
  pulseEnabled?: boolean
  pulseTableId?: string
}

type Step = 'column-selection' | 'scanning'

interface ScanResult {
  id: string
  barcode: string
  timestamp: Date
  success: boolean
  foundRows: TableRow[]
  errorMessage?: string
}

interface PulseScanState {
  showPopup: boolean
  success: boolean
  rowData?: Record<string, any>
  barcodeValue: string
  checkInTime: Date
  isDuplicate: boolean
  checkInCount: number
}

export function BarcodeScanModal({ 
  isOpen, 
  onClose, 
  tableId,
  workspaceId,
  columns,
  onRowSelect,
  onScanSuccess,
  pulseEnabled = false,
  pulseTableId
}: BarcodeScanModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('column-selection')
  const [selectedColumn, setSelectedColumn] = useState<TableColumn | null>(null)
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Pulse check-in state
  const [pulseScanState, setPulseScanState] = useState<PulseScanState>({
    showPopup: false,
    success: false,
    barcodeValue: '',
    checkInTime: new Date(),
    isDuplicate: false,
    checkInCount: 1
  })
  const [showWalkInModal, setShowWalkInModal] = useState(false)
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string>('')
  const [pulseSettings, setPulseSettings] = useState<any>(null)

  const {
    isScanning,
    isConnected,
    connectedDevices,
    scanResults: hookScanResults,
    startScanning,
    stopScanning,
    lookupBarcode
  } = useBarcodeScanning(tableId, selectedColumn?.name, selectedColumn?.id)

  // Load Pulse settings if enabled
  useEffect(() => {
    if (pulseEnabled && pulseTableId) {
      pulseClient.getPulseConfig(pulseTableId)
        .then(config => {
          setPulseSettings(config.settings)
          // Auto-select check-in column if configured
          if (config.check_in_column_id) {
            const column = columns.find(c => c.id === config.check_in_column_id)
            if (column) {
              setSelectedColumn(column)
              setCurrentStep('scanning')
            }
          }
        })
        .catch(err => {
          console.error('Error loading Pulse config:', err)
        })
    }
  }, [pulseEnabled, pulseTableId, columns])

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

  // Watch for scan results from the hook
  useEffect(() => {
    if (hookScanResults.length > 0 && currentStep === 'scanning' && selectedColumn) {
      // If Pulse is enabled, handle check-in
      if (pulseEnabled && pulseTableId) {
        const scanResult = hookScanResults[hookScanResults.length - 1]
        handlePulseCheckIn(scanResult.barcode)
      } else {
        // Regular mode: close modal and redirect to scan-results page
        onClose()
        const resultsUrl = `/scan-results?table=${tableId}&column=${selectedColumn.name}`
        window.open(resultsUrl, '_blank')
      }
    }
  }, [hookScanResults, currentStep, selectedColumn, onClose, tableId, pulseEnabled, pulseTableId])

  // Handle Pulse check-in
  const handlePulseCheckIn = async (barcode: string) => {
    if (!selectedColumn || !selectedColumn.id || !pulseTableId) return

    console.log('🔵 Pulse check-in started for barcode:', barcode)
    setLastScannedBarcode(barcode)

    try {
      // Search for the row with this barcode
      const rows = await rowsSupabase.searchByBarcode(tableId, selectedColumn.id, barcode)

      if (rows.length > 0) {
        // Found RSVP - create check-in
        const row = rows[0]
        if (!row.id) {
          throw new Error('Row ID is missing')
        }

        console.log('✅ Found RSVP row:', row.id)

        // Create check-in record
        const checkIn = await pulseClient.createCheckIn({
          pulse_table_id: pulseTableId,
          table_id: tableId,
          row_id: row.id,
          barcode_scanned: barcode,
          row_data: row.data,
          is_walk_in: false
        })

        console.log('✅ Check-in created:', checkIn)

        // Show success popup
        setPulseScanState({
          showPopup: true,
          success: true,
          rowData: row.data,
          barcodeValue: barcode,
          checkInTime: new Date(checkIn.check_in_time),
          isDuplicate: checkIn.check_in_count > 1,
          checkInCount: checkIn.check_in_count
        })

        // Play sound if enabled
        if (pulseSettings?.play_sound) {
          playCheckInSound(true)
        }

        // Show toast notification
        if (checkIn.check_in_count > 1) {
          toast.warning(`Already checked in (${checkIn.check_in_count} times)`)
        } else {
          toast.success('Check-in successful!')
        }
      } else {
        // Not found - show error popup
        console.log('❌ Barcode not found in RSVP list')

        setPulseScanState({
          showPopup: true,
          success: false,
          barcodeValue: barcode,
          checkInTime: new Date(),
          isDuplicate: false,
          checkInCount: 0
        })

        // Play error sound if enabled
        if (pulseSettings?.play_sound) {
          playCheckInSound(false)
        }

        // Show toast notification
        if (pulseSettings?.allow_duplicate_scans !== false) {
          toast.error('Not on RSVP list', {
            description: 'Add as walk-in to check them in'
          })
        }
      }
    } catch (error) {
      console.error('❌ Error during check-in:', error)
      toast.error('Check-in failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Play check-in sound
  const playCheckInSound = (success: boolean) => {
    try {
      const audio = new Audio(success ? '/sounds/success.mp3' : '/sounds/error.mp3')
      audio.volume = 0.5
      audio.play().catch(err => console.warn('Could not play sound:', err))
    } catch (err) {
      console.warn('Sound playback not supported:', err)
    }
  }

  // Handle walk-in submission
  const handleWalkInSubmit = async (walkInData: WalkInData) => {
    if (!pulseTableId) return

    console.log('🟠 Creating walk-in:', walkInData)

    try {
      // Create a new row in the table
      const rowData: Record<string, any> = {
        is_walk_in: true
      }

      // Map walk-in data to table columns (using common field names)
      if (walkInData.name) rowData.Name = walkInData.name
      if (walkInData.email) rowData.Email = walkInData.email
      if (walkInData.phone) rowData.Phone = walkInData.phone
      if (walkInData.group) rowData.School = walkInData.group
      if (walkInData.notes) rowData.Notes = walkInData.notes
      if (walkInData.barcode && selectedColumn) {
        rowData[selectedColumn.name] = walkInData.barcode
      }

      const newRow = await rowsSupabase.create(tableId, {
        data: rowData
      } as TableRowCreate)

      if (!newRow.id) {
        throw new Error('Failed to create row: missing ID')
      }

      console.log('✅ Walk-in row created:', newRow.id)

      // Create check-in record
      const checkIn = await pulseClient.createCheckIn({
        pulse_table_id: pulseTableId,
        table_id: tableId,
        row_id: newRow.id,
        barcode_scanned: walkInData.barcode || lastScannedBarcode,
        row_data: rowData,
        is_walk_in: true,
        notes: walkInData.notes
      })

      console.log('✅ Walk-in check-in created:', checkIn)

      // Show success popup
      setPulseScanState({
        showPopup: true,
        success: true,
        rowData: rowData,
        barcodeValue: walkInData.barcode || lastScannedBarcode,
        checkInTime: new Date(checkIn.check_in_time),
        isDuplicate: false,
        checkInCount: 1
      })

      toast.success('Walk-in added and checked in!')
    } catch (error) {
      console.error('❌ Error creating walk-in:', error)
      toast.error('Failed to add walk-in', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Handle successful barcode scan - now handles both regular and Pulse modes
  const handleScanSuccess = async (barcode: string) => {
    if (!selectedColumn) return
    
    if (pulseEnabled && pulseTableId) {
      // Pulse mode: handle check-in
      await handlePulseCheckIn(barcode)
    } else {
      // Regular mode: close modal and redirect to scan-results page
      onClose()
      const resultsUrl = `/scan-results?table=${tableId}&column=${selectedColumn.name}`
      window.open(resultsUrl, '_blank')
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

  const getStepIndicator = () => {
    const steps = [
      { key: 'column-selection', label: 'Select Column', active: currentStep === 'column-selection' },
      { key: 'scanning', label: 'Scan Barcode', active: currentStep === 'scanning' }
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

      default:
        return null
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="scan-lookup-modal max-w-md max-h-[80vh] overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              {pulseEnabled ? 'Pulse Check-In Scanner' : 'Scan & Lookup'}
            </h2>
            {pulseEnabled && (
              <p className="text-sm text-gray-600 mt-1">
                Scan barcodes to check in attendees
              </p>
            )}
          </div>
          
          <div className="py-4">
            {!pulseEnabled && getStepIndicator()}
            {renderStepContent()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pulse Check-in Result Popup */}
      {pulseEnabled && (
        <ScanResultPopup
          open={pulseScanState.showPopup}
          onClose={() => setPulseScanState(prev => ({ ...prev, showPopup: false }))}
          success={pulseScanState.success}
          rowData={pulseScanState.rowData}
          barcodeValue={pulseScanState.barcodeValue}
          checkInTime={pulseScanState.checkInTime}
          isDuplicate={pulseScanState.isDuplicate}
          checkInCount={pulseScanState.checkInCount}
          onAddWalkIn={() => setShowWalkInModal(true)}
          autoCloseSeconds={3}
        />
      )}

      {/* Walk-In Modal */}
      {pulseEnabled && (
        <WalkInModal
          open={showWalkInModal}
          onOpenChange={setShowWalkInModal}
          onSubmit={handleWalkInSubmit}
          barcodeValue={lastScannedBarcode}
        />
      )}
    </>
  )
}