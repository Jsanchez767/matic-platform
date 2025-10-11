"use client"

import React, { useRef, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Tab } from './Tab'
import { useTabManager } from './TabManager'
import { Button } from "@/ui-components/button"
import { NAV_CONFIG } from '@/lib/navigation'

interface TabBarProps {
  onCreateNewDashboard: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  onCreateNewDashboard
}) => {
  const { state, switchTab, removeTab } = useTabManager()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  // Check scroll state
  const checkScrollState = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth
    )
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    checkScrollState()
    container.addEventListener('scroll', checkScrollState)
    window.addEventListener('resize', checkScrollState)

    return () => {
      container.removeEventListener('scroll', checkScrollState)
      window.removeEventListener('resize', checkScrollState)
    }
  }, [state.tabs])

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
  }

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
  }

  if (state.tabs.length === 0) {
    return (
      <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateNewDashboard}
          className="h-8 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <Plus className="h-4 w-4" />
          Create Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="h-10 bg-gray-50 border-b border-gray-200 flex items-center">
      {/* Left Scroll Button */}
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollLeft}
          className="h-8 w-8 p-0 flex-shrink-0 ml-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Tabs Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex min-w-max">
          {state.tabs.map((dashboard) => (
            <Tab
              key={dashboard.id}
              dashboard={dashboard}
              isActive={dashboard.id === state.activeTabId}
              onSelect={() => switchTab(dashboard.id)}
              onClose={() => removeTab(dashboard.id)}
            />
          ))}
        </div>
      </div>

      {/* Right Scroll Button */}
      {canScrollRight && (
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollRight}
          className="h-8 w-8 p-0 flex-shrink-0 mr-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Add New Dashboard Button */}
      <div className="flex-shrink-0 px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateNewDashboard}
          className="h-8 w-8 p-0"
          title="Create new dashboard"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}