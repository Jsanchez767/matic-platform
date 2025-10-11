"use client"

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { Dashboard, TabState } from '../types'

interface TabContextType {
  state: TabState;
  addTab: (dashboard: Dashboard) => void;
  removeTab: (dashboardId: string) => void;
  switchTab: (dashboardId: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  updateTabName: (dashboardId: string, name: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined)

type TabAction = 
  | { type: 'ADD_TAB'; payload: Dashboard }
  | { type: 'REMOVE_TAB'; payload: string }
  | { type: 'SWITCH_TAB'; payload: string }
  | { type: 'REORDER_TABS'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'UPDATE_TAB_NAME'; payload: { dashboardId: string; name: string } }
  | { type: 'LOAD_STATE'; payload: TabState }

const tabReducer = (state: TabState, action: TabAction): TabState => {
  switch (action.type) {
    case 'ADD_TAB': {
      // Don't add if already exists
      if (state.tabs.find(tab => tab.id === action.payload.id)) {
        return { ...state, activeTabId: action.payload.id }
      }
      
      // Limit to 10 tabs
      const newTabs = state.tabs.length >= 10 
        ? [...state.tabs.slice(1), action.payload]
        : [...state.tabs, action.payload]
      
      return {
        tabs: newTabs,
        activeTabId: action.payload.id,
        tabOrder: newTabs.map(tab => tab.id)
      }
    }
    
    case 'REMOVE_TAB': {
      const newTabs = state.tabs.filter(tab => tab.id !== action.payload)
      let newActiveId = state.activeTabId
      
      // If removing active tab, switch to adjacent tab
      if (state.activeTabId === action.payload) {
        const currentIndex = state.tabs.findIndex(tab => tab.id === action.payload)
        if (newTabs.length > 0) {
          const newIndex = Math.min(currentIndex, newTabs.length - 1)
          newActiveId = newTabs[newIndex]?.id || ''
        } else {
          newActiveId = ''
        }
      }
      
      return {
        tabs: newTabs,
        activeTabId: newActiveId,
        tabOrder: newTabs.map(tab => tab.id)
      }
    }
    
    case 'SWITCH_TAB':
      return { ...state, activeTabId: action.payload }
    
    case 'REORDER_TABS': {
      const { fromIndex, toIndex } = action.payload
      const newTabs = [...state.tabs]
      const [movedTab] = newTabs.splice(fromIndex, 1)
      newTabs.splice(toIndex, 0, movedTab)
      
      return {
        ...state,
        tabs: newTabs,
        tabOrder: newTabs.map(tab => tab.id)
      }
    }
    
    case 'UPDATE_TAB_NAME': {
      const newTabs = state.tabs.map(tab =>
        tab.id === action.payload.dashboardId
          ? { ...tab, name: action.payload.name }
          : tab
      )
      
      return { ...state, tabs: newTabs }
    }
    
    case 'LOAD_STATE':
      return action.payload
    
    default:
      return state
  }
}

const initialState: TabState = {
  tabs: [],
  activeTabId: '',
  tabOrder: []
}

export const TabManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tabReducer, initialState)

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('matic-tab-state')
    if (saved) {
      try {
        const parsedState = JSON.parse(saved)
        dispatch({ type: 'LOAD_STATE', payload: parsedState })
      } catch (error) {
        console.warn('Failed to load tab state from localStorage:', error)
      }
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('matic-tab-state', JSON.stringify(state))
  }, [state])

  const addTab = (dashboard: Dashboard) => {
    dispatch({ type: 'ADD_TAB', payload: dashboard })
  }

  const removeTab = (dashboardId: string) => {
    dispatch({ type: 'REMOVE_TAB', payload: dashboardId })
  }

  const switchTab = (dashboardId: string) => {
    dispatch({ type: 'SWITCH_TAB', payload: dashboardId })
  }

  const reorderTabs = (fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER_TABS', payload: { fromIndex, toIndex } })
  }

  const updateTabName = (dashboardId: string, name: string) => {
    dispatch({ type: 'UPDATE_TAB_NAME', payload: { dashboardId, name } })
  }

  return (
    <TabContext.Provider value={{
      state,
      addTab,
      removeTab,
      switchTab,
      reorderTabs,
      updateTabName
    }}>
      {children}
    </TabContext.Provider>
  )
}

export const useTabManager = () => {
  const context = useContext(TabContext)
  if (!context) {
    throw new Error('useTabManager must be used within a TabManager')
  }
  return context
}