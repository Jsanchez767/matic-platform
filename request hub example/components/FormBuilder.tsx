import { useState, useEffect } from 'react';
import { FormField, FieldType, WorkflowTemplate, FormTemplate } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Plus, Trash2, GripVertical, X, Eye } from 'lucide-react';
import { mockWorkflowTemplates } from '../lib/mockData';
import { toast } from 'sonner@2.0.3';
import { FormPreviewDialog } from './FormPreviewDialog';

interface FormBuilderProps {
  onSave: (formData: {
    id?: string;
    name: string;
    requestType: string;
    description: string;
    fields: FormField[];
    workflowTemplateId: string;
  }) => void;
  onCancel?: () => void;
  template?: FormTemplate | null;
}

export function FormBuilder({ onSave, onCancel, template }: FormBuilderProps) {
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [formName, setFormName] = useState('');
  const [requestType, setRequestType] = useState('');
  const [description, setDescription] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Load template data when editing
  useEffect(() => {
    if (template) {
      setTemplateId(template.id);
      setFormName(template.name);
      setRequestType(template.requestType);
      setDescription(template.description);
      setSelectedWorkflow(template.workflowTemplateId);
      setFields(template.fields);
    }
  }, [template]);

  const fieldTypes: FieldType[] = ['text', 'textarea', 'number', 'date', 'select', 'checkbox', 'item_list'];

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
    if (!formName || !requestType || !description || !selectedWorkflow) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (fields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }

    // Validate field configuration
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      if (!field.name || !field.label) {
        toast.error(`Field ${i + 1}: Please provide both name and label`);
        return;
      }
      if (field.type === 'select' && (!field.options || field.options.length === 0)) {
        toast.error(`Field ${i + 1}: Select fields must have at least one option`);
        return;
      }
    }

    onSave({
      id: templateId,
      name: formName,
      requestType,
      description,
      fields,
      workflowTemplateId: selectedWorkflow,
    });

    // Reset form if not editing
    if (!template) {
      setTemplateId(undefined);
      setFormName('');
      setRequestType('');
      setDescription('');
      setSelectedWorkflow('');
      setFields([]);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    // Reset form
    setTemplateId(undefined);
    setFormName('');
    setRequestType('');
    setDescription('');
    setSelectedWorkflow('');
    setFields([]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {template ? 'Edit Form Template' : 'Create New Form Template'}
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

          <div className="space-y-2">
            <Label htmlFor="workflow">Approval Workflow *</Label>
            <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
              <SelectTrigger>
                <SelectValue placeholder="Select a workflow" />
              </SelectTrigger>
              <SelectContent>
                {mockWorkflowTemplates.map((workflow) => (
                  <SelectItem key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4>Form Fields</h4>
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
                <div key={field.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-5 w-5 text-gray-400" />
                      <span className="text-sm">Field {index + 1}</span>
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
                        onValueChange={(value) => updateField(index, { type: value as FieldType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type === 'item_list' ? 'Item List' : type.charAt(0).toUpperCase() + type.slice(1)}
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
                        placeholder="Placeholder text"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={field.required}
                      onCheckedChange={(checked) => updateField(index, { required: !!checked })}
                    />
                    <Label>Required Field</Label>
                  </div>

                  {/* Options for Select type */}
                  {field.type === 'select' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Options</Label>
                        <Button size="sm" variant="outline" onClick={() => addOption(index)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {(field.options || []).map((option, optIndex) => (
                          <div key={optIndex} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => updateOption(index, optIndex, e.target.value)}
                              placeholder={`Option ${optIndex + 1}`}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeOption(index, optIndex)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Validation for Number type */}
                  {field.type === 'number' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Value</Label>
                        <Input
                          type="number"
                          value={field.validation?.min || ''}
                          onChange={(e) => updateField(index, {
                            validation: { ...field.validation, min: parseInt(e.target.value) || undefined }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Value</Label>
                        <Input
                          type="number"
                          value={field.validation?.max || ''}
                          onChange={(e) => updateField(index, {
                            validation: { ...field.validation, max: parseInt(e.target.value) || undefined }
                          })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Info for Item List type */}
                  {field.type === 'item_list' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        This field will allow users to add multiple items with name, quantity, and unit cost.
                        The system will automatically calculate totals.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(true)}
            disabled={fields.length === 0 || !formName}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Form
          </Button>
          <div className="flex gap-3">
            {onCancel && (
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave}>
              {template ? 'Update Template' : 'Save Form Template'}
            </Button>
          </div>
        </div>
      </CardContent>
      {showPreview && (
        <FormPreviewDialog
          open={showPreview}
          onOpenChange={setShowPreview}
          template={{
            name: formName,
            description: description,
            requestType: requestType,
            workflowTemplateId: selectedWorkflow,
            fields: fields,
          }}
        />
      )}
    </Card>
  );
}
