import { useState, useEffect } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Calendar, Users, Maximize2, X, Share2, Edit, Activity, Table, FileText, BarChart3, Zap, Database, Upload, ClipboardCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CommandPalette } from './CommandPalette';
import { AttendanceView } from './AttendanceView';
import { SetupAttendanceDialog } from './SetupAttendanceDialog';
import { TakeAttendanceDialog } from './TakeAttendanceDialog';
import { ActivityDetailPanel } from './ActivityDetailPanel';

export type Activity = {
  id: string;
  name: string;
  category: string;
  beginDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
  participants: number;
};

const mockActivities: Activity[] = [
  {
    id: '1',
    name: 'Adult Advanced Sewing ST25-26',
    category: 'Sustainable Community Schools',
    beginDate: '2025-09-17',
    endDate: '2026-05-15',
    status: 'active',
    participants: 24
  },
  {
    id: '2',
    name: 'Adult Art ST25-26',
    category: 'Sustainable Community Schools',
    beginDate: '2025-09-15',
    endDate: '2026-05-26',
    status: 'active',
    participants: 18
  },
  {
    id: '3',
    name: 'Adult Beginners Sewing ST25-26',
    category: 'Sustainable Community Schools',
    beginDate: '2025-09-16',
    endDate: '2026-05-26',
    status: 'active',
    participants: 32
  },
  {
    id: '4',
    name: 'Adult Beginners Spanish GED ST25-26',
    category: 'Sustainable Community Schools',
    beginDate: '2025-09-16',
    endDate: '2026-05-27',
    status: 'active',
    participants: 28
  },
  {
    id: '5',
    name: 'Adult Intermediate Spanish GED ST25-26',
    category: 'Sustainable Community Schools',
    beginDate: '2025-09-17',
    endDate: '2026-05-28',
    status: 'active',
    participants: 22
  },
  {
    id: '6',
    name: 'Adult Zumba ST25-26',
    category: 'Sustainable Community Schools',
    beginDate: '2025-09-23',
    endDate: '2026-05-07',
    status: 'active',
    participants: 45
  },
  {
    id: '7',
    name: 'S25 Adult Art/Manualidades',
    category: 'Sustainable Community Schools',
    beginDate: '2025-07-01',
    endDate: '2025-07-29',
    status: 'completed',
    participants: 16
  },
  {
    id: '8',
    name: 'S25 Adult Sewing',
    category: 'Sustainable Community Schools',
    beginDate: '2025-06-30',
    endDate: '2025-07-28',
    status: 'completed',
    participants: 20
  },
  {
    id: '9',
    name: 'S25 Adult Zumba',
    category: 'Sustainable Community Schools',
    beginDate: '2025-06-30',
    endDate: '2025-07-30',
    status: 'completed',
    participants: 38
  },
  {
    id: '10',
    name: 'S25 Debate en Espanol',
    category: 'Sustainable Community Schools',
    beginDate: '2025-07-01',
    endDate: '2025-07-30',
    status: 'completed',
    participants: 12
  },
  {
    id: '11',
    name: 'S25 Latinos Unidos',
    category: 'Sustainable Community Schools',
    beginDate: '2025-07-01',
    endDate: '2025-07-23',
    status: 'completed',
    participants: 15
  },
  {
    id: '12',
    name: 'S25 OSC Mentors (Mural)',
    category: 'Sustainable Community Schools',
    beginDate: '2025-06-25',
    endDate: '2025-08-01',
    status: 'completed',
    participants: 8
  },
  {
    id: '13',
    name: 'S25 OSC Mentors (Tiuffula)',
    category: 'Sustainable Community Schools',
    beginDate: '2025-06-23',
    endDate: '2025-07-31',
    status: 'completed',
    participants: 10
  },
  {
    id: '14',
    name: 'SY25-26 Asian American Club',
    category: 'Sustainable Community Schools',
    beginDate: '2025-09-16',
    endDate: '2026-05-05',
    status: 'active',
    participants: 25
  }
];

