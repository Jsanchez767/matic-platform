/**
 * Pulse Module Supabase Client
 * Direct Supabase access for Pulse check-in system
 */

import { supabase } from '@/lib/supabase'
import type {
  PulseSettings,
  PulseEnabledTableCreate,
  PulseEnabledTableUpdate,
  PulseEnabledTable,
  PulseCheckInCreate,
  PulseCheckIn,
} from './pulse-client'

export const pulseSupabase = {
  /**
   * Enable Pulse check-in on a table
   */
  async enablePulse(config: PulseEnabledTableCreate): Promise<PulseEnabledTable> {
    console.log('🔵 Enabling Pulse via Supabase:', config)

    // Check if already enabled
    const { data: existing } = await supabase
      .from('pulse_enabled_tables')
      .select('*')
      .eq('table_id', config.table_id)
      .single()

    if (existing) {
      throw new Error('Pulse already enabled for this table')
    }

    // Create configuration
    const { data, error } = await supabase
      .from('pulse_enabled_tables')
      .insert({
        table_id: config.table_id,
        workspace_id: config.workspace_id,
        check_in_column_id: config.check_in_column_id,
        display_columns: config.display_columns,
        settings: config.settings || {
          show_popup: true,
          play_sound: false,
          highlight_checked_in: true,
          allow_duplicate_scans: false,
          scan_mode: 'rapid',
          offline_mode: true,
          guest_scanning_enabled: true,
          show_photos: true,
          show_notes: true,
          auto_scroll: true,
          alert_on_duplicate: true,
          alert_on_non_rsvp: true,
        },
        enabled: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Error enabling Pulse:', error)
      throw new Error(error.message)
    }

    console.log('✅ Pulse enabled successfully:', data)
    return data as PulseEnabledTable
  },

  /**
   * Get Pulse configuration for a table
   */
  async getPulseConfig(tableId: string): Promise<PulseEnabledTable | null> {
    const { data, error } = await supabase
      .from('pulse_enabled_tables')
      .select('*')
      .eq('table_id', tableId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      console.error('Error getting Pulse config:', error)
      throw new Error(error.message)
    }

    return data as PulseEnabledTable
  },

  /**
   * Update Pulse configuration
   */
  async updatePulseConfig(
    tableId: string,
    updates: PulseEnabledTableUpdate
  ): Promise<PulseEnabledTable> {
    const { data, error} = await supabase
      .from('pulse_enabled_tables')
      .update({
        enabled: updates.enabled,
        check_in_column_id: updates.check_in_column_id,
        display_columns: updates.display_columns,
        settings: updates.settings,
        updated_at: new Date().toISOString(),
      })
      .eq('table_id', tableId)
      .select()
      .single()

    if (error) {
      console.error('Error updating Pulse config:', error)
      throw new Error(error.message)
    }

    return data as PulseEnabledTable
  },

  /**
   * Disable Pulse for a table
   */
  async disablePulse(tableId: string): Promise<void> {
    const { error } = await supabase
      .from('pulse_enabled_tables')
      .delete()
      .eq('table_id', tableId)

    if (error) {
      console.error('Error disabling Pulse:', error)
      throw new Error(error.message)
    }
  },

  /**
   * Create a check-in event
   */
  async createCheckIn(checkIn: PulseCheckInCreate): Promise<PulseCheckIn> {
    // First verify Pulse is enabled
    const config = await this.getPulseConfig(checkIn.table_id)
    if (!config || !config.enabled) {
      throw new Error('Pulse not enabled for this table')
    }

    // Check for duplicates if not allowed
    const settings = config.settings as PulseSettings
    if (!settings.allow_duplicate_scans) {
      const { data: existing } = await supabase
        .from('pulse_check_ins')
        .select('*')
        .eq('pulse_table_id', config.id)
        .eq('row_id', checkIn.row_id)
        .single()

      if (existing) {
        // Update check-in count
        const { data, error } = await supabase
          .from('pulse_check_ins')
          .update({
            check_in_count: (existing.check_in_count || 1) + 1,
            check_in_time: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw new Error(error.message)
        return data as PulseCheckIn
      }
    }

    // Create new check-in
    const { data, error } = await supabase
      .from('pulse_check_ins')
      .insert({
        pulse_table_id: config.id,
        table_id: checkIn.table_id,
        row_id: checkIn.row_id,
        barcode_scanned: checkIn.barcode_scanned,
        scanner_user_name: checkIn.scanner_user_name,
        scanner_user_email: checkIn.scanner_user_email,
        scanner_device_id: checkIn.scanner_device_id,
        row_data: checkIn.row_data,
        is_walk_in: checkIn.is_walk_in || false,
        notes: checkIn.notes,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating check-in:', error)
      throw new Error(error.message)
    }

    return data as PulseCheckIn
  },

  /**
   * Get check-ins for a table
   */
  async getCheckIns(
    tableId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PulseCheckIn[]> {
    let query = supabase
      .from('pulse_check_ins')
      .select('*')
      .eq('table_id', tableId)
      .order('check_in_time', { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 100) - 1
      )
    }

    const { data, error } = await query

    if (error) {
      console.error('Error getting check-ins:', error)
      throw new Error(error.message)
    }

    return (data || []) as PulseCheckIn[]
  },
}
