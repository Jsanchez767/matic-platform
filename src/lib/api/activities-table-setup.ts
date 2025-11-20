/**
 * Activities Table Setup Helper
 * Creates activities as a data table instead of custom table
 */

import { tablesSupabase } from './tables-supabase'
import { supabase } from '@/lib/supabase'

export const ACTIVITIES_TABLE_NAME = 'Activities'
export const ACTIVITIES_TABLE_SLUG = 'activities'

/**
 * Check if activities table exists in workspace
 */
export async function activitiesTableExists(workspaceId: string): Promise<string | null> {
  try {
    const tables = await tablesSupabase.getTablesByWorkspace(workspaceId)
    const activitiesTable = tables?.find(t => t.slug === ACTIVITIES_TABLE_SLUG)
    return activitiesTable?.id || null
  } catch (error) {
    console.error('Error checking activities table:', error)
    return null
  }
}

/**
 * Get activities table columns definition
 */
function getActivitiesColumns(): any[] {
  return [
    {
      name: 'name',
      label: 'Activity Name',
      column_type: 'text',
      is_primary: true,
      is_visible: true,
      position: 0,
      width: 200,
      validation: { required: true }
    },
    {
      name: 'description',
      label: 'Description',
      column_type: 'text',
      is_visible: true,
      position: 1,
      width: 300,
      validation: {}
    },
    {
      name: 'category',
      label: 'Category',
      column_type: 'select',
      is_visible: true,
      position: 2,
      width: 150,
      settings: {
        options: [
          { value: 'Sports', label: 'Sports', color: '#10B981' },
          { value: 'Arts', label: 'Arts', color: '#8B5CF6' },
          { value: 'Academic', label: 'Academic', color: '#3B82F6' },
          { value: 'Community', label: 'Community', color: '#F59E0B' },
          { value: 'Other', label: 'Other', color: '#6B7280' }
        ]
      },
      validation: {}
    },
    {
      name: 'status',
      label: 'Status',
      column_type: 'select',
      is_visible: true,
      position: 3,
      width: 120,
      settings: {
        options: [
          { value: 'active', label: 'Active', color: '#10B981' },
          { value: 'upcoming', label: 'Upcoming', color: '#F59E0B' },
          { value: 'completed', label: 'Completed', color: '#6B7280' }
        ]
      },
      validation: {}
    },
    {
      name: 'begin_date',
      label: 'Start Date',
      column_type: 'date',
      is_visible: true,
      position: 4,
      width: 120,
      validation: {}
    },
    {
      name: 'end_date',
      label: 'End Date',
      column_type: 'date',
      is_visible: true,
      position: 5,
      width: 120,
      validation: {}
    },
    {
      name: 'participants_count',
      label: 'Participants',
      column_type: 'number',
      is_visible: true,
      position: 6,
      width: 100,
      settings: {},
      validation: {}
    }
  ]
}

/**
 * Create the activities table
 */
export async function createActivitiesTable(workspaceId: string, userId: string) {
  try {
    // Create the table
    const table = await tablesSupabase.createTable({
      workspace_id: workspaceId,
      name: ACTIVITIES_TABLE_NAME,
      slug: ACTIVITIES_TABLE_SLUG,
      description: 'Manage programs and activities',
      icon: 'activity',
      color: '#8B5CF6',
      settings: {
        defaultView: 'grid',
        allowComments: true
      },
      is_archived: false,
      created_by: userId
    })

    // Create all columns
    const columns = getActivitiesColumns()
    for (const column of columns) {
      await tablesSupabase.createColumn({
        table_id: table.id,
        ...column
      })
    }

    // Create default view
    await supabase.from('table_views').insert({
      table_id: table.id,
      name: 'All Activities',
      view_type: 'grid',
      settings: {},
      filters: [],
      sorts: [{ columnId: 'name', direction: 'asc' }],
      created_by: userId
    })

    return table
  } catch (error) {
    console.error('Error creating activities table:', error)
    throw error
  }
}

/**
 * Get or create activities table for a workspace
 */
export async function getOrCreateActivitiesTable(workspaceId: string, userId: string) {
  const existingTableId = await activitiesTableExists(workspaceId)
  
  if (existingTableId) {
    return await tablesSupabase.getTableById(existingTableId)
  }
  
  return await createActivitiesTable(workspaceId, userId)
}

/**
 * Sync activities from old activities_hubs table to new data table
 */
export async function syncActivitiesToTable(
  workspaceId: string,
  activitiesTableId: string,
  userId: string
) {
  try {
    // Get activities from activities_hubs table
    const { data: activities } = await supabase
      .from('activities_hubs')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (!activities || activities.length === 0) return

    // Convert each activity to a table row
    for (const activity of activities) {
      await tablesSupabase.createRow({
        table_id: activitiesTableId,
        data: {
          name: activity.name,
          description: activity.description || '',
          category: activity.category || 'Other',
          status: activity.status || 'upcoming',
          begin_date: activity.begin_date,
          end_date: activity.end_date,
          participants_count: activity.participants || 0
        },
        metadata: {
          original_id: activity.id,
          synced_at: new Date().toISOString()
        },
        created_by: userId
      })
    }
  } catch (error) {
    console.error('Error syncing activities:', error)
  }
}
