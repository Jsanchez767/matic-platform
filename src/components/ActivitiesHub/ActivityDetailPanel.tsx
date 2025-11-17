'use client';

import { useState } from 'react';
import { X, Maximize2, Trash2, Calendar, Users, MapPin, ChevronDown, ChevronUp, ClipboardCheck, GraduationCap, Target } from 'lucide-react';
import { Button } from '@/ui-components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/ui-components/dialog';
import { toast } from 'sonner';
import { deleteActivitiesHub, formatDate } from '@/lib/api/activities-hubs-client';
import type { ActivitiesHub } from '@/types/activities-hubs';

type ActivityDetailPanelProps = {
  activity: ActivitiesHub;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onClose: () => void;
  onDeleted?: () => void;
};

type SectionKey = 
  | 'program' 
  | 'categories' 
  | 'enrollment'
  | 'description';

export function ActivityDetailPanel({
  activity,
  isFullScreen = false,
  onToggleFullScreen,
  onClose,
  onDeleted
}: ActivityDetailPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(['program', 'description'])
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleSection = (section: SectionKey) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteActivitiesHub(activity.id);
      
      toast.success(`Activity "${activity.name}" deleted successfully`);
      
      if (onDeleted) {
        onDeleted();
      }
      onClose();
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const CollapsibleSection = ({ 
    title, 
    sectionKey,
    icon: Icon,
    badge,
    children 
  }: { 
    title: string; 
    sectionKey: SectionKey;
    icon?: any;
    badge?: string;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-violet-600" />
              </div>
            )}
            <div className="text-left">
              <h3 className="text-sm font-medium text-gray-900">{title}</h3>
              {badge && !isExpanded && (
                <p className="text-xs text-gray-500 mt-0.5">{badge}</p>
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50">
            {children}
          </div>
        )}
      </div>
    );
  };

  const InfoRow = ({ 
    label, 
    value,
    fullWidth = false 
  }: { 
    label: string; 
    value: string | number; 
    fullWidth?: boolean;
  }) => (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );

  const targetEnrollment = 50; // This could come from activity.settings

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              activity.status === 'active' ? 'bg-emerald-500 animate-pulse' :
              activity.status === 'upcoming' ? 'bg-blue-500' :
              'bg-gray-400'
            }`}></div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Activity</span>
          </div>
          <div className="flex items-center gap-2">
            {onToggleFullScreen && (
              <button
                onClick={onToggleFullScreen}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"
              >
                <Maximize2 className="h-4 w-4 text-gray-600" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">{activity.name}</h1>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs text-emerald-700">Enrolled</span>
            </div>
            <div className="text-xl font-semibold text-emerald-900">{activity.participants}</div>
            <div className="text-xs text-emerald-600">of {targetEnrollment}</div>
          </div>
          <div className="bg-violet-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5 text-violet-600" />
              <span className="text-xs text-violet-700">Status</span>
            </div>
            <div className="text-lg font-semibold text-violet-900 capitalize">{activity.status}</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ClipboardCheck className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs text-blue-700">Duration</span>
            </div>
            <div className="text-lg font-semibold text-blue-900">
              {activity.begin_date && activity.end_date ? (
                Math.ceil((new Date(activity.end_date).getTime() - new Date(activity.begin_date).getTime()) / (1000 * 60 * 60 * 24))
              ) : '-'}
            </div>
            <div className="text-xs text-blue-600">days</div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-4 space-y-4">
        
        {/* Program Information */}
        <CollapsibleSection 
          title="Program Information" 
          sectionKey="program"
          icon={GraduationCap}
          badge={activity.category || 'No category'}
        >
          <div className="space-y-3">
            <InfoRow label="Program Category" value={activity.category || 'Not specified'} fullWidth />
            <InfoRow label="Activity Name" value={activity.name} fullWidth />
            <InfoRow label="Status" value={activity.status} fullWidth />
          </div>
        </CollapsibleSection>

        {/* Enrollment */}
        <CollapsibleSection 
          title="Enrollment" 
          sectionKey="enrollment"
          icon={Target}
          badge={`${activity.participants}/${targetEnrollment} enrolled`}
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Enrollment Progress</span>
                <span className="font-medium text-gray-900">{Math.round((activity.participants / targetEnrollment) * 100)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all"
                  style={{ width: `${(activity.participants / targetEnrollment) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {targetEnrollment - activity.participants} spots remaining
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Target Total" value={targetEnrollment} />
              <InfoRow label="Current Enrolled" value={activity.participants} />
            </div>
          </div>
        </CollapsibleSection>

        {/* Description */}
        {activity.description && (
          <CollapsibleSection 
            title="Activity Description" 
            sectionKey="description"
            badge="Full details"
          >
            <div className="prose prose-sm max-w-none">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {activity.description}
              </p>
            </div>
          </CollapsibleSection>
        )}

        {/* Schedule Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            Schedule
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div>
                <div className="text-xs text-gray-500">Start Date</div>
                <div className="text-sm font-medium text-gray-900 mt-0.5">
                  {activity.begin_date ? formatDate(activity.begin_date) : 'Not set'}
                </div>
              </div>
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-violet-600" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-xs text-gray-500">End Date</div>
                <div className="text-sm font-medium text-gray-900 mt-0.5">
                  {activity.end_date ? formatDate(activity.end_date) : 'Not set'}
                </div>
              </div>
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline"
            className="h-11"
          >
            Edit Details
          </Button>
          <Button 
            variant="outline"
            className="h-11 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity?</DialogTitle>
            <DialogDescription>
              This will permanently delete "{activity.name}" and all associated data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Activity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
