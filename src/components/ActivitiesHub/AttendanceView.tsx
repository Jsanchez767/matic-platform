'use client';

import { useState } from 'react';
import { Calendar, Clock, Users, ChevronRight, CheckCircle2, XCircle, ClipboardCheck } from 'lucide-react';
import { Badge } from '@/ui-components/badge';
import type { Activity } from '@/types/activities-hubs';

interface AttendanceSession {
  id: string;
  date: string;
  beginTime: string;
  endTime: string;
  present: number;
  total: number;
}

interface AttendanceViewProps {
  activities: Activity[];
  onSelectActivity: (activity: Activity) => void;
}

export function AttendanceView({ activities, onSelectActivity }: AttendanceViewProps) {
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'empty'>('all');

  // Mock function to get attendance sessions for an activity
  const getAttendanceSessions = (activity: Activity): AttendanceSession[] => {
    // This would be replaced with actual API call
    // For now, generating mock data
    const sessions: AttendanceSession[] = [];
    const startDate = activity.begin_date ? new Date(activity.begin_date) : new Date();
    const endDate = activity.end_date ? new Date(activity.end_date) : new Date();
    
    // Generate weekly sessions
    let currentDate = new Date(startDate);
    let sessionId = 0;
    
    while (currentDate <= endDate && sessions.length < 20) {
      sessions.push({
        id: `${activity.id}-${sessionId++}`,
        date: currentDate.toISOString().split('T')[0],
        beginTime: '6:00 PM',
        endTime: '8:00 PM',
        present: Math.floor(Math.random() * (activity.participants + 1)),
        total: activity.participants,
      });
      
      // Add 7 days for weekly sessions
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    return sessions;
  };

  const getAttendanceStatus = (session: AttendanceSession) => {
    if (session.present === 0) {
      return { icon: XCircle, color: 'red', label: 'Empty' };
    }
    const percentage = (session.present / session.total) * 100;
    if (percentage < 50) {
      return { icon: XCircle, color: 'amber', label: 'Low' };
    }
    if (percentage < 100) {
      return { icon: ClipboardCheck, color: 'blue', label: 'Incomplete' };
    }
    return { icon: CheckCircle2, color: 'emerald', label: 'Complete' };
  };

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const filteredActivities = activities.filter(activity => activity.status === 'active');

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">Attendance</h1>
        <p className="text-sm text-gray-600">Track and manage attendance for all activities</p>
      </div>

      {/* Activities with Attendance */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-4 space-y-4">
        {filteredActivities.map((activity) => {
          const sessions = getAttendanceSessions(activity);
          const incompleteSessions = sessions.filter(s => s.present === 0).length;
          const avgAttendance = sessions.length > 0 ? Math.round(
            (sessions.reduce((sum, s) => sum + s.present, 0) / 
            sessions.reduce((sum, s) => sum + s.total, 0)) * 100
          ) : 0;
          
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
                    <div className="text-lg font-semibold">{activity.participants}</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <div className="text-xs text-violet-200 mb-0.5">Avg Rate</div>
                    <div className="text-lg font-semibold">{avgAttendance}%</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
                    <div className="text-xs text-violet-200 mb-0.5">Sessions</div>
                    <div className="text-lg font-semibold">{sessions.length}</div>
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
                        ? 'border-violet-600 text-violet-600 font-medium'
                        : 'border-transparent text-gray-600'
                    }`}
                  >
                    All Dates
                  </button>
                  <button
                    onClick={() => setFilter('incomplete')}
                    className={`px-3 py-3 text-xs md:text-sm whitespace-nowrap transition-colors border-b-2 ${
                      filter === 'incomplete'
                        ? 'border-violet-600 text-violet-600 font-medium'
                        : 'border-transparent text-gray-600'
                    }`}
                  >
                    Incomplete
                  </button>
                  <button
                    onClick={() => setFilter('empty')}
                    className={`px-3 py-3 text-xs md:text-sm whitespace-nowrap transition-colors border-b-2 ${
                      filter === 'empty'
                        ? 'border-violet-600 text-violet-600 font-medium'
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
                  {sessions
                    .filter(session => {
                      if (filter === 'incomplete') return session.present > 0 && session.present < session.total;
                      if (filter === 'empty') return session.present === 0;
                      return true;
                    })
                    .map((session) => {
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
                              <div className="text-sm font-medium text-gray-900 mb-1">
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Time</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">Attendance</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">Rate</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions
                        .filter(session => {
                          if (filter === 'incomplete') return session.present > 0 && session.present < session.total;
                          if (filter === 'empty') return session.present === 0;
                          return true;
                        })
                        .map((session) => {
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
    </div>
  );
}
