// Core Types
export type RequestStatus = 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Denied' | 'Completed';

export type UserRole = 'staff' | 'supervisor' | 'program_director' | 'finance' | 'admin' | 'transportation';

export type ApprovalAction = 'approve' | 'deny' | 'pending';

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'file' | 'item_list';

// Database Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
}

export interface Request {
  id: string;
  staffUserId: string;
  requestType: string;
  status: RequestStatus;
  submittedDate: string;
  completedDate?: string;
  priority: 'low' | 'medium' | 'high';
  currentStep: number;
  workflowInstanceId?: string;
}

export interface RequestDetail {
  id: string;
  requestId: string;
  fieldKey: string;
  fieldValue: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface FormTemplate {
  id: string;
  requestType: string;
  name: string;
  description: string;
  fields: FormField[];
  workflowTemplateId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  stepNumber: number;
  name: string;
  approverRoles: UserRole[];
  requiredApprovals: number; // For parallel approval
  timeoutHours?: number;
  conditions?: {
    field: string;
    operator: 'equals' | 'greater_than' | 'less_than';
    value: string | number;
  }[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  createdAt: string;
}

export interface WorkflowInstance {
  id: string;
  requestId: string;
  workflowTemplateId: string;
  currentStep: number;
  status: 'active' | 'completed' | 'cancelled';
  approvalHistory: ApprovalAction[];
  createdAt: string;
}

export interface ApprovalActionRecord {
  id: string;
  requestId: string;
  workflowInstanceId: string;
  approverId: string;
  stepNumber: number;
  action: ApprovalAction;
  comments?: string;
  timestamp: string;
}

export interface Attachment {
  id: string;
  requestId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

export interface Notification {
  id: string;
  userId: string;
  requestId: string;
  type: 'status_change' | 'approval_needed' | 'escalation' | 'completion';
  message: string;
  read: boolean;
  createdAt: string;
}

// Analytics Types
export interface RequestMetrics {
  totalRequests: number;
  pendingApprovals: number;
  averageApprovalTime: number; // in hours
  approvalRate: number; // percentage
  denialRate: number; // percentage
}

export interface RequestsByType {
  requestType: string;
  count: number;
}

export interface RequestsByStatus {
  status: RequestStatus;
  count: number;
}

export interface RequestTrend {
  date: string;
  count: number;
}
