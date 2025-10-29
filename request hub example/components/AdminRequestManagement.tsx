import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { StatusBadge } from './StatusBadge';
import { AdminRequestDetailsModal } from './AdminRequestDetailsModal';
import { mockRequests, mockUsers, mockFormTemplates } from '../lib/mockData';
import { formatDateTime } from '../lib/utils';
import { Search, Filter, Eye } from 'lucide-react';
import { RequestStatus, ApprovalAction } from '../types';

interface AdminRequestManagementProps {
  currentUserId: string;
}

export function AdminRequestManagement({ currentUserId }: AdminRequestManagementProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filter requests
  const filteredRequests = mockRequests.filter((request) => {
    const submitter = mockUsers.find(u => u.id === request.staffUserId);
    const formTemplate = mockFormTemplates.find(ft => ft.requestType === request.requestType);
    
    const matchesSearch = 
      request.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submitter?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      formTemplate?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.requestType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleStatusChange = (
    requestId: string, 
    newStatus: RequestStatus, 
    action: ApprovalAction, 
    comments?: string
  ) => {
    console.log('Status changed:', { requestId, newStatus, action, comments });
    // In a real app, this would update the backend
    // For now, we'll just log and close the modal
  };

  // Get unique request types
  const requestTypes = Array.from(new Set(mockRequests.map(r => r.requestType)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>View and manage all system requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by ID, submitter, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RequestStatus | 'all')}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Denied">Denied</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {requestTypes.map((type) => {
                  const template = mockFormTemplates.find(ft => ft.requestType === type);
                  return (
                    <SelectItem key={type} value={type}>
                      {template?.name || type}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Showing {filteredRequests.length} of {mockRequests.length} requests
          </div>

          {/* Requests Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => {
                    const submitter = mockUsers.find(u => u.id === request.staffUserId);
                    const formTemplate = mockFormTemplates.find(ft => ft.requestType === request.requestType);
                    
                    return (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">{request.id}</TableCell>
                        <TableCell>{formTemplate?.name || request.requestType}</TableCell>
                        <TableCell>{submitter?.name}</TableCell>
                        <TableCell>{submitter?.department}</TableCell>
                        <TableCell>
                          <span className={`capitalize inline-flex items-center px-2 py-1 rounded text-xs ${
                            request.priority === 'high' 
                              ? 'bg-red-100 text-red-700' 
                              : request.priority === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {request.priority}
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDateTime(request.submittedDate)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequestId(request.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Request Details Modal */}
      {selectedRequestId && (
        <AdminRequestDetailsModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
          currentUserId={currentUserId}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
