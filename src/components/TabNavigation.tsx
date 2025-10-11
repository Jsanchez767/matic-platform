'use client'

import { useState, useEffect } from 'react'
import { X, Plus, FileText, Calendar, Users, Search, Settings } from 'lucide-react'
import { TabManager, TabData } from '@/lib/tab-manager'
import { useTabContext } from './WorkspaceTabProvider'
import { cn } from '@/lib/utils'

interface TabNavigationProps {
  workspaceId: string
  onTabChange?: (tab: TabData | null) => void
  tabManager?: TabManager | null
}

const TAB_ICONS = {
  form: FileText,
  table: FileText,
  calendar: Calendar,
  project: Users,
  custom: Settings
}

export function TabNavigation({ workspaceId, onTabChange, tabManager: externalTabManager }: TabNavigationProps) {
  const { tabManager: contextTabManager, activeTab, tabs } = useTabContext()
  const tabManager = externalTabManager || contextTabManager
  
  // Use context values or local state as fallback
  const [localActiveTab, setLocalActiveTab] = useState<TabData | null>(null)
  const [localTabs, setLocalTabs] = useState<TabData[]>([])

  const currentActiveTab = activeTab || localActiveTab
  const currentTabs = tabs.length > 0 ? tabs : localTabs

  // Initialize Tab Manager if not provided and no context
  useEffect(() => {
    if (!externalTabManager && !contextTabManager) {
      const manager = new TabManager(workspaceId)
      // Set local tab manager - but we'll use context instead
      
      const unsubscribe = manager.subscribe(() => {
        const currentTabs = manager.getTabs()
        const currentActiveTab = manager.getActiveTab()
        
        setLocalTabs(currentTabs)
        setLocalActiveTab(currentActiveTab)
        onTabChange?.(currentActiveTab)
      })

      // Initial load
      setLocalTabs(manager.getTabs())
      setLocalActiveTab(manager.getActiveTab())

      return () => {
        unsubscribe()
        manager.destroy()
      }
    }
  }, [workspaceId, externalTabManager, contextTabManager])

  // Subscribe to tab changes when using external or context tab manager
  useEffect(() => {
    if (!tabManager) return

    const unsubscribe = tabManager.subscribe(() => {
      const currentTabs = tabManager.getTabs()
      const currentActiveTab = tabManager.getActiveTab()
      
      if (!contextTabManager) {
        setLocalTabs(currentTabs)
        setLocalActiveTab(currentActiveTab)
      }
      onTabChange?.(currentActiveTab)
    })

    // Initial load
    if (!contextTabManager) {
      setLocalTabs(tabManager.getTabs())
      setLocalActiveTab(tabManager.getActiveTab())
      onTabChange?.(tabManager.getActiveTab())
    }

    return unsubscribe
  }, [tabManager, onTabChange, contextTabManager])

  const handleTabClick = (tabId: string) => {
    tabManager?.setActiveTab(tabId)
  }

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation()
    tabManager?.closeTab(tabId)
  }

  const handleNewTab = () => {
    // Open a new document tab and activate it
    tabManager?.addTab({
      title: 'New Document',
      type: 'custom',
      url: `/w/${workspaceId}/docs/new`,
      workspaceId,
      metadata: {}
    })
  }

  if (!tabManager) {
    return (
      <div className="flex items-center bg-white border-b border-gray-200 px-4 py-2">
        <div className="text-sm text-gray-500">Loading tabs...</div>
      </div>
    )
  }

  return (
    <div className="flex items-end px-4 pt-2 pb-0 gap-1">
      {/* Tab List */}
      <div className="flex items-end overflow-x-auto scrollbar-hide gap-1">
        {currentTabs.map((tab) => {
          const IconComponent = TAB_ICONS[tab.type] || FileText
          const isActive = currentActiveTab?.id === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "flex items-center gap-2 px-3 cursor-pointer min-w-0 max-w-48 group relative text-sm",
                isActive ? "tab-selected" : "tab-unselected"
              )}
            >
              <IconComponent size={14} className="flex-shrink-0 opacity-70" />
              <span className="truncate">
                {tab.title}
              </span>
              <button
                onClick={(e) => handleTabClose(e, tab.id)}
                className={cn(
                  "opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded flex-shrink-0 transition-opacity ml-auto",
                  isActive && "hover:bg-gray-200"
                )}
              >
                <X size={14} />
              </button>
            </button>
          )
        })}
        
        {/* New Tab Button */}
        <button
          onClick={handleNewTab}
          className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 hover:bg-blue-100 bg-transparent transition-colors duration-150 rounded-lg mb-1"
          title="New tab"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  )
}

// Quick actions for opening different types of tabs
function TabQuickActions({ tabManager, workspaceId }: { 
  tabManager: TabManager | null
  workspaceId: string 
}) {
  const quickActions = [
    {
      label: 'New Document',
      type: 'custom' as const,
      icon: FileText,
      url: `/w/${workspaceId}/docs/new`
    },
    {
      label: 'New Form',
      type: 'form' as const,
      icon: FileText,
      url: `/w/${workspaceId}/forms/new`
    },
    {
      label: 'Calendar',
      type: 'calendar' as const,
      icon: Calendar,
      url: `/w/${workspaceId}/calendar`
    }
  ]

  const handleQuickAction = (action: typeof quickActions[0]) => {
    tabManager?.addTab({
      title: action.label,
      type: action.type,
      url: action.url,
      workspaceId,
      metadata: {}
    })
  }

  return (
    <div className="flex items-center gap-1">
      {quickActions.map((action) => (
        <button
          key={action.type}
          onClick={() => handleQuickAction(action)}
          className="p-2 hover:bg-gray-100 rounded text-gray-500 transition-colors"
          title={action.label}
        >
          <action.icon size={16} />
        </button>
      ))}
    </div>
  )
}

// Individual Tab Component for reusability
export function TabItem({ 
  tab,
  isActive,
  onActivate, 
  onClose 
}: { 
  tab: TabData
  isActive: boolean
  onActivate: () => void
  onClose: () => void
}) {
  const IconComponent = TAB_ICONS[tab.type] || FileText

  return (
    <div
      onClick={onActivate}
      className={cn(
        "flex items-center gap-2 px-3 py-2 border-r border-gray-200 cursor-pointer min-w-0 max-w-48 group relative",
        isActive 
          ? "bg-blue-50 text-blue-700 border-b-2 border-b-blue-600" 
          : "hover:bg-gray-50 text-gray-600"
      )}
    >
      <IconComponent size={14} className="flex-shrink-0" />
      <span className="truncate text-sm font-medium">
        {tab.title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className={cn(
          "opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded flex-shrink-0 transition-opacity",
          isActive && "opacity-100"
        )}
      >
        <X size={12} />
      </button>
    </div>
  )
}