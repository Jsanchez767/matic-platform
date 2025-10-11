"use client"

import React, { useState } from 'react'
import { Plus, Grid3x3 } from 'lucide-react'
import { Dashboard, ModuleInstance } from '../types'
import { ModuleCard } from './ModuleCard'
import { Button } from "@/ui-components/button"
import { useTabManager } from '../TabBar/TabManager'
import { NAV_CONFIG } from '@/lib/navigation'

interface DashboardCanvasProps {
  dashboard: Dashboard;
  onUpdateDashboard: (updates: Partial<Dashboard>) => void;
  onAddModule: () => void;
}

export const DashboardCanvas: React.FC<DashboardCanvasProps> = ({
  dashboard,
  onUpdateDashboard,
  onAddModule
}) => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null)

  const updateModule = (moduleId: string, updates: Partial<ModuleInstance>) => {
    const updatedModules = dashboard.layout.modules.map(module =>
      module.id === moduleId ? { ...module, ...updates } : module
    )
    
    onUpdateDashboard({
      layout: {
        ...dashboard.layout,
        modules: updatedModules
      }
    })
  }

  const removeModule = (moduleId: string) => {
    const updatedModules = dashboard.layout.modules.filter(
      module => module.id !== moduleId
    )
    
    onUpdateDashboard({
      layout: {
        ...dashboard.layout,
        modules: updatedModules
      }
    })
  }

  const hasModules = dashboard.layout.modules.length > 0

  return (
    <div className="flex-1 relative bg-gray-50 overflow-auto">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Canvas Content */}
      <div className="relative min-h-full p-4">
        {hasModules ? (
          <>
            {/* Modules */}
            {dashboard.layout.modules.map((module) => (
              <div
                key={module.id}
                className="absolute"
                style={{
                  left: module.position.x,
                  top: module.position.y,
                }}
              >
                <ModuleCard
                  module={module}
                  onUpdate={(updates) => updateModule(module.id, updates)}
                  onRemove={() => removeModule(module.id)}
                />
              </div>
            ))}

            {/* Floating Add Button */}
            <Button
              onClick={onAddModule}
              className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-10"
              title="Add module"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center min-h-96 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
              <Grid3x3 className="h-8 w-8 text-gray-400" />
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {NAV_CONFIG.TEXT.CANVAS.EMPTY_STATE_TITLE}
            </h3>
            
            <p className="text-gray-600 mb-6 max-w-md">
              {NAV_CONFIG.TEXT.CANVAS.EMPTY_STATE_DESCRIPTION}
            </p>
            
            <Button onClick={onAddModule} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {NAV_CONFIG.TEXT.CANVAS.ADD_FIRST_MODULE}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}