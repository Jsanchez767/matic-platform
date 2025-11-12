"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  X,
  Table2,
  Inbox,
  Filter,
  Edit,
  Copy,
  Trash2,
  ExternalLink,
  ChevronRight,
  Zap,
  Layout,
  Database,
  CheckSquare,
  Calendar,
  UserCircle2
} from 'lucide-react'

interface OmniSearchProps {
  isOpen: boolean
  onClose: () => void
  workspaceId?: string
  workspaceSlug?: string
}

type SearchResultType = 
  | 'table' 
  | 'form' 
  | 'request-hub' 
  | 'row' 
  | 'submission' 
  | 'action' 
  | 'navigation' 
  | 'recent'

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  description?: string
  icon: React.ComponentType<any>
  type: SearchResultType
  category: string
  action: () => void
  secondaryActions?: {
    label: string
    icon: React.ComponentType<any>
    action: () => void
  }[]
  shortcut?: string
  keywords?: string[]
  badge?: string
  timestamp?: string
  path?: string // breadcrumb path
}

export const OmniSearch: React.FC<OmniSearchProps> = ({ 
  isOpen, 
  onClose, 
  workspaceId,
  workspaceSlug 
}) => {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('omnisearch-recent')
    if (recent) {
      setRecentSearches(JSON.parse(recent))
    }
  }, [])

  // Save search to recent
  const saveToRecent = (query: string) => {
    if (!query.trim()) return
    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('omnisearch-recent', JSON.stringify(updated))
  }

  // Default actions and navigation items
  const getDefaultResults = useCallback((): SearchResult[] => {
    if (!workspaceSlug) return []

    return [
      // Quick Actions
      {
        id: 'action-new-form',
        title: 'Create New Form',
        subtitle: 'Start building a new form',
        icon: FileText,
        type: 'action',
        category: 'ACTIONS',
        action: () => {
          router.push(`/workspace/${workspaceSlug}?action=create-form`)
          onClose()
        },
        shortcut: '⌘N',
        keywords: ['create', 'new', 'form', 'survey']
      },
      {
        id: 'action-new-document',
        title: 'Create Document',
        subtitle: 'Start a new collaborative document',
        icon: FileText,
        type: 'action',
        category: 'ACTIONS',
        action: () => {
          router.push(`/workspace/${workspaceSlug}?action=create-document`)
          onClose()
        },
        keywords: ['create', 'new', 'document', 'doc']
      },
      {
        id: 'action-calendar',
        title: 'Open Calendar',
        subtitle: 'View your schedule',
        icon: Calendar,
        type: 'action',
        category: 'ACTIONS',
        action: () => {
          router.push(`/workspace/${workspaceSlug}/calendar`)
          onClose()
        },
        keywords: ['calendar', 'schedule', 'events']
      },
      {
        id: 'action-team',
        title: 'Team',
        subtitle: 'Manage team members',
        icon: UserCircle2,
        type: 'action',
        category: 'ACTIONS',
        action: () => {
          router.push(`/workspace/${workspaceSlug}/team`)
          onClose()
        },
        keywords: ['team', 'members', 'people']
      },

      // Navigation
      {
        id: 'nav-dashboard',
        title: 'Dashboard',
        subtitle: 'Go to workspace dashboard',
        icon: Layout,
        type: 'navigation',
        category: 'NAVIGATION',
        action: () => {
          router.push(`/workspace/${workspaceSlug}`)
          onClose()
        },
        keywords: ['dashboard', 'overview', 'home']
      },
      {
        id: 'nav-tables',
        title: 'All Tables',
        subtitle: 'View all database tables',
        icon: Table2,
        type: 'navigation',
        category: 'NAVIGATION',
        action: () => {
          router.push(`/workspace/${workspaceSlug}/tables`)
          onClose()
        },
        keywords: ['tables', 'databases', 'data']
      },
      {
        id: 'nav-forms',
        title: 'All Forms',
        subtitle: 'View all forms',
        icon: FileText,
        type: 'navigation',
        category: 'NAVIGATION',
        action: () => {
          router.push(`/workspace/${workspaceSlug}/forms`)
          onClose()
        },
        keywords: ['forms', 'surveys']
      },
      {
        id: 'nav-hubs',
        title: 'Request Hubs',
        subtitle: 'View all request hubs',
        icon: Inbox,
        type: 'navigation',
        category: 'NAVIGATION',
        action: () => {
          router.push(`/workspace/${workspaceSlug}/request-hubs`)
          onClose()
        },
        keywords: ['hubs', 'requests', 'inbox']
      },
      {
        id: 'nav-settings',
        title: 'Settings',
        subtitle: 'Workspace settings',
        icon: Settings,
        type: 'navigation',
        category: 'NAVIGATION',
        action: () => {
          router.push(`/workspace/${workspaceSlug}/settings`)
          onClose()
        },
        keywords: ['settings', 'preferences', 'configuration']
      }
    ]
  }, [workspaceSlug, router, onClose])

  // Search function (to be enhanced with API calls)
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(getDefaultResults())
      return
    }

    setIsLoading(true)
    
    try {
      // TODO: Replace with actual API call to search endpoint
      // For now, filter default results
      const defaultResults = getDefaultResults()
      const filtered = defaultResults.filter(result => {
        const searchTerms = searchQuery.toLowerCase().split(' ')
        const searchableText = [
          result.title,
          result.subtitle,
          result.description,
          result.category,
          ...(result.keywords || [])
        ].join(' ').toLowerCase()
        
        return searchTerms.every(term => searchableText.includes(term))
      })

      setResults(filtered)
      
      // TODO: Add API search results for:
      // - Tables (search by name, description)
      // - Forms (search by name, description)
      // - Request Hubs (search by name)
      // - Table Rows (search within row data)
      // - Form Submissions (search within submission data)
      
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [getDefaultResults])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query)
    }, 150)

    return () => clearTimeout(timer)
  }, [query, performSearch])

  // Initialize with default results
  useEffect(() => {
    if (isOpen && !query) {
      setResults(getDefaultResults())
    }
  }, [isOpen, query, getDefaultResults])

  // Group results by category
  const groupedResults = results.reduce((groups, result) => {
    if (!groups[result.category]) {
      groups[result.category] = []
    }
    groups[result.category].push(result)
    return groups
  }, {} as Record<string, SearchResult[]>)

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
            prev < results.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : results.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            saveToRecent(query)
            results[selectedIndex].action()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, results, onClose, query])

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
      const allResults = listRef.current.querySelectorAll('[data-result]')
      const selectedElement = allResults[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div className="fixed top-[15%] left-1/2 transform -translate-x-1/2 w-full max-w-2xl z-50 px-4 animate-in slide-in-from-top-4 duration-300">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200/80 overflow-hidden">
          {/* Search Input */}
          <div className="relative border-b border-gray-100">
            <div className="flex items-center gap-3 px-5 py-4">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for anything..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-[15px]"
                autoFocus
              />
              {isLoading && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          </div>

          {/* Results */}
          <div 
            ref={listRef}
            className="max-h-[420px] overflow-y-auto overscroll-contain"
          >
            {results.length === 0 && !isLoading ? (
              <div className="py-20 px-4 text-center">
                <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-base font-medium text-gray-900 mb-1">
                  {query ? 'No results found' : 'Start typing to search'}
                </p>
                <p className="text-sm text-gray-500">
                  {query 
                    ? 'Try different keywords or check your spelling'
                    : 'Search across tables, forms, request hubs, and more'
                  }
                </p>
              </div>
            ) : (
              <div className="py-2">
                {Object.entries(groupedResults).map(([category, categoryResults]) => (
                  <div key={category} className="mb-1">
                    {/* Category Header */}
                    <div className="px-4 py-2">
                      <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        {category}
                      </div>
                    </div>

                    {/* Results */}
                    {categoryResults.map((result) => {
                      const globalIndex = results.indexOf(result)
                      const isSelected = globalIndex === selectedIndex
                      
                      return (
                        <button
                          key={result.id}
                          data-result
                          onClick={() => {
                            saveToRecent(query)
                            result.action()
                          }}
                          className={`w-full group relative flex items-center gap-3 px-4 py-2.5 transition-colors ${
                            isSelected 
                              ? 'bg-gray-100' 
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Icon */}
                          <div className={`flex-shrink-0 p-2 rounded-md transition-colors ${
                            isSelected 
                              ? 'bg-white' 
                              : 'bg-transparent'
                          }`}>
                            <result.icon className="w-[18px] h-[18px] text-gray-600" />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-medium text-[14px] text-gray-900 truncate leading-tight">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-[13px] text-gray-500 truncate mt-0.5">
                                {result.subtitle}
                              </div>
                            )}
                          </div>

                          {/* Shortcut */}
                          {result.shortcut && !isSelected && (
                            <kbd className="px-2 py-1 text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded">
                              {result.shortcut}
                            </kbd>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-white border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-[11px] text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">↑↓</span>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">↵</span>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">ESC</span>
                  <span>Close</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
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
