import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface StatusConfig {
  id: string;
  name: string;
  color: string;
  isPredefined: boolean;
  description?: string;
}

const predefinedStatuses: StatusConfig[] = [
  { id: 'draft', name: 'Draft', color: 'gray', isPredefined: true, description: 'Request is being prepared' },
  { id: 'submitted', name: 'Submitted', color: 'blue', isPredefined: true, description: 'Request has been submitted' },
  { id: 'under_review', name: 'Under Review', color: 'yellow', isPredefined: true, description: 'Request is being reviewed' },
  { id: 'approved', name: 'Approved', color: 'green', isPredefined: true, description: 'Request has been approved' },
  { id: 'denied', name: 'Denied', color: 'red', isPredefined: true, description: 'Request has been denied' },
  { id: 'completed', name: 'Completed', color: 'purple', isPredefined: true, description: 'Request is completed' },
];

const colorOptions = [
  { value: 'gray', label: 'Gray', class: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'green', label: 'Green', class: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'red', label: 'Red', class: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-100 text-pink-700 border-pink-200' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
];

export function StatusManagement() {
  const [statuses, setStatuses] = useState<StatusConfig[]>(predefinedStatuses);
  const [customStatuses, setCustomStatuses] = useState<StatusConfig[]>([]);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('blue');
  const [newStatusDescription, setNewStatusDescription] = useState('');
  const [editingStatus, setEditingStatus] = useState<string | null>(null);

  const handleAddStatus = () => {
    if (!newStatusName.trim()) {
      toast.error('Please enter a status name');
      return;
    }

    const statusId = newStatusName.toLowerCase().replace(/\s+/g, '_');
    
    // Check if status already exists
    if ([...statuses, ...customStatuses].some(s => s.id === statusId)) {
      toast.error('A status with this name already exists');
      return;
    }

    const newStatus: StatusConfig = {
      id: statusId,
      name: newStatusName,
      color: newStatusColor,
      isPredefined: false,
      description: newStatusDescription,
    };

    setCustomStatuses([...customStatuses, newStatus]);
    setNewStatusName('');
    setNewStatusDescription('');
    toast.success(`Status "${newStatusName}" added successfully`);
  };

  const handleDeleteStatus = (statusId: string) => {
    setCustomStatuses(customStatuses.filter(s => s.id !== statusId));
    toast.success('Status deleted');
  };

  const getColorClass = (color: string) => {
    const option = colorOptions.find(o => o.value === color);
    return option?.class || colorOptions[0].class;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Predefined Statuses</CardTitle>
          <CardDescription>
            System default statuses that cannot be modified
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {statuses.map((status) => (
              <div key={status.id} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getColorClass(status.color)}>
                    {status.name}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Predefined
                  </Badge>
                </div>
                {status.description && (
                  <p className="text-sm text-gray-600 mt-2">{status.description}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Statuses</CardTitle>
          <CardDescription>
            Add custom statuses for your specific workflow needs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Status Form */}
          <div className="p-4 border rounded-lg bg-blue-50 border-blue-200 space-y-4">
            <h4 className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Custom Status
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="statusName">Status Name *</Label>
                <Input
                  id="statusName"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  placeholder="e.g., Pending Revision"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="statusColor">Color</Label>
                <select
                  id="statusColor"
                  value={newStatusColor}
                  onChange={(e) => setNewStatusColor(e.target.value)}
                  className="w-full h-10 px-3 py-2 border rounded-md"
                >
                  {colorOptions.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="statusDescription">Description (Optional)</Label>
                <Input
                  id="statusDescription"
                  value={newStatusDescription}
                  onChange={(e) => setNewStatusDescription(e.target.value)}
                  placeholder="Describe when this status should be used"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleAddStatus}>
                <Plus className="h-4 w-4 mr-2" />
                Add Status
              </Button>
              
              {newStatusName && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Preview:</span>
                  <Badge className={getColorClass(newStatusColor)}>
                    {newStatusName}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Custom Statuses List */}
          {customStatuses.length > 0 ? (
            <div>
              <h4 className="mb-3">Your Custom Statuses</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customStatuses.map((status) => (
                  <div key={status.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getColorClass(status.color)}>
                        {status.name}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStatus(status.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    {status.description && (
                      <p className="text-sm text-gray-600 mt-2">{status.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 border rounded-lg border-dashed">
              No custom statuses yet. Add one above to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <p>• Custom statuses can be used in workflows alongside predefined statuses</p>
          <p>• Each status should represent a distinct stage in your approval process</p>
          <p>• Choose colors that make sense for your organization (e.g., yellow for pending, green for approved)</p>
          <p>• Status names should be clear and descriptive for all users</p>
        </CardContent>
      </Card>
    </div>
  );
}
