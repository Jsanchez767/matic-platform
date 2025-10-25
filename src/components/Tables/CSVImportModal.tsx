'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui-components/dialog'
import { Button } from '@/ui-components/button'
import { Checkbox } from '@/ui-components/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-components/select'
import { Progress } from '@/ui-components/progress'
import { Label } from '@/ui-components/label'
import { 
  Upload, FileText, CheckCircle2, Sparkles, Type, AlignLeft, Hash, 
  Mail, Phone, Link as LinkIcon, Calendar, Clock, CheckSquare, List, 
  ListCheck, ArrowRightLeft, Paperclip, Star, DollarSign, Percent 
} from 'lucide-react'
import { toast } from 'sonner'

type ColumnType = 
  | 'single_line_text' 
  | 'long_text' 
  | 'number' 
  | 'email' 
  | 'phone' 
  | 'url' 
  | 'date' 
  | 'date_time' 
  | 'checkbox' 
  | 'single_select' 
  | 'multiple_select' 
  | 'link_to_table' 
  | 'attachment' 
  | 'rating' 
  | 'currency' 
  | 'percent'

interface ColumnMapping {
  name: string
  type: ColumnType
  included: boolean
}

interface CSVImportModalProps {
  open: boolean
  onClose: () => void
  onComplete: (data: { headers: string[]; rows: string[][]; mappings: ColumnMapping[] }) => void
}

const fieldTypeConfig: Record<ColumnType, { icon: any; label: string; description: string }> = {
  single_line_text: { icon: Type, label: 'Single line text', description: 'Plain text up to 100 characters' },
  long_text: { icon: AlignLeft, label: 'Long text', description: 'Multi-line text' },
  number: { icon: Hash, label: 'Number', description: 'Integer or decimal numbers' },
  email: { icon: Mail, label: 'Email', description: 'Email address with validation' },
  phone: { icon: Phone, label: 'Phone', description: 'Phone number' },
  url: { icon: LinkIcon, label: 'URL', description: 'Website link' },
  date: { icon: Calendar, label: 'Date', description: 'Date picker' },
  date_time: { icon: Clock, label: 'Date & Time', description: 'Date and time picker' },
  checkbox: { icon: CheckSquare, label: 'Checkbox', description: 'True/false value' },
  single_select: { icon: List, label: 'Single select', description: 'Pick one option from a list' },
  multiple_select: { icon: ListCheck, label: 'Multiple select', description: 'Pick multiple options' },
  link_to_table: { icon: ArrowRightLeft, label: 'Link to another table', description: 'Reference records from another table' },
  attachment: { icon: Paperclip, label: 'Attachment', description: 'File uploads' },
  rating: { icon: Star, label: 'Rating', description: 'Star rating (1-5)' },
  currency: { icon: DollarSign, label: 'Currency', description: 'Monetary values' },
  percent: { icon: Percent, label: 'Percent', description: 'Percentage values' },
}

