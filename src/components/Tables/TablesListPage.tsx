'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Table2, MoreVertical, Edit, Trash2, Copy, Archive, Upload } from 'lucide-react'
import { useTabContext } from '../WorkspaceTabProvider'
import { CreateTableModal, TableFormData } from './CreateTableModal'
import { CSVImportModal } from './CSVImportModal'
import { tablesSupabase } from '@/lib/api/tables-supabase'
import { supabase, getSessionToken } from '@/lib/supabase'
import { toast } from 'sonner'
import type { DataTable } from '@/types/data-tables'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!
if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not configured. Set it in .env.local')
}

interface TablesListPageProps {
  workspaceId: string
}

export function TablesListPage({ workspaceId }: TablesListPageProps) {
  const [tables, setTables] = useState<DataTable[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const { tabManager } = useTabContext()

  useEffect(() => {
    loadTables()
  }, [workspaceId])

  const loadTables = async () => {
    try {
      setLoading(true)
      const data = await tablesSupabase.getTablesByWorkspace(workspaceId)
      setTables(data)
    } catch (error) {
      console.error('Error loading tables:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewTable = () => {
    setIsCreateModalOpen(true)
  }

  const handleImportCSV = () => {
    setIsImportModalOpen(true)
  }

    const handleCSVImport = async (data: { headers: string[]; rows: string[][]; mappings: { name: string; type: string; included: boolean }[] }) => {
    let createdTableId: string | null = null
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to import data')
        return
      }

      // Create table name
      const tableName = `Imported Table ${new Date().toLocaleDateString()}`
      
      // Map column types from CSV import to table column types
      const typeMapping: Record<string, string> = {
        'single_line_text': 'text',
        'long_text': 'text',
        'number': 'number',
        'email': 'email',
        'phone': 'phone',
        'url': 'url',
        'date': 'date',
        'date_time': 'datetime',
        'checkbox': 'checkbox',
        'single_select': 'select',
        'multiple_select': 'multiselect',
        'currency': 'currency',
        'percent': 'number',
        'rating': 'rating',
        'attachment': 'attachment',
        'link_to_table': 'lookup'
      }

      // Map CSV columns to table columns
      const tableColumns = data.mappings.map((mapping, index) => ({
        name: mapping.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        label: mapping.name,
        column_type: (typeMapping[mapping.type] || 'text') as any,
        position: index,
        is_visible: true,
        is_primary: false,
        width: 150,
        settings: {}
      }))

      // Create the table via Supabase
      toast.loading('Creating table...')
      const newTable = await tablesSupabase.createTable({
        workspace_id: workspaceId,
        name: tableName,
        slug: tableName.toLowerCase().replace(/\s+/g, '-'),
        columns: tableColumns,
        created_by: user.id
      })

      console.log('Table created:', newTable)
      createdTableId = newTable.id
      toast.dismiss()
      toast.success(`Table "${tableName}" created with ${tableColumns.length} columns`)

      // Transform CSV rows to match table structure
      const transformedRows = data.rows.map((row, index) => {
        const rowData: Record<string, any> = {}
        data.headers.forEach((header, headerIndex) => {
          const mapping = data.mappings[headerIndex]
          const columnName = mapping.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
          rowData[columnName] = row[headerIndex] || null
        })
        return {
          data: rowData,
          position: index,
          created_by: user.id
        }
      })

      // Bulk insert rows via FastAPI
      if (transformedRows.length > 0) {
        toast.loading(`Importing ${transformedRows.length} rows...`)
        const token = await getSessionToken()
        console.log('Attempting to insert rows:', {
          tableId: newTable.id,
          rowCount: transformedRows.length,
          sampleRow: transformedRows[0]
        })

        const response = await fetch(`${API_BASE_URL}/tables/${newTable.id}/rows/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            rows: transformedRows.map(r => r.data),
            created_by: user.id
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Failed to import rows:', response.status, errorData)
          toast.dismiss()
          toast.error(`Table created but rows failed to import: ${errorData.detail || response.statusText}`)
          // Don't throw - table was created successfully
        } else {
          const importedRows = await response.json()
          console.log('Rows imported successfully:', importedRows.length, 'rows')
          toast.dismiss()
          toast.success(`Successfully imported ${importedRows.length} rows!`)
        }
      }

      // Reload tables list to get updated row counts
      await loadTables()

      // Close modal
      setIsImportModalOpen(false)

      // Open the new table in a tab
      if (createdTableId) {
        tabManager?.addTab({
          title: newTable.name,
          type: 'table',
          url: `/w/${workspaceId}/tables/${createdTableId}`,
          workspaceId,
          metadata: { tableId: createdTableId }
        })
      }
    } catch (error) {
      console.error('Error importing CSV:', error)
      toast.dismiss()
      toast.error(`Failed to import CSV: ${error}`)
      
      // If table was created, still offer to open it
      if (createdTableId) {
        toast.info('Table was created but import had issues. Opening table...')
        await loadTables()
        tabManager?.addTab({
          title: 'Imported Table',
          type: 'table',
          url: `/w/${workspaceId}/tables/${createdTableId}`,
          workspaceId,
          metadata: { tableId: createdTableId }
        })
      }
    }
  }

  const handleCreateTable = async (data: TableFormData) => {
    try {
      console.log('Creating table with data:', data)
      
      const newTable = await tablesSupabase.createTable(data as any)
      console.log('Table created:', newTable)
      
      // Reload tables list
      await loadTables()
      
      // Close modal
      setIsCreateModalOpen(false)
      
      // Open the new table in a tab
      tabManager?.addTab({
        title: newTable.name,
        type: 'table',
        url: `/w/${workspaceId}/tables/${newTable.id}`,
        workspaceId,
        metadata: { tableId: newTable.id }
      })
    } catch (error) {
      console.error('Error creating table:', error)
      const message = error instanceof Error ? error.message : 'Failed to create table. Please try again.'
      alert(message)
    }
  }

  const handleOpenTable = (table: DataTable) => {
    tabManager?.addTab({
      title: table.name,
      type: 'table',
      url: `/w/${workspaceId}/tables/${table.id}`,
      workspaceId,
      metadata: { tableId: table.id }
    })
  }

  const handleDuplicateTable = async (table: DataTable) => {
    try {
      // TODO: Add duplicate endpoint to API client
      console.log('Duplicate functionality not yet implemented')
      alert('Duplicate functionality coming soon!')
    } catch (error) {
      console.error('Error duplicating table:', error)
    }
    setActiveMenu(null)
  }

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      return
    }
    
    try {
      await tablesSupabase.deleteTable(tableId)
      await loadTables()
    } catch (error) {
      console.error('Error deleting table:', error)
    }
    setActiveMenu(null)
  }

  const filteredTables = tables.filter(table =>
    table.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    table.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tables...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tables</h1>
            <p className="text-sm text-gray-600 mt-1">
              {tables.length} {tables.length === 1 ? 'table' : 'tables'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleImportCSV}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={handleNewTable}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Table</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tables..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {filteredTables.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Table2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? 'No tables found' : 'No tables yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating your first table to organize and manage your data'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleNewTable}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Table
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTables.map((table) => (
              <div
                key={table.id}
                className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div
                  className="p-4"
                  onClick={() => handleOpenTable(table)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Table2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenu(activeMenu === table.id ? null : table.id)
                        }}
                        className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                      
                      {activeMenu === table.id && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenTable(table)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Open
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDuplicateTable(table)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Duplicate
                          </button>
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTable(table.id)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-1 truncate">
                    {table.name}
                  </h3>
                  
                  {table.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {table.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{table.row_count || 0} rows</span>
                    <span>{table.columns?.length || 0} columns</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Table Modal */}
      <CreateTableModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTable}
        workspaceId={workspaceId}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onComplete={handleCSVImport}
      />
    </div>
  )
}
