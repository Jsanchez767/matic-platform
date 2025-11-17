'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { NavigationLayout } from '@/components/NavigationLayout'
import { WorkspaceTabProvider } from '@/components/WorkspaceTabProvider'
import { RequestHubViewer } from '@/components/RequestHub/RequestHubViewer'
import { workspacesSupabase } from '@/lib/api/workspaces-supabase'
import { getRequestHubBySlug } from '@/lib/api/request-hubs-client'
import type { Workspace } from '@/types/workspaces'
import type { RequestHubWithTabs } from '@/lib/api/request-hubs-client'

export default function RequestHubPage() {
  const params = useParams()
  const workspaceSlug = params.slug as string
  const hubSlug = params.hubSlug as string
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [hub, setHub] = useState<RequestHubWithTabs | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [workspaceSlug, hubSlug])

  async function loadData() {
    try {
      setLoading(true)
      
      // Load workspace
      const workspaceData = await workspacesSupabase.getWorkspaceBySlug(workspaceSlug)
      setWorkspace(workspaceData)
      
      // Load request hub
      const hubData = await getRequestHubBySlug(workspaceData.id, hubSlug)
      setHub(hubData)
      
    } catch (err) {
      console.error('Error loading request hub:', err)
      setError(err instanceof Error ? err.message : 'Failed to load request hub')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500">Loading request hub...</div>
      </div>
    )
  }

  if (error || !workspace || !hub) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Request Hub Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'Not Found'}</p>
          <a href={`/workspace/${workspaceSlug}`} className="text-blue-600 hover:underline">
            Back to Workspace
          </a>
        </div>
      </div>
    )
  }

  return (
    <WorkspaceTabProvider workspaceId={workspace.id}>
      <NavigationLayout workspaceSlug={workspaceSlug}>
        <RequestHubViewer 
          hub={hub}
          workspaceId={workspace.id}
          onHubUpdate={loadData}
        />
      </NavigationLayout>
    </WorkspaceTabProvider>
  )
}