export function ActivitiesEventsPage() {
  const [commandOpen, setCommandOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModule, setActiveModule] = useState('activity-hubs');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activities, setActivities] = useState(mockActivities);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [connectTableDialogOpen, setConnectTableDialogOpen] = useState(false);
  const [selectedDataTable, setSelectedDataTable] = useState('');
  const [setupAttendanceOpen, setSetupAttendanceOpen] = useState(false);
  const [takeAttendanceOpen, setTakeAttendanceOpen] = useState(false);
  const [attendanceActivity, setAttendanceActivity] = useState<Activity | null>(null);
  const [newActivity, setNewActivity] = useState({
    name: '',
    category: '',
    status: 'upcoming' as 'active' | 'upcoming' | 'completed',
    beginDate: '',
    endDate: '',
    participants: 0,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         activity.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const activeCount = mockActivities.filter(a => a.status === 'active').length;
  const completedCount = mockActivities.filter(a => a.status === 'completed').length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleAddActivity = () => {
    const activity: Activity = {
      id: `act-${Date.now()}`,
      name: newActivity.name,
      category: newActivity.category,
      status: newActivity.status,
      beginDate: newActivity.beginDate,
      endDate: newActivity.endDate,
      participants: newActivity.participants,
    };
    
    setActivities([activity, ...activities]);
    setAddDialogOpen(false);
    
    // Reset form
    setNewActivity({
      name: '',
      category: '',
      status: 'upcoming',
      beginDate: '',
      endDate: '',
      participants: 0,
    });
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-3 md:px-6 py-2 md:py-3 flex items-center justify-between gap-2 md:gap-4">
        {/* Left: Organization */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-blue-50 rounded-lg">
            <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs">
              B
            </div>
            <span className="text-xs md:text-sm hidden sm:inline">BPNC</span>
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
            JD
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
              <Activity className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
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
        {activeModule === 'attendance' ? (
          /* Attendance View */
          <div className="flex-1 overflow-auto">
            <AttendanceView 
              activities={activities} 
              onSelectActivity={(activity) => {
                setAttendanceActivity(activity);
                setTakeAttendanceOpen(true);
              }}
            />
          </div>
        ) : (
          /* Activities List */
          <>
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
                All {mockActivities.length}
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
              {filteredActivities.map((activity) => (
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
                        <h3 className="text-xs md:text-sm text-gray-900 flex-1 line-clamp-2">{activity.name}</h3>
                        <Badge className="bg-emerald-50 text-emerald-700 text-xs px-1.5 md:px-2 py-0.5 border-0 flex-shrink-0">
                          {activity.status}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{formatDate(activity.beginDate)}</span>
                          <span>→</span>
                          <span className="truncate">{formatDate(activity.endDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 flex-shrink-0" />
                          <span>{activity.participants} enrolled</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
                onSetupAttendance={() => {
                  setAttendanceActivity(selectedActivity);
                  setSetupAttendanceOpen(true);
                }}
              />
            </div>
          </>
        )}
      </>
        )}
      </div>

      {/* Add Activity Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Activity</DialogTitle>
            <DialogDescription>
              Create a new activity or event for your school management system.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Activity Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Youth Basketball League"
                value={newActivity.name}
                onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                placeholder="e.g., After School Programs"
                value={newActivity.category}
                onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={newActivity.status}
                onValueChange={(value: 'active' | 'upcoming' | 'completed') => 
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
                  value={newActivity.beginDate}
                  onChange={(e) => setNewActivity({ ...newActivity, beginDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newActivity.endDate}
                  onChange={(e) => setNewActivity({ ...newActivity, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="participants">Initial Participants</Label>
              <Input
                id="participants"
                type="number"
                placeholder="0"
                value={newActivity.participants}
                onChange={(e) => setNewActivity({ ...newActivity, participants: parseInt(e.target.value) || 0 })}
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
              disabled={!newActivity.name || !newActivity.category || !newActivity.beginDate || !newActivity.endDate}
            >
              Create Activity
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <SelectItem value="cityspan_import">CitySpan Import</SelectItem>
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
              }}
            >
              <Database className="h-4 w-4 mr-2" />
              Connect Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* Setup Attendance Dialog */}
      <SetupAttendanceDialog
        open={setupAttendanceOpen}
        onClose={() => setSetupAttendanceOpen(false)}
        activity={attendanceActivity}
        onSetup={(schedule) => {
          console.log('Setup attendance schedule:', schedule);
          // Here you would save the schedule
        }}
      />

      {/* Take Attendance Dialog */}
      <TakeAttendanceDialog
        open={takeAttendanceOpen}
        onClose={() => setTakeAttendanceOpen(false)}
        activity={attendanceActivity}
        sessionDate="2025-11-12"
        sessionTime={{ begin: "6:00 PM", end: "8:00 PM" }}
        onSave={(records) => {
          console.log('Attendance records saved:', records);
          // Here you would save the attendance records
        }}
      />
    </div>
  );
}