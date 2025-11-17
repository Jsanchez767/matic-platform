import { Activity } from './ActivitiesEventsPage';
import { Calendar, Users, MoreVertical, Star } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface ActivityCardProps {
  activity: Activity;
  onClick: () => void;
}

export function ActivityCard({ activity, onClick }: ActivityCardProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <Badge className={`${getStatusStyle(activity.status)} text-xs px-2 py-0.5`}>
          {activity.status}
        </Badge>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Star className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <h3 className="text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
        {activity.name}
      </h3>

      <p className="text-xs text-gray-500 mb-4 line-clamp-1">{activity.category}</p>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <span>{formatDate(activity.beginDate)} - {formatDate(activity.endDate)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Users className="h-3.5 w-3.5 text-gray-400" />
            <span>{activity.participants} enrolled</span>
          </div>
          
          {/* Mini progress indicator */}
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1 h-3 rounded-full ${
                  i < Math.floor((activity.participants / 50) * 5)
                    ? 'bg-blue-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
