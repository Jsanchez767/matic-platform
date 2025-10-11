"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User, ChevronDown, Settings, LogOut, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { CommandPalette } from './CommandPalette/CommandPalette'
import { HybridSearchWithTabs } from './HybridSearchWithTabs'
import { useWorkspaceDiscovery } from '@/hooks/useWorkspaceDiscovery'
import { useTabContext } from './WorkspaceTabProvider'

interface NavigationLayoutProps {
  children: React.ReactNode
  workspaceSlug?: string
}

export const NavigationLayout: React.FC<NavigationLayoutProps> = ({ children, workspaceSlug }) => {
  const router = useRouter()
  const pathname = usePathname()
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  
  // Try to get tab context (might be null if not in workspace)
  let tabContext = null
  try {
    tabContext = useTabContext()
  } catch (error) {
    // Context not available - that's fine for non-workspace pages
  }
  
  // Use the new workspace discovery hook
  const { 
    workspaces, 
    currentWorkspace, 
    user, 
    loading, 
    switchToWorkspace, 
    setCurrentWorkspaceBySlug 
  } = useWorkspaceDiscovery()

  useEffect(() => {
    if (workspaceSlug && workspaces.length > 0) {
      setCurrentWorkspaceBySlug(workspaceSlug)
    }
  }, [workspaceSlug, workspaces])

  const fetchWorkspaces = async () => {
    // This function is now handled by the useWorkspaceDiscovery hook
    // Keep for compatibility but it's not used anymore
  }

  const handleWorkspaceSwitch = (workspace: any) => {
    switchToWorkspace(workspace.slug)
    setShowWorkspaceDropdown(false)
  }

  const handleCreateWorkspace = () => {
    router.push('/create-workspace')
    setShowWorkspaceDropdown(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleOpenCommandPalette = () => {
    setShowCommandPalette(true)
  }

  const handleCloseCommandPalette = () => {
    setShowCommandPalette(false)
  }

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const getCurrentWorkspaceName = () => {
    if (currentWorkspace) {
      return currentWorkspace.name
    }
    // Only show "Your Workspaces" if we have workspaces but none selected
    if (workspaces.length > 0) {
      return workspaces[0].name // This shouldn't happen with our new logic, but good fallback
    }
    return 'Your Workspaces'
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 flex-shrink-0">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            
            {/* Left side - Workspace Switcher */}
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {getCurrentWorkspaceName().charAt(0)}
                    </span>
                  </div>
                  <span className="truncate max-w-48">{getCurrentWorkspaceName()}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Workspace Dropdown */}
                {showWorkspaceDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      {/* Current workspace section */}
                      {currentWorkspace && (
                        <div className="mb-2">
                          <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
                            Current Workspace
                          </div>
                          <div className="flex items-center gap-3 px-2 py-2 bg-blue-50 rounded">
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {currentWorkspace.name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-gray-900">{currentWorkspace.name}</div>
                              <div className="text-xs text-gray-500 capitalize">{currentWorkspace.plan}</div>
                            </div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          </div>
                        </div>
                      )}
                      
                      {/* Other workspaces section */}
                      {workspaces.filter(w => w.id !== currentWorkspace?.id).length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1 border-t border-gray-100 pt-2">
                            Switch Workspace
                          </div>
                          {workspaces
                            .filter(workspace => workspace.id !== currentWorkspace?.id)
                            .map((workspace) => (
                            <button
                              key={workspace.id}
                              onClick={() => handleWorkspaceSwitch(workspace)}
                              className="w-full flex items-center gap-3 px-2 py-2 text-sm hover:bg-gray-50 rounded"
                            >
                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {workspace.name.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1 text-left">
                                <div className="font-medium text-gray-900">{workspace.name}</div>
                                <div className="text-xs text-gray-500 capitalize">{workspace.plan}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button
                          onClick={handleCreateWorkspace}
                          className="w-full flex items-center gap-3 px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                        >
                          <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                            <span className="text-lg text-gray-400">+</span>
                          </div>
                          <span>Create workspace</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Center - Enhanced Search */}
            <div className="flex-1 flex justify-center max-w-lg mx-4">
              {currentWorkspace && (
                <HybridSearchWithTabs 
                  workspaceId={currentWorkspace.id}
                  tabManager={tabContext?.tabManager || null}
                  className="w-64"
                />
              )}
            </div>

            {/* Right side - User Menu */}
            <div className="flex items-center">
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:block">{user?.user_metadata?.first_name || user?.email}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      <div className="px-2 py-2 border-b border-gray-100 mb-2">
                        <div className="font-medium text-gray-900 text-sm">
                          {user?.user_metadata?.first_name || 'User'}
                        </div>
                        <div className="text-xs text-gray-500">{user?.email}</div>
                      </div>
                      
                      {/* Profile Option */}
                      <button
                        onClick={() => {
                          router.push('/profile')
                          setShowUserMenu(false)
                        }}
                        className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </button>

                      {/* Settings Option */}
                      <button
                        onClick={() => {
                          if (currentWorkspace) {
                            router.push(`/w/${currentWorkspace.slug}/settings`)
                          } else {
                            router.push('/settings')
                          }
                          setShowUserMenu(false)
                        }}
                        className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>

                      {/* Divider */}
                      <div className="border-t border-gray-100 my-2"></div>

                      {/* Sign Out */}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden m-0 p-0" style={{ height: '100%' }}>
        {children}
      </main>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={showCommandPalette}
        onClose={handleCloseCommandPalette}
        workspaceSlug={workspaceSlug}
      />
    </div>
  )
}