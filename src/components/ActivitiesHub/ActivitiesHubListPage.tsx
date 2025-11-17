'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Calendar, Users, Activity } from 'lucide-react';
import { Button } from '@/ui-components/button';
import { Badge } from '@/ui-components/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui-components/dialog';
import { Input } from '@/ui-components/input';
import { Label } from '@/ui-components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-components/select';
import { toast } from 'sonner';
import {
  listActivitiesHubs,
  createActivitiesHub,
  deleteActivitiesHub,
  generateSlug,
  formatDate,
} from '@/lib/api/activities-hubs-client';
import type { ActivitiesHub, ActivityStatus, CreateActivityInput } from '@/types/activities-hubs';

interface ActivitiesHubListPageProps {
  workspaceId: string;
  onSelectActivity?: (activity: ActivitiesHub) => void;
}

export function ActivitiesHubListPage({ workspaceId, onSelectActivity }: ActivitiesHubListPageProps) {
  const [activities, setActivities] = useState<ActivitiesHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ActivityStatus | 'all'>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivitiesHub | null>(null);
  
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
      const data = await listActivitiesHubs(workspaceId, { includeInactive: true });
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
        workspace_id: workspaceId,
        name: newActivity.name,
        slug: newActivity.slug || generateSlug(newActivity.name),
        category: newActivity.category || '',
        description: newActivity.description,
        status: newActivity.status as ActivityStatus || 'upcoming',
        begin_date: newActivity.begin_date,
        end_date: newActivity.end_date,
        participants: newActivity.participants || 0,
      };

      const created = await createActivitiesHub(activityData);
      
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

  const handleSelectActivity = (activity: ActivitiesHub) => {
    setSelectedActivity(activity);
    if (onSelectActivity) {
      onSelectActivity(activity);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading activities...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="p-3 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Activities Hub</h1>
          <Button 
            onClick={() => setAddDialogOpen(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search activities..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('all')}
            className="whitespace-nowrap"
          >
            All {activities.length}
          </Button>
          <Button
            variant={filterStatus === 'active' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('active')}
            className="whitespace-nowrap"
          >
            Active {activeCount}
          </Button>
          <Button
            variant={filterStatus === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('upcoming')}
            className="whitespace-nowrap"
          >
            Upcoming {upcomingCount}
          </Button>
          <Button
            variant={filterStatus === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('completed')}
            className="whitespace-nowrap"
          >
            Completed {completedCount}
          </Button>
        </div>

        {/* Activities List */}
        <div className="space-y-3">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                onClick={() => handleSelectActivity(activity)}
                className={`bg-white rounded-xl p-4 border transition-all cursor-pointer hover:shadow-md ${
                  selectedActivity?.id === activity.id
                    ? 'border-violet-600 shadow-sm'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900 flex-1">{activity.name}</h3>
                  <Badge 
                    className={`
                      ${activity.status === 'active' ? 'bg-emerald-50 text-emerald-700' : ''}
                      ${activity.status === 'upcoming' ? 'bg-blue-50 text-blue-700' : ''}
                      ${activity.status === 'completed' ? 'bg-gray-50 text-gray-700' : ''}
                    `}
                  >
                    {activity.status}
                  </Badge>
                </div>
                
                {activity.category && (
                  <p className="text-xs text-gray-500 mb-2">{activity.category}</p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(activity.begin_date)} → {formatDate(activity.end_date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{activity.participants} enrolled</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
