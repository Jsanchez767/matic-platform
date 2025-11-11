"use client";

import { useState, useMemo } from 'react';
import { Card } from '@/ui-components/card';
import { Button } from '@/ui-components/button';
import { Input } from '@/ui-components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-components/select';
import { Badge } from '@/ui-components/badge';
import { StatusBadge } from './StatusBadge';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  FileText,
  Calendar,
  User,
  Tag,
  Clock
} from 'lucide-react';
import type { Request, RequestStatus } from '@/types/request';

interface MyRequestsPageProps {
  requests: Request[];
  currentUserId: string;
  onNewRequest: () => void;
  onViewRequest?: (id: string) => void;
  onEditRequest?: (id: string) => void;
  onDeleteRequest?: (id: string) => void;
  requestTypesMap?: Record<string, { name: string; icon?: any }>;
  assignedUsersMap?: Record<string, { name: string; email: string }>;
}

type StatusFilter = 'All' | RequestStatus;

export function MyRequestsPage({
  requests,
  currentUserId,
  onNewRequest,
  onViewRequest,
  onEditRequest,
  onDeleteRequest,
  requestTypesMap = {},
  assignedUsersMap = {}
}: MyRequestsPageProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  // Get unique request types
  const requestTypes = useMemo(() => {
    const types = new Set(requests.map(r => r.request_type));
    return ['All', ...Array.from(types)];
  }, [requests]);

  // Filter and search requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      // Status filter
      if (statusFilter !== 'All' && request.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'All' && request.request_type !== typeFilter) {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const typeName = requestTypesMap[request.request_type]?.name || request.request_type;
        const matchesType = typeName.toLowerCase().includes(searchLower);
        const matchesId = request.id.toLowerCase().includes(searchLower);
        const matchesStatus = request.status.toLowerCase().includes(searchLower);
        
        if (!matchesType && !matchesId && !matchesStatus) {
          return false;
        }
      }

      return true;
    });
  }, [requests, statusFilter, typeFilter, searchQuery, requestTypesMap]);

  // Count by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'All': requests.length,
      'Draft': 0,
      'Submitted': 0,
      'Under Review': 0,
      'Approved': 0,
      'Denied': 0,
      'Completed': 0
    };
    requests.forEach(r => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [requests]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRequestTitle = (request: Request) => {
    return requestTypesMap[request.request_type]?.name || request.request_type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">My Requests</h2>
          <p className="text-gray-600">View and manage your submitted requests</p>
        </div>
        <Button onClick={onNewRequest} size="lg">
          <PlusCircle className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <div className="flex-1" />
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredRequests.length}</span> of{' '}
            <span className="font-semibold">{requests.length}</span> requests
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by title, ID, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status ({statusCounts['All']})</SelectItem>
                <SelectItem value="Draft">Draft ({statusCounts['Draft']})</SelectItem>
                <SelectItem value="Submitted">Submitted ({statusCounts['Submitted']})</SelectItem>
                <SelectItem value="Under Review">Under Review ({statusCounts['Under Review']})</SelectItem>
                <SelectItem value="Approved">Approved ({statusCounts['Approved']})</SelectItem>
                <SelectItem value="Denied">Denied ({statusCounts['Denied']})</SelectItem>
                <SelectItem value="Completed">Completed ({statusCounts['Completed']})</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {requestTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === 'All' ? 'All Types' : (requestTypesMap[type]?.name || type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>

      {/* Requests Table */}
      {filteredRequests.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {requests.length === 0 ? 'No requests yet' : 'No requests match your filters'}
          </h3>
          <p className="text-gray-600 mb-6">
            {requests.length === 0 
              ? 'Get started by submitting your first request'
              : 'Try adjusting your filters or search terms'
            }
          </p>
          {requests.length === 0 && (
            <Button onClick={onNewRequest}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Submit New Request
            </Button>
          )}
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted Date
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
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
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
                      <Badge variant="outline" className="gap-1">
                        <Tag className="h-3 w-3" />
                        {requestTypesMap[request.request_type]?.name || request.request_type}
                      </Badge>
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
                          onClick={() => onViewRequest?.(request.id)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {request.status === 'Draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditRequest?.(request.id)}
                            title="Edit draft"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {(request.status === 'Draft' || request.status === 'Denied') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteRequest?.(request.id)}
                            title="Delete request"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
      {filteredRequests.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {(['Draft', 'Submitted', 'Under Review', 'Approved', 'Denied', 'Completed'] as const).map(status => (
            <Card 
              key={status} 
              className={`p-4 cursor-pointer transition-all ${statusFilter === status ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {statusCounts[status] || 0}
              </div>
              <div className="text-xs text-gray-600">{status}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
