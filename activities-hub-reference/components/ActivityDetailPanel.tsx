import { useState } from 'react';
import { X, Maximize2, Trash2, Calendar, Users, MapPin, DollarSign, ChevronDown, ChevronUp, ClipboardCheck, GraduationCap, Target } from 'lucide-react';
import { Button } from './ui/button';
import type { Activity } from './ActivitiesEventsPage';

type ActivityDetailPanelProps = {
  activity: Activity;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onClose: () => void;
  onSetupAttendance: () => void;
};

type SectionKey = 
  | 'program' 
  | 'categories' 
  | 'provider'
  | 'eligibility'
  | 'enrollment'
  | 'location'
  | 'description';

export function ActivityDetailPanel({
  activity,
  isFullScreen,
  onToggleFullScreen,
  onClose,
  onSetupAttendance
}: ActivityDetailPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(
    new Set(['program', 'description', 'location'])
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const toggleSection = (section: SectionKey) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
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
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
        >
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Icon className="h-5 w-5 text-violet-600" />
              </div>
            )}
            <div className="text-left">
              <h3 className="text-sm text-gray-900">{title}</h3>
              {badge && !isExpanded && (
                <p className="text-xs text-gray-500 mt-0.5">{badge}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
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

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Group Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFullScreen}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:bg-gray-200 hidden md:block"
            >
              <Maximize2 className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors active:bg-gray-200"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <h1 className="text-xl md:text-2xl text-gray-900 mb-4 leading-tight">{activity.name}</h1>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs text-emerald-700">Enrolled</span>
            </div>
            <div className="text-xl text-emerald-900">{activity.participants}</div>
            <div className="text-xs text-emerald-600">of 50</div>
          </div>
          <div className="bg-violet-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-3.5 w-3.5 text-violet-600" />
              <span className="text-xs text-violet-700">Attendance</span>
            </div>
            <div className="text-xl text-violet-900">94%</div>
            <div className="text-xs text-violet-600">avg rate</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ClipboardCheck className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-xs text-blue-700">Sessions</span>
            </div>
            <div className="text-xl text-blue-900">24</div>
            <div className="text-xs text-blue-600">total</div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto px-4 md:px-6 py-4 space-y-4 pb-24 md:pb-6">
        
        {/* Program Information */}
        <CollapsibleSection 
          title="Program Information" 
          sectionKey="program"
          icon={GraduationCap}
          badge={activity.category}
        >
          <div className="space-y-3">
            <InfoRow label="Program Category" value={activity.category} fullWidth />
            <InfoRow label="Funding Source" value="SCS Funds" fullWidth />
            <InfoRow label="Program Year" value="FY 25-26" fullWidth />
          </div>
        </CollapsibleSection>

        {/* Activity Categories */}
        <CollapsibleSection 
          title="21st CCLC Categories" 
          sectionKey="categories"
          icon={Target}
          badge="Well-rounded Education"
        >
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-2">Primary Category</div>
              <div className="inline-flex items-center px-3 py-2 bg-violet-100 text-violet-700 rounded-lg text-sm">
                Well-rounded Education Activities
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2">Sub-Category</div>
              <div className="inline-flex items-center px-3 py-2 bg-violet-100 text-violet-700 rounded-lg text-sm">
                Arts & Music
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Service Provider */}
        <CollapsibleSection 
          title="Service Provider" 
          sectionKey="provider"
          icon={Users}
          badge="Brighton Park Neighborhood Council"
        >
          <div className="space-y-3">
            <InfoRow label="Provider Name" value="Brighton Park Neighborhood Council" fullWidth />
            <InfoRow label="Contact Person" value="Maria Rodriguez" fullWidth />
            <InfoRow label="Email" value="maria@bpnc.org" fullWidth />
            <InfoRow label="Phone" value="(312) 555-0123" fullWidth />
          </div>
        </CollapsibleSection>

        {/* Eligibility */}
        <CollapsibleSection 
          title="Eligibility Requirements" 
          sectionKey="eligibility"
          icon={GraduationCap}
          badge="Community Adults/Parents"
        >
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Target Group" value="Community Adults/Parents" />
            <InfoRow label="Gender" value="Both" />
            <InfoRow label="Fee Scale" value="Free" />
            <InfoRow label="Grade Level" value="Adult Participants" />
          </div>
        </CollapsibleSection>

        {/* Enrollment */}
        <CollapsibleSection 
          title="Target Enrollment" 
          sectionKey="enrollment"
          icon={Target}
          badge={`${activity.participants}/50 enrolled`}
        >
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Enrollment Progress</span>
                <span className="text-gray-900">{Math.round((activity.participants / 50) * 100)}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-violet-600 rounded-full transition-all duration-500"
                  style={{ width: `${(activity.participants / 50) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {50 - activity.participants} spots remaining
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Target Total" value="50" />
              <InfoRow label="Current Enrolled" value={activity.participants} />
              <InfoRow label="Parents/Community" value={activity.participants} />
              <InfoRow label="Waitlist" value="0" />
            </div>
          </div>
        </CollapsibleSection>

        {/* Location */}
        <CollapsibleSection 
          title="Location Details" 
          sectionKey="location"
          icon={MapPin}
          badge="Kelly College Prep, Room 253"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Facility" value="Kelly College Prep" />
              <InfoRow label="Room Number" value="253" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-2">Address</div>
              <div className="text-sm text-gray-900">
                4136 S California Ave<br />
                Chicago, IL 60632
              </div>
            </div>
            <div className="pt-2">
              <Button 
                variant="outline" 
                className="w-full justify-center"
                onClick={() => window.open('https://maps.google.com', '_blank')}
              >
                <MapPin className="h-4 w-4 mr-2" />
                View on Map
              </Button>
            </div>
          </div>
        </CollapsibleSection>

        {/* Description */}
        <CollapsibleSection 
          title="Activity Description" 
          sectionKey="description"
          badge="Full details"
        >
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-gray-700 leading-relaxed">
              In our Sewing Club, participants have the opportunity to learn and develop their 
              sewing skills in a supportive and creative environment. Whether you are a beginner 
              or already have some sewing experience, our club welcomes all students who are eager 
              to explore the art of sewing.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed mt-3">
              Participants will learn essential sewing techniques, from basic hand-stitching to 
              machine sewing, enabling them to complete a variety of projects. This hands-on 
              experience will help boost their confidence and proficiency.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed mt-3">
              The club encourages members to express their individuality through their sewing 
              projects. Whether creating clothing, accessories, or home décor items, students will 
              have the freedom to bring their creative visions to life.
            </p>
          </div>
        </CollapsibleSection>

        {/* Schedule Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            Schedule
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div>
                <div className="text-xs text-gray-500">Start Date</div>
                <div className="text-sm text-gray-900 mt-0.5">{formatDate(activity.beginDate)}</div>
              </div>
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-violet-600" />
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-xs text-gray-500">End Date</div>
                <div className="text-sm text-gray-900 mt-0.5">{formatDate(activity.endDate)}</div>
              </div>
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-violet-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions - Mobile Friendly */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 space-y-2">
        <Button 
          className="w-full bg-violet-600 hover:bg-violet-700 text-white h-12 text-base"
          onClick={onSetupAttendance}
        >
          <ClipboardCheck className="h-5 w-5 mr-2" />
          Setup Attendance
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline"
            className="h-11"
            onClick={() => {/* Edit handler */}}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg text-gray-900 mb-2">Delete Activity?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete "{activity.name}" and all associated data. This action cannot be undone.
            </p>
            <div className="space-y-2">
              <Button 
                className="w-full bg-red-600 hover:bg-red-700 text-white h-11"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onClose();
                }}
              >
                Delete Activity
              </Button>
              <Button 
                variant="outline"
                className="w-full h-11"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
