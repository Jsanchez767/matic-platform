import { Activity } from './ActivitiesEventsPage';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Calendar, Users, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface ActivityGridProps {
  activities: Activity[];
}

export function ActivityGrid({ activities }: ActivityGridProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 hover:bg-green-100';
      case 'upcoming':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
      case 'completed':
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activities.length === 0 ? (
        <div className="col-span-full text-center py-12 text-gray-500">
          No activities found. Try adjusting your filters.
        </div>
      ) : (
        activities.map((activity) => (
          <Card key={activity.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <Badge className={getStatusColor(activity.status)}>
                  {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Activity
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="pb-4">
              <h3 className="text-gray-900 mb-3 line-clamp-2">
                <a href="#" className="hover:text-blue-600 transition-colors">
                  {activity.name}
                </a>
              </h3>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {activity.category}
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(activity.beginDate)} - {formatDate(activity.endDate)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>{activity.participants} participants</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full">
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
}
