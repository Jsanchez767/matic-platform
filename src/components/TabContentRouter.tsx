'use client'

import { TabData } from '@/lib/tab-manager'
import { useTabContext } from './WorkspaceTabProvider'
import { FileText, Calendar, Users, Search, Plus, BarChart3, Folder, Clock, Layout } from 'lucide-react'
import { TablesListPage } from './Tables/TablesListPage'
import { TableGridView } from './Tables/TableGridView'
import { FormsListPage as FormsListComponent } from './Forms/FormsListPage'
import { RequestHubListPage } from './RequestHub/RequestHubListPage'

interface TabContentRouterProps {
  tab?: TabData | null
  workspaceId: string
}

export function TabContentRouter({ tab: propTab, workspaceId }: TabContentRouterProps) {
  const { activeTab } = useTabContext()
  
  // Use prop tab or context active tab
  const tab = propTab !== undefined ? propTab : activeTab

  if (!tab) {
    return <WorkspaceDashboard workspaceId={workspaceId} />
  }

  // Route tab content based on type and URL
  switch (tab.type) {
    case 'form':
      // Check if it's the forms list page or a specific form
      if (tab.url?.includes('/forms') && !tab.url?.includes('/forms/')) {
        return <FormsListComponent workspaceId={workspaceId} />
      }
      return (
        <div className="h-full p-6 bg-gray-50">
          <div className="h-full bg-white rounded-lg border border-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium mb-2">Form Builder</p>
              <p className="text-sm">Form builder coming soon</p>
            </div>
          </div>
        </div>
      )
      
    case 'table':
      // Check if it's the tables list page or a specific table
      if (tab.url?.includes('/tables') && !tab.url?.includes('/tables/')) {
        return <TablesListPage workspaceId={workspaceId} />
      }
      // Individual table view - extract tableId from URL or metadata
      const tableId = tab.metadata?.tableId || tab.url?.split('/tables/')[1]
      if (tableId) {
        return <TableGridView tableId={tableId} workspaceId={workspaceId} />
      }
      // Fallback
      return (
        <div className="h-full p-6 bg-gray-50">
          <div className="h-full bg-white rounded-lg border border-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium mb-2">Table Not Found</p>
              <p className="text-sm">Unable to load table data</p>
            </div>
          </div>
        </div>
      )
      
    case 'calendar':
      return (
        <div className="h-full p-6">
          <div className="h-full bg-white rounded-lg border border-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Calendar view coming soon</p>
            </div>
          </div>
        </div>
      )
      
    case 'project':
      return (
        <div className="h-full p-6">
          <div className="h-full bg-white rounded-lg border border-gray-200 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Project view coming soon</p>
            </div>
          </div>
        </div>
      )
      
    case 'custom':
      // Handle Request Hub list page
      if (tab.url?.includes('/request-hubs') && !tab.url?.includes('/request-hubs/')) {
        return <RequestHubListPage workspaceId={workspaceId} />
      }
      
      // Handle Overview and other custom workspace content
      if (tab.url === `/w/${workspaceId}` || tab.title === 'Overview') {
        return (
          <div className="flex-1 overflow-hidden">
            <WorkspaceDashboard 
              workspaceId={workspaceId}
            />
          </div>
        )
      }
      
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {tab.title}
            </h3>
            <p className="text-gray-600">
              Content type: {tab.type}
            </p>
          </div>
        </div>
      )
      
    default:
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {tab.title}
            </h3>
            <p className="text-gray-600">
              Content type: {tab.type}
            </p>
          </div>
        </div>
      )
  }
}
// Empty state when no tab is active
function EmptyTabState({ workspaceId }: { workspaceId: string }) {
  const quickActions = [
    {
      title: 'Create Document',
      description: 'Start a new collaborative document',
      icon: FileText,
      action: 'new-document'
    },
    {
      title: 'Create Form',
      description: 'Build a new form',
      icon: FileText,
      action: 'new-form'
    },
    {
      title: 'Open Calendar',
      description: 'View your schedule',
      icon: Calendar,
      action: 'calendar'
    },
    {
      title: 'Search Content',
      description: 'Find documents and data',
      icon: Search,
      action: 'search'
    }
  ]

  const handleQuickAction = (action: string) => {
    // These would trigger tab creation via the parent component
    console.log('Quick action:', action)
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome to your workspace
          </h1>
          <p className="text-gray-600">
            Open a tab or create new content to get started
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.action}
              onClick={() => handleQuickAction(action.action)}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all text-left group"
            >
              <div className="flex items-center gap-3 mb-2">
                <action.icon size={20} className="text-purple-600" />
                <span className="font-medium text-gray-900 group-hover:text-blue-600">
                  {action.title}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {action.description}
              </p>
            </button>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">
            Keyboard shortcuts:
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <span><kbd className="bg-white border border-gray-300 px-2 py-1 rounded text-xs">⌘K</kbd> Search</span>
            <span><kbd className="bg-white border border-gray-300 px-2 py-1 rounded text-xs">⌘T</kbd> New tab</span>
            <span><kbd className="bg-white border border-gray-300 px-2 py-1 rounded text-xs">⌘W</kbd> Close tab</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Calendar view placeholder
function CalendarView({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Calendar</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Calendar Coming Soon
          </h3>
          <p className="text-gray-600">
            Calendar functionality will be available in a future update.
          </p>
        </div>
      </div>
    </div>
  )
}

// Project view placeholder
function ProjectView({ projectId, workspaceId }: { 
  projectId: string
  workspaceId: string 
}) {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Project</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Users size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Project Management Coming Soon
          </h3>
          <p className="text-gray-600">
            Project functionality will be available in a future update.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Project ID: {projectId}
          </p>
        </div>
      </div>
    </div>
  )
}

