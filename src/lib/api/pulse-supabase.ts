/**
 * Pulse Supabase API Client
 * Temporary compatibility layer during migration to FastAPI
 * TODO: Migrate all usages to pulse-client.ts
 */

import { supabase } from '@/lib/supabase'

export const pulseSupabase = {
  /**
   * Get pulse configuration for a table
   */
  async getPulseConfig(tableId: string) {
    const { data, error } = await supabase
      .from('pulse_enabled_tables')
      .select('*')
      .eq('table_id', tableId)
      .single()

    if (error && error.code !== 'PGRST116') throw error // Ignore "not found" error
    return data
  },

  /**
   * Create pulse configuration
   */
  async createPulseConfig(configData: any) {
    const { data, error } = await supabase
      .from('pulse_enabled_tables')
      .insert(configData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update pulse configuration
   */
  async updatePulseConfig(configId: string, updates: any) {
    const { data, error } = await supabase
      .from('pulse_enabled_tables')
      .update(updates)
      .eq('id', configId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete pulse configuration
   */
  async deletePulseConfig(configId: string) {
    const { error } = await supabase
      .from('pulse_enabled_tables')
      .delete()
      .eq('id', configId)

    if (error) throw error
  },

  /**
   * Enable pulse for a table
   */
  async enablePulse(tableId: string, config: any) {
    const existingConfig = await this.getPulseConfig(tableId)

    if (existingConfig) {
      return await this.updatePulseConfig(existingConfig.id, {
        ...config,
        enabled: true
      })
    } else {
      return await this.createPulseConfig({
        table_id: tableId,
        enabled: true,
        ...config
      })
    }
  },

  /**
   * Disable pulse for a table
   */
  async disablePulse(tableId: string) {
    const config = await this.getPulseConfig(tableId)
    if (config) {
      return await this.updatePulseConfig(config.id, { enabled: false })
    }
  },

  /**
   * Get pulse scan history
   */
  async getPulseScanHistory(tableId: string, limit = 50) {
    const { data, error } = await supabase
      .from('pulse_scan_history')
      .select('*')
      .eq('table_id', tableId)
      .order('scanned_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  },

  /**
   * Record a pulse scan
   */
  async recordPulseScan(scanData: any) {
    const { data, error } = await supabase
      .from('pulse_scan_history')
      .insert(scanData)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
