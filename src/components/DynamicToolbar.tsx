'use client'

import { ChevronLeft, ChevronRight, Plus, Calendar, Search, FileText, Users, BarChart3, Settings } from 'lucide-react'
import { Button } from '@/ui-components/button'
import { useRouter } from 'next/navigation'
import { useTabContext } from './WorkspaceTabProvider'
import { useMemo } from 'react'

interface DynamicToolbarProps {
  workspaceId: string
}

interface ToolAction {
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
}

export function DynamicToolbar({ workspaceId }: DynamicToolbarProps) {
  const router = useRouter()
  const { activeTab, tabs, tabManager } = useTabContext()

  // Find current tab index for navigation
  const currentTabIndex = useMemo(() => {
    if (!activeTab) return -1
    return tabs.findIndex(tab => tab.id === activeTab.id)
  }, [activeTab, tabs])

  const canGoBack = currentTabIndex > 0
  const canGoForward = currentTabIndex < tabs.length - 1

  // Navigation handlers
  const handleBack = () => {
    if (canGoBack && tabManager) {
      const previousTab = tabs[currentTabIndex - 1]
      tabManager.setActiveTab(previousTab.id)
    }
  }

  const handleForward = () => {
    if (canGoForward && tabManager) {
      const nextTab = tabs[currentTabIndex + 1]
      tabManager.setActiveTab(nextTab.id)
    }
  }

  // Get dynamic actions based on current tab/tool
  const getToolActions = (): ToolAction[] => {
    if (!activeTab) return []

    switch (activeTab.type) {
      case 'form':
        return [
          {
            label: 'New Form',
            icon: Plus,
            onClick: () => {
              if (tabManager) {
                tabManager.addTab({
                  title: 'New Form',
                  type: 'form',
                  url: `/w/${workspaceId}/forms/new`,
                  workspaceId,
                  metadata: { formId: `new-${Date.now()}` }
                })
              }
            },
            className: 'bg-blue-600 hover:bg-blue-700 text-white'
          },
          {
            label: 'Form Settings',
            icon: Settings,
            onClick: () => {
              // Handle form settings
              console.log('Open form settings')
            },
            variant: 'outline' as const
          }
        ]

      case 'calendar':
        return [
          {
            label: 'New Event',
            icon: Plus,
            onClick: () => {
              // Handle new calendar event
              console.log('Create new calendar event')
            },
            className: 'bg-green-600 hover:bg-green-700 text-white'
          },
          {
            label: 'View Settings',
            icon: Settings,
            onClick: () => {
              console.log('Open calendar settings')
            },
            variant: 'outline' as const
          }
        ]

      case 'project':
        return [
          {
            label: 'New Project',
            icon: Plus,
            onClick: () => {
              if (tabManager) {
                tabManager.addTab({
                  title: 'New Project',
                  type: 'project',
                  url: `/w/${workspaceId}/projects/new`,
                  workspaceId,
                  metadata: { projectId: `project-${Date.now()}` }
                })
              }
            },
            className: 'bg-orange-600 hover:bg-orange-700 text-white'
          },
          {
            label: 'Analytics',
            icon: BarChart3,
            onClick: () => {
              console.log('Open project analytics')
            },
            variant: 'outline' as const
          }
        ]

      case 'custom':
        // Overview/Dashboard actions
        if (activeTab.title === 'Overview') {
          return [
            {
              label: 'Quick Add',
              icon: Plus,
              onClick: () => {
                // Could open the search modal or a quick add menu
                console.log('Open quick add menu')
              },
              className: 'bg-indigo-600 hover:bg-indigo-700 text-white'
            },
            {
              label: 'Workspace Settings',
              icon: Settings,
              onClick: () => {
                console.log('Open workspace settings')
              },
              variant: 'outline' as const
            }
          ]
        }
        return []

      default:
        return []
    }
  }

  const toolActions = getToolActions()

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
      {/* Left side - Navigation */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={!canGoBack}
          className="p-2 h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleForward}
          disabled={!canGoForward}
          className="p-2 h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Contextual information (for tool-specific content like form names) */}
        <div className="ml-4 flex items-center space-x-2">
          {/* This space is reserved for tool-specific context like form names, document titles, etc. */}
        </div>
      </div>

      {/* Right side - Dynamic tool actions */}
      <div className="flex items-center space-x-2">
        {toolActions.map((action, index) => {
          const IconComponent = action.icon
          return (
            <Button
              key={index}
              variant={action.variant || 'default'}
              size="sm"
              onClick={action.onClick}
              className={action.className}
            >
              <IconComponent className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}