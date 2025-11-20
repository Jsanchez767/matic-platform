/**
 * Participants Table Setup Helper
 * Creates and initializes the Participants table in a workspace
 */

import { tablesSupabase } from './tables-supabase'
import { 
  PARTICIPANTS_TABLE_NAME, 
  PARTICIPANTS_TABLE_SLUG, 
  PARTICIPANTS_TABLE_DESCRIPTION,
  getParticipantsColumns,
  PARTICIPANTS_DEFAULT_VIEW
} from '../participants-table-schema'

/**
 * Check if participants table exists in workspace
 */
export async function participantsTableExists(workspaceId: string): Promise<string | null> {
  try {
    const tables = await tablesSupabase.getTablesByWorkspace(workspaceId)
    const participantsTable = tables?.find(t => t.slug === PARTICIPANTS_TABLE_SLUG)
    return participantsTable?.id || null
  } catch (error) {
    console.error('Error checking participants table:', error)
    return null
  }
}

/**
 * Create the participants table with all columns and default view
 */
export async function createParticipantsTable(workspaceId: string, userId: string) {
  try {
    // Create the table
    const table = await tablesSupabase.createTable({
      workspace_id: workspaceId,
      name: PARTICIPANTS_TABLE_NAME,
      slug: PARTICIPANTS_TABLE_SLUG,
      description: PARTICIPANTS_TABLE_DESCRIPTION,
      icon: 'users',
      color: '#3B82F6',
      settings: {
        defaultView: 'grid',
        allowComments: true,
        allowAttachments: true
      },
      is_archived: false,
      created_by: userId
    })

    // Create all columns
    const columns = getParticipantsColumns()
    for (const column of columns) {
      await tablesSupabase.createColumn({
        table_id: table.id,
        ...column
      })
    }

    // Create default view
    const { supabase } = await import('@/lib/supabase')
    await supabase.from('table_views').insert({
      table_id: table.id,
      name: PARTICIPANTS_DEFAULT_VIEW.name,
      view_type: PARTICIPANTS_DEFAULT_VIEW.view_type,
      settings: PARTICIPANTS_DEFAULT_VIEW.settings,
      filters: PARTICIPANTS_DEFAULT_VIEW.filters,
      sorts: PARTICIPANTS_DEFAULT_VIEW.sorts,
      created_by: userId
    })

    // Set up link to activities table
    const { getOrCreateActivitiesTable } = await import('./activities-table-setup')
    const { createParticipantsActivitiesLink } = await import('./participants-activities-link')
    
    const activitiesTable = await getOrCreateActivitiesTable(workspaceId, userId)
    await createParticipantsActivitiesLink(table.id, activitiesTable.id)

    return table
  } catch (error) {
    console.error('Error creating participants table:', error)
    throw error
  }
}

/**
 * Get or create participants table for a workspace
 */
export async function getOrCreateParticipantsTable(workspaceId: string, userId: string) {
  const existingTableId = await participantsTableExists(workspaceId)
  
  if (existingTableId) {
    return await tablesSupabase.getTableById(existingTableId)
  }
  
  return await createParticipantsTable(workspaceId, userId)
}
