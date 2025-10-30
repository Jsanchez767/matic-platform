"use client";

import { useState } from 'react';
import { WorkflowStep, UserRole, WorkflowTemplate } from '@/types/request';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui-components/card';
import { Button } from '@/ui-components/button';
import { Input } from '@/ui-components/input';
import { Label } from '@/ui-components/label';
import { Textarea } from '@/ui-components/textarea';
import { Checkbox } from '@/ui-components/checkbox';
import { Plus, Trash2, ArrowDown, X } from 'lucide-react';

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

const availableRoles: UserRole[] = ['supervisor', 'program_director', 'finance', 'transportation', 'admin', 'editor'];

export function WorkflowBuilder({ onSave, onCancel, template }: WorkflowBuilderProps) {
  const [templateId] = useState<string | undefined>(template?.id);
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [steps, setSteps] = useState<WorkflowStep[]>(template?.steps || []);

  const addStep = () => {
    const newStep: WorkflowStep = {
      step_number: steps.length + 1,
      name: '',
      approver_roles: [],
      required_approvals: 1,
      timeout_hours: 48,
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
      .map((step, i) => ({ ...step, step_number: i + 1 }));
    setSteps(updatedSteps);
  };

  const toggleRole = (stepIndex: number, role: UserRole) => {
    const step = steps[stepIndex];
    const roles = step.approver_roles.includes(role)
      ? step.approver_roles.filter(r => r !== role)
      : [...step.approver_roles, role];
    updateStep(stepIndex, { approver_roles: roles });
  };

  const handleSave = () => {
    if (!name || !description) {
      alert('Please fill in workflow name and description');
      return;
    }

    if (steps.length === 0) {
      alert('Please add at least one approval step');
      return;
    }

    const invalidSteps = steps.filter(s => !s.name || s.approver_roles.length === 0);
    if (invalidSteps.length > 0) {
      alert('Please ensure all steps have a name and at least one approver role');
      return;
    }

    onSave({ 
      id: templateId,
      name, 
      description, 
      steps 
    });
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
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
        {/* Basic Info */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-semibold">Workflow Information</h4>
          
          <div className="space-y-2">
            <Label htmlFor="workflowName">Workflow Name *</Label>
            <Input
              id="workflowName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Budget Approval"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workflowDescription">Description *</Label>
            <Textarea
              id="workflowDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this approval workflow"
              rows={3}
            />
          </div>
        </div>

        {/* Approval Steps */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Approval Steps</h4>
            <Button onClick={addStep} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>

          {steps.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8 border rounded-lg">
              No steps added yet. Click "Add Step" to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.step_number} className="relative">
                  <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                          {step.step_number}
                        </div>
                        <span className="text-sm font-medium">Step {step.step_number}</span>
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
                        placeholder="e.g., Supervisor Approval"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Approver Roles * (Select at least one)</Label>
                      <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg">
                        {availableRoles.map((role) => (
                          <div key={role} className="flex items-center space-x-2">
                            <Checkbox
                              id={`step-${step.step_number}-role-${role}`}
                              checked={step.approver_roles.includes(role)}
                              onCheckedChange={() => toggleRole(index, role)}
                            />
                            <Label 
                              htmlFor={`step-${step.step_number}-role-${role}`}
                              className="cursor-pointer capitalize"
                            >
                              {role.replace('_', ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Required Approvals</Label>
                        <Input
                          type="number"
                          min="1"
                          value={step.required_approvals}
                          onChange={(e) => updateStep(index, { required_approvals: parseInt(e.target.value) || 1 })}
                        />
                        <p className="text-xs text-gray-500">
                          Number of approvals needed from selected roles
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Timeout (hours)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={step.timeout_hours || 48}
                          onChange={(e) => updateStep(index, { timeout_hours: parseInt(e.target.value) || 48 })}
                        />
                        <p className="text-xs text-gray-500">
                          Hours before escalation
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Arrow between steps */}
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

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave}>
            {template ? 'Update Workflow' : 'Create Workflow'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
