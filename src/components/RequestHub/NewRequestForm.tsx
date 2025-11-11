"use client";

import { useState, useMemo } from 'react';
import { Card } from '@/ui-components/card';
import { Button } from '@/ui-components/button';
import { Input } from '@/ui-components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-components/select';
import { Progress } from '@/ui-components/progress';
import { Badge } from '@/ui-components/badge';
import { 
  Save, 
  Send, 
  ArrowLeft,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { FormFieldRenderer } from './FormFieldRenderer';
import type { FormTemplate, FormField } from '@/types/request';

interface NewRequestFormProps {
  templates: FormTemplate[];
  onSubmit: (data: {
    request_type: string;
    form_data: Record<string, any>;
    status: 'Draft' | 'Submitted';
  }) => Promise<void>;
  onCancel: () => void;
  initialData?: {
    request_type?: string;
    form_data?: Record<string, any>;
  };
  isLoading?: boolean;
}

export function NewRequestForm({
  templates,
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}: NewRequestFormProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialData?.request_type || templates[0]?.id || ''
  );
  const [formData, setFormData] = useState<Record<string, any>>(initialData?.form_data || {});
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTemplate = useMemo(
    () => templates.find(t => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  // Calculate form completion
  const completionStats = useMemo(() => {
    if (!selectedTemplate) return { completed: 0, total: 0, percentage: 0 };

    const requiredFields = selectedTemplate.fields.filter(f => f.required);
    const completedFields = requiredFields.filter(f => {
      const value = formData[f.name];
      return value !== undefined && value !== null && value !== '';
    });

    const total = requiredFields.length;
    const completed = completedFields.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 100;

    return { completed, total, percentage };
  }, [selectedTemplate, formData]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setFormData({});
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await onSubmit({
        request_type: selectedTemplateId,
        form_data: formData,
        status: 'Draft'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (completionStats.percentage < 100) {
      return; // Don't submit if required fields aren't complete
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        request_type: selectedTemplateId,
        form_data: formData,
        status: 'Submitted'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedTemplate) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No request templates available</h3>
        <p className="text-gray-600 mb-6">
          Contact your administrator to set up request templates.
        </p>
        <Button onClick={onCancel} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Submit New Request</h2>
          <p className="text-gray-600">Fill out the form and submit for approval</p>
        </div>
        <Button onClick={onCancel} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Request Type Selector */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Request Type <span className="text-red-500">*</span>
            </label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a request type..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-xs text-gray-500">{template.description}</div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate.description && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">{selectedTemplate.description}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Progress Indicator */}
      <Card className="p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {completionStats.percentage === 100 ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <span className="text-sm font-medium text-gray-700">
                Required Fields Completion
              </span>
            </div>
            <Badge variant={completionStats.percentage === 100 ? "default" : "secondary"}>
              {completionStats.completed} of {completionStats.total} completed
            </Badge>
          </div>
          <Progress value={completionStats.percentage} className="h-2" />
          <p className="text-xs text-gray-600">
            {completionStats.percentage === 100 
              ? 'All required fields are complete. You can now submit this request.'
              : `Complete ${completionStats.total - completionStats.completed} more required field${completionStats.total - completionStats.completed !== 1 ? 's' : ''} to submit.`
            }
          </p>
        </div>
      </Card>

      {/* Form Fields */}
      <Card className="p-6">
        <FormFieldRenderer
          fields={selectedTemplate.fields}
          values={formData}
          onChange={handleFieldChange}
          disabled={isLoading || isSaving || isSubmitting}
        />
      </Card>

      {/* Action Buttons */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveDraft}
              variant="outline"
              disabled={isLoading || isSaving || isSubmitting || Object.keys(formData).length === 0}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500">
              You can save your progress and come back later
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={completionStats.percentage < 100 || isLoading || isSaving || isSubmitting}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        </div>

        {completionStats.percentage < 100 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  Complete required fields to submit
                </p>
                <p className="text-xs text-yellow-700">
                  The following required fields are missing:
                </p>
                <ul className="mt-2 space-y-1">
                  {selectedTemplate.fields
                    .filter(f => f.required && !formData[f.name])
                    .map(f => (
                      <li key={f.name} className="text-xs text-yellow-700">
                        • {f.label}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
