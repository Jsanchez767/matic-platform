import { useState } from 'react';
import { WorkflowStep, UserRole, WorkflowTemplate } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Plus, Trash2, ArrowDown, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface WorkflowBuilderProps {
  onSave: (workflowData: {
    id?: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
  }) => void;
  onCancel?: () => void;
  template?: WorkflowTemplate | null;
}

const availableRoles: UserRole[] = ['supervisor', 'program_director', 'finance', 'transportation', 'admin'];

export function WorkflowBuilder({ onSave, onCancel, template }: WorkflowBuilderProps) {
  const [templateId, setTemplateId] = useState<string | undefined>(template?.id);
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [steps, setSteps] = useState<WorkflowStep[]>(template?.steps || []);

  const addStep = () => {
    const newStep: WorkflowStep = {
      stepNumber: steps.length + 1,
      name: '',
      approverRoles: [],
      requiredApprovals: 1,
      timeoutHours: 48,
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (index: number, updates: Partial<WorkflowStep>) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], ...updates };
    setSteps(updatedSteps);
  };

  const removeStep = (index: number) => {
    const updatedSteps = steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, stepNumber: i + 1 }));
    setSteps(updatedSteps);
  };

  const toggleRole = (stepIndex: number, role: UserRole) => {
    const step = steps[stepIndex];
    const roles = step.approverRoles.includes(role)
      ? step.approverRoles.filter(r => r !== role)
      : [...step.approverRoles, role];
    updateStep(stepIndex, { approverRoles: roles });
  };

  const handleSave = () => {
    if (!name || !description) {
      toast.error('Please fill in workflow name and description');
      return;
    }

    if (steps.length === 0) {
      toast.error('Please add at least one approval step');
      return;
    }

    const invalidSteps = steps.filter(s => !s.name || s.approverRoles.length === 0);
    if (invalidSteps.length > 0) {
      toast.error('Please ensure all steps have a name and at least one approver role');
      return;
    }

    onSave({ 
      id: templateId,
      name, 
      description, 
      steps 
    });

    // Reset form if not editing
    if (!template) {
      setTemplateId(undefined);
      setName('');
      setDescription('');
      setSteps([]);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    setTemplateId(undefined);
    setName('');
    setDescription('');
    setSteps([]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {template ? 'Edit Workflow Template' : 'Create New Workflow Template'}
          </CardTitle>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Settings */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4>Basic Settings</h4>
          
          <div className="space-y-2">
            <Label htmlFor="workflowName">Workflow Name *</Label>
            <Input
              id="workflowName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Approval Workflow"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflowDescription">Description *</Label>
            <Textarea
              id="workflowDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when this workflow should be used"
              rows={3}
            />
          </div>
        </div>

        {/* Approval Steps */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4>Approval Steps</h4>
            <Button onClick={addStep} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>

          {steps.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8 border rounded-lg">
              No approval steps added yet. Click "Add Step" to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index}>
                  <div className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800">
                          {step.stepNumber}
                        </div>
                        <span className="text-sm">Step {step.stepNumber}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Step Name *</Label>
                      <Input
                        value={step.name}
                        onChange={(e) => updateStep(index, { name: e.target.value })}
                        placeholder="e.g., Supervisor Review"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Approver Roles * (Select at least one)</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableRoles.map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => toggleRole(index, role)}
                            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                              step.approverRoles.includes(role)
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                            }`}
                          >
                            {role.replace('_', ' ').charAt(0).toUpperCase() + role.replace('_', ' ').slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Required Approvals</Label>
                        <Input
                          type="number"
                          min="1"
                          value={step.requiredApprovals}
                          onChange={(e) => updateStep(index, { requiredApprovals: parseInt(e.target.value) || 1 })}
                        />
                        <p className="text-xs text-gray-500">For parallel approval (X of N approvers)</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Timeout (hours)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={step.timeoutHours || ''}
                          onChange={(e) => updateStep(index, { timeoutHours: parseInt(e.target.value) || undefined })}
                        />
                        <p className="text-xs text-gray-500">Escalate if no action taken</p>
                      </div>
                    </div>

                    {/* Conditional Routing */}
                    <div className="space-y-2">
                      <Label>Conditional Routing (Optional)</Label>
                      <p className="text-xs text-gray-500">
                        Configure conditions for when this step should be executed
                      </p>
                      <div className="p-3 bg-gray-50 rounded text-sm text-gray-600">
                        Advanced feature - Configure field-based conditions
                      </div>
                    </div>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowDown className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave}>
            {template ? 'Update Workflow' : 'Save Workflow Template'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
