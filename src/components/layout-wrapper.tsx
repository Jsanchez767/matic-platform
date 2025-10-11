"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation" 
import { supabase } from "@/lib/supabase"
import { NavigationLayout } from "./NavigationLayout"

interface LayoutWrapperProps {
  children: React.ReactNode
}

// Simple route exclusion function
const shouldExcludeLayout = (pathname: string) => {
  const excludedRoutes = [
    '/login',
    '/signup', 
    '/verify-email',
    '/auth',
    '/api'
  ]
  
  return excludedRoutes.some(route => pathname.startsWith(route))
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null)

  useEffect(() => {
    const handleWorkspaceRedirect = async () => {
      try {
        // Skip layout logic for excluded routes
        if (shouldExcludeLayout(pathname)) {
          setLoading(false)
          return
        }

        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentUser) {
          router.push('/login')
          return
        }

        setUser(currentUser)

        // If we're on a workspace page, get workspace info
        const workspaceMatch = pathname.match(/^\/w\/([^\/]+)/)
        if (workspaceMatch) {
          const slug = workspaceMatch[1]
          
          // Get workspace details
          const { data: workspace } = await supabase
            .from('workspaces')
            .select('*')
            .eq('slug', slug)
            .single()
            
          if (workspace) {
            setCurrentWorkspace(workspace)
          }
        }
        
        setLoading(false)
      } catch (error) {
        console.error("Error in workspace redirect:", error)
        router.push('/login')
      }
    }

    handleWorkspaceRedirect()
  }, [pathname, router, supabase])

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Skip navigation for excluded routes
  if (shouldExcludeLayout(pathname)) {
    return <>{children}</>
  }

  // Use NavigationLayout for all other routes
  return (
    <NavigationLayout>
      {children}
    </NavigationLayout>
  )
}
