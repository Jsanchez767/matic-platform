// Navigation v2 Types
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan_type: 'free' | 'premium' | 'enterprise';
  description?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  workspaceId: string;
  layout: DashboardLayout;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  id: string;
  name: string;
  modules: ModuleInstance[];
  connections: Connection[];
  gridSettings: GridConfig;
}

export interface ModuleInstance {
  id: string;
  type: 'forms' | 'email' | 'chat' | 'list' | 'chart' | 'projects' | 'documents' | 'discussions';
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  title: string;
}

export interface Connection {
  id: string;
  fromModuleId: string;
  toModuleId: string;
  fromPort: string;
  toPort: string;
  type: 'data' | 'action' | 'event';
}

export interface GridConfig {
  columns: number;
  gap: number;
  snapToGrid: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface TabState {
  tabs: Dashboard[];
  activeTabId: string;
  tabOrder: string[];
}

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: 'workspace' | 'dashboard' | 'module' | 'action' | 'search';
  icon?: string;
  action: () => void;
  keywords: string[];
}