"use client";

import { useState } from 'react';
import { Card } from '@/ui-components/card';
import { Button } from '@/ui-components/button';
import { Input } from '@/ui-components/input';
import { Label } from '@/ui-components/label';
import { Textarea } from '@/ui-components/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-components/select';
import { Checkbox } from '@/ui-components/checkbox';
import { Badge } from '@/ui-components/badge';
import {
  Settings,
  FileText,
  Workflow,
  Bell,
  Users,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  Check
} from 'lucide-react';
import type { FormTemplate, FormField, WorkflowTemplate, UserRole } from '@/types/request';

type SettingsTab = 'request-types' | 'workflows' | 'notifications' | 'permissions';

interface SettingsPageProps {
  onClose: () => void;
  onSave: (settings: any) => Promise<void>;
  initialSettings?: any;
}

export function SettingsPage({ onClose, onSave, initialSettings }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('request-types');
  const [isSaving, setIsSaving] = useState(false);

  // Request Types State
  const [requestTypes, setRequestTypes] = useState<FormTemplate[]>(initialSettings?.requestTypes || []);
  const [editingType, setEditingType] = useState<string | null>(null);

  // Workflows State
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>(initialSettings?.workflows || []);
  
  // Notifications State
  const [notificationSettings, setNotificationSettings] = useState({
    emailOnSubmit: initialSettings?.notifications?.emailOnSubmit ?? true,
    emailOnApprove: initialSettings?.notifications?.emailOnApprove ?? true,
    emailOnDeny: initialSettings?.notifications?.emailOnDeny ?? true,
    slackWebhook: initialSettings?.notifications?.slackWebhook || '',
  });

  // Permissions State
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, string[]>>(
    initialSettings?.rolePermissions || {
      staff: ['submit', 'view_own'],
      supervisor: ['submit', 'view_own', 'approve', 'view_team'],
      program_director: ['submit', 'view_own', 'approve', 'view_all'],
      finance: ['view_all', 'approve'],
      admin: ['submit', 'view_own', 'approve', 'view_all', 'configure', 'manage_users'],
      transportation: ['view_all', 'approve'],
      editor: ['submit', 'view_own', 'view_all'],
      viewer: ['view_own']
    }
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        requestTypes,
        workflows,
        notifications: notificationSettings,
        rolePermissions
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-gray-700" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-gray-600">Configure your request management system</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={onClose} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('request-types')}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'request-types'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <FileText className="h-4 w-4" />
            Request Types
          </button>
          
          <button
            onClick={() => setActiveTab('workflows')}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'workflows'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <Workflow className="h-4 w-4" />
            Approval Workflows
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <Bell className="h-4 w-4" />
            Notifications
          </button>
          
          <button
            onClick={() => setActiveTab('permissions')}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
              }
            `}
          >
            <Users className="h-4 w-4" />
            Roles & Permissions
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'request-types' && (
          <RequestTypesTab
            requestTypes={requestTypes}
            onChange={setRequestTypes}
            editingType={editingType}
            setEditingType={setEditingType}
          />
        )}
        
        {activeTab === 'workflows' && (
          <WorkflowsTab
            workflows={workflows}
            onChange={setWorkflows}
          />
        )}
        
        {activeTab === 'notifications' && (
          <NotificationsTab
            settings={notificationSettings}
            onChange={setNotificationSettings}
          />
        )}
        
        {activeTab === 'permissions' && (
          <PermissionsTab
            rolePermissions={rolePermissions}
            onChange={setRolePermissions}
          />
        )}
      </div>
    </div>
  );
}

// Request Types Tab Component
function RequestTypesTab({ 
  requestTypes, 
  onChange, 
  editingType, 
  setEditingType 
}: {
  requestTypes: FormTemplate[];
  onChange: (types: FormTemplate[]) => void;
  editingType: string | null;
  setEditingType: (id: string | null) => void;
}) {
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');

  const handleAddType = () => {
    if (!newTypeName.trim()) return;

    const newType: FormTemplate = {
      id: `type_${Date.now()}`,
      hub_id: '',
      request_type: newTypeName.toLowerCase().replace(/\s+/g, '_'),
      name: newTypeName,
      description: newTypeDescription,
      fields: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onChange([...requestTypes, newType]);
    setNewTypeName('');
    setNewTypeDescription('');
  };

  const handleDeleteType = (id: string) => {
    if (confirm('Are you sure you want to delete this request type?')) {
      onChange(requestTypes.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Request Type</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type-name">Type Name *</Label>
              <Input
                id="type-name"
                placeholder="e.g., Program Supplies Request"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="type-description">Description</Label>
              <Input
                id="type-description"
                placeholder="Brief description of this request type"
                value={newTypeDescription}
                onChange={(e) => setNewTypeDescription(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleAddType} disabled={!newTypeName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Request Type
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Existing Request Types</h3>
        {requestTypes.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No request types configured yet</p>
          </Card>
        ) : (
          requestTypes.map((type) => (
            <Card key={type.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">{type.name}</h4>
                  {type.description && (
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline">{type.fields.length} fields</Badge>
                    <Badge variant="outline">ID: {type.request_type}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingType(type.id)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Fields
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteType(type.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Workflows Tab Component
function WorkflowsTab({ 
  workflows, 
  onChange 
}: {
  workflows: WorkflowTemplate[];
  onChange: (workflows: WorkflowTemplate[]) => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Approval Workflows</h3>
        <p className="text-gray-600 mb-4">
          Define multi-step approval processes for your requests
        </p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Workflow
        </Button>
      </Card>

      {workflows.length === 0 ? (
        <Card className="p-12 text-center">
          <Workflow className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No workflows configured yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Create workflows to automate approval processes
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="p-6">
              <h4 className="text-lg font-semibold text-gray-900">{workflow.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
              <div className="mt-4">
                <Badge variant="outline">{workflow.steps.length} steps</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Notifications Tab Component
function NotificationsTab({
  settings,
  onChange
}: {
  settings: any;
  onChange: (settings: any) => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Send email when request is submitted</Label>
              <p className="text-sm text-gray-600">Notify approvers of new requests</p>
            </div>
            <Checkbox
              checked={settings.emailOnSubmit}
              onCheckedChange={(checked) => onChange({ ...settings, emailOnSubmit: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Send email when request is approved</Label>
              <p className="text-sm text-gray-600">Notify submitter of approval</p>
            </div>
            <Checkbox
              checked={settings.emailOnApprove}
              onCheckedChange={(checked) => onChange({ ...settings, emailOnApprove: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Send email when request is denied</Label>
              <p className="text-sm text-gray-600">Notify submitter of denial</p>
            </div>
            <Checkbox
              checked={settings.emailOnDeny}
              onCheckedChange={(checked) => onChange({ ...settings, emailOnDeny: checked })}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Slack Integration</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
            <p className="text-sm text-gray-600 mb-2">
              Enter your Slack incoming webhook URL to receive notifications
            </p>
            <Input
              id="slack-webhook"
              placeholder="https://hooks.slack.com/services/..."
              value={settings.slackWebhook}
              onChange={(e) => onChange({ ...settings, slackWebhook: e.target.value })}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

// Permissions Tab Component
function PermissionsTab({
  rolePermissions,
  onChange
}: {
  rolePermissions: Record<UserRole, string[]>;
  onChange: (permissions: Record<UserRole, string[]>) => void;
}) {
  const availablePermissions = [
    { id: 'submit', label: 'Submit Requests', description: 'Create new requests' },
    { id: 'view_own', label: 'View Own Requests', description: 'View own submitted requests' },
    { id: 'view_team', label: 'View Team Requests', description: 'View requests from team members' },
    { id: 'view_all', label: 'View All Requests', description: 'View all requests in system' },
    { id: 'approve', label: 'Approve Requests', description: 'Approve or deny requests' },
    { id: 'configure', label: 'Configure System', description: 'Access system settings' },
    { id: 'manage_users', label: 'Manage Users', description: 'Add/remove users and assign roles' },
  ];

  const roles: UserRole[] = ['staff', 'supervisor', 'program_director', 'finance', 'admin', 'transportation', 'editor', 'viewer'];

  const togglePermission = (role: UserRole, permission: string) => {
    const current = rolePermissions[role] || [];
    const updated = current.includes(permission)
      ? current.filter(p => p !== permission)
      : [...current, permission];
    
    onChange({
      ...rolePermissions,
      [role]: updated
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Role Permissions</h3>
        <p className="text-gray-600 mb-6">
          Configure what each role can do in the system
        </p>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Permission
                </th>
                {roles.map(role => (
                  <th key={role} className="px-4 py-3 text-center text-sm font-medium text-gray-700 capitalize">
                    {role.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {availablePermissions.map(permission => (
                <tr key={permission.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{permission.label}</div>
                      <div className="text-sm text-gray-600">{permission.description}</div>
                    </div>
                  </td>
                  {roles.map(role => (
                    <td key={role} className="px-4 py-4 text-center">
                      <Checkbox
                        checked={rolePermissions[role]?.includes(permission.id) || false}
                        onCheckedChange={() => togglePermission(role, permission.id)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