export function CSVImportModal({ open, onClose, onComplete }: CSVImportModalProps) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string[][]>([])
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(0) // 0 = first row, -1 = no header
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [importedResults, setImportedResults] = useState<{
    headers: string[]
    rows: string[][]
    mappings: ColumnMapping[]
  } | null>(null)

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim())
    return lines.map(line => {
      const values: string[] = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())
      return values
    })
  }

  const detectColumnType = (columnIndex: number, startRow: number): ColumnType => {
    // Sample up to 10 rows to detect type
    const sampleSize = Math.min(10, csvData.length - startRow)
    const samples = csvData.slice(startRow, startRow + sampleSize).map(row => row[columnIndex]).filter(val => val && val.trim())
    
    if (samples.length === 0) return 'single_line_text'

    // Check for checkbox/boolean
    const booleanPattern = /^(true|false|yes|no|y|n|1|0)$/i
    if (samples.every(s => booleanPattern.test(s.trim()))) return 'checkbox'
    
    // Check for email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (samples.every(s => emailPattern.test(s.trim()))) return 'email'
    
    // Check for phone
    const phonePattern = /^[\d\s\-\(\)\+]+$/
    if (samples.some(s => phonePattern.test(s.trim()) && s.replace(/\D/g, '').length >= 10)) return 'phone'
    
    // Check for URL
    const urlPattern = /^(https?:\/\/|www\.)/i
    if (samples.some(s => urlPattern.test(s.trim()))) return 'url'
    
    // Check for percent
    const percentPattern = /^\d+\.?\d*\s*%$/
    if (samples.some(s => percentPattern.test(s.trim()))) return 'percent'
    
    // Check for currency
    const currencyPattern = /^[$£€¥]\s*[\d,]+\.?\d*$/
    if (samples.some(s => currencyPattern.test(s.trim()))) return 'currency'
    
    // Check for rating
    const ratingPattern = /^[1-5]$/
    if (samples.every(s => ratingPattern.test(s.trim()))) return 'rating'
    
    // Check for number
    const numberPattern = /^-?\d+\.?\d*$/
    if (samples.every(s => numberPattern.test(s.trim().replace(/,/g, '')))) return 'number'
    
    // Check for date & time
    const dateTimePattern = /\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}\s+\d{1,2}:\d{2}/
    if (samples.some(s => dateTimePattern.test(s.trim()))) return 'date_time'
    
    // Check for date
    const datePattern = /^\d{1,4}[-\/]\d{1,2}[-\/]\d{1,4}$/
    if (samples.some(s => datePattern.test(s.trim()) || !isNaN(Date.parse(s)))) return 'date'
    
    // Check for long text (multi-line or very long)
    if (samples.some(s => s.length > 100 || s.includes('\n'))) return 'long_text'
    
    return 'single_line_text'
  }

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setFile(selectedFile)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCSV(text)
      setCsvData(parsed)
      
      // Initialize column mappings
      const firstRow = parsed[0] || []
      const mappings = firstRow.map((col, idx) => ({
        name: col || `Column ${idx + 1}`,
        type: 'single_line_text' as ColumnType,
        included: true
      }))
      setColumnMappings(mappings)
      setStep(2)
    }
    reader.readAsText(selectedFile)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleColumnTypeChange = (index: number, type: ColumnType) => {
    const updated = [...columnMappings]
    updated[index].type = type
    setColumnMappings(updated)
  }

  const handleColumnIncludedChange = (index: number, included: boolean) => {
    const updated = [...columnMappings]
    updated[index].included = included
    setColumnMappings(updated)
  }

  const handleNext = () => {
    if (step === 2) {
      const hasHeader = headerRowIndex >= 0
      const dataStartRow = hasHeader ? headerRowIndex + 1 : 0
      
      // Update column names and detect types
      const updated = columnMappings.map((mapping, idx) => {
        const detectedType = detectColumnType(idx, dataStartRow)
        return {
          ...mapping,
          name: hasHeader ? csvData[headerRowIndex][idx] || mapping.name : mapping.name,
          type: detectedType
        }
      })
      setColumnMappings(updated)
      setStep(3)
    }
  }

  const handleComplete = () => {
    // Filter to only included columns
    const includedIndices = columnMappings
      .map((mapping, idx) => mapping.included ? idx : -1)
      .filter(idx => idx !== -1)
    
    const hasHeader = headerRowIndex >= 0
    const dataStartRow = hasHeader ? headerRowIndex + 1 : 0
    
    const allHeaders = hasHeader ? csvData[headerRowIndex] : columnMappings.map(m => m.name)
    const allRows = csvData.slice(dataStartRow)
    
    // Filter columns
    const headers = includedIndices.map(idx => allHeaders[idx])
    const rows = allRows.map(row => includedIndices.map(idx => row[idx]))
    const mappings = columnMappings.filter(m => m.included)
    
    setImportedResults({ headers, rows, mappings })
    
    onComplete({
      headers,
      rows,
      mappings
    })
    
    const includedCount = columnMappings.filter(m => m.included).length
    toast.success(`Successfully imported ${rows.length} rows with ${includedCount} columns`)
    setStep(4)
  }

  const handleClose = () => {
    setStep(1)
    setFile(null)
    setCsvData([])
    setHeaderRowIndex(0)
    setColumnMappings([])
    setImportedResults(null)
    onClose()
  }

  const getPreviewRows = () => {
    return csvData.slice(0, 5)
  }

  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      single_line_text: 'bg-gray-500',
      long_text: 'bg-gray-600',
      number: 'bg-blue-500',
      date: 'bg-purple-500',
      date_time: 'bg-purple-600',
      email: 'bg-green-500',
      phone: 'bg-teal-500',
      url: 'bg-indigo-500',
      checkbox: 'bg-yellow-500',
      single_select: 'bg-orange-500',
      multiple_select: 'bg-orange-600',
      link_to_table: 'bg-pink-500',
      attachment: 'bg-cyan-500',
      rating: 'bg-amber-500',
      currency: 'bg-emerald-500',
      percent: 'bg-lime-500',
    }
    return colors[type] || 'bg-gray-500'
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import CSV File</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Upload your CSV file to get started'}
            {step === 2 && 'Configure your data import settings'}
            {step === 3 && 'Assign data types to each column'}
            {step === 4 && 'Import complete! Review your imported data below'}
          </DialogDescription>
        </DialogHeader>

        {step < 4 && (
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span className={step >= 1 ? 'text-blue-600' : ''}>Upload</span>
              <span className={step >= 2 ? 'text-blue-600' : ''}>Preview</span>
              <span className={step >= 3 ? 'text-blue-600' : ''}>Configure</span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          {/* Step 1: File Upload */}
          {step === 1 && (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="mx-auto mb-4 text-gray-400" size={48} />
              <h3 className="mb-2">Drag and drop your CSV file here</h3>
              <p className="text-gray-500 mb-4">or</p>
              <Button
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.csv'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) handleFileSelect(file)
                  }
                  input.click()
                }}
              >
                <FileText className="mr-2" size={16} />
                Choose File
              </Button>
            </div>
          )}

          {/* Step 2: Preview & Header Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div>
                  <Label className="mb-2 block">Which row contains your column headers?</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Select the row that contains your column names, or choose "No header row" if your data doesn't have headers.
                  </p>
                </div>
                <Select 
                  value={headerRowIndex.toString()} 
                  onValueChange={(value) => setHeaderRowIndex(parseInt(value))}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">
                      <span className="text-gray-600">No header row</span>
                    </SelectItem>
                    {csvData.slice(0, Math.min(5, csvData.length)).map((row, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Row {idx + 1}:</span>
                          <span className="text-sm">
                            {row.slice(0, 3).join(', ')}
                            {row.length > 3 ? '...' : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        {(csvData[0] || []).map((cell, idx) => {
                          const headerText = headerRowIndex >= 0
                            ? csvData[headerRowIndex]?.[idx] || `Column ${idx + 1}`
                            : `Column ${idx + 1}`
                          return (
                            <th key={idx} className="px-4 py-3 text-left max-w-[200px]">
                              <div className="truncate text-sm" title={headerText}>
                                {headerText}
                              </div>
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {getPreviewRows().map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className={`border-t ${rowIdx === headerRowIndex ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                        >
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-4 py-2 max-w-[200px]">
                              <div className="text-sm truncate" title={cell}>
                                {cell}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Showing {getPreviewRows().length} of {csvData.length} rows
                {headerRowIndex >= 0 && (
                  <span className="ml-2 text-blue-600">• Header row: Row {headerRowIndex + 1}</span>
                )}
              </p>
            </div>
          )}

          {/* Step 3: Column Type Mapping */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-blue-600" size={16} />
                    <p className="text-sm">
                      Data types auto-detected. Adjust as needed and choose which columns to import.
                    </p>
                  </div>
                  <p className="text-sm">
                    {columnMappings.filter(m => m.included).length} of {columnMappings.length} columns selected
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {columnMappings.map((mapping, idx) => {
                  const hasHeader = headerRowIndex >= 0
                  const dataStartRow = hasHeader ? headerRowIndex + 1 : 0
                  const sampleData = csvData[dataStartRow]?.[idx] || ''
                  const fieldConfig = fieldTypeConfig[mapping.type]
                  const FieldIcon = fieldConfig.icon
                  
                  return (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
                        mapping.included 
                          ? 'bg-white border-gray-200' 
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center">
                        <Checkbox
                          id={`include-${idx}`}
                          checked={mapping.included}
                          onCheckedChange={(checked) => handleColumnIncludedChange(idx, checked as boolean)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-1">Column name</div>
                        <div className={`truncate ${mapping.included ? '' : 'line-through'}`} title={mapping.name}>
                          {mapping.name}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-1">Sample data</div>
                        <div className="text-sm truncate text-gray-700" title={sampleData}>
                          {sampleData}
                        </div>
                      </div>
                      <div className="w-64">
                        <Select
                          value={mapping.type}
                          onValueChange={(value) => handleColumnTypeChange(idx, value as ColumnType)}
                          disabled={!mapping.included}
                        >
                          <SelectTrigger>
                            <SelectValue>
                              <div className="flex items-center gap-2">
                                <FieldIcon size={16} className="text-gray-500" />
                                <span>{fieldConfig.label}</span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-80">
                            {Object.entries(fieldTypeConfig).map(([type, config]) => {
                              const Icon = config.icon
                              return (
                                <SelectItem key={type} value={type}>
                                  <div className="flex items-start gap-3 py-1">
                                    <Icon size={18} className="text-gray-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div>{config.label}</div>
                                      <div className="text-xs text-gray-500">{config.description}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 4: Import Results */}
          {step === 4 && importedResults && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-green-900">Import Successful!</h3>
                    <p className="text-sm text-green-700">
                      Imported {importedResults.rows.length} rows with {importedResults.mappings.length} columns
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-3">Column Mappings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {importedResults.mappings.map((mapping, idx) => {
                    const fieldConfig = fieldTypeConfig[mapping.type]
                    const FieldIcon = fieldConfig.icon
                    return (
                      <div key={idx} className="p-3 border rounded-lg bg-white flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-500 mb-1">Column {idx + 1}</div>
                          <div className="truncate" title={mapping.name}>{mapping.name}</div>
                        </div>
                        <div className={`px-3 py-1 rounded text-white text-sm flex items-center gap-2 ${getTypeColor(mapping.type)}`}>
                          <FieldIcon size={14} />
                          <span>{fieldConfig.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h4 className="mb-3">Data Preview</h4>
                <p className="text-sm text-gray-500 mb-3">First 10 rows of your imported data</p>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          {importedResults.headers.map((header, idx) => (
                            <th key={idx} className="px-4 py-3 text-left max-w-[200px]">
                              <div className="truncate text-sm" title={header}>
                                {header}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importedResults.rows.slice(0, 10).map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-t">
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="px-4 py-2 max-w-[200px]">
                                <div className="text-sm truncate" title={cell}>
                                  {cell}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {importedResults.rows.length > 10 && (
                  <p className="text-sm text-gray-500 mt-3">
                    Showing 10 of {importedResults.rows.length} rows
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          {step < 4 && (
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          )}
          {step > 1 && step < 3 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleNext}>
              Next
            </Button>
          )}
          {step === 3 && (
            <Button onClick={handleComplete}>
              <CheckCircle2 className="mr-2" size={16} />
              Complete Import
            </Button>
          )}
          {step === 4 && (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
