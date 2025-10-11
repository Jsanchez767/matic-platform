import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import Fuse from 'fuse.js'
import { supabase } from '@/lib/supabase'

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

interface ContentIndex {
  documentId: string
  content: string
  lastIndexed: number
}

export class HybridSearchEngine {
  private workspaceId: string
  private metadataIndex: Fuse<any>
  private metadataItems: any[] = []
  private contentCache: Map<string, ContentIndex> = new Map()
  private contentIndex: Fuse<ContentIndex>
  private providers: Map<string, WebsocketProvider> = new Map()
  private isIndexingContent = false
  
  constructor(workspaceId: string) {
    this.workspaceId = workspaceId
    
    // Initialize metadata search (instant)
    this.metadataIndex = new Fuse([], {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'type', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true
    })
    
    // Initialize content search (progressive)
    this.contentIndex = new Fuse([], {
      keys: [
        { name: 'content', weight: 1.0 }
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true
    })
    
    this.initialize()
  }

  private async initialize() {
    // Load metadata immediately (fast)
    await this.loadMetadata()
    
    // Load content progressively (slower)
    this.loadContentProgressively()
  }

  // PHASE 1: Instant metadata search
  private async loadMetadata() {
    try {
      const { data: content } = await supabase
        .from('workspace_content')
        .select(`
          id,
          title,
          description,
          content_type,
          created_at,
          updated_at,
          yjs_document_id,
          yjs_documents (
            document_name
          )
        `)
        .eq('workspace_id', this.workspaceId)

      if (content) {
        const searchableItems = content.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          type: item.content_type,
          url: `/w/${this.workspaceId}/${item.content_type}s/${item.id}`,
          workspaceId: this.workspaceId,
          source: 'metadata',
          lastUpdated: new Date(item.updated_at).getTime(),
          metadata: {
            documentName: Array.isArray(item.yjs_documents) 
              ? item.yjs_documents[0]?.document_name 
              : (item.yjs_documents as any)?.document_name,
            yjsDocumentId: item.yjs_document_id
          }
        }))
        
        this.metadataItems = searchableItems
        this.metadataIndex.setCollection(searchableItems)
      }
    } catch (error) {
      console.error('Failed to load metadata:', error)
    }
  }

  // PHASE 2: Progressive content indexing
  private async loadContentProgressively() {
    if (this.isIndexingContent) return
    this.isIndexingContent = true

    try {
      const metadataItems = this.metadataItems
      
      // Index documents in batches
      const batchSize = 3
      for (let i = 0; i < metadataItems.length; i += batchSize) {
        const batch = metadataItems.slice(i, i + batchSize)
        
        await Promise.all(
          batch.map((item: any) => this.indexDocumentContent(item))
        )
        
        // Small delay between batches to not overwhelm
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error('Content indexing failed:', error)
    } finally {
      this.isIndexingContent = false
    }
  }

  // Index individual document content
  private async indexDocumentContent(item: any) {
    if (!item.metadata?.documentName) return

    try {
      const documentName = item.metadata.documentName
      
      // Check if already cached and recent
      const cached = this.contentCache.get(documentName)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
      
      if (cached && cached.lastIndexed > fiveMinutesAgo) {
        return // Use cached content
      }

      const ydoc = new Y.Doc()
      
      // Create provider with timeout
      const provider = new WebsocketProvider(
        process.env.NEXT_PUBLIC_YJS_WEBSOCKET_URL || 'ws://localhost:1234',
        documentName,
        ydoc
      )

      this.providers.set(documentName, provider)

      // Wait for sync with timeout
      const content = await Promise.race([
        this.extractContentWhenReady(ydoc, item.type),
        new Promise(resolve => setTimeout(() => resolve(null), 3000))
      ])

      if (content) {
        const contentIndex: ContentIndex = {
          documentId: item.id,
          content: content as string,
          lastIndexed: Date.now()
        }
        
        this.contentCache.set(documentName, contentIndex)
        this.rebuildContentIndex()
        
        // Subscribe to real-time updates
        this.subscribeToDocumentUpdates(ydoc, documentName, item.id)
      }

    } catch (error) {
      console.error(`Failed to index document ${item.metadata.documentName}:`, error)
    }
  }

  // Extract content when YJS document is ready
  private async extractContentWhenReady(ydoc: Y.Doc, type: string): Promise<string | null> {
    return new Promise((resolve) => {
      const checkContent = () => {
        try {
          let content = ''
          
          switch (type) {
            case 'document':
              const ytext = ydoc.getText('content')
              content = ytext.toString()
              break
              
            case 'form':
              const formMap = ydoc.getMap('form')
              content = this.extractFormContent(formMap.toJSON())
              break
              
            case 'project':
              const projectMap = ydoc.getMap('project')
              content = this.extractProjectContent(projectMap.toJSON())
              break
          }
          
          if (content.trim()) {
            resolve(content)
          } else {
            // Try again in a moment
            setTimeout(checkContent, 500)
          }
        } catch (error) {
          resolve(null)
        }
      }
      
      checkContent()
    })
  }

  // Subscribe to real-time document updates
  private subscribeToDocumentUpdates(ydoc: Y.Doc, documentName: string, documentId: string) {
    const updateContent = () => {
      try {
        const ytext = ydoc.getText('content')
        const content = ytext.toString()
        
        if (content.trim()) {
          this.contentCache.set(documentName, {
            documentId,
            content,
            lastIndexed: Date.now()
          })
          this.rebuildContentIndex()
        }
      } catch (error) {
        console.error('Error updating content index:', error)
      }
    }

    // Subscribe to changes
    ydoc.on('update', updateContent)
  }

  // Rebuild content search index
  private rebuildContentIndex() {
    const allContent = Array.from(this.contentCache.values())
    this.contentIndex.setCollection(allContent)
  }

  // Extract searchable text from forms
  private extractFormContent(formData: any): string {
    const parts: string[] = []
    
    if (formData.title) parts.push(formData.title)
    if (formData.description) parts.push(formData.description)
    
    if (formData.fields) {
      formData.fields.forEach((field: any) => {
        if (field.label) parts.push(field.label)
        if (field.placeholder) parts.push(field.placeholder)
        if (field.options) {
          field.options.forEach((option: any) => {
            if (typeof option === 'string') parts.push(option)
            else if (option.label) parts.push(option.label)
          })
        }
      })
    }
    
    return parts.join(' ')
  }

  // Extract searchable text from projects
  private extractProjectContent(projectData: any): string {
    const parts: string[] = []
    
    if (projectData.name) parts.push(projectData.name)
    if (projectData.description) parts.push(projectData.description)
    
    if (projectData.tasks) {
      projectData.tasks.forEach((task: any) => {
        if (task.title) parts.push(task.title)
        if (task.description) parts.push(task.description)
      })
    }
    
    return parts.join(' ')
  }

  // PUBLIC SEARCH METHOD - Hybrid approach
  public async search(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return []

    const results: SearchResult[] = []
    
    // 1. INSTANT: Search metadata first
    const metadataResults = this.metadataIndex.search(query)
    
    metadataResults.forEach(result => {
      results.push({
        ...result.item,
        score: result.score || 0,
        source: 'metadata'
      })
    })

    // 2. PROGRESSIVE: Search content if indexed
    const contentResults = this.contentIndex.search(query)
    
    contentResults.forEach(result => {
      const metadata = this.metadataItems.find(
        (doc: any) => doc.id === result.item.documentId
      )
      
      if (metadata) {
        // Enhance with content highlights
        const highlights = this.extractHighlights([...result.matches || []])
        
        results.push({
          ...metadata,
          score: result.score || 0,
          source: 'content',
          highlights
        })
      }
    })

    // 3. DEDUPLICATE: Prefer content matches over metadata matches
    const uniqueResults = new Map<string, SearchResult>()
    
    results.forEach(result => {
      const existing = uniqueResults.get(result.id)
      
      if (!existing || result.source === 'content') {
        uniqueResults.set(result.id, result)
      }
    })

    // 4. SORT: By relevance and source
    return Array.from(uniqueResults.values())
      .sort((a, b) => {
        // Content matches rank higher
        if (a.source === 'content' && b.source === 'metadata') return -1
        if (a.source === 'metadata' && b.source === 'content') return 1
        
        // Then by score
        return a.score - b.score
      })
      .slice(0, 10) // Limit results
  }

  // Extract highlights from search matches
  private extractHighlights(matches: any[]): string[] {
    const highlights: string[] = []
    
    matches.forEach(match => {
      if (match.indices && match.value) {
        match.indices.forEach(([start, end]: [number, number]) => {
          const contextStart = Math.max(0, start - 30)
          const contextEnd = Math.min(match.value.length, end + 30)
          const highlight = match.value.substring(contextStart, contextEnd)
          highlights.push(`...${highlight}...`)
        })
      }
    })
    
    return highlights.slice(0, 2)
  }

  // Get indexing progress (for UI feedback)
  public getIndexingProgress(): { 
    total: number
    indexed: number
    isIndexing: boolean 
  } {
    const total = this.metadataItems.length
    const indexed = this.contentCache.size
    
    return {
      total,
      indexed,
      isIndexing: this.isIndexingContent
    }
  }

  // Cleanup
  public destroy() {
    this.providers.forEach(provider => provider.destroy())
    this.providers.clear()
    this.contentCache.clear()
  }
}