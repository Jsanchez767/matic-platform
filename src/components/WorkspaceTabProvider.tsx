'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { TabManager, TabData } from '@/lib/tab-manager'

interface TabContextType {
  tabManager: TabManager | null
  activeTab: TabData | null
  tabs: TabData[]
}

const TabContext = createContext<TabContextType>({
  tabManager: null,
  activeTab: null,
  tabs: []
})

export const useTabContext = () => useContext(TabContext)

interface WorkspaceTabProviderProps {
  children: React.ReactNode
  workspaceId: string
}

export function WorkspaceTabProvider({ children, workspaceId }: WorkspaceTabProviderProps) {
  const [tabManager, setTabManager] = useState<TabManager | null>(null)
  const [activeTab, setActiveTab] = useState<TabData | null>(null)
  const [tabs, setTabs] = useState<TabData[]>([])

  // Initialize tab manager
  useEffect(() => {
    const manager = new TabManager(workspaceId)
    setTabManager(manager)

    // Subscribe to tab changes
    const unsubscribe = manager.subscribe(() => {
      const currentTabs = manager.getTabs()
      const currentActiveTab = manager.getActiveTab()
      
      // Remove duplicate Overview tabs if they exist
      const overviewUrl = `/workspace/${workspaceId}`
      const overviewTabs = currentTabs.filter(tab => tab.url === overviewUrl && tab.type === 'custom')
      if (overviewTabs.length > 1) {
        // Keep the first one, remove the rest
        for (let i = 1; i < overviewTabs.length; i++) {
          manager.closeTab(overviewTabs[i].id)
        }
        return // Subscription will fire again with updated tabs
      }
      
      // Auto-create Overview tab if all tabs are closed
      if (currentTabs.length === 0) {
        manager.addTab({
          title: 'Overview',
          type: 'custom',
          url: overviewUrl,
          workspaceId
        })
        return // The subscription will fire again with the new tab
      }
      
      setTabs(currentTabs)
      setActiveTab(currentActiveTab)
    })

    // Initial load
    const initialTabs = manager.getTabs()
    const initialActiveTab = manager.getActiveTab()
    
    // Create default tab if no tabs exist and no Overview tab exists
    if (initialTabs.length === 0) {
      // Check if Overview tab already exists
      const overviewUrl = `/workspace/${workspaceId}`
      const existingOverview = initialTabs.find(tab => tab.url === overviewUrl && tab.type === 'custom')
      
      if (!existingOverview) {
        manager.addTab({
          title: 'Overview',
          type: 'custom',
          url: overviewUrl,
          workspaceId
        })
      }
    }
    
    setTabs(manager.getTabs())
    setActiveTab(manager.getActiveTab())

    return () => {
      unsubscribe()
      manager.destroy()
    }
  }, [workspaceId])

  const contextValue: TabContextType = {
    tabManager,
    activeTab,
    tabs
  }

  return (
    <TabContext.Provider value={contextValue}>
      {children}
    </TabContext.Provider>
  )
}