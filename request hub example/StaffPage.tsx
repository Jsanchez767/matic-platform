import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DashboardMetrics } from '../components/DashboardMetrics';
import { RequestsByTypeChart, StatusDistributionChart, RequestTrendsChart } from '../components/RequestsChart';
import { RequestList } from '../components/RequestList';
import { DynamicForm } from '../components/DynamicForm';
import { ApprovalQueue } from '../components/ApprovalQueue';
import { mockUsers, mockRequests, mockRequestDetails, mockFormTemplates } from '../lib/mockData';
import { calculateHoursBetween } from '../lib/utils';
import { RequestsByType, RequestsByStatus, RequestTrend, User } from '../types';
import { LayoutDashboard, FileText, PlusCircle, CheckSquare, Settings } from 'lucide-react';

interface StaffPageProps {
  currentUser: User;
  onNavigateToAdmin: () => void;
}

export function StaffPage({ currentUser, onNavigateToAdmin }: StaffPageProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedFormType, setSelectedFormType] = useState<string>('');

  // Calculate metrics
  const totalRequests = mockRequests.length;
  const pendingApprovals = mockRequests.filter(
    r => r.status === 'Submitted' || r.status === 'Under Review'
  ).length;

  const completedRequests = mockRequests.filter(
    r => r.completedDate && r.status === 'Approved'
  );
  const avgApprovalTime = completedRequests.length > 0
    ? completedRequests.reduce((acc, r) => {
        return acc + calculateHoursBetween(r.submittedDate, r.completedDate!);
      }, 0) / completedRequests.length
    : 0;

  const approvedCount = mockRequests.filter(r => r.status === 'Approved').length;
  const approvalRate = totalRequests > 0 ? (approvedCount / totalRequests) * 100 : 0;

  // Requests by type
  const requestsByType: RequestsByType[] = mockFormTemplates.map(template => ({
    requestType: template.name,
    count: mockRequests.filter(r => r.requestType === template.requestType).length,
  }));

  // Requests by status
  const statusCounts: Record<string, number> = mockRequests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const requestsByStatus: RequestsByStatus[] = Object.entries(statusCounts).map(([status, count]) => ({
    status: status as any,
    count,
  }));

  // Request trends (last 30 days)
  const requestTrends: RequestTrend[] = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dateStr = date.toISOString().split('T')[0];
    
    // Simulate some trend data
    const count = Math.floor(Math.random() * 5) + 1;
    
    return {
      date: dateStr.slice(5), // MM-DD format
      count,
    };
  });

  // Filter requests by current user
  const myRequests = mockRequests.filter(r => r.staffUserId === currentUser.id);

  // Handle form submission
  const handleFormSubmit = (data: Record<string, any>, isDraft: boolean) => {
    console.log('Form submitted:', { data, isDraft });
    alert(`Request ${isDraft ? 'saved as draft' : 'submitted'} successfully!`);
    setSelectedFormType('');
    setActiveTab('my-requests');
  };

  // Handle approval action
  const handleApprovalAction = (requestId: string, action: any, comments?: string) => {
    console.log('Approval action:', { requestId, action, comments });
    alert(`Request ${action === 'approve' ? 'approved' : 'denied'} successfully!`);
  };

  // Check if user should see admin button
  const showAdminButton = currentUser.role === 'admin';

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="my-requests" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">My Requests</span>
            </TabsTrigger>
            <TabsTrigger value="new-request" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">New Request</span>
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Approvals</span>
            </TabsTrigger>
          </TabsList>
          
          {showAdminButton && (
            <Button onClick={onNavigateToAdmin} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Admin Panel
            </Button>
          )}
        </div>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div>
            <h2>Dashboard Overview</h2>
            <p className="text-gray-600">Real-time metrics and analytics</p>
          </div>

          <DashboardMetrics
            totalRequests={totalRequests}
            pendingApprovals={pendingApprovals}
            averageApprovalTime={avgApprovalTime}
            approvalRate={approvalRate}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RequestsByTypeChart data={requestsByType} />
            <StatusDistributionChart data={requestsByStatus} />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <RequestTrendsChart data={requestTrends} />
          </div>

          {/* Recent Requests */}
          <div>
            <h3 className="mb-4">Recent Requests</h3>
            <RequestList
              requests={mockRequests.slice(0, 5)}
              users={mockUsers}
              requestDetails={mockRequestDetails}
              currentUserId={currentUser.id}
            />
          </div>
        </TabsContent>

        {/* My Requests Tab */}
        <TabsContent value="my-requests" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2>My Requests</h2>
              <p className="text-gray-600">View and track your submitted requests</p>
            </div>
            <Button onClick={() => setActiveTab('new-request')}>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>

          <RequestList
            requests={myRequests}
            users={mockUsers}
            requestDetails={mockRequestDetails}
            currentUserId={currentUser.id}
          />
        </TabsContent>

        {/* New Request Tab */}
        <TabsContent value="new-request" className="space-y-6">
          <div>
            <h2>Submit New Request</h2>
            <p className="text-gray-600">Choose a request type and fill out the form</p>
          </div>

          {!selectedFormType ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockFormTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedFormType(template.requestType)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </Card>
              ))}
            </div>
          ) : (
            <div>
              <Button
                variant="outline"
                onClick={() => setSelectedFormType('')}
                className="mb-4"
              >
                ← Back to Request Types
              </Button>
              <DynamicForm
                formTemplate={mockFormTemplates.find(t => t.requestType === selectedFormType)!}
                onSubmit={handleFormSubmit}
              />
            </div>
          )}
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-6">
          <div>
            <h2>Pending Approvals</h2>
            <p className="text-gray-600">Review and approve requests requiring your attention</p>
          </div>

          <ApprovalQueue
            currentUser={currentUser}
            onApprovalAction={handleApprovalAction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
