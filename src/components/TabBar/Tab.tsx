"use client"

import React from 'react'
import { X, MoreHorizontal } from 'lucide-react'
import { Dashboard } from '../types'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TabProps {
  dashboard: Dashboard;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  isDragging?: boolean;
}

export const Tab: React.FC<TabProps> = ({
  dashboard,
  isActive,
  onSelect,
  onClose,
  isDragging = false
}) => {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-3 py-1 border-r border-gray-200 cursor-pointer min-w-0 max-w-48 transition-all duration-200",
        isActive 
          ? "bg-white border-b-2 border-b-blue-500 text-gray-900" 
          : "bg-gray-50 hover:bg-gray-100 text-gray-600",
        isDragging && "opacity-50"
      )}
      onClick={onSelect}
    >
      {/* Dashboard Name */}
      <span className="text-sm font-medium truncate flex-1 min-w-0">
        {dashboard.name}
      </span>

      {/* Close Button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-opacity",
          isActive && "opacity-60 hover:opacity-100"
        )}
        onClick={handleClose}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}