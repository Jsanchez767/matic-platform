"use client";

import { useState } from 'react';
import { Request, RequestUser, RequestDetail } from '@/types/request';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '@/lib/request-utils';
import { Card } from '@/ui-components/card';
import { Button } from '@/ui-components/button';
import { Eye, FileText, Clock } from 'lucide-react';
import { RequestDetailsModal } from './RequestDetailsModal';

interface RequestListProps {
  requests: Request[];
  users: RequestUser[];
  requestDetails: RequestDetail[];
  currentUserId: string;
  onRequestClick?: (requestId: string) => void;
}

export function RequestList({ requests, users, requestDetails, currentUserId, onRequestClick }: RequestListProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown';
  };

  const getRequestTypeName = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-gray-600',
      medium: 'text-yellow-600',
      high: 'text-red-600',
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  const handleViewDetails = (requestId: string) => {
    setSelectedRequestId(requestId);
    onRequestClick?.(requestId);
  };

  return (
    <>
      <div className="space-y-4">
        {requests.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No requests found</p>
          </Card>
        ) : (
          requests.map((request) => {
            const submitter = users.find(u => u.id === request.staff_user_id);

            return (
              <Card key={request.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{getRequestTypeName(request.request_type)}</h3>
                      <StatusBadge status={request.status} />
                      <span className={`text-sm ${getPriorityColor(request.priority)}`}>
                        {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Submitted by: {getUserName(request.staff_user_id)}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>Submitted: {formatDate(request.submitted_date)}</span>
                        </div>
                        {request.completed_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Completed: {formatDate(request.completed_date)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Request ID: {request.id}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(request.id)}
                    className="ml-4"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {selectedRequestId && (
        <RequestDetailsModal
          requestId={selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
        />
      )}
    </>
  );
}
