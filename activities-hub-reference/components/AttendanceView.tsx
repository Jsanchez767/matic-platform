import { useState } from 'react';
import { Calendar, Clock, Users, CheckCircle2, XCircle, AlertCircle, Search, ChevronRight, Download, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import type { Activity } from './ActivitiesEventsPage';

type AttendanceFilter = 'all' | 'all-thru-today' | 'incomplete' | 'empty';

type AttendanceSession = {
  id: string;
  date: string;
  beginTime: string;
  endTime: string;
  present: number;
  total: number;
};

type AttendanceProps = {
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
};

export function AttendanceView({ activities, onSelectActivity }: AttendanceProps) {
  const [filter, setFilter] = useState<AttendanceFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock attendance sessions for each activity
  const getAttendanceSessions = (activity: Activity): AttendanceSession[] => {
    return [
      {
        id: '1',
        date: '2025-11-12',
        beginTime: '6:00 PM',
        endTime: '8:00 PM',
        present: 0,
        total: activity.participants
      },
      {
        id: '2',
        date: '2025-11-14',
        beginTime: '4:00 PM',
        endTime: '6:00 PM',
        present: 18,
        total: activity.participants
      },
      {
        id: '3',
        date: '2025-11-19',
        beginTime: '6:00 PM',
        endTime: '8:00 PM',
        present: activity.participants,
        total: activity.participants
      }
    ];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && activity.status === 'active';
  });

  const getAttendanceStatus = (session: AttendanceSession) => {
    const percentage = (session.present / session.total) * 100;
    if (session.present === 0) return { status: 'empty', color: 'red', icon: XCircle };
    if (percentage >= 90) return { status: 'excellent', color: 'emerald', icon: CheckCircle2 };
    if (percentage >= 70) return { status: 'good', color: 'blue', icon: CheckCircle2 };
    return { status: 'low', color: 'amber', icon: AlertCircle };
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 md:py-6 sticky top-0 z-10">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl text-gray-900 mb-2">Attendance</h1>
            <p className="text-sm text-gray-600">Track and manage attendance for all activities</p>
          </div>
          <Button 
            className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2 h-10 flex-shrink-0"
            onClick={() => {
              // Generate PDF for the week
              alert('Downloading weekly attendance sheet...');
              // In a real app, this would generate and download a PDF
            }}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download Week PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search activities..."
            className="pl-10 h-11 text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Activities with Attendance */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-4 space-y-4">
        {filteredActivities.map((activity) => {
          const sessions = getAttendanceSessions(activity);
          const incompleteSessions = sessions.filter(s => s.present === 0).length;
          const avgAttendance = Math.round(
            (sessions.reduce((sum, s) => sum + s.present, 0) / 
            sessions.reduce((sum, s) => sum + s.total, 0)) * 100
          );
          
          return (
            <div key={activity.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Activity Header */}
              <div className="bg-gradient-to-r from-violet-600 to-violet-700 text-white px-4 md:px-6 py-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base md:text-lg mb-1 truncate">{activity.name}</h2>
                    <p className="text-xs text-violet-200">{activity.category}</p>
                  </div>
                  {incompleteSessions > 0 && (
                    <Badge className="bg-amber-500 text-white border-0 flex-shrink-0">
                      {incompleteSessions} incomplete
                    </Badge>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <div className="text-xs text-violet-200 mb-0.5">Enrolled</div>
                    <div className="text-lg">{activity.participants}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <div className="text-xs text-violet-200 mb-0.5">Avg Rate</div>
                    <div className="text-lg">{avgAttendance}%</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <div className="text-xs text-violet-200 mb-0.5">Sessions</div>
                    <div className="text-lg">{sessions.length}</div>
                  </div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="border-b border-gray-200 px-4 md:px-6 bg-gray-50">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mb-px">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-3 text-xs md:text-sm whitespace-nowrap transition-colors border-b-2 ${ 
                      filter === 'all'
                        ? 'border-violet-600 text-violet-600'
                        : 'border-transparent text-gray-600'
                    }`}
                  >
                    All Dates
                  </button>
                  <button
                    onClick={() => setFilter('incomplete')}
                    className={`px-3 py-3 text-xs md:text-sm whitespace-nowrap transition-colors border-b-2 ${
                      filter === 'incomplete'
                        ? 'border-violet-600 text-violet-600'
                        : 'border-transparent text-gray-600'
                    }`}
                  >
                    Incomplete
                  </button>
                  <button
                    onClick={() => setFilter('empty')}
                    className={`px-3 py-3 text-xs md:text-sm whitespace-nowrap transition-colors border-b-2 ${
                      filter === 'empty'
                        ? 'border-violet-600 text-violet-600'
                        : 'border-transparent text-gray-600'
                    }`}
                  >
                    Empty
                  </button>
                </div>
              </div>

              {/* Sessions - Card Layout for Mobile, Table for Desktop */}
              <div className="p-3 md:p-4 space-y-2">
                {/* Mobile: Cards */}
                <div className="md:hidden space-y-2">
                  {sessions.map((session) => {
                    const statusInfo = getAttendanceStatus(session);
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <button
                        key={session.id}
                        onClick={() => onSelectActivity(activity)}
                        className="w-full bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-xl p-4 transition-colors text-left"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-sm text-gray-900 mb-1">
                              {formatFullDate(session.date)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{session.beginTime} - {session.endTime}</span>
                            </div>
                          </div>
                          <StatusIcon className={`h-5 w-5 text-${statusInfo.color}-600 flex-shrink-0`} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {session.present} of {session.total} present
                            </span>
                          </div>
                          <div className={`text-sm font-medium text-${statusInfo.color}-600`}>
                            {Math.round((session.present / session.total) * 100)}%
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-${statusInfo.color}-500 rounded-full transition-all duration-500`}
                            style={{ width: `${(session.present / session.total) * 100}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Desktop: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs text-gray-600">Date</th>
                        <th className="px-4 py-3 text-left text-xs text-gray-600">Time</th>
                        <th className="px-4 py-3 text-right text-xs text-gray-600">Attendance</th>
                        <th className="px-4 py-3 text-right text-xs text-gray-600">Rate</th>
                        <th className="px-4 py-3 text-right text-xs text-gray-600"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => {
                        const statusInfo = getAttendanceStatus(session);
                        const StatusIcon = statusInfo.icon;
                        
                        return (
                          <tr 
                            key={session.id}
                            onClick={() => onSelectActivity(activity)}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-900">
                                  {formatFullDate(session.date)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {session.beginTime} - {session.endTime}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className="text-sm text-gray-900">
                                {session.present} / {session.total}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <StatusIcon className={`h-4 w-4 text-${statusInfo.color}-600`} />
                                <span className={`text-sm font-medium text-${statusInfo.color}-600`}>
                                  {Math.round((session.present / session.total) * 100)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredActivities.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-900 mb-1">No activities found</p>
            <p className="text-sm text-gray-500">Try adjusting your search</p>
          </div>
        </div>
      )}
    </div>
  );
}