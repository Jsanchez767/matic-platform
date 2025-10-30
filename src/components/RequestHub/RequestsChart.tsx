"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/ui-components/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface RequestsByType {
  request_type: string;
  count: number;
}

interface RequestsByTypeChartProps {
  data: RequestsByType[];
}

export function RequestsByTypeChart({ data }: RequestsByTypeChartProps) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Requests by Type</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="request_type" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const STATUS_COLORS: Record<string, string> = {
  'Draft': '#9ca3af',
  'Submitted': '#3b82f6',
  'Under Review': '#eab308',
  'Approved': '#22c55e',
  'Denied': '#ef4444',
  'Completed': '#a855f7',
};

interface RequestsByStatus {
  status: string;
  count: number;
  [key: string]: string | number;
}

interface StatusDistributionChartProps {
  data: RequestsByStatus[];
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data as any}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#9ca3af'} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface RequestTrend {
  date: string;
  count: number;
}

interface RequestTrendsChartProps {
  data: RequestTrend[];
}

export function RequestTrendsChart({ data }: RequestTrendsChartProps) {
  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Request Trends (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
