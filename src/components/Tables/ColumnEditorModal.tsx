'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, GripVertical, Type, Hash, Mail, Phone, Calendar, CheckSquare, Link as LinkIcon, List, Image, Link2 } from 'lucide-react'

interface Column {
  id?: string
  name: string
  label: string
  column_type: string
  description?: string
  width?: number
  is_visible?: boolean
  position?: number
  settings?: Record<string, any>
  linked_table_id?: string
}

interface ColumnEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (column: Column) => void
  column?: Column | null
  mode: 'create' | 'edit'
  workspaceId: string
  currentTableId: string
}

const COLUMN_TYPES = [
  { value: 'text', label: 'Single line text', icon: Type, description: 'Plain text up to 100 characters' },
  { value: 'textarea', label: 'Long text', icon: Type, description: 'Multi-line text' },
  { value: 'number', label: 'Number', icon: Hash, description: 'Integer or decimal numbers' },
  { value: 'email', label: 'Email', icon: Mail, description: 'Email address with validation' },
  { value: 'phone', label: 'Phone', icon: Phone, description: 'Phone number' },
  { value: 'url', label: 'URL', icon: LinkIcon, description: 'Website link' },
  { value: 'date', label: 'Date', icon: Calendar, description: 'Date picker' },
  { value: 'datetime', label: 'Date & Time', icon: Calendar, description: 'Date and time picker' },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'True/false value' },
  { value: 'select', label: 'Single select', icon: List, description: 'Pick one option from a list' },
  { value: 'multiselect', label: 'Multiple select', icon: List, description: 'Pick multiple options' },
  { value: 'link', label: 'Link to another table', icon: Link2, description: 'Reference records from another table' },
  { value: 'attachment', label: 'Attachment', icon: Image, description: 'File uploads' },
  { value: 'rating', label: 'Rating', icon: Type, description: 'Star rating (1-5)' },
  { value: 'currency', label: 'Currency', icon: Hash, description: 'Monetary values' },
  { value: 'percent', label: 'Percent', icon: Hash, description: 'Percentage values' },
]

export function ColumnEditorModal({ isOpen, onClose, onSubmit, column, mode, workspaceId, currentTableId }: ColumnEditorModalProps) {
  const [label, setLabel] = useState(column?.label || '')
  const [description, setDescription] = useState(column?.description || '')
  const [columnType, setColumnType] = useState(column?.column_type || 'text')
  const [selectedType, setSelectedType] = useState<typeof COLUMN_TYPES[0] | null>(
    COLUMN_TYPES.find(t => t.value === (column?.column_type || 'text')) || COLUMN_TYPES[0]
  )
  
  // Field-specific settings
  const [selectOptions, setSelectOptions] = useState<string[]>(
    column?.settings?.options || ['Option 1']
  )
  const [linkedTableId, setLinkedTableId] = useState<string>(column?.linked_table_id || '')
  const [availableTables, setAvailableTables] = useState<Array<{ id: string; name: string }>>([])
  const [loadingTables, setLoadingTables] = useState(false)

  // Load available tables when link type is selected
  useEffect(() => {
    if (columnType === 'link' && workspaceId) {
      loadAvailableTables()
    }
  }, [columnType, workspaceId])

  const loadAvailableTables = async () => {
    try {
      setLoadingTables(true)
      const { tablesAPI } = await import('@/lib/api/data-tables-client')
      const tables = await tablesAPI.list(workspaceId)
      // Filter out the current table
      setAvailableTables(tables.filter(t => t.id !== currentTableId))
    } catch (error) {
      console.error('Error loading tables:', error)
    } finally {
      setLoadingTables(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const name = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    
    const columnData: Column = {
      ...column,
      name,
      label,
      description,
      column_type: columnType,
      settings: {}
    }

    // Add type-specific settings
    if (columnType === 'select' || columnType === 'multiselect') {
      columnData.settings = {
        options: selectOptions.filter(o => o.trim())
      }
    }

    // Add linked table for link type
    if (columnType === 'link') {
      if (!linkedTableId) {
        alert('Please select a table to link to')
        return
      }
      columnData.linked_table_id = linkedTableId
    }

    onSubmit(columnData)
    onClose()
  }

  const handleAddOption = () => {
    setSelectOptions([...selectOptions, `Option ${selectOptions.length + 1}`])
  }

  const handleRemoveOption = (index: number) => {
    setSelectOptions(selectOptions.filter((_, i) => i !== index))
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...selectOptions]
    newOptions[index] = value
    setSelectOptions(newOptions)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add Field' : 'Edit Field'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Field Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field Name *
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Full Name, Email Address"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Help text for this field"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Field Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Field Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {COLUMN_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setColumnType(type.value)
                        setSelectedType(type)
                      }}
                      className={`flex items-start gap-3 p-3 border rounded-lg transition-all text-left ${
                        columnType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">
                          {type.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {type.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Type-specific settings */}
            {(columnType === 'select' || columnType === 'multiselect') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Options
                </label>
                <div className="border border-gray-300 rounded-lg p-3 min-h-[100px]">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectOptions.map((option, index) => (
                      <div
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                      >
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder="Option"
                          className="bg-transparent border-none outline-none text-sm font-medium w-auto min-w-[60px] focus:ring-0 p-0"
                          style={{ width: `${Math.max(60, option.length * 8)}px` }}
                        />
                        {selectOptions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(index)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Link to table settings */}
            {columnType === 'link' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select table to link
                </label>
                {loadingTables ? (
                  <div className="text-sm text-gray-500 py-2">Loading tables...</div>
                ) : (
                  <select
                    value={linkedTableId}
                    onChange={(e) => setLinkedTableId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a table...</option>
                    {availableTables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name}
                      </option>
                    ))}
                  </select>
                )}
                {linkedTableId && (
                  <p className="mt-2 text-xs text-gray-500">
                    This field will allow you to link records from the selected table
                  </p>
                )}
              </div>
            )}

            {columnType === 'number' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Value
                  </label>
                  <input
                    type="number"
                    placeholder="No minimum"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Value
                  </label>
                  <input
                    type="number"
                    placeholder="No maximum"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {columnType === 'currency' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!label}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {mode === 'create' ? 'Add Field' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
