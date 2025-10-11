"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  )
}

interface DialogContentProps {
  className?: string
  children: React.ReactNode
}

const DialogContent: React.FC<DialogContentProps> = ({ className, children }) => {
  return (
    <div className={cn(
      "relative bg-white rounded-lg shadow-lg max-w-lg w-full mx-4",
      className
    )}>
      {children}
    </div>
  )
}

export { Dialog, DialogContent }