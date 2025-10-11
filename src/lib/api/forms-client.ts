/**
 * API client for forms endpoints
 */

export interface FormField {
  id?: string;
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  field_type: string;
  settings?: Record<string, any>;
  validation?: Record<string, any>;
  options?: Record<string, any>;
  position: number;
  width?: string;
  is_visible?: boolean;
}

export interface Form {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  slug: string;
  settings?: Record<string, any>;
  submit_settings?: Record<string, any>;
  status: 'draft' | 'published' | 'archived' | 'paused';
  version: number;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  fields: FormField[];
}

export interface FormCreate {
  workspace_id: string;
  name: string;
  description?: string;
  slug: string;
  settings?: Record<string, any>;
  submit_settings?: Record<string, any>;
  status?: 'draft' | 'published' | 'archived' | 'paused';
  is_public?: boolean;
  created_by: string;
  fields?: FormField[];
}

export interface FormUpdate {
  name?: string;
  description?: string;
  slug?: string;
  settings?: Record<string, any>;
  submit_settings?: Record<string, any>;
  status?: 'draft' | 'published' | 'archived' | 'paused';
  is_public?: boolean;
  version?: number;
  fields?: FormField[];
}

// @ts-ignore - Next.js injects env vars at build time
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

export const formsAPI = {
  /**
   * List all forms in a workspace
   */
  list: async (workspaceId: string): Promise<Form[]> => {
    return fetchAPI<Form[]>(`/forms/?workspace_id=${workspaceId}`);
  },

  /**
   * Get a single form by ID (includes fields)
   */
  get: async (formId: string): Promise<Form> => {
    return fetchAPI<Form>(`/forms/${formId}/`);
  },

  /**
   * Create a new form
   */
  create: async (data: FormCreate): Promise<Form> => {
    return fetchAPI<Form>('/forms/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a form (replaces all fields)
   */
  update: async (formId: string, data: FormUpdate): Promise<Form> => {
    return fetchAPI<Form>(`/forms/${formId}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Publish a form (shortcut for status update)
   */
  publish: async (formId: string): Promise<Form> => {
    return formsAPI.update(formId, {
      status: 'published',
    });
  },

  /**
   * Archive a form (shortcut for status update)
   */
  archive: async (formId: string): Promise<Form> => {
    return formsAPI.update(formId, {
      status: 'archived',
    });
  },
};

export default formsAPI;
