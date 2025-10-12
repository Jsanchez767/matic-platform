/**
 * Real-time table linking system using proper database relations
 */

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// Supabase client for real-time subscriptions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface TableLink {
  id: string
  source_table_id: string
  source_column_id: string
  target_table_id: string
  target_column_id?: string
  link_type: 'one_to_one' | 'one_to_many' | 'many_to_many'
}

interface TableRowLink {
  id: string
  link_id: string
  source_row_id: string
  target_row_id: string
  target_row?: any // The actual linked row data
}

interface LinkedRecordsCache {
  [linkId: string]: {
    [rowId: string]: TableRowLink[]
  }
}

/**
 * Hook for real-time table linking with proper database relations
 */
export function useRealTimeTableLinks(tableId: string) {
  const [links, setLinks] = useState<TableLink[]>([])
  const [linkedRecords, setLinkedRecords] = useState<LinkedRecordsCache>({})
  const [loading, setLoading] = useState(true)

  // Load table links and set up real-time subscriptions
  useEffect(() => {
    if (!tableId) return

    loadTableLinks()
    setupRealtimeSubscriptions()

    return () => {
      // Cleanup subscriptions
      supabase.removeAllChannels()
    }
  }, [tableId])

  const loadTableLinks = async () => {
    try {
      setLoading(true)

      // Load all links where this table is source or target
      const { data: linkData, error: linkError } = await supabase
        .from('table_links')
        .select('*')
        .or(`source_table_id.eq.${tableId},target_table_id.eq.${tableId}`)

      if (linkError) throw linkError

      setLinks(linkData || [])

      // Load all row links for these table links
      const linkIds = linkData?.map(link => link.id) || []
      if (linkIds.length > 0) {
        const { data: rowLinksData, error: rowLinksError } = await supabase
          .from('table_row_links')
          .select(`
            *,
            target_row:table_rows!target_row_id(id, data),
            source_row:table_rows!source_row_id(id, data)
          `)
          .in('link_id', linkIds)

        if (rowLinksError) throw rowLinksError

        // Organize linked records by link_id and row_id
        const cache: LinkedRecordsCache = {}
        rowLinksData?.forEach(rowLink => {
          if (!cache[rowLink.link_id]) {
            cache[rowLink.link_id] = {}
          }
          
          // Store links for both source and target rows
          const sourceRowId = rowLink.source_row_id
          const targetRowId = rowLink.target_row_id
          
          if (!cache[rowLink.link_id][sourceRowId]) {
            cache[rowLink.link_id][sourceRowId] = []
          }
          if (!cache[rowLink.link_id][targetRowId]) {
            cache[rowLink.link_id][targetRowId] = []
          }
          
          cache[rowLink.link_id][sourceRowId].push(rowLink)
          cache[rowLink.link_id][targetRowId].push(rowLink)
        })

        setLinkedRecords(cache)
      }
    } catch (error) {
      console.error('Error loading table links:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscriptions = () => {
    // Subscribe to table_row_links changes for real-time updates
    const rowLinksChannel = supabase
      .channel('table-row-links')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_row_links'
        },
        (payload) => {
          console.log('Real-time table link update:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newLink = payload.new as TableRowLink
            setLinkedRecords(prev => {
              const updated = { ...prev }
              
              if (!updated[newLink.link_id]) {
                updated[newLink.link_id] = {}
              }
              
              // Add to both source and target
              if (!updated[newLink.link_id][newLink.source_row_id]) {
                updated[newLink.link_id][newLink.source_row_id] = []
              }
              if (!updated[newLink.link_id][newLink.target_row_id]) {
                updated[newLink.link_id][newLink.target_row_id] = []
              }
              
              updated[newLink.link_id][newLink.source_row_id].push(newLink)
              updated[newLink.link_id][newLink.target_row_id].push(newLink)
              
              return updated
            })
          } else if (payload.eventType === 'DELETE') {
            const deletedLink = payload.old as TableRowLink
            setLinkedRecords(prev => {
              const updated = { ...prev }
              
              if (updated[deletedLink.link_id]) {
                // Remove from both source and target
                if (updated[deletedLink.link_id][deletedLink.source_row_id]) {
                  updated[deletedLink.link_id][deletedLink.source_row_id] = 
                    updated[deletedLink.link_id][deletedLink.source_row_id]
                      .filter(link => link.id !== deletedLink.id)
                }
                if (updated[deletedLink.link_id][deletedLink.target_row_id]) {
                  updated[deletedLink.link_id][deletedLink.target_row_id] = 
                    updated[deletedLink.link_id][deletedLink.target_row_id]
                      .filter(link => link.id !== deletedLink.id)
                }
              }
              
              return updated
            })
          }
        }
      )
      .subscribe()

    // Subscribe to table_links changes
    const linksChannel = supabase
      .channel('table-links')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_links',
          filter: `source_table_id=eq.${tableId}`
        },
        () => {
          // Reload links when link definitions change
          loadTableLinks()
        }
      )
      .subscribe()

    return () => {
      rowLinksChannel.unsubscribe()
      linksChannel.unsubscribe()
    }
  }

  // Create a new link between two rows
  const createRowLink = useCallback(async (
    linkId: string,
    sourceRowId: string,
    targetRowId: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('table_row_links')
        .insert({
          link_id: linkId,
          source_row_id: sourceRowId,
          target_row_id: targetRowId
        })
        .select('*')
        .single()

      if (error) throw error

      // Real-time subscription will handle UI update
      return data
    } catch (error) {
      console.error('Error creating row link:', error)
      throw error
    }
  }, [])

  // Remove a link between two rows
  const removeRowLink = useCallback(async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('table_row_links')
        .delete()
        .eq('id', linkId)

      if (error) throw error

      // Real-time subscription will handle UI update
    } catch (error) {
      console.error('Error removing row link:', error)
      throw error
    }
  }, [])

  // Get linked records for a specific row and column
  const getLinkedRecords = useCallback((rowId: string, columnId: string) => {
    const link = links.find(l => 
      (l.source_table_id === tableId && l.source_column_id === columnId) ||
      (l.target_table_id === tableId && l.target_column_id === columnId)
    )

    if (!link || !linkedRecords[link.id] || !linkedRecords[link.id][rowId]) {
      return []
    }

    return linkedRecords[link.id][rowId] || []
  }, [links, linkedRecords, tableId])

  return {
    links,
    linkedRecords,
    loading,
    createRowLink,
    removeRowLink,
    getLinkedRecords,
    refreshLinks: loadTableLinks
  }
}