'use client'

import { ClipboardList, Activity, FileText, BarChart3, Plus, Settings, Download, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TabData } from '@/lib/tab-manager'
import { useRouter } from 'next/navigation'

interface TabActionBarProps {
  activeTab: TabData | null
  workspaceId: string
  onAddTab?: (tab: Omit<TabData, 'id' | 'lastAccessed'>) => void
}

export function TabActionBar({ activeTab, workspaceId, onAddTab }: TabActionBarProps) {
  const router = useRouter()

  // Determine which actions to show based on the active tab
  const getActionsForTab = () => {
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

  if (actions.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
      {actions.map((action, index) => {
        const Icon = action.icon
        return (
          <button
            key={index}
            onClick={action.onClick}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200"
          >
            <Icon size={16} />
            <span className="font-medium">{action.label}</span>
          </button>
        )
      })}
    </div>
  )
}
