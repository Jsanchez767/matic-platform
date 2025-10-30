"use client";

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-components/select';
import { Button } from '@/ui-components/button';
import { Card } from '@/ui-components/card';
import { Badge } from '@/ui-components/badge';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  CheckSquare,
  User,
  TrendingUp,
  Clock,
  CheckCircle,
  Eye,
  ChevronUp
} from 'lucide-react';
import { DashboardMetrics } from '@/components/RequestHub/DashboardMetrics';
import { RequestsByTypeChart, StatusDistributionChart } from '@/components/RequestHub/RequestsChart';
import { RequestList } from '@/components/RequestHub/RequestList';
import { StatusBadge } from '@/components/RequestHub/StatusBadge';
import type { Request, RequestUser, RequestDetail } from '@/types/request';

type TabType = 'dashboard' | 'my-requests' | 'new-request' | 'approvals';

// Mock data matching the screenshots
const mockUsers: RequestUser[] = [
  { id: 'u1', name: 'John Smith', email: 'john@example.com', role: 'staff', department: 'Education' },
  { id: 'u2', name: 'Jane Doe', email: 'jane@example.com', role: 'supervisor', department: 'Education' },
];

const mockRequests: Request[] = [
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

const mockRequestDetails: RequestDetail[] = [];

const requestTypes = [
  {
    id: 'program_supplies',
    name: 'Program Supplies Request',
    description: 'Request supplies for your program',
    icon: FileText,
  },
  {
    id: 'field_trip',
    name: 'Field Trip Request',
    description: 'Request approval for a field trip',
    icon: FileText,
  },
  {
    id: 'professional_development',
    name: 'Professional Development Request',
    description: 'Request to attend a workshop or conference',
    icon: FileText,
  },
];

export default function DemoRequestHubPage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [currentUser, setCurrentUser] = useState('u1');

  const currentUserData = mockUsers.find(u => u.id === currentUser) || mockUsers[0];

  // Calculate metrics
  const totalRequests = 7;
  const pendingApprovals = 2;
  const averageApprovalTime = 97; // hours
  const approvalRate = 29; // percentage

  // Chart data
  const requestsByType = [
    { request_type: 'Budget Request', count: 4 },
    { request_type: 'Field Trip', count: 2 },
    { request_type: 'Professional Development Request', count: 1 },
  ];

  const statusDistribution = [
    { status: 'Submitted', count: 1 },
    { status: 'Approved', count: 2 },
    { status: 'Denied', count: 1 },
    { status: 'Draft', count: 1 },
    { status: 'Completed', count: 1 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Request Management System</h1>
              <p className="text-sm text-gray-600">Streamlined approval workflows</p>
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
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="p-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Dashboard Overview</h2>
              <p className="text-gray-600">Real-time metrics and analytics</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-sm font-medium text-gray-600">Total Requests</div>
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{totalRequests}</div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <ChevronUp className="h-4 w-4" />
                  <span>12% from last month</span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-sm font-medium text-gray-600">Pending Approvals</div>
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{pendingApprovals}</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-sm font-medium text-gray-600">Avg. Approval Time</div>
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{averageApprovalTime}h</div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <ChevronUp className="h-4 w-4" />
                  <span>8% faster</span>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-sm font-medium text-gray-600">Approval Rate</div>
                  <CheckCircle className="h-5 w-5 text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{approvalRate}%</div>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RequestsByTypeChart data={requestsByType} />
              </div>
              <div>
                <StatusDistributionChart data={statusDistribution} />
              </div>
            </div>
          </div>
        )}

        {/* My Requests Tab */}
        {activeTab === 'my-requests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">My Requests</h2>
                <p className="text-gray-600">View and track your submitted requests</p>
              </div>
              <Button onClick={() => setActiveTab('new-request')}>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>

            {/* Request List */}
            <div className="space-y-4">
              {mockRequests.map((request) => {
                const requestType = requestTypes.find(t => t.id === request.request_type);
                return (
                  <Card key={request.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {requestType?.name.replace(' Request', '') || request.request_type}
                          </h3>
                          <StatusBadge status={request.status} />
                          <Badge variant="outline" className={
                            request.priority === 'high' ? 'border-red-200 text-red-600' :
                            request.priority === 'medium' ? 'border-yellow-200 text-yellow-600' :
                            'border-gray-200 text-gray-600'
                          }>
                            {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Submitted by: {currentUserData.name}</p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Submitted: {new Date(request.submitted_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            {request.completed_date && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>Completed: {new Date(request.completed_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">Request ID: {request.id}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* New Request Tab */}
        {activeTab === 'new-request' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Submit New Request</h2>
              <p className="text-gray-600">Choose a request type and fill out the form</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {requestTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card 
                    key={type.id}
                    className="p-8 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-500"
                  >
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-lg">
                        <Icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {type.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Approval Queue</h2>
              <p className="text-gray-600">Review and approve pending requests</p>
            </div>

            <Card className="p-8 text-center text-gray-500">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No pending approvals</p>
              <p className="text-sm mt-2">You're all caught up!</p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
