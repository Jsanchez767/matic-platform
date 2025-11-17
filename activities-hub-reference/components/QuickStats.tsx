import { Activity } from './ActivitiesEventsPage';
import { Card, CardContent } from './ui/card';
import { Calendar, Users, TrendingUp, CheckCircle2 } from 'lucide-react';

interface QuickStatsProps {
  activities: Activity[];
}

export function QuickStats({ activities }: QuickStatsProps) {
  const activeCount = activities.filter(a => a.status === 'active').length;
  const completedCount = activities.filter(a => a.status === 'completed').length;
  const totalParticipants = activities.reduce((sum, a) => sum + a.participants, 0);
  const avgParticipants = Math.round(totalParticipants / activities.length);

  const stats = [
    {
      icon: Calendar,
      label: 'Total Activities',
      value: activities.length.toString(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: TrendingUp,
      label: 'Active Programs',
      value: activeCount.toString(),
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: CheckCircle2,
      label: 'Completed',
      value: completedCount.toString(),
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    },
    {
      icon: Users,
      label: 'Total Participants',
      value: totalParticipants.toString(),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-2xl text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-2.5 rounded-lg`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}