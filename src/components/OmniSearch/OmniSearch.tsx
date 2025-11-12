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
  CheckSquare
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
        id: 'action-new-table',
        title: 'Create new table',
        subtitle: 'Start a new database table',
        icon: Plus,
        type: 'action',
        category: 'Quick Actions',
        action: () => {
          router.push(`/workspace/${workspaceSlug}?action=create-table`)
          onClose()
        },
        shortcut: '⌘T',
        keywords: ['create', 'new', 'table', 'database']
      },
      {
        id: 'action-new-form',
        title: 'Create new form',
        subtitle: 'Build a custom form',
        icon: Plus,
        type: 'action',
        category: 'Quick Actions',
        action: () => {
          router.push(`/workspace/${workspaceSlug}?action=create-form`)
          onClose()
        },
        shortcut: '⌘F',
        keywords: ['create', 'new', 'form', 'survey']
      },
      {
        id: 'action-new-hub',
        title: 'Create request hub',
        subtitle: 'Set up a new request collection',
        icon: Plus,
        type: 'action',
        category: 'Quick Actions',
        action: () => {
          router.push(`/workspace/${workspaceSlug}?action=create-hub`)
          onClose()
        },
        shortcut: '⌘H',
        keywords: ['create', 'new', 'hub', 'request', 'inbox']
      },

      // Navigation
      {
        id: 'nav-overview',
        title: 'Overview',
        subtitle: 'Workspace dashboard',
        icon: Layout,
        type: 'navigation',
        category: 'Navigation',
        action: () => {
          router.push(`/workspace/${workspaceSlug}`)
          onClose()
        },
        keywords: ['overview', 'dashboard', 'home']
      },
      {
        id: 'nav-tables',
        title: 'All Tables',
        subtitle: 'View all database tables',
        icon: Table2,
        type: 'navigation',
        category: 'Navigation',
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
        category: 'Navigation',
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
        category: 'Navigation',
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
        category: 'Navigation',
        action: () => {
          router.push(`/workspace/${workspaceSlug}/settings`)
          onClose()
        },
        keywords: ['settings', 'preferences', 'configuration']
      },
      {
        id: 'nav-team',
        title: 'Team',
        subtitle: 'Manage team members',
        icon: Users,
        type: 'navigation',
        category: 'Navigation',
        action: () => {
          router.push(`/workspace/${workspaceSlug}/team`)
          onClose()
        },
        keywords: ['team', 'members', 'users', 'collaborators']
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
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 animate-in fade-in duration-150"
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div className="fixed top-[10%] left-1/2 transform -translate-x-1/2 w-full max-w-3xl z-50 px-4 animate-in slide-in-from-top-4 duration-200">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search Input */}
          <div className="relative">
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search tables, forms, hubs, or type a command..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 outline-none text-base"
              />
              {isLoading && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-500">Recent:</span>
                  {recentSearches.map((recent, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(recent)}
                      className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-md hover:border-blue-300 hover:text-blue-600 transition-colors"
                    >
                      {recent}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div 
            ref={listRef}
            className="max-h-[500px] overflow-y-auto"
          >
            {results.length === 0 && !isLoading ? (
              <div className="py-16 px-4 text-center">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-900 mb-1">
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
              <div className="p-2">
                {Object.entries(groupedResults).map(([category, categoryResults]) => (
                  <div key={category} className="mb-4 last:mb-2">
                    {/* Category Header */}
                    <div className="flex items-center gap-2 px-3 py-2 mb-1">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {category}
                      </div>
                      <div className="flex-1 h-px bg-gray-200" />
                      <div className="text-xs text-gray-400">
                        {categoryResults.length}
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
                          className={`w-full group relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 ${
                            isSelected 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-sm' 
                              : 'hover:bg-gray-50 border-2 border-transparent'
                          }`}
                        >
                          {/* Icon */}
                          <div className={`flex-shrink-0 p-2.5 rounded-lg transition-all ${
                            isSelected 
                              ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30' 
                              : 'bg-gray-100 group-hover:bg-gray-200'
                          }`}>
                            <result.icon className={`w-4 h-4 ${
                              isSelected ? 'text-white' : 'text-gray-600'
                            }`} />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900 truncate">
                                {result.title}
                              </div>
                              {result.badge && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                  {result.badge}
                                </span>
                              )}
                            </div>
                            {result.subtitle && (
                              <div className="text-sm text-gray-500 truncate mt-0.5">
                                {result.subtitle}
                              </div>
                            )}
                            {result.path && (
                              <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                {result.path.split('/').map((segment, idx, arr) => (
                                  <React.Fragment key={idx}>
                                    <span>{segment}</span>
                                    {idx < arr.length - 1 && <ChevronRight className="w-3 h-3" />}
                                  </React.Fragment>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Right side */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {result.timestamp && (
                              <span className="text-xs text-gray-400">
                                {result.timestamp}
                              </span>
                            )}
                            {result.shortcut && !isSelected && (
                              <kbd className="hidden sm:block px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-mono">
                                {result.shortcut}
                              </kbd>
                            )}
                            {isSelected && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-lg">
                                <span className="text-xs font-medium text-blue-700">Enter</span>
                                <ArrowRight className="w-3 h-3 text-blue-600" />
                              </div>
                            )}
                          </div>

                          {/* Secondary Actions (on hover) */}
                          {result.secondaryActions && isSelected && (
                            <div className="absolute right-3 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
                              {result.secondaryActions.map((action, idx) => (
                                <button
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    action.action()
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                  <action.icon className="w-4 h-4" />
                                  {action.label}
                                </button>
                              ))}
                            </div>
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
          <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-1 bg-white rounded border border-gray-200 text-gray-600 font-mono shadow-sm">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-1 bg-white rounded border border-gray-200 text-gray-600 font-mono shadow-sm">↵</kbd>
                  <span>Open</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-1 bg-white rounded border border-gray-200 text-gray-600 font-mono shadow-sm">ESC</kbd>
                  <span>Close</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Zap className="w-3 h-3" />
                <span>OmniSearch</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
