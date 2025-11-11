"use client";

import { useState } from 'react';
import { FormField, FieldType, FormTemplate } from '@/types/request';
import { Card } from '@/ui-components/card';
import { Button } from '@/ui-components/button';
import { Input } from '@/ui-components/input';
import { Label } from '@/ui-components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-components/select';
import { Checkbox } from '@/ui-components/checkbox';
import { Textarea } from '@/ui-components/textarea';
import { Plus, Trash2, GripVertical, X, Eye } from 'lucide-react';

interface FormBuilderProps {
  onSave: (formData: {
    id?: string;
    name: string;
    request_type: string;
    description: string;
    fields: FormField[];
    workflow_template_id?: string;
  }) => void;
  onCancel?: () => void;
  template?: FormTemplate | null;
  workflows?: Array<{ id: string; name: string }>;
}

export function FormBuilder({ onSave, onCancel, template, workflows = [] }: FormBuilderProps) {
  const [templateId] = useState<string | undefined>(template?.id);
  const [formName, setFormName] = useState(template?.name || '');
  const [requestType, setRequestType] = useState(template?.request_type || '');
  const [description, setDescription] = useState(template?.description || '');
  const [selectedWorkflow, setSelectedWorkflow] = useState(template?.workflow_template_id || '');
  const [fields, setFields] = useState<FormField[]>(template?.fields || []);

  const fieldTypes: FieldType[] = ['text', 'textarea', 'number', 'date', 'select', 'checkbox', 'item_list', 'email', 'phone', 'url'];

  const addField = () => {
    const newField: FormField = {
      id: `f${Date.now()}`,
      name: `field_${fields.length + 1}`,
      label: '',
      type: 'text',
      required: false,
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFields(updatedFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const addOption = (fieldIndex: number) => {
    const field = fields[fieldIndex];
    const options = field.options || [];
    updateField(fieldIndex, { options: [...options, ''] });
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const field = fields[fieldIndex];
    const options = [...(field.options || [])];
    options[optionIndex] = value;
    updateField(fieldIndex, { options });
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = fields[fieldIndex];
    const options = (field.options || []).filter((_, i) => i !== optionIndex);
    updateField(fieldIndex, { options });
  };

  const handleSave = () => {
    if (!formName || !requestType || !description) {
      alert('Please fill in all required fields');
      return;
    }

    if (fields.length === 0) {
      alert('Please add at least one field');
      return;
    }

    // Validate field configuration
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (!field.name || !field.label) {
        alert(`Field ${i + 1}: Please provide both name and label`);
        return;
      }
      if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        alert(`Field ${i + 1}: Select fields must have at least one option`);
        return;
      }
    }

    onSave({
      id: templateId,
      name: formName,
      request_type: requestType,
      description,
      fields,
      workflow_template_id: selectedWorkflow || undefined,
    });
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">
            {template ? 'Edit Form Template' : 'Create New Form Template'}
          </h3>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-6">
        {/* Basic Settings */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-semibold">Basic Settings</h4>
          
          <div className="space-y-2">
            <Label htmlFor="formName">Form Name *</Label>
            <Input
              id="formName"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g., Budget Request Form"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestType">Request Type (Slug) *</Label>
            <Input
              id="requestType"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              placeholder="e.g., budget_request"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this form"
              rows={3}
            />
          </div>

          {workflows.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="workflow">Approval Workflow</Label>
              <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a workflow (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {workflows.map((workflow) => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Form Fields</h4>
            <Button onClick={addField} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8 border rounded-lg">
              No fields added yet. Click "Add Field" to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <span className="text-sm font-medium">Field {index + 1}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Field Name (Internal)</Label>
                      <Input
                        value={field.name}
                        onChange={(e) => updateField(index, { name: e.target.value })}
                        placeholder="field_name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Field Label (Display)</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        placeholder="Field Label"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Field Type</Label>
                      <Select 
                        value={field.type} 
                        onValueChange={(value: FieldType) => updateField(index, { type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Placeholder</Label>
                      <Input
                        value={field.placeholder || ''}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        placeholder="Optional placeholder text"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`required-${field.id}`}
                      checked={field.required}
                      onCheckedChange={(checked) => updateField(index, { required: !!checked })}
                    />
                    <Label htmlFor={`required-${field.id}`}>Required Field</Label>
                  </div>

                  {/* Options for select fields */}
                  {field.type === 'select' && (
                    <div className="space-y-2 pl-4 border-l-2">
                      <div className="flex items-center justify-between">
                        <Label>Options</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => addOption(index)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      {field.options?.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                            placeholder="Option value"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeOption(index, optionIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
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
            {template ? 'Update Form' : 'Create Form'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
