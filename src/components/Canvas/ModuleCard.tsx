"use client"

import React from 'react'
import { ModuleInstance } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from "@/ui-components/card"
import { Button } from "@/ui-components/button"
import { 
  FileText, 
  Mail, 
  MessageCircle, 
  List, 
  BarChart3, 
  FolderKanban,
  FileCheck,
  MessageSquare,
  Settings,
  GripHorizontal,
  X
} from 'lucide-react'

interface ModuleCardProps {
  module: ModuleInstance;
  onUpdate: (updates: Partial<ModuleInstance>) => void;
  onRemove: () => void;
  onConnect?: () => void;
}

const moduleIcons = {
  forms: FileText,
  email: Mail,
  chat: MessageCircle,
  list: List,
  chart: BarChart3,
  projects: FolderKanban,
  documents: FileCheck,
  discussions: MessageSquare,
}

const moduleColors = {
  forms: 'border-blue-200 bg-blue-50',
  email: 'border-green-200 bg-green-50',
  chat: 'border-purple-200 bg-purple-50',
  list: 'border-orange-200 bg-orange-50',
  chart: 'border-indigo-200 bg-indigo-50',
  projects: 'border-red-200 bg-red-50',
  documents: 'border-yellow-200 bg-yellow-50',
  discussions: 'border-pink-200 bg-pink-50',
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  onUpdate,
  onRemove,
  onConnect
}) => {
  const IconComponent = moduleIcons[module.type] || Settings
  const colorClass = moduleColors[module.type] || 'border-gray-200 bg-gray-50'

  const handleTitleChange = (newTitle: string) => {
    onUpdate({ title: newTitle })
  }

  return (
    <Card 
      className={`relative group transition-all duration-200 hover:shadow-md ${colorClass}`}
      style={{
        width: module.size.width,
        height: module.size.height,
        transform: `translate(${module.position.x}px, ${module.position.y}px)`,
      }}
    >
      {/* Module Header */}
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className="h-4 w-4" />
            <input
              type="text"
              value={module.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-sm font-medium bg-transparent border-none outline-none flex-1"
              placeholder="Module title"
            />
          </div>
          
          {/* Module Controls */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Drag Handle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 cursor-move"
            >
              <GripHorizontal className="h-3 w-3" />
            </Button>
            
            {/* Connect Button */}
            {onConnect && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onConnect}
                className="h-6 w-6 p-0"
                title="Connect to other modules"
              >
                <Settings className="h-3 w-3" />
              </Button>
            )}
            
            {/* Remove Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              title="Remove module"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Module Content */}
      <CardContent className="p-3 pt-0 flex-1">
        <div className="text-xs text-gray-600 mb-2 capitalize">
          {module.type} Module
        </div>
        
        {/* Module-specific content preview */}
        <div className="text-sm text-gray-800">
          {module.type === 'forms' && (
            <div>Forms: {module.config.formCount || 0} forms</div>
          )}
          {module.type === 'chat' && (
            <div>Chat: {module.config.unreadCount || 0} unread</div>
          )}
          {module.type === 'list' && (
            <div>List: {module.config.itemCount || 0} items</div>
          )}
          {module.type === 'chart' && (
            <div>Chart: {module.config.chartType || 'Line'} chart</div>
          )}
          {module.type === 'email' && (
            <div>Email: {module.config.unreadCount || 0} unread</div>
          )}
          {module.type === 'projects' && (
            <div>Projects: {module.config.projectCount || 0} active</div>
          )}
          {module.type === 'documents' && (
            <div>Documents: {module.config.docCount || 0} files</div>
          )}
          {module.type === 'discussions' && (
            <div>Discussions: {module.config.topicCount || 0} topics</div>
          )}
        </div>
      </CardContent>

      {/* Resize Handle */}
      <div className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-full h-full bg-gray-400 transform rotate-45 translate-x-1 translate-y-1"></div>
      </div>
    </Card>
  )
}