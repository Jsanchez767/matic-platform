"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Hash, 
  FileText, 
  Users, 
  Settings, 
  Plus, 
  Folder,
  Command,
  ArrowRight,
  Clock,
  Star,
  X
} from 'lucide-react'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  workspaceSlug?: string
}

interface Command {
  id: string
  title: string
  subtitle?: string
  icon: React.ComponentType<any>
  category: 'Navigation' | 'Actions' | 'Recent' | 'Forms' | 'Workspace'
  action: () => void
  shortcut?: string
  keywords?: string[]
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  workspaceSlug 
}) => {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Command definitions
  const commands: Command[] = [
    // Navigation
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Go to workspace dashboard',
      icon: Hash,
      category: 'Navigation',
      action: () => router.push(`/w/${workspaceSlug}`),
      keywords: ['dashboard', 'home', 'overview']
    },
    {
      id: 'forms',
      title: 'Forms',
      subtitle: 'View all forms',
      icon: FileText,
      category: 'Navigation',
      action: () => router.push(`/w/${workspaceSlug}/forms`),
      keywords: ['forms', 'surveys', 'questionnaires']
    },
    {
      id: 'settings',
      title: 'Settings',
      subtitle: 'Workspace settings',
      icon: Settings,
      category: 'Navigation',
      action: () => router.push(`/w/${workspaceSlug}/settings`),
      keywords: ['settings', 'preferences', 'config']
    },
    {
      id: 'team',
      title: 'Team',
      subtitle: 'Manage team members',
      icon: Users,
      category: 'Navigation',
      action: () => router.push(`/w/${workspaceSlug}/team`),
      keywords: ['team', 'members', 'collaborators', 'users']
    },
    
    // Actions
    {
      id: 'new-form',
      title: 'Create New Form',
      subtitle: 'Start building a new form',
      icon: Plus,
      category: 'Actions',
      action: () => router.push(`/w/${workspaceSlug}/forms/new`),
      shortcut: '⌘N',
      keywords: ['create', 'new', 'form', 'build']
    },
    {
      id: 'new-workspace',
      title: 'Create Workspace',
      subtitle: 'Create a new workspace',
      icon: Folder,
      category: 'Actions',
      action: () => router.push('/create-workspace'),
      shortcut: '⌘⇧N',
      keywords: ['workspace', 'create', 'new', 'organization']
    },
    
    // Recent (would be populated from actual usage)
    {
      id: 'recent-1',
      title: 'Contact Form',
      subtitle: 'Last edited 2 hours ago',
      icon: Clock,
      category: 'Recent',
      action: () => router.push(`/w/${workspaceSlug}/forms/contact-form`),
      keywords: ['contact', 'form', 'recent']
    },
    {
      id: 'recent-2',
      title: 'User Feedback Survey',
      subtitle: 'Last edited yesterday',
      icon: Clock,
      category: 'Recent',
      action: () => router.push(`/w/${workspaceSlug}/forms/feedback-survey`),
      keywords: ['feedback', 'survey', 'recent']
    }
  ]

  // Filter commands based on search query
  const filteredCommands = commands.filter(command => {
    if (!query) return true
    
    const searchTerms = query.toLowerCase().split(' ')
    const searchableText = [
      command.title,
      command.subtitle,
      command.category,
      ...(command.keywords || [])
    ].join(' ').toLowerCase()
    
    return searchTerms.every(term => searchableText.includes(term))
  })

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((groups, command) => {
    if (!groups[command.category]) {
      groups[command.category] = []
    }
    groups[command.category].push(command)
    return groups
  }, {} as Record<string, Command[]>)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
            onClose()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, onClose])

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Command Palette */}
      <div className="fixed top-[15%] left-1/2 transform -translate-x-1/2 w-full max-w-2xl z-50 mx-4">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 outline-none text-lg"
            />
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Results */}
          <div 
            ref={listRef}
            className="max-h-96 overflow-y-auto p-2"
          >
            {Object.keys(groupedCommands).length === 0 ? (
              <div className="py-12 px-4 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-1">No results found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category} className="mb-6 last:mb-2">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {category}
                  </div>
                  {categoryCommands.map((command, index) => {
                    const globalIndex = filteredCommands.indexOf(command)
                    const isSelected = globalIndex === selectedIndex
                    
                    return (
                      <button
                        key={command.id}
                        onClick={() => {
                          command.action()
                          onClose()
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 ${
                          isSelected 
                            ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className={`p-2.5 rounded-lg ${
                          isSelected ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <command.icon className={`w-4 h-4 ${
                            isSelected ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                        
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {command.title}
                          </div>
                          {command.subtitle && (
                            <div className="text-sm text-gray-500 truncate">
                              {command.subtitle}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {command.shortcut && (
                            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-mono">
                              {command.shortcut}
                            </kbd>
                          )}
                          {isSelected && (
                            <ArrowRight className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-1 bg-white rounded text-gray-600 font-mono">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-1 bg-white rounded text-gray-600 font-mono">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-1 bg-white rounded text-gray-600 font-mono">ESC</kbd>
                  <span>Close</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Command className="w-3 h-3" />
                <span>Command Palette</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
