"use client";

import { useState, useMemo } from 'react';
import { Card } from '@/ui-components/card';
import { Button } from '@/ui-components/button';
import { Checkbox } from '@/ui-components/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-components/select';
import { Badge } from '@/ui-components/badge';
import { StatusBadge } from './StatusBadge';
import {
  CheckSquare,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Filter,
  User,
  Calendar
} from 'lucide-react';
import type { Request, ApprovalAction } from '@/types/request';

interface AdminApprovalQueueProps {
  requests: Request[];
  onApprove: (requestIds: string[], action: ApprovalAction) => Promise<void>;
  onViewRequest: (id: string) => void;
  requestTypesMap?: Record<string, { name: string }>;
  usersMap?: Record<string, { name: string; email: string }>;
}

export function AdminApprovalQueue({
  requests,
  onApprove,
  onViewRequest,
  requestTypesMap = {},
  usersMap = {}
}: AdminApprovalQueueProps) {
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'under_review'>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter requests that need approval
  const pendingRequests = useMemo(() => {
    return requests.filter(r => {
      const needsApproval = r.status === 'Submitted' || r.status === 'Under Review';
      
      if (!needsApproval) return false;
      
      if (filterStatus === 'submitted') return r.status === 'Submitted';
      if (filterStatus === 'under_review') return r.status === 'Under Review';
      
      return true;
    });
  }, [requests, filterStatus]);

  const handleSelectAll = () => {
    if (selectedRequests.size === pendingRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(pendingRequests.map(r => r.id)));
    }
  };

  const handleSelectRequest = (id: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRequests(newSelected);
  };

  const handleBulkAction = async (action: ApprovalAction) => {
    if (selectedRequests.size === 0) return;
    
    setIsProcessing(true);
    try {
      await onApprove(Array.from(selectedRequests), action);
      setSelectedRequests(new Set());
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRequestTitle = (request: Request) => {
    return requestTypesMap[request.request_type]?.name || request.request_type;
  };

  const getUserName = (userId: string) => {
    return usersMap[userId]?.name || 'Unknown User';
  };

  return (
    <div className="space-y-6">
      {/* Header with Bulk Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Approval Queue</h2>
          <p className="text-gray-600">Review and approve pending requests</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pending</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedRequests.size > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectedRequests.size === pendingRequests.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium text-gray-900">
                {selectedRequests.size} request{selectedRequests.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleBulkAction('approve')}
                disabled={isProcessing}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Selected
              </Button>
              <Button
                onClick={() => handleBulkAction('deny')}
                disabled={isProcessing}
                size="sm"
                variant="outline"
                className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Deny Selected
              </Button>
              <Button
                onClick={() => setSelectedRequests(new Set())}
                disabled={isProcessing}
                size="sm"
                variant="ghost"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Selection
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Requests Table */}
      {pendingRequests.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending approvals</h3>
          <p className="text-gray-600">You're all caught up! 🎉</p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <Checkbox
                      checked={selectedRequests.size === pendingRequests.length && pendingRequests.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRequests.map((request) => (
                  <tr 
                    key={request.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedRequests.has(request.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <Checkbox
                        checked={selectedRequests.has(request.id)}
                        onCheckedChange={() => handleSelectRequest(request.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <CheckSquare className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {getRequestTitle(request)}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {request.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {getUserName(request.staff_user_id)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {formatDate(request.submitted_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant="outline"
                        className={
                          request.priority === 'high'
                            ? 'border-red-200 text-red-700 bg-red-50'
                            : request.priority === 'medium'
                            ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
                            : 'border-gray-200 text-gray-700 bg-gray-50'
                        }
                      >
                        {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewRequest(request.id)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBulkAction('approve')}
                          disabled={isProcessing}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Approve"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBulkAction('deny')}
                          disabled={isProcessing}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Deny"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      {pendingRequests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {pendingRequests.filter(r => r.status === 'Submitted').length}
                </div>
                <div className="text-sm text-gray-600">Newly Submitted</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {pendingRequests.filter(r => r.status === 'Under Review').length}
                </div>
                <div className="text-sm text-gray-600">Under Review</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckSquare className="h-8 w-8 text-gray-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedRequests.size}
                </div>
                <div className="text-sm text-gray-600">Selected for Action</div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
