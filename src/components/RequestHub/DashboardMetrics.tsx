"use client";

import { TrendingUp, Clock, CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui-components/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  description?: string;
}

function MetricCard({ title, value, icon, trend, trendUp, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-gray-500">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
        {trend && (
          <p className={`text-xs mt-2 flex items-center ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardMetricsProps {
  totalRequests: number;
  pendingApprovals: number;
  averageApprovalTime: number;
  approvalRate: number;
}

export function DashboardMetrics({
  totalRequests,
  pendingApprovals,
  averageApprovalTime,
  approvalRate,
}: DashboardMetricsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Requests"
        value={totalRequests}
        icon={<FileText className="h-4 w-4" />}
        description="All time"
      />
      <MetricCard
        title="Pending Approvals"
        value={pendingApprovals}
        icon={<Clock className="h-4 w-4" />}
        description="Awaiting review"
      />
      <MetricCard
        title="Avg. Approval Time"
        value={averageApprovalTime > 0 ? `${averageApprovalTime.toFixed(1)}h` : 'N/A'}
        icon={<Clock className="h-4 w-4" />}
        description="Average processing time"
      />
      <MetricCard
        title="Approval Rate"
        value={`${approvalRate.toFixed(0)}%`}
        icon={<CheckCircle className="h-4 w-4" />}
        description="Approved requests"
      />
    </div>
  );
}
