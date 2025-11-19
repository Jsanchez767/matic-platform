'use client'

import { ClipboardList, Activity, FileText, BarChart3, Plus, Settings, Download, Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TabData } from '@/lib/tab-manager'
import { useRouter } from 'next/navigation'

interface TabActionBarProps {
  activeTab: TabData | null
  workspaceId: string
  tabs: TabData[]
  onAddTab?: (tab: Omit<TabData, 'id' | 'lastAccessed'>) => void
  onNavigate?: (direction: 'back' | 'forward') => void
}

export function TabActionBar({ activeTab, workspaceId, tabs, onAddTab, onNavigate }: TabActionBarProps) {
  const router = useRouter()

  // Find current tab index for navigation
  const currentTabIndex = activeTab ? tabs.findIndex(tab => tab.id === activeTab.id) : -1
  const canGoBack = currentTabIndex > 0
  const canGoForward = currentTabIndex >= 0 && currentTabIndex < tabs.length - 1

  const handleBack = () => {
    if (canGoBack) {
      onNavigate?.('back')
    }
  }

  const handleForward = () => {
    if (canGoForward) {
      onNavigate?.('forward')
    }
  }

  // Determine which actions to show based on the active tab
  const getActionsForTab = () => {
    // Activities Hub tab - show Attendance action
    if (activeTab?.title?.includes('Activities') || activeTab?.url?.includes('activities-hub')) {
      return [
        {
          icon: ClipboardList,
          label: 'Attendance',
          onClick: () => {
            onAddTab?.({
              title: 'Attendance',
              url: `/workspace/${workspaceId}/attendance`,
              type: 'custom',
              workspaceId,
            })
          }
        }
      ]
    }

    // Overview tab - show main modules
    if (activeTab?.id === 'overview' || activeTab?.title === 'Overview') {
      return [
        {
          icon: ClipboardList,
          label: 'Attendance',
          onClick: () => {
            onAddTab?.({
              title: 'Attendance',
              url: `/w/${workspaceId}/attendance`,
              type: 'custom',
              workspaceId,
            })
          }
        },
        {
          icon: Activity,
          label: 'Pulse',
          onClick: () => {
            onAddTab?.({
              title: 'Pulse',
              url: `/w/${workspaceId}/pulse`,
              type: 'custom',
              workspaceId,
            })
          }
        },
        {
          icon: FileText,
          label: 'Documents',
          onClick: () => {
            onAddTab?.({
              title: 'Documents',
              url: `/w/${workspaceId}/documents`,
              type: 'custom',
              workspaceId,
            })
          }
        },
        {
          icon: BarChart3,
          label: 'Reports',
          onClick: () => {
            onAddTab?.({
              title: 'Reports',
              url: `/w/${workspaceId}/reports`,
              type: 'custom',
              workspaceId,
            })
          }
        }
      ]
    }

    // Table tab - show table-specific actions
    if (activeTab?.type === 'table') {
      return [
        {
          icon: Plus,
          label: 'Add Row',
          onClick: () => console.log('Add row')
        },
        {
          icon: Download,
          label: 'Export',
          onClick: () => console.log('Export table')
        },
        {
          icon: Share2,
          label: 'Share',
          onClick: () => console.log('Share table')
        },
        {
          icon: Settings,
          label: 'Settings',
          onClick: () => console.log('Table settings')
        }
      ]
    }

    // Form tab - show form-specific actions
    if (activeTab?.type === 'form') {
      return [
        {
          icon: Share2,
          label: 'Share Form',
          onClick: () => console.log('Share form')
        },
        {
          icon: BarChart3,
          label: 'View Responses',
          onClick: () => console.log('View responses')
        },
        {
          icon: Settings,
          label: 'Settings',
          onClick: () => console.log('Form settings')
        }
      ]
    }

    // Default: no actions
    return []
  }

  const actions = getActionsForTab()


  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
      {/* Left side - Navigation arrows */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleBack}
          disabled={!canGoBack}
          className={cn(
            "p-1.5 rounded transition-colors",
            canGoBack 
              ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" 
              : "text-gray-300 cursor-not-allowed"
          )}
          title="Go back"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={handleForward}
          disabled={!canGoForward}
          className={cn(
            "p-1.5 rounded transition-colors",
            canGoForward 
              ? "text-gray-600 hover:text-gray-900 hover:bg-gray-100" 
              : "text-gray-300 cursor-not-allowed"
          )}
          title="Go forward"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right side - Action buttons */}
      <div className="flex items-center gap-2">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <button
              key={index}
              onClick={action.onClick}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              <Icon size={16} />
              <span className="font-medium">{action.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
