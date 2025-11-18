'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Calendar, 
  Users, 
  Activity as ActivityIcon,
  ChevronLeft,
  ChevronRight,
  Table,
  FileText,
  BarChart3,
  Database,
  Maximize2
} from 'lucide-react';
import { Button } from '@/ui-components/button';
import { Badge } from '@/ui-components/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui-components/dialog';
import { Input } from '@/ui-components/input';
import { Label } from '@/ui-components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-components/select';
import { toast } from 'sonner';
import { activitiesSupabase } from '@/lib/api/activities-supabase';
import { ActivityDetailPanel } from './ActivityDetailPanel';
import type { Activity, ActivityStatus, CreateActivityInput } from '@/types/activities-hubs';

// Helper function to format dates
const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'Not set';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Invalid date';
  }
};

interface ActivitiesHubListPageProps {
  workspaceId: string;
  onSelectActivity?: (activity: Activity) => void;
}

export function ActivitiesHubListPage({ workspaceId, onSelectActivity }: ActivitiesHubListPageProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModule, setActiveModule] = useState('activity-hubs');
  const [filterStatus, setFilterStatus] = useState<ActivityStatus | 'all'>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [connectTableDialogOpen, setConnectTableDialogOpen] = useState(false);
  const [selectedDataTable, setSelectedDataTable] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [newActivity, setNewActivity] = useState<Partial<CreateActivityInput>>({
    name: '',
    category: '',
    status: 'upcoming',
    begin_date: '',
    end_date: '',
    participants: 0,
  });

  // Load activities
  useEffect(() => {
    loadActivities();
  }, [workspaceId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const data = await activitiesSupabase.listActivities(workspaceId);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (activity.category?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeCount = activities.filter(a => a.status === 'active').length;
  const completedCount = activities.filter(a => a.status === 'completed').length;
  const upcomingCount = activities.filter(a => a.status === 'upcoming').length;

  const handleAddActivity = async () => {
    if (!newActivity.name || !newActivity.begin_date || !newActivity.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const activityData: CreateActivityInput = {
        name: newActivity.name!,
        description: newActivity.description,
        category: newActivity.category || '',
        status: (newActivity.status as ActivityStatus) || 'upcoming',
        begin_date: newActivity.begin_date || undefined,
        end_date: newActivity.end_date || undefined,
        participants: newActivity.participants || 0,
      };

      const created = await activitiesSupabase.createActivity(workspaceId, activityData);
      
      setActivities([created, ...activities]);
      setAddDialogOpen(false);
      
      // Reset form
      setNewActivity({
        name: '',
        category: '',
        status: 'upcoming',
        begin_date: '',
        end_date: '',
        participants: 0,
      });

      toast.success(`Activity "${created.name}" created successfully`);
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Failed to create activity');
    }
  };

  const handleSelectActivity = (activity: Activity) => {
    setSelectedActivity(activity);
    if (onSelectActivity) {
      onSelectActivity(activity);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading activities...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-3 md:px-6 py-2 md:py-3 flex items-center justify-between gap-2 md:gap-4">
        {/* Left: Organization */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-blue-50 rounded-lg">
            <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs">
              W
            </div>
            <span className="text-xs md:text-sm hidden sm:inline">Workspace</span>
            <ChevronLeft className="h-3 w-3 md:h-3.5 md:w-3.5 rotate-90 hidden sm:inline" />
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-8 md:pl-10 pr-2 md:pr-16 py-1.5 md:py-2 bg-gray-100 border-0 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => e.target.placeholder = "Search for anything..."}
              onBlur={(e) => e.target.placeholder = "Search..."}
            />
            <kbd className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 px-1.5 md:px-2 py-0.5 bg-white border border-gray-300 rounded text-xs text-gray-500 hidden md:inline-block">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: User */}
        <div className="flex items-center flex-shrink-0">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs md:text-sm">
            U
          </div>
        </div>
      </div>

      {/* Module Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-3 md:px-6 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 md:gap-2 min-w-max">
            {/* Navigation arrows - Desktop only */}
            <button className="p-1.5 hover:bg-gray-100 rounded-lg hidden lg:flex items-center justify-center flex-shrink-0 transition-colors">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg hidden lg:flex items-center justify-center flex-shrink-0 transition-colors">
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>

            {/* Active Module */}
            <button 
              onClick={() => setActiveModule('activity-hubs')}
              className={`
                relative px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm flex items-center gap-1.5 md:gap-2 
                whitespace-nowrap transition-all flex-shrink-0 group
                ${activeModule === 'activity-hubs' 
                  ? 'text-violet-700' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <ActivityIcon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Activity Hubs</span>
              <span className="sm:hidden">Activities</span>
              
              {/* Active indicator */}
              {activeModule === 'activity-hubs' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-t-full" />
              )}
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200 mx-1" />

            {/* Other Modules */}
            <button 
              onClick={() => setActiveModule('attendance')}
              className={`
                relative px-2.5 md:px-3 py-2.5 md:py-3 text-xs md:text-sm flex items-center gap-1.5 
                whitespace-nowrap transition-all flex-shrink-0 rounded-lg
                ${activeModule === 'attendance' 
                  ? 'text-violet-700 bg-violet-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="hidden md:inline">Attendance</span>
            </button>

            <button 
              onClick={() => setActiveModule('tables')}
              className={`
                relative px-2.5 md:px-3 py-2.5 md:py-3 text-xs md:text-sm flex items-center gap-1.5 
                whitespace-nowrap transition-all flex-shrink-0 rounded-lg
                ${activeModule === 'tables' 
                  ? 'text-violet-700 bg-violet-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <Table className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="hidden md:inline">Tables</span>
            </button>

            <button 
              onClick={() => setActiveModule('documents')}
              className={`
                relative px-2.5 md:px-3 py-2.5 md:py-3 text-xs md:text-sm flex items-center gap-1.5 
                whitespace-nowrap transition-all flex-shrink-0 rounded-lg
                ${activeModule === 'documents' 
                  ? 'text-violet-700 bg-violet-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="hidden md:inline">Documents</span>
            </button>

            <button 
              onClick={() => setActiveModule('reports')}
              className={`
                relative px-2.5 md:px-3 py-2.5 md:py-3 text-xs md:text-sm flex items-center gap-1.5 
                whitespace-nowrap transition-all flex-shrink-0 rounded-lg
                ${activeModule === 'reports' 
                  ? 'text-violet-700 bg-violet-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <BarChart3 className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
              <span className="hidden md:inline">Reports</span>
            </button>

            {/* Add New Button */}
            <div className="h-6 w-px bg-gray-200 mx-1" />
            <button 
              className="p-2 md:p-2.5 border border-dashed border-gray-300 rounded-lg hover:border-violet-400 hover:bg-violet-50 flex-shrink-0 transition-all group"
              onClick={() => setAddDialogOpen(true)}
              title="Add new module"
            >
              <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500 group-hover:text-violet-600 transition-colors" />
            </button>
          </div>
        </div>
        
        {/* Scroll indicator for mobile */}
        <div className="md:hidden absolute right-0 top-12 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Activities List */}
        <div className={`transition-all duration-300 overflow-auto ${
          selectedActivity && !isFullScreen ? 'md:w-2/3 w-full' : 'w-full'
        }`}>
          <div className="p-3 md:p-6 pb-32 md:pb-6">
            {/* Header with Action Buttons */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div className="flex-1" />
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setConnectTableDialogOpen(true)}
                  className="flex items-center gap-2 text-xs md:text-sm"
                >
                  <Database className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Connect Table</span>
                  <span className="sm:inline md:hidden">Table</span>
                </Button>
                <Button 
                  onClick={() => setAddDialogOpen(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2 text-xs md:text-sm"
                >
                  <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Add Activity</span>
                  <span className="sm:inline md:hidden">Add</span>
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-4 md:mb-6 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition-all whitespace-nowrap ${
                  filterStatus === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                All {activities.length}
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition-all whitespace-nowrap ${
                  filterStatus === 'active'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Active {activeCount}
              </button>
              <button
                onClick={() => setFilterStatus('upcoming')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition-all whitespace-nowrap ${
                  filterStatus === 'upcoming'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Upcoming {upcomingCount}
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm transition-all whitespace-nowrap ${
                  filterStatus === 'completed'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Completed {completedCount}
              </button>
            </div>

            {/* Activities */}
            <div className="space-y-2 md:space-y-3">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-12">
                  <ActivityIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first activity'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setAddDialogOpen(true)} className="bg-violet-600 hover:bg-violet-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Activity
                    </Button>
                  )}
                </div>
              ) : (
                filteredActivities.map((activity) => (
                  <div
                    key={activity.id}
                    onClick={() => setSelectedActivity(activity)}
                    className={`bg-white rounded-lg md:rounded-xl p-3 md:p-4 border transition-all cursor-pointer active:scale-[0.98] ${
                      selectedActivity?.id === activity.id
                        ? 'border-violet-600 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1.5 md:mb-2">
                          <h3 className="text-xs md:text-sm text-gray-900 flex-1 line-clamp-2">
                            {activity.name}
                          </h3>
                          <Badge 
                            className={`
                              text-xs px-1.5 md:px-2 py-0.5 border-0 flex-shrink-0
                              ${activity.status === 'active' ? 'bg-emerald-50 text-emerald-700' : ''}
                              ${activity.status === 'upcoming' ? 'bg-blue-50 text-blue-700' : ''}
                              ${activity.status === 'completed' ? 'bg-gray-50 text-gray-700' : ''}
                            `}
                          >
                            {activity.status}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{formatDate(activity.begin_date)}</span>
                            <span>→</span>
                            <span className="truncate">{formatDate(activity.end_date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 flex-shrink-0" />
                            <span>{activity.participants} enrolled</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Detail Panel - Desktop: Side Panel, Mobile: Bottom Sheet */}
        {selectedActivity && (
          <>
            {/* Mobile Overlay */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => {
                setSelectedActivity(null);
                setIsFullScreen(false);
              }}
            />
            
            {/* Panel */}
            <div className={`
              transition-all duration-300 bg-white z-50
              md:relative md:border-l md:border-gray-200
              fixed bottom-0 left-0 right-0 rounded-t-3xl md:rounded-none
              max-h-[85vh] md:max-h-none
              ${isFullScreen ? 'md:w-full' : 'md:w-1/3'}
            `}>
              {/* Mobile Handle */}
              <div className="md:hidden flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>

              <ActivityDetailPanel
                activity={selectedActivity}
                isFullScreen={isFullScreen}
                onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                onClose={() => {
                  setSelectedActivity(null);
                  setIsFullScreen(false);
                }}
                onDeleted={() => {
                  loadActivities();
                  setSelectedActivity(null);
                }}
              />
            </div>
          </>
        )}
      </div>


      {/* Connect Data Table Dialog */}
      <Dialog open={connectTableDialogOpen} onOpenChange={setConnectTableDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Connect to Data Table</DialogTitle>
            <DialogDescription>
              Select a data table to sync activities from your existing database or external sources.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Table Selection */}
            <div className="grid gap-2">
              <Label htmlFor="dataTable">Select Data Table</Label>
              <Select
                value={selectedDataTable}
                onValueChange={setSelectedDataTable}
              >
                <SelectTrigger id="dataTable">
                  <SelectValue placeholder="Choose a data source..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activities_2024">Activities Table (2024)</SelectItem>
                  <SelectItem value="programs_master">Programs Master List</SelectItem>
                  <SelectItem value="events_calendar">Events Calendar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview of selected table */}
            {selectedDataTable && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="h-4 w-4 text-violet-600" />
                  <span className="text-sm">Preview - {selectedDataTable}</span>
                </div>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span>Total Records:</span>
                    <span className="">142 activities</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Updated:</span>
                    <span className="">Nov 15, 2025</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Columns Matched:</span>
                    <span className="text-emerald-600">6/6</span>
                  </div>
                </div>
              </div>
            )}

            {/* Sync Options */}
            <div className="grid gap-2">
              <Label>Sync Options</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>Auto-sync new activities</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span>Update existing activities</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>Two-way sync (update table from hub)</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setConnectTableDialogOpen(false);
              setSelectedDataTable('');
            }}>
              Cancel
            </Button>
            <Button 
              className="bg-violet-600 hover:bg-violet-700"
              disabled={!selectedDataTable}
              onClick={() => {
                // Here you would implement the table connection logic
                setConnectTableDialogOpen(false);
                setSelectedDataTable('');
                toast.success('Table connected successfully');
              }}
            >
              <Database className="h-4 w-4 mr-2" />
              Connect Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Activity</DialogTitle>
            <DialogDescription>
              Create a new activity or event for your workspace.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Activity Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Youth Basketball League"
                value={newActivity.name || ''}
                onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., After School Programs"
                value={newActivity.category || ''}
                onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={newActivity.status}
                onValueChange={(value: ActivityStatus) => 
                  setNewActivity({ ...newActivity, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="beginDate">Start Date *</Label>
                <Input
                  id="beginDate"
                  type="date"
                  value={newActivity.begin_date || ''}
                  onChange={(e) => setNewActivity({ ...newActivity, begin_date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newActivity.end_date || ''}
                  onChange={(e) => setNewActivity({ ...newActivity, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="participants">Initial Participants</Label>
              <Input
                id="participants"
                type="number"
                placeholder="0"
                value={newActivity.participants || 0}
                onChange={(e) => setNewActivity({ ...newActivity, participants: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of the activity"
                value={newActivity.description || ''}
                onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-violet-600 hover:bg-violet-700"
              onClick={handleAddActivity}
            >
              Create Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