// Search results view
function SearchResultsView({ 
  query, 
  results, 
  workspaceId 
}: { 
  query: string
  results: any[]
  workspaceId: string 
}) {
  return (
    <div className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Search Results
          </h1>
          <p className="text-gray-600">
            Results for &quot;{query}&quot; ({results.length} found)
          </p>
        </div>

        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={result.id || index}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-gray-500 mt-1">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {result.title}
                    </h3>
                    {result.snippet && (
                      <p className="text-sm text-gray-600 mb-2">
                        {result.snippet}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="uppercase">{result.type}</span>
                      {result.score && (
                        <>
                          <span>•</span>
                          <span>{Math.round((1 - result.score) * 100)}% match</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <Search size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search query or explore other content.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Workspace Dashboard Component
function WorkspaceDashboard({ workspaceId }: { workspaceId: string }) {
  const { tabManager } = useTabContext()

  const handleQuickAction = (type: 'forms' | 'tables' | 'calendar' | 'document' | 'request-hubs') => {
    if (!tabManager) return
    
    switch (type) {
      case 'forms':
        tabManager.addTab({
          title: 'Forms',
          type: 'form',
          url: `/workspace/${workspaceId}/forms`,
          workspaceId,
          metadata: {}
        })
        break
      case 'tables':
        tabManager.addTab({
          title: 'Tables',
          type: 'table',
          url: `/workspace/${workspaceId}/tables`,
          workspaceId,
          metadata: {}
        })
        break
      case 'request-hubs':
        tabManager.addTab({
          title: 'Request Hubs',
          type: 'custom',
          url: `/workspace/${workspaceId}/request-hubs`,
          workspaceId,
          metadata: {}
        })
        break
      case 'calendar':
        tabManager.addTab({
          title: 'Calendar',
          type: 'calendar',
          url: `/workspace/${workspaceId}/calendar`,
          workspaceId,
          metadata: {}
        })
        break
      case 'document':
        tabManager.addTab({
          title: 'New Document',
          type: 'custom',
          url: `/workspace/${workspaceId}/docs/new`,
          workspaceId,
          metadata: {}
        })
        break
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Workspace Overview
        </h1>
        <p className="text-gray-600">
          Welcome to your collaborative workspace. Get started by creating content or exploring existing resources.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div onClick={() => handleQuickAction('document')}>
          <QuickActionCard
            title="New Document"
            description="Create a collaborative document"
            icon={FileText}
            color="blue"
          />
        </div>
        <div onClick={() => handleQuickAction('forms')}>
          <QuickActionCard
            title="New Form"
            description="Build interactive forms"
            icon={Users}
            color="green"
          />
        </div>
        <div onClick={() => handleQuickAction('request-hubs')}>
          <QuickActionCard
            title="Request Hubs"
            description="Manage request workflows"
            icon={Layout}
            color="purple"
          />
        </div>
        <div onClick={() => handleQuickAction('tables')}>
          <QuickActionCard
            title="Tables"
            description="Manage your data tables"
            icon={Folder}
            color="orange"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText size={16} className="text-blue-500" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Welcome Document</p>
                <p className="text-sm text-gray-600">Created just now</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Folder size={20} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Quick Access</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <Users size={16} className="text-green-500" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Team Members</p>
                <p className="text-sm text-gray-600">Manage workspace access</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
              <FileText size={16} className="text-blue-500" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">All Documents</p>
                <p className="text-sm text-gray-600">Browse workspace content</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Quick Action Card Component
function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  color 
}: { 
  title: string
  description: string
  icon: any
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}>
        <Icon size={24} />
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
