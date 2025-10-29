'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    checkAuthAndRedirect()
  }, [])

  async function checkAuthAndRedirect() {
    // Check if user is already logged in
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      // User is logged in - redirect to workspaces
      router.push('/workspaces')
    } else {
      // User is not logged in - redirect to Webflow homepage
      window.location.href = 'https://www.maticslab.com'
    }
  }

  // Show loading state while checking auth
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
