"use client"

import React from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { NAV_CONFIG, getModulesByCategory } from '@/config/navigation'

interface ModulePaletteProps {
  isOpen: boolean
  onClose: () => void
  onAddModule: (moduleType: string) => void
}

export const ModulePalette: React.FC<ModulePaletteProps> = ({
  isOpen,
  onClose,
  onAddModule
}) => {
  const groupedModules = getModulesByCategory()

  const handleAddModule = (moduleType: string) => {
    onAddModule(moduleType)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{NAV_CONFIG.TEXT.MODULE_PALETTE.TITLE}</h2>
            <p className="text-gray-600">
              {NAV_CONFIG.TEXT.MODULE_PALETTE.DESCRIPTION}
            </p>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedModules).map(([category, modules]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold mb-3">
                  {NAV_CONFIG.MODULE_CATEGORIES[category as keyof typeof NAV_CONFIG.MODULE_CATEGORIES]}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {modules.map((module) => {
                    const IconComponent = module.icon
                    
                    return (
                      <Card 
                        key={module.id}
                        className={`cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-200 ${module.color.bg} ${module.color.border}`}
                        onClick={() => handleAddModule(module.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 ${module.color.bg} rounded-lg flex items-center justify-center`}>
                                <IconComponent className={`h-4 w-4 ${module.color.icon}`} />
                              </div>
                              <CardTitle className="text-base">{module.name}</CardTitle>
                            </div>
                            {module.premium && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                Pro
                              </span>
                            )}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <p className="text-sm text-gray-600 mb-3">
                            {module.description}
                          </p>
                          
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddModule(module.id)
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {NAV_CONFIG.TEXT.MODULE_PALETTE.ADD_BUTTON}
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}