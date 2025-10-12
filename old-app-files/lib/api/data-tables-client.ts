/**
 * API client for data tables/sheets endpoints
 */

import type {
  DataTable,
  DataTableCreate,
  DataTableUpdate,
  TableRow,
  TableRowCreate,
  TableRowUpdate,
  TableRowBulkCreate,
  TableView,
  TableViewCreate,
  TableViewUpdate,
  TableComment,
  TableCommentCreate,
} from '../types/data-tables';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Helper function for API calls
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

// Table CRUD operations
export const tablesAPI = {
  /**
   * List all tables in a workspace
   */
  list: async (workspaceId: string, includeArchived = false): Promise<DataTable[]> => {
    return fetchAPI<DataTable[]>(
      `/tables?workspace_id=${workspaceId}&include_archived=${includeArchived}`
    );
  },

  /**
   * Get a single table by ID
   */
  get: async (tableId: string): Promise<DataTable> => {
    return fetchAPI<DataTable>(`/tables/${tableId}`);
  },

  /**
   * Create a new table
   */
  create: async (data: DataTableCreate): Promise<DataTable> => {
    return fetchAPI<DataTable>('/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a table
   */
  update: async (tableId: string, data: DataTableUpdate): Promise<DataTable> => {
    return fetchAPI<DataTable>(`/tables/${tableId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a table
   */
  delete: async (tableId: string): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/tables/${tableId}`, {
      method: 'DELETE',
    });
  },
};

// Row operations
export const rowsAPI = {
  /**
   * List rows in a table
   */
  list: async (
    tableId: string,
    options?: {
      includeArchived?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<TableRow[]> => {
    const params = new URLSearchParams({
      include_archived: String(options?.includeArchived ?? false),
      limit: String(options?.limit ?? 100),
      offset: String(options?.offset ?? 0),
    });
    return fetchAPI<TableRow[]>(`/tables/${tableId}/rows?${params}`);
  },

  /**
   * Get a single row
   */
  get: async (tableId: string, rowId: string): Promise<TableRow> => {
    return fetchAPI<TableRow>(`/tables/${tableId}/rows/${rowId}`);
  },

  /**
   * Create a new row
   */
  create: async (tableId: string, data: TableRowCreate): Promise<TableRow> => {
    return fetchAPI<TableRow>(`/tables/${tableId}/rows`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Create multiple rows at once (bulk import)
   */
  createBulk: async (tableId: string, data: TableRowBulkCreate): Promise<TableRow[]> => {
    return fetchAPI<TableRow[]>(`/tables/${tableId}/rows/bulk`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a row
   */
  update: async (tableId: string, rowId: string, data: TableRowUpdate): Promise<TableRow> => {
    return fetchAPI<TableRow>(`/tables/${tableId}/rows/${rowId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a row
   */
  delete: async (tableId: string, rowId: string): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/tables/${tableId}/rows/${rowId}`, {
      method: 'DELETE',
    });
  },
};

// View operations
export const viewsAPI = {
  /**
   * List all views for a table
   */
  list: async (tableId: string): Promise<TableView[]> => {
    return fetchAPI<TableView[]>(`/tables/${tableId}/views`);
  },

  /**
   * Create a new view
   */
  create: async (tableId: string, data: TableViewCreate): Promise<TableView> => {
    return fetchAPI<TableView>(`/tables/${tableId}/views`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a view
   */
  update: async (tableId: string, viewId: string, data: TableViewUpdate): Promise<TableView> => {
    return fetchAPI<TableView>(`/tables/${tableId}/views/${viewId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a view
   */
  delete: async (tableId: string, viewId: string): Promise<{ message: string }> => {
    return fetchAPI<{ message: string }>(`/tables/${tableId}/views/${viewId}`, {
      method: 'DELETE',
    });
  },
};

// Comment operations
export const commentsAPI = {
  /**
   * List comments for a row
   */
  list: async (tableId: string, rowId: string): Promise<TableComment[]> => {
    return fetchAPI<TableComment[]>(`/tables/${tableId}/rows/${rowId}/comments`);
  },

  /**
   * Create a comment on a row
   */
  create: async (
    tableId: string,
    rowId: string,
    data: TableCommentCreate
  ): Promise<TableComment> => {
    return fetchAPI<TableComment>(`/tables/${tableId}/rows/${rowId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Export all APIs
export const dataTablesClient = {
  tables: tablesAPI,
  rows: rowsAPI,
  views: viewsAPI,
  comments: commentsAPI,
};

export default dataTablesClient;
