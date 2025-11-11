"use client";

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-components/select';
import { Button } from '@/ui-components/button';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  CheckSquare,
  User,
  Settings as SettingsIcon
} from 'lucide-react';
import { MyRequestsPage } from '@/components/RequestHub/MyRequestsPage';
import { NewRequestForm } from '@/components/RequestHub/NewRequestForm';
import { EnhancedDashboard } from '@/components/RequestHub/EnhancedDashboard';
import { SettingsPage } from '@/components/RequestHub/SettingsPage';
import { AdminApprovalQueue } from '@/components/RequestHub/AdminApprovalQueue';
import { ToastContainer, showToast } from '@/lib/toast';
import type { Request, RequestUser, FormTemplate, RequestMetrics, ApprovalAction } from '@/types/request';

type TabType = 'dashboard' | 'my-requests' | 'new-request' | 'approvals' | 'settings';

// Mock data
const mockUsers: RequestUser[] = [
  { id: 'u1', name: 'John Smith', email: 'john@example.com', role: 'staff', department: 'Education' },
  { id: 'u2', name: 'Jane Doe', email: 'jane@example.com', role: 'admin', department: 'Administration' },
  { id: 'u3', name: 'Bob Johnson', email: 'bob@example.com', role: 'supervisor', department: 'Education' },
];

