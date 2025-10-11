// Simplified search engine without Yjs dependencies
// Uses basic fuzzy search for metadata and content

interface SearchResult {
  id: string
  title: string
  description?: string
  type: 'document' | 'form' | 'calendar' | 'project' | 'custom'
  url: string
  workspaceId: string
  source: 'metadata' | 'content'
  score: number
  highlights?: string[]
  lastUpdated: number
  metadata?: Record<string, any>
}

interface SearchableItem {
  id: string
  title: string
  description?: string
  type: string
  url: string
  workspaceId: string
  content?: string
  lastUpdated: number
  metadata?: Record<string, any>
}

export class HybridSearchEngine {
  private workspaceId: string
  private searchableItems: SearchableItem[] = []
  
  constructor(workspaceId: string) {
    this.workspaceId = workspaceId
    this.initialize()
  }

  private async initialize() {
    // Load searchable items
    await this.loadSearchableItems()
  }

  private async loadSearchableItems() {
    try {
      // For now, return empty array
      // In the future, this could load from Supabase or other sources
      this.searchableItems = []
    } catch (error) {
      console.error('Failed to load searchable items:', error)
    }
  }

  // Simple fuzzy search implementation
  private fuzzyMatch(text: string, query: string): { matches: boolean; score: number } {
    const normalizedText = text.toLowerCase()
    const normalizedQuery = query.toLowerCase()
    
    // Exact match
    if (normalizedText.includes(normalizedQuery)) {
      return { matches: true, score: 1.0 }
    }
    
    // Word-by-word match
    const queryWords = normalizedQuery.split(/\s+/)
    const textWords = normalizedText.split(/\s+/)
    
    let matchCount = 0
    queryWords.forEach(qWord => {
      if (textWords.some(tWord => tWord.includes(qWord))) {
        matchCount++
      }
    })
    
    const score = matchCount / queryWords.length
    return { matches: score > 0.5, score }
  }

  // PUBLIC SEARCH METHOD
  public async search(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return []

    const results: SearchResult[] = []
    
    // Search through all items
    this.searchableItems.forEach(item => {
      const titleMatch = this.fuzzyMatch(item.title, query)
      const descMatch = item.description 
        ? this.fuzzyMatch(item.description, query) 
        : { matches: false, score: 0 }
      const contentMatch = item.content
        ? this.fuzzyMatch(item.content, query)
        : { matches: false, score: 0 }
      
      // Calculate combined score
      const maxScore = Math.max(titleMatch.score, descMatch.score, contentMatch.score)
      
      if (titleMatch.matches || descMatch.matches || contentMatch.matches) {
        results.push({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.type as any,
          url: item.url,
          workspaceId: item.workspaceId,
          source: contentMatch.matches ? 'content' : 'metadata',
          score: maxScore,
          lastUpdated: item.lastUpdated,
          metadata: item.metadata
        })
      }
    })

    // Sort by score (descending)
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  }

  // Get indexing progress (for UI feedback)
  public getIndexingProgress(): { 
    total: number
    indexed: number
    isIndexing: boolean 
  } {
    return {
      total: this.searchableItems.length,
      indexed: this.searchableItems.length,
      isIndexing: false
    }
  }

  // Cleanup
  public destroy() {
    this.searchableItems = []
  }
}