import { Activity } from './ActivitiesEventsPage';
import { X, Calendar, Users, MapPin, Clock, Edit, Trash2, Share2, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ActivityDetailProps {
  activity: Activity;
  onClose: () => void;
}

export function ActivityDetail({ activity, onClose }: ActivityDetailProps) {
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
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[90vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <Badge className={`${getStatusStyle(activity.status)} text-xs px-2 py-1 mb-3`}>
              {activity.status}
            </Badge>
            <h2 className="text-2xl text-gray-900 mb-2">{activity.name}</h2>
            <p className="text-sm text-gray-500">{activity.category}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">Start Date</span>
              </div>
              <div className="text-gray-900">{formatDate(activity.beginDate)}</div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-xs">End Date</span>
              </div>
              <div className="text-gray-900">{formatDate(activity.endDate)}</div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 col-span-2">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Users className="h-4 w-4" />
                <span className="text-xs">Participants Enrolled</span>
              </div>
              <div className="text-2xl text-blue-900">{activity.participants}</div>
              <div className="mt-3 bg-white rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: `${(activity.participants / 50) * 100}%` }}
                />
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {Math.round((activity.participants / 50) * 100)}% of capacity
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm text-gray-500 mb-2">Description</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              This program is part of the {activity.category} initiative, designed to provide
              quality educational and enrichment opportunities for community members. The program
              runs throughout the academic year with scheduled sessions and activities.
            </p>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-sm text-gray-500 mb-2">Location</h3>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm">Kelly High School, Main Building, Room 204</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Edit className="h-4 w-4 mr-2" />
              Edit Activity
            </Button>
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
