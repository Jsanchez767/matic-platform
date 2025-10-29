import { TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

function MetricCard({ title, value, icon, trend, trendUp }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        <div className="text-gray-500">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="mt-2">{value}</div>
        {trend && (
          <p className={`text-xs ${trendUp ? 'text-green-600' : 'text-red-600'} mt-2`}>
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
        icon={<TrendingUp className="h-4 w-4" />}
        trend="12% from last month"
        trendUp={true}
      />
      <MetricCard
        title="Pending Approvals"
        value={pendingApprovals}
        icon={<Clock className="h-4 w-4" />}
      />
      <MetricCard
        title="Avg. Approval Time"
        value={`${averageApprovalTime.toFixed(1)}h`}
        icon={<Clock className="h-4 w-4" />}
        trend="8% faster"
        trendUp={true}
      />
      <MetricCard
        title="Approval Rate"
        value={`${approvalRate.toFixed(0)}%`}
        icon={<CheckCircle className="h-4 w-4" />}
      />
    </div>
  );
}
