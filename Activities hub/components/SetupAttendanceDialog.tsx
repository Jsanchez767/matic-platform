import { useState } from 'react';
import { Calendar, Clock, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Activity } from './ActivitiesEventsPage';

type MeetingSchedule = {
  day: string;
  startTime: string;
  endTime: string;
};

type SetupAttendanceDialogProps = {
  open: boolean;
  onClose: () => void;
  activity: Activity | null;
  onSetup: (schedule: { dateRange: { start: string; end: string }; meetings: MeetingSchedule[] }) => void;
};

export function SetupAttendanceDialog({ open, onClose, activity, onSetup }: SetupAttendanceDialogProps) {
  const [dateRange, setDateRange] = useState({
    start: activity?.beginDate || '',
    end: activity?.endDate || ''
  });

  const [meetings, setMeetings] = useState<MeetingSchedule[]>([
    { day: 'monday', startTime: '16:00', endTime: '18:00' }
  ]);

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const addMeeting = () => {
    setMeetings([...meetings, { day: 'monday', startTime: '16:00', endTime: '18:00' }]);
  };

  const removeMeeting = (index: number) => {
    setMeetings(meetings.filter((_, i) => i !== index));
  };

  const updateMeeting = (index: number, field: keyof MeetingSchedule, value: string) => {
    const updated = [...meetings];
    updated[index][field] = value;
    setMeetings(updated);
  };

  const handleSetup = () => {
    onSetup({ dateRange, meetings });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Setup Attendance Schedule</DialogTitle>
          <DialogDescription>
            Configure when this activity meets to automatically generate attendance sheets
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Activity Info */}
          {activity && (
            <div className="bg-violet-50 rounded-lg p-4">
              <h3 className="text-sm text-violet-900 mb-1">{activity.name}</h3>
              <p className="text-xs text-violet-700">{activity.category}</p>
            </div>
          )}

          {/* Date Range */}
          <div className="space-y-4">
            <Label className="text-base">Date Range</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Meeting Schedule */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Meeting Schedule</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMeeting}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Meeting
              </Button>
            </div>

            <div className="space-y-3">
              {meetings.map((meeting, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Day of Week</Label>
                        <Select
                          value={meeting.day}
                          onValueChange={(value) => updateMeeting(index, 'day', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {daysOfWeek.map((day) => (
                              <SelectItem key={day.value} value={day.value}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Start Time</Label>
                        <Input
                          type="time"
                          value={meeting.startTime}
                          onChange={(e) => updateMeeting(index, 'startTime', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">End Time</Label>
                        <Input
                          type="time"
                          value={meeting.endTime}
                          onChange={(e) => updateMeeting(index, 'endTime', e.target.value)}
                        />
                      </div>
                    </div>
                    {meetings.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMeeting(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm text-gray-900 mb-2">Preview</h4>
            <p className="text-xs text-gray-600 mb-3">
              This will generate attendance sheets for:
            </p>
            <ul className="text-xs text-gray-700 space-y-1">
              {meetings.map((meeting, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-violet-600" />
                  Every {daysOfWeek.find(d => d.value === meeting.day)?.label} from{' '}
                  {meeting.startTime} to {meeting.endTime}
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-600 mt-3">
              Between {new Date(dateRange.start).toLocaleDateString()} and{' '}
              {new Date(dateRange.end).toLocaleDateString()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-violet-600 hover:bg-violet-700"
            onClick={handleSetup}
            disabled={!dateRange.start || !dateRange.end || meetings.length === 0}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Generate Attendance Sheets
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
