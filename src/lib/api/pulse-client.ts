/**
 * Pulse Module API Client
 * Event check-in system client for Matic Platform
 */

import { getSessionToken } from '@/lib/supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ============================================================================
// TYPES (matching backend schemas)
// ============================================================================

export interface PulseSettings {
  show_popup: boolean;
  play_sound: boolean;
  highlight_checked_in: boolean;
  allow_duplicate_scans: boolean;
  scan_mode: 'rapid' | 'verification' | 'manual';
  offline_mode: boolean;
  guest_scanning_enabled: boolean;
}

export interface PulseEnabledTableCreate {
  table_id: string;
  workspace_id: string;
  check_in_column_id?: string;
  display_columns?: string[];
  settings?: PulseSettings;
}

export interface PulseEnabledTableUpdate {
  enabled?: boolean;
  check_in_column_id?: string;
  display_columns?: string[];
  settings?: PulseSettings;
}

export interface PulseEnabledTable {
  id: string;
  table_id: string;
  workspace_id: string;
  enabled: boolean;
  check_in_column_id?: string;
  display_columns?: string[];
  settings: PulseSettings;
  total_rsvps: number;
  checked_in_count: number;
  walk_in_count: number;
  last_check_in_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PulseCheckInCreate {
  pulse_table_id: string;
  table_id: string;
  row_id: string;
  barcode_scanned: string;
  scanner_user_name?: string;
  scanner_user_email?: string;
  scanner_device_id?: string;
  row_data?: Record<string, any>;
  is_walk_in?: boolean;
  notes?: string;
}

export interface PulseCheckIn {
  id: string;
  pulse_table_id: string;
  table_id: string;
  row_id: string;
  barcode_scanned: string;
  scanner_user_name?: string;
  scanner_user_email?: string;
  scanner_device_id?: string;
  check_in_time: string;
  check_in_count: number;
  row_data?: Record<string, any>;
  is_walk_in: boolean;
  notes?: string;
  created_at: string;
  created_by?: string;
}

export interface PulseScannerSessionCreate {
  pulse_table_id: string;
  pairing_code: string;
  scanner_name: string;
  scanner_email?: string;
  device_id?: string;
}

export interface PulseScannerSessionUpdate {
  is_active?: boolean;
  total_scans?: number;
  last_scan_at?: string;
}

export interface PulseScannerSession {
  id: string;
  pulse_table_id: string;
  pairing_code: string;
  scanner_name: string;
  scanner_email?: string;
  device_id?: string;
  is_active: boolean;
  last_scan_at?: string;
  total_scans: number;
  started_at: string;
  ended_at?: string;
}

export interface PulseDashboardStats {
  total_rsvps: number;
  checked_in_count: number;
  walk_in_count: number;
  check_in_rate: number;
  last_check_in_at?: string;
  active_scanners: number;
  recent_check_ins: PulseCheckIn[];
}

// ============================================================================
// API CLIENT
// ============================================================================

class PulseClient {
  /**
   * Enable Pulse check-in on a table
   */
  async enablePulse(config: PulseEnabledTableCreate): Promise<PulseEnabledTable> {
    const token = await getSessionToken();
    const response = await fetch(`${API_BASE}/pulse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to enable Pulse');
    }

    return response.json();
  }

  /**
   * Get Pulse configuration for a table
   */
  async getPulseConfig(tableId: string): Promise<PulseEnabledTable> {
    const token = await getSessionToken();
    const response = await fetch(`${API_BASE}/pulse/${tableId}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Pulse not enabled for this table');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get Pulse config');
    }

    return response.json();
  }

  /**
   * Update Pulse configuration
   */
  async updatePulseConfig(
    tableId: string,
    updates: PulseEnabledTableUpdate
  ): Promise<PulseEnabledTable> {
    const token = await getSessionToken();
    const response = await fetch(`${API_BASE}/pulse/${tableId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update Pulse config');
    }

    return response.json();
  }

  /**
   * Disable Pulse for a table
   */
  async disablePulse(tableId: string): Promise<void> {
    const token = await getSessionToken();
    const response = await fetch(`${API_BASE}/pulse/${tableId}`, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to disable Pulse');
    }
  }

  /**
   * Create a check-in event (used by scanner)
   */
  async createCheckIn(checkIn: PulseCheckInCreate): Promise<PulseCheckIn> {
    const token = await getSessionToken();
    const response = await fetch(`${API_BASE}/pulse/check-ins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(checkIn),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create check-in');
    }

    return response.json();
  }

  /**
   * Get check-ins for a table (paginated)
   */
  async getCheckIns(
    tableId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PulseCheckIn[]> {
    const token = await getSessionToken();
    const params = new URLSearchParams({
      table_id: tableId,
      ...(options?.limit && { limit: options.limit.toString() }),
      ...(options?.offset && { offset: options.offset.toString() }),
    });

    const response = await fetch(`${API_BASE}/pulse/check-ins?${params}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get check-ins');
    }

    return response.json();
  }

  /**
   * Get a specific check-in
   */
  async getCheckIn(checkInId: string): Promise<PulseCheckIn> {
    const token = await getSessionToken();
    const response = await fetch(`${API_BASE}/pulse/check-ins/${checkInId}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get check-in');
    }

    return response.json();
  }

  /**
   * Create a scanner session (for mobile pairing)
   */
  async createScannerSession(
    session: PulseScannerSessionCreate
  ): Promise<PulseScannerSession> {
    const token = await getSessionToken();
    const response = await fetch(`${API_BASE}/pulse/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(session),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create scanner session');
    }

    return response.json();
  }

  /**
   * Get scanner sessions for a table
   */
  async getScannerSessions(
    tableId: string,
    activeOnly: boolean = false
  ): Promise<PulseScannerSession[]> {
    const token = await getSessionToken();
    const params = new URLSearchParams({
      table_id: tableId,
      active_only: activeOnly.toString(),
    });

    const response = await fetch(`${API_BASE}/pulse/sessions?${params}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get scanner sessions');
    }

    return response.json();
  }

  /**
   * Update a scanner session
   */
  async updateScannerSession(
    sessionId: string,
    updates: PulseScannerSessionUpdate
  ): Promise<PulseScannerSession> {
    const token = await getSessionToken();
    const response = await fetch(`${API_BASE}/pulse/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update scanner session');
    }

    return response.json();
  }

  /**
   * Get real-time dashboard statistics
   */
  async getDashboardStats(
    tableId: string,
    recentLimit: number = 10
  ): Promise<PulseDashboardStats> {
    const token = await getSessionToken();
    const params = new URLSearchParams({
      recent_limit: recentLimit.toString(),
    });

    const response = await fetch(
      `${API_BASE}/pulse/dashboard/${tableId}?${params}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get dashboard stats');
    }

    return response.json();
  }
}

// Export singleton instance
export const pulseClient = new PulseClient();
