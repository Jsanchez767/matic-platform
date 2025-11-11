"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, Settings, LogOut, Search, Plus } from 'lucide-react'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { clearLastWorkspace } from '@/lib/utils'
import { useWorkspaceDiscovery } from '@/hooks/useWorkspaceDiscovery'
import { TabNavigation } from './TabNavigation'
import { WorkspaceSettingsModal } from './WorkspaceSettingsModal'
import { workspacesSupabase } from '@/lib/api/workspaces-supabase'
import { toast } from 'sonner'
import type { Workspace } from '@/types/workspaces'

interface NavigationLayoutProps {
  children: React.ReactNode
  workspaceSlug?: string
}

export function NavigationLayout({ children, workspaceSlug }: NavigationLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [fullWorkspace, setFullWorkspace] = useState<Workspace | null>(null)
  
  const { workspaces, currentWorkspace, setCurrentWorkspaceBySlug } = useWorkspaceDiscovery()

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (workspaceSlug && workspaces.length > 0) {
      setCurrentWorkspaceBySlug(workspaceSlug)
    }
  }, [workspaceSlug, workspaces, setCurrentWorkspaceBySlug])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      // Clear any cached data
      setUser(null)
      setShowUserMenu(false)
      clearLastWorkspace()
      // Redirect to login
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleOpenSettings = async () => {
    if (!currentWorkspace) return
    
    try {
      // Fetch full workspace data
      const workspace = await workspacesSupabase.getWorkspaceById(currentWorkspace.id)
      setFullWorkspace(workspace)
      setShowSettingsModal(true)
      setShowUserMenu(false)
    } catch (error) {
      console.error('Error fetching workspace:', error)
      toast.error('Failed to load workspace settings')
    }
  }

  const handleWorkspaceUpdate = (updatedWorkspace: Workspace) => {
    // The workspace discovery hook will automatically pick up changes
    // via Supabase realtime, but we can force a refresh if needed
    setCurrentWorkspaceBySlug(updatedWorkspace.slug)
  }

  const handleWorkspaceSwitch = (slug: string) => {
    router.push(`/workspace/${slug}`)
    setShowWorkspaceMenu(false)
  }

  const getWorkspaceInitial = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || 'W'
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Left: Workspace Dropdown */}
          <div className="flex items-center space-x-4">
            {currentWorkspace && (
              <div className="relative">
                <button 
                  onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)} 
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                    {getWorkspaceInitial(currentWorkspace.name)}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{currentWorkspace.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                
                {showWorkspaceMenu && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* Current Workspace Section */}
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Current Workspace
                    </div>
                    <div className="px-3 py-2 mb-2">
                      <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
                        <div className="w-8 h-8 rounded bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                          {getWorkspaceInitial(currentWorkspace.name)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{currentWorkspace.name}</div>
                          <div className="text-xs text-gray-500">Free</div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                    </div>

                    {/* Switch Workspace Section */}
                    {workspaces.length > 1 && (
                      <>
                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Switch Workspace
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {workspaces.filter(ws => ws.id !== currentWorkspace.id).map((ws) => (
                            <button
                              key={ws.id}
                              onClick={() => handleWorkspaceSwitch(ws.slug)}
                              className="w-full flex items-center space-x-3 px-5 py-2 hover:bg-gray-50 transition-colors"
                            >
                              <div className="w-6 h-6 rounded bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold">
                                {getWorkspaceInitial(ws.name)}
                              </div>
                              <div className="flex-1 text-left">
                                <div className="text-sm text-gray-900">{ws.name}</div>
                                <div className="text-xs text-gray-500">Free</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Create Workspace */}
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button className="w-full flex items-center space-x-2 px-5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Plus className="w-4 h-4" />
                        <span>Create workspace</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search workspace..."
                className="w-full pl-10 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 px-2 py-0.5 text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded">
                ⌘ K
              </kbd>
            </div>
          </div>

          {/* Right: User Avatar Only */}
          <div className="flex items-center space-x-2">
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)} 
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium border-2 border-white shadow-sm">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                </button>
                
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-medium text-sm text-gray-900">
                        {user.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                    </div>
                    <button className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button 
                      onClick={handleOpenSettings}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button 
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation Bar */}
        {currentWorkspace && (
          <div className="bg-gray-50 border-t border-gray-200">
            <TabNavigation workspaceId={currentWorkspace.id} />
          </div>
        )}

        {/* Action Buttons Bar - Below tabs */}
        {currentWorkspace && (
          <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
      
      {/* Workspace Settings Modal */}
      {fullWorkspace && (
        <WorkspaceSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          workspace={fullWorkspace}
          onUpdate={handleWorkspaceUpdate}
        />
      )}
      
      {/* Backdrop */}
      {(showUserMenu || showWorkspaceMenu) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => { 
            setShowUserMenu(false)
            setShowWorkspaceMenu(false)
          }} 
        />
      )}
    </div>
  )
}
