"use client";

import { useState, useMemo } from 'react';
import { Card } from '@/ui-components/card';
import { Button } from '@/ui-components/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-components/select';
import { Badge } from '@/ui-components/badge';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  PlusCircle,
  CheckSquare,
  Settings,
  ChevronUp,
  ChevronDown,
  Calendar
} from 'lucide-react';
import type { Request, RequestMetrics, RequestsByStatus, RequestTrend, UserRole } from '@/types/request';

// Status colors matching the design system
const STATUS_COLORS: Record<string, string> = {
  'Draft': '#9ca3af',
  'Submitted': '#3b82f6',
  'Under Review': '#eab308',
  'Approved': '#22c55e',
  'Denied': '#ef4444',
  'Completed': '#a855f7',
};

interface EnhancedDashboardProps {
  requests: Request[];
  metrics: RequestMetrics;
  userRole: UserRole;
  isAdminView?: boolean;
  onToggleAdminView?: () => void;
  onNewRequest?: () => void;
  onViewApprovals?: () => void;
  onViewSettings?: () => void;
}

type DateRange = 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';

export function EnhancedDashboard({
  requests,
  metrics,
  userRole,
  isAdminView = false,
  onToggleAdminView,
  onNewRequest,
  onViewApprovals,
  onViewSettings
}: EnhancedDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>('last_30_days');

  // Filter requests by date range
  const filteredRequests = useMemo(() => {
    if (dateRange === 'all_time') return requests;

    const now = new Date();
    const daysAgo = {
      last_7_days: 7,
      last_30_days: 30,
      last_90_days: 90
    }[dateRange];

    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return requests.filter(r => new Date(r.submitted_date) >= cutoffDate);
  }, [requests, dateRange]);

  // Calculate status distribution
  const statusDistribution = useMemo(() => {
    const distribution: RequestsByStatus[] = [];
    const statusCounts: Record<string, number> = {};

    filteredRequests.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      distribution.push({ status: status as any, count });
    });

    return distribution;
  }, [filteredRequests]);

  // Calculate requests over time (last 30 days)
  const requestsOverTime = useMemo(() => {
    const trend: RequestTrend[] = [];
    const days = dateRange === 'last_7_days' ? 7 : dateRange === 'last_30_days' ? 30 : 90;
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = filteredRequests.filter(r => 
        r.submitted_date.startsWith(dateStr)
      ).length;
      trend.push({ date: dateStr, count });
    }

    return trend;
  }, [filteredRequests, dateRange]);

  // Calculate metrics for filtered period
  const periodMetrics = useMemo(() => {
    const total = filteredRequests.length;
    const pending = filteredRequests.filter(r => 
      r.status === 'Submitted' || r.status === 'Under Review'
    ).length;
    const approved = filteredRequests.filter(r => r.status === 'Approved').length;
    const denied = filteredRequests.filter(r => r.status === 'Denied').length;

    const completedRequests = filteredRequests.filter(r => r.completed_date);
    const avgApprovalTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, r) => {
          const submitted = new Date(r.submitted_date);
          const completed = new Date(r.completed_date!);
          const hours = (completed.getTime() - submitted.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }, 0) / completedRequests.length
      : 0;

    const approvalRate = total > 0 ? (approved / total) * 100 : 0;

    return {
      total,
      pending,
      avgApprovalTime: Math.round(avgApprovalTime),
      approvalRate: Math.round(approvalRate)
    };
  }, [filteredRequests]);

  const canAccessAdmin = userRole === 'admin' || userRole === 'supervisor';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Dashboard Overview</h2>
          <p className="text-gray-600">Real-time metrics and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          {canAccessAdmin && onToggleAdminView && (
            <Button
              variant={isAdminView ? "default" : "outline"}
              onClick={onToggleAdminView}
              size="sm"
            >
              {isAdminView ? 'Admin View' : 'My View'}
            </Button>
          )}
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 days</SelectItem>
              <SelectItem value="last_30_days">Last 30 days</SelectItem>
              <SelectItem value="last_90_days">Last 90 days</SelectItem>
              <SelectItem value="all_time">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={onNewRequest}
            size="lg" 
            className="w-full justify-start gap-3"
          >
            <PlusCircle className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">Submit New Request</div>
              <div className="text-xs opacity-90">Create a new request</div>
            </div>
          </Button>
          <Button 
            onClick={onViewApprovals}
            variant="outline" 
            size="lg" 
            className="w-full justify-start gap-3"
          >
            <CheckSquare className="h-5 w-5" />
            <div className="text-left">
              <div className="font-semibold">View Pending Approvals</div>
              <div className="text-xs text-gray-600">{periodMetrics.pending} pending</div>
            </div>
          </Button>
          {canAccessAdmin && (
            <Button 
              onClick={onViewSettings}
              variant="outline" 
              size="lg" 
              className="w-full justify-start gap-3"
            >
              <Settings className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Settings</div>
                <div className="text-xs text-gray-600">Configure system</div>
              </div>
            </Button>
          )}
        </div>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="text-sm font-medium text-gray-600">Total Requests</div>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {periodMetrics.total}
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <ChevronUp className="h-4 w-4" />
            <span>Active in period</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="text-sm font-medium text-gray-600">Pending Approvals</div>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {periodMetrics.pending}
          </div>
          <div className="flex items-center gap-1 text-sm text-yellow-600">
            <Clock className="h-4 w-4" />
            <span>Needs attention</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="text-sm font-medium text-gray-600">Avg. Approval Time</div>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {periodMetrics.avgApprovalTime}h
          </div>
          <div className="flex items-center gap-1 text-sm text-blue-600">
            <ChevronDown className="h-4 w-4" />
            <span>From submit to approval</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="text-sm font-medium text-gray-600">Approval Rate</div>
            <CheckCircle className="h-5 w-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {periodMetrics.approvalRate}%
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Success rate</span>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests Over Time */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Requests Over Time</h3>
          <div className="h-64">
            <RequestsOverTimeChart data={requestsOverTime} />
          </div>
        </Card>

        {/* Status Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Requests by Status</h3>
          <div className="h-64">
            <SimpleStatusChart data={statusDistribution} />
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {filteredRequests.slice(0, 5).map((request) => (
            <div key={request.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">
                    {request.request_type}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(request.submitted_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <Badge 
                variant="outline"
                className={
                  request.status === 'Approved' ? 'border-green-200 text-green-700' :
                  request.status === 'Denied' ? 'border-red-200 text-red-700' :
                  request.status === 'Under Review' ? 'border-yellow-200 text-yellow-700' :
                  'border-blue-200 text-blue-700'
                }
              >
                {request.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Simple line chart component for requests over time
function RequestsOverTimeChart({ data }: { data: RequestTrend[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div className="h-full flex items-end justify-between gap-1">
      {data.map((point, idx) => {
        const height = (point.count / maxCount) * 100;
        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '100%' }}>
              <div 
                className="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${height}%` }}
                title={`${point.date}: ${point.count} requests`}
              />
            </div>
            {idx % Math.ceil(data.length / 7) === 0 && (
              <div className="text-xs text-gray-500">
                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Simple donut chart for status distribution
function SimpleStatusChart({ data }: { data: RequestsByStatus[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  
  return (
    <div className="h-full flex flex-col items-center justify-center">
      {/* Donut chart */}
      <div className="relative w-48 h-48 mb-4">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {data.reduce((acc, item, idx) => {
            const percentage = (item.count / total) * 100;
            const circumference = 2 * Math.PI * 40;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const previousPercentage = acc.previousPercentage;
            const strokeDashoffset = -((previousPercentage / 100) * circumference);
            
            acc.previousPercentage += percentage;
            acc.elements.push(
              <circle
                key={idx}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={STATUS_COLORS[item.status] || '#9ca3af'}
                strokeWidth="12"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all hover:opacity-80"
              />
            );
            
            return acc;
          }, { previousPercentage: 0, elements: [] as React.ReactElement[] }).elements}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {data.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[item.status] || '#9ca3af' }}
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{item.count}</div>
              <div className="text-xs text-gray-600">{item.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
