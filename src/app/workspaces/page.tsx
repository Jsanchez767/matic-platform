'use client'

import { useEffect, useState } from 'react'
import { NavigationLayout } from '@/components/NavigationLayout'
import { WorkspaceTabProvider } from '@/components/WorkspaceTabProvider'
import { workspacesAPI } from '@/lib/api/workspaces-client'
import { getCurrentUser } from '@/lib/supabase'
import type { Workspace } from '@/types/workspaces'

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  async function loadWorkspaces() {
    try {
      setLoading(true)
      setError(null)
      console.log('Loading workspaces...')
      
      const user = await getCurrentUser()
      console.log('Current user:', user)
      
      if (!user) {
        setError('Please sign in to view workspaces')
        return
      }

      console.log('Fetching workspaces for user:', user.id)
      const data = await workspacesAPI.list(user.id)
      console.log('Workspaces loaded:', data)
      setWorkspaces(data)
    } catch (err) {
      console.error('Error loading workspaces:', err)
      setError(err instanceof Error ? err.message : 'Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Workspaces</h1>
        <p className="text-muted-foreground mt-2">
          Manage your workspaces and projects
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading workspaces...</div>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!loading && !error && workspaces.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No workspaces found</p>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
            Create Workspace
          </button>
        </div>
      )}

      {!loading && !error && workspaces.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <a
              key={workspace.id}
              href={`/workspace/${workspace.slug}`}
              className="block p-6 border border-border rounded-lg hover:border-primary hover:shadow-lg transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: workspace.color || '#3B82F6' }}
                >
                  {workspace.icon || workspace.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold">{workspace.name}</h3>
                  <p className="text-sm text-muted-foreground">{workspace.slug}</p>
                </div>
              </div>
              {workspace.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {workspace.description}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