const mockFormTemplates: FormTemplate[] = [
  {
    id: 'program_supplies',
    hub_id: 'hub1',
    request_type: 'program_supplies',
    name: 'Program Supplies Request',
    description: 'Request supplies for your program',
    fields: [
      { id: 'f1', name: 'program_name', label: 'Program Name', type: 'text', required: true },
      { id: 'f2', name: 'supplies_needed', label: 'Supplies Needed', type: 'textarea', required: true },
      { id: 'f3', name: 'estimated_cost', label: 'Estimated Cost', type: 'number', required: true },
      { id: 'f4', name: 'date_needed', label: 'Date Needed', type: 'date', required: true },
    ],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'field_trip',
    hub_id: 'hub1',
    request_type: 'field_trip',
    name: 'Field Trip Request',
    description: 'Request approval for a field trip',
    fields: [
      { id: 'f1', name: 'destination', label: 'Destination', type: 'text', required: true },
      { id: 'f2', name: 'date', label: 'Trip Date', type: 'date', required: true },
      { id: 'f3', name: 'purpose', label: 'Purpose', type: 'textarea', required: true },
      { id: 'f4', name: 'number_of_students', label: 'Number of Students', type: 'number', required: true },
      { id: 'f5', name: 'transportation', label: 'Transportation Needed', type: 'select', required: true, options: ['Bus', 'Van', 'Walking', 'Parent Drivers'] },
    ],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'professional_development',
    hub_id: 'hub1',
    request_type: 'professional_development',
    name: 'Professional Development Request',
    description: 'Request to attend a workshop or conference',
    fields: [
      { id: 'f1', name: 'event_name', label: 'Event Name', type: 'text', required: true },
      { id: 'f2', name: 'event_date', label: 'Event Date', type: 'date', required: true },
      { id: 'f3', name: 'location', label: 'Location', type: 'text', required: true },
      { id: 'f4', name: 'cost', label: 'Registration Cost', type: 'number', required: true },
      { id: 'f5', name: 'justification', label: 'Justification', type: 'textarea', required: true },
    ],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const initialMockRequests: Request[] = [
  {
    id: 'r1',
    hub_id: 'hub1',
    staff_user_id: 'u1',
    request_type: 'program_supplies',
    status: 'Approved',
    submitted_date: '2024-10-15T10:00:00Z',
    completed_date: '2024-10-18T14:30:00Z',
    priority: 'medium',
    current_step: 3,
    created_at: '2024-10-15T10:00:00Z',
    updated_at: '2024-10-18T14:30:00Z',
  },
  {
    id: 'r2',
    hub_id: 'hub1',
    staff_user_id: 'u1',
    request_type: 'field_trip',
    status: 'Under Review',
    submitted_date: '2024-10-25T09:00:00Z',
    priority: 'high',
    current_step: 1,
    created_at: '2024-10-25T09:00:00Z',
    updated_at: '2024-10-25T09:00:00Z',
  },
  {
    id: 'r3',
    hub_id: 'hub1',
    staff_user_id: 'u3',
    request_type: 'professional_development',
    status: 'Submitted',
    submitted_date: '2024-11-01T14:00:00Z',
    priority: 'low',
    current_step: 0,
    created_at: '2024-11-01T14:00:00Z',
    updated_at: '2024-11-01T14:00:00Z',
  },
  {
    id: 'r4',
    hub_id: 'hub1',
    staff_user_id: 'u1',
    request_type: 'program_supplies',
    status: 'Draft',
    submitted_date: '2024-11-05T11:00:00Z',
    priority: 'medium',
    current_step: 0,
    created_at: '2024-11-05T11:00:00Z',
    updated_at: '2024-11-05T11:00:00Z',
  },
  {
    id: 'r5',
    hub_id: 'hub1',
    staff_user_id: 'u1',
    request_type: 'program_supplies',
    status: 'Completed',
    submitted_date: '2024-10-05T11:00:00Z',
    completed_date: '2024-10-12T16:00:00Z',
    priority: 'medium',
    current_step: 4,
    created_at: '2024-10-05T11:00:00Z',
    updated_at: '2024-10-12T16:00:00Z',
  },
];

export default function DemoRequestHubPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [currentUser, setCurrentUser] = useState('u1');
  const [isAdminView, setIsAdminView] = useState(false);
  const [requests, setRequests] = useState<Request[]>(initialMockRequests);

  const currentUserData = mockUsers.find(u => u.id === currentUser) || mockUsers[0];

  // Filter requests based on user and admin view
  const visibleRequests = isAdminView 
    ? requests 
    : requests.filter(r => r.staff_user_id === currentUser);

  // Calculate metrics
  const metrics: RequestMetrics = {
    total_requests: visibleRequests.length,
    pending_approvals: visibleRequests.filter(r => r.status === 'Submitted' || r.status === 'Under Review').length,
    average_approval_time: 97,
    approval_rate: 29,
    denial_rate: 14,
  };

  // Request type mapping
  const requestTypesMap = mockFormTemplates.reduce((acc, template) => {
    acc[template.request_type] = { name: template.name };
    return acc;
  }, {} as Record<string, { name: string }>);

  // Users mapping
  const usersMap = mockUsers.reduce((acc, user) => {
    acc[user.id] = { name: user.name, email: user.email };
    return acc;
  }, {} as Record<string, { name: string; email: string }>);

  // Handlers
  const handleNewRequest = () => {
    setActiveTab('new-request');
  };

  const handleSubmitRequest = async (data: {
    request_type: string;
    form_data: Record<string, any>;
    status: 'Draft' | 'Submitted';
  }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newRequest: Request = {
      id: `r${requests.length + 1}`,
      hub_id: 'hub1',
      staff_user_id: currentUser,
      request_type: data.request_type,
      status: data.status,
      submitted_date: new Date().toISOString(),
      priority: 'medium',
      current_step: data.status === 'Draft' ? 0 : 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setRequests([...requests, newRequest]);
    
    if (data.status === 'Draft') {
      showToast('Request saved as draft', 'success');
    } else {
      showToast('Request submitted successfully!', 'success');
    }
    
    setActiveTab('my-requests');
  };

  const handleApprove = async (requestIds: string[], action: ApprovalAction) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setRequests(requests.map(r => {
      if (requestIds.includes(r.id)) {
        return {
          ...r,
          status: action === 'approve' ? 'Approved' : action === 'deny' ? 'Denied' : r.status,
          completed_date: action === 'approve' || action === 'deny' ? new Date().toISOString() : r.completed_date,
          updated_at: new Date().toISOString(),
        };
      }
      return r;
    }));

    const actionText = action === 'approve' ? 'approved' : action === 'deny' ? 'denied' : 'processed';
    showToast(`${requestIds.length} request${requestIds.length > 1 ? 's' : ''} ${actionText}`, 'success');
  };

  const handleViewRequest = (id: string) => {
    showToast(`Viewing request ${id}`, 'info');
  };

  const handleEditRequest = (id: string) => {
    showToast(`Editing request ${id}`, 'info');
  };

  const handleDeleteRequest = (id: string) => {
    if (confirm('Are you sure you want to delete this request?')) {
      setRequests(requests.filter(r => r.id !== id));
      showToast('Request deleted', 'success');
    }
  };

  const handleSaveSettings = async (settings: any) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToast('Settings saved successfully!', 'success');
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Request Management System</h1>
                <p className="text-sm text-gray-600">Streamlined approval workflows with enhanced features</p>
              </div>
              
              {/* User Switcher */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{currentUserData.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{currentUserData.role}</p>
                  </div>
                </div>
                <Select value={currentUser} onValueChange={setCurrentUser}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white border-b px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'dashboard' 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </button>
            
            <button
              onClick={() => setActiveTab('my-requests')}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'my-requests' 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <FileText className="h-4 w-4" />
              My Requests
            </button>
            
            <button
              onClick={() => setActiveTab('new-request')}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'new-request' 
                  ? 'border-gray-900 text-gray-900' 
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <PlusCircle className="h-4 w-4" />
              New Request
            </button>
            
            {(currentUserData.role === 'admin' || currentUserData.role === 'supervisor') && (
              <button
                onClick={() => setActiveTab('approvals')}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === 'approvals' 
                    ? 'border-gray-900 text-gray-900' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <CheckSquare className="h-4 w-4" />
                Approvals
                {metrics.pending_approvals > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {metrics.pending_approvals}
                  </span>
                )}
              </button>
            )}
            
            {currentUserData.role === 'admin' && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === 'settings' 
                    ? 'border-gray-900 text-gray-900' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <SettingsIcon className="h-4 w-4" />
                Settings
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <main className="p-6">
          {activeTab === 'dashboard' && (
            <EnhancedDashboard
              requests={visibleRequests}
              metrics={metrics}
              userRole={currentUserData.role}
              isAdminView={isAdminView}
              onToggleAdminView={() => setIsAdminView(!isAdminView)}
              onNewRequest={handleNewRequest}
              onViewApprovals={() => setActiveTab('approvals')}
              onViewSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'my-requests' && (
            <MyRequestsPage
              requests={visibleRequests}
              currentUserId={currentUser}
              onNewRequest={handleNewRequest}
              onViewRequest={handleViewRequest}
              onEditRequest={handleEditRequest}
              onDeleteRequest={handleDeleteRequest}
              requestTypesMap={requestTypesMap}
              assignedUsersMap={usersMap}
            />
          )}

          {activeTab === 'new-request' && (
            <NewRequestForm
              templates={mockFormTemplates}
              onSubmit={handleSubmitRequest}
              onCancel={() => setActiveTab('my-requests')}
            />
          )}

          {activeTab === 'approvals' && (
            <AdminApprovalQueue
              requests={requests}
              onApprove={handleApprove}
              onViewRequest={handleViewRequest}
              requestTypesMap={requestTypesMap}
              usersMap={usersMap}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              onClose={() => setActiveTab('dashboard')}
              onSave={handleSaveSettings}
              initialSettings={{
                requestTypes: mockFormTemplates,
                workflows: [],
                notifications: {
                  emailOnSubmit: true,
                  emailOnApprove: true,
                  emailOnDeny: true,
                  slackWebhook: '',
                },
              }}
            />
          )}
        </main>
      </div>
      
      {/* Toast Container */}
      <ToastContainer />
    </>
  );
}
