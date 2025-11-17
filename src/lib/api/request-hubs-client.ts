/**
 * Request Hubs API Client - Go Backend
 * 
 * Handles all request hub and tab operations through Go Gin backend
 */

import { getSessionToken } from '@/lib/supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============================================================================
// Types (matching backend schemas)
// ============================================================================

export interface RequestHubTab {
  id: string;
  hub_id: string;
  name: string;
  slug: string;
  type: 'dashboard' | 'my-requests' | 'new-request' | 'approvals' | 'all-requests' | 'analytics' | 'custom';
  icon?: string;
  position: number;
  is_visible: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface RequestHub {
  id: string;
  workspace_id: string;
  name: string;
  slug: string;
  description?: string;
  settings: Record<string, any>;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RequestHubWithTabs extends RequestHub {
  tabs: RequestHubTab[];
}

export interface CreateRequestHubData {
  workspace_id: string;
  name: string;
  slug: string;
  description?: string;
  settings?: Record<string, any>;
  is_active?: boolean;
}

export interface UpdateRequestHubData {
  name?: string;
  slug?: string;
  description?: string;
  settings?: Record<string, any>;
  is_active?: boolean;
}

export interface CreateTabData {
  name: string;
  slug: string;
  type: RequestHubTab['type'];
  icon?: string;
  position?: number;
  is_visible?: boolean;
  config?: Record<string, any>;
}

export interface UpdateTabData {
  name?: string;
  slug?: string;
  type?: RequestHubTab['type'];
  icon?: string;
  position?: number;
  is_visible?: boolean;
  config?: Record<string, any>;
}

export interface ReorderTabsData {
  tabs: Array<{
    id: string;
    position: number;
  }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getAuthHeaders() {
  const token = await getSessionToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || error.message || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

// ============================================================================
// Request Hub Operations
// ============================================================================

export async function listRequestHubs(
  workspaceId: string,
  options?: {
    includeInactive?: boolean;
  }
): Promise<RequestHub[]> {
  const params = new URLSearchParams({ workspace_id: workspaceId });
  
  if (options?.includeInactive) {
    params.append('include_inactive', 'true');
  }

  return fetchWithAuth(`${API_BASE}/request-hubs?${params}`);
}

export async function getRequestHub(
  workspaceId: string,
  hubId: string
): Promise<RequestHubWithTabs> {
  return fetchWithAuth(`${API_BASE}/request-hubs/${hubId}`);
}

export async function getRequestHubBySlug(
  workspaceId: string,
  slug: string
): Promise<RequestHubWithTabs> {
  const params = new URLSearchParams({ workspace_id: workspaceId });
  return fetchWithAuth(`${API_BASE}/request-hubs/by-slug/${slug}?${params}`);
}

export async function createRequestHub(
  workspaceId: string,
  data: CreateRequestHubData
): Promise<RequestHubWithTabs> {
  return fetchWithAuth(`${API_BASE}/request-hubs`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRequestHub(
  workspaceId: string,
  hubId: string,
  data: UpdateRequestHubData
): Promise<RequestHubWithTabs> {
  return fetchWithAuth(`${API_BASE}/request-hubs/${hubId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteRequestHub(
  workspaceId: string,
  hubId: string
): Promise<void> {
  await fetchWithAuth(`${API_BASE}/request-hubs/${hubId}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Request Hub Tab Operations
// ============================================================================

export async function listRequestHubTabs(
  workspaceId: string,
  hubId: string,
  options?: {
    includeHidden?: boolean;
  }
): Promise<RequestHubTab[]> {
  const params = new URLSearchParams();
  
  if (options?.includeHidden) {
    params.append('include_hidden', 'true');
  }

  const queryString = params.toString();
  return fetchWithAuth(
    `${API_BASE}/request-hubs/${hubId}/tabs${queryString ? `?${queryString}` : ''}`
  );
}

export async function createRequestHubTab(
  workspaceId: string,
  hubId: string,
  data: CreateTabData
): Promise<RequestHubTab> {
  return fetchWithAuth(`${API_BASE}/request-hubs/${hubId}/tabs`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRequestHubTab(
  workspaceId: string,
  hubId: string,
  tabId: string,
  data: UpdateTabData
): Promise<RequestHubTab> {
  return fetchWithAuth(`${API_BASE}/request-hubs/${hubId}/tabs/${tabId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteRequestHubTab(
  workspaceId: string,
  hubId: string,
  tabId: string
): Promise<void> {
  await fetchWithAuth(`${API_BASE}/request-hubs/${hubId}/tabs/${tabId}`, {
    method: 'DELETE',
  });
}

export async function reorderRequestHubTabs(
  workspaceId: string,
  hubId: string,
  data: ReorderTabsData
): Promise<RequestHubTab[]> {
  return fetchWithAuth(`${API_BASE}/request-hubs/${hubId}/tabs/reorder`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
