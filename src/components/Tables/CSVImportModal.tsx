'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, X, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import Papa from 'papaparse'

interface ParsedColumn {
  name: string
  label: string
  type: string
  sample: string
}

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: { columns: ParsedColumn[]; rows: Record<string, any>[] }) => void
}

const detectColumnType = (values: any[]): string => {
  // Filter out empty values
  const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '')
  if (nonEmpty.length === 0) return 'text'

  // Check if all values are numbers
  const allNumbers = nonEmpty.every(v => !isNaN(Number(v)))
  if (allNumbers) return 'number'

  // Check if all values look like emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const allEmails = nonEmpty.every(v => typeof v === 'string' && emailRegex.test(v))
  if (allEmails) return 'email'

  // Check if all values look like phone numbers
  const phoneRegex = /^[\d\s\-\(\)\+]+$/
  const allPhones = nonEmpty.every(v => typeof v === 'string' && phoneRegex.test(v) && v.length >= 10)
  if (allPhones) return 'phone'

  // Check if all values look like URLs
  const urlRegex = /^https?:\/\/.+/
  const allUrls = nonEmpty.every(v => typeof v === 'string' && urlRegex.test(v))
  if (allUrls) return 'url'

  // Check if all values look like dates
  const allDates = nonEmpty.every(v => {
    const date = new Date(v)
    return !isNaN(date.getTime()) && typeof v === 'string' && v.match(/\d/)
  })
  if (allDates) return 'date'

  // Check if values are boolean-like
  const boolValues = ['true', 'false', 'yes', 'no', '1', '0']
  const allBools = nonEmpty.every(v => boolValues.includes(String(v).toLowerCase()))
  if (allBools) return 'checkbox'

  return 'text'
}

export function CSVImportModal({ isOpen, onClose, onImport }: CSVImportModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [columns, setColumns] = useState<ParsedColumn[]>([])
  const [rows, setRows] = useState<Record<string, any>[]>([])
  const [previewExpanded, setPreviewExpanded] = useState(true)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (selectedFile: File) => {
    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setFile(selectedFile)
    setError(null)
    parseCSV(selectedFile)
  }

  const parseCSV = (file: File) => {
    setParsing(true)
    setError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            setError(`CSV parsing error: ${results.errors[0].message}`)
            setParsing(false)
            return
          }

          if (results.data.length === 0) {
            setError('CSV file is empty')
            setParsing(false)
            return
          }

          const data = results.data as Record<string, any>[]
          const headers = results.meta.fields || []

          if (headers.length === 0) {
            setError('No columns found in CSV')
            setParsing(false)
            return
          }

          // Analyze columns and detect types
          const analyzedColumns: ParsedColumn[] = headers.map(header => {
            const values = data.map(row => row[header]).slice(0, 100) // Sample first 100 rows
            const type = detectColumnType(values)
            const sample = values.find(v => v !== null && v !== undefined && v !== '') || ''

            return {
              name: header.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
              label: header,
              type,
              sample: String(sample).slice(0, 50)
            }
          })

          setColumns(analyzedColumns)
          setRows(data)
          setParsed(true)
          setParsing(false)
        } catch (err) {
          setError('Failed to parse CSV file')
          setParsing(false)
        }
      },
      error: (error) => {
        setError(`Failed to read CSV: ${error.message}`)
        setParsing(false)
      }
    })
  }

  const handleColumnTypeChange = (index: number, newType: string) => {
    const newColumns = [...columns]
    newColumns[index].type = newType
    setColumns(newColumns)
  }

  const handleImport = () => {
    onImport({ columns, rows })
    handleReset()
    onClose()
  }

  const handleReset = () => {
    setFile(null)
    setParsed(false)
    setError(null)
    setColumns([])
    setRows([])
    setPreviewExpanded(true)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Import from CSV</h2>
              <p className="text-sm text-gray-600">Upload a CSV file to create a table</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!parsed ? (
            /* Upload Section */
            <div className="space-y-4">
              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : error
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex flex-col items-center gap-4">
                  {parsing ? (
                    <>
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <p className="text-gray-600">Parsing CSV file...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        {file ? (
                          <FileText className="w-8 h-8 text-gray-600" />
                        ) : (
                          <Upload className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      {file ? (
                        <div>
                          <p className="text-lg font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      ) : (
                        <>
                          <p className="text-lg font-medium text-gray-900">
                            Drop your CSV file here
                          </p>
                          <p className="text-sm text-gray-500">or click to browse</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileInput}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label
                        htmlFor="csv-upload"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                      >
                        Select File
                      </label>
                    </>
                  )}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">CSV Format Guidelines</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• First row should contain column headers</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• Column types will be automatically detected</li>
                  <li>• You can adjust column types after import</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Preview Section */
            <div className="space-y-4">
              {/* Success Message */}
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">CSV parsed successfully!</p>
                  <p className="text-sm text-green-700 mt-1">
                    Found {columns.length} columns and {rows.length} rows
                  </p>
                </div>
              </div>

              {/* Column Mapping */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Column Mapping</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Column Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Sample Data
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {columns.map((column, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {column.label}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={column.type}
                              onChange={(e) => handleColumnTypeChange(index, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="email">Email</option>
                              <option value="phone">Phone</option>
                              <option value="url">URL</option>
                              <option value="date">Date</option>
                              <option value="checkbox">Checkbox</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">
                            {column.sample || '(empty)'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Preview */}
              <div>
                <button
                  onClick={() => setPreviewExpanded(!previewExpanded)}
                  className="flex items-center gap-2 font-medium text-gray-900 hover:text-gray-700 mb-3"
                >
                  {previewExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  Data Preview ({rows.length} rows)
                </button>
                
                {previewExpanded && (
                  <div className="border border-gray-200 rounded-lg overflow-auto max-h-64">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                          {columns.map((column, index) => (
                            <th
                              key={index}
                              className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap"
                            >
                              {column.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rows.slice(0, 10).map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50">
                            {columns.map((column, colIndex) => (
                              <td key={colIndex} className="px-4 py-2 whitespace-nowrap text-gray-900">
                                {row[column.label] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {parsed && (
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Import {rows.length} Rows
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
