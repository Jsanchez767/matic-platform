"use client";

import { useState } from 'react';
import { FormTemplate, FormField } from '@/types/request';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui-components/card';
import { Button } from '@/ui-components/button';
import { Input } from '@/ui-components/input';
import { Textarea } from '@/ui-components/textarea';
import { Label } from '@/ui-components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui-components/select';
import { Checkbox } from '@/ui-components/checkbox';
import { Upload, Save, Send } from 'lucide-react';
import { ItemListField } from './ItemListField';

interface DynamicFormProps {
  formTemplate: FormTemplate;
  onSubmit: (data: Record<string, any>, isDraft: boolean) => void;
}

export function DynamicForm({ formTemplate, onSubmit }: DynamicFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleSubmit = (isDraft: boolean) => {
    // Validate required fields if not a draft
    if (!isDraft) {
      const missingFields = formTemplate.fields
        .filter(field => {
          if (!field.required) return false;
          const value = formData[field.name];
          // For item_list type, check if array has items
          if (field.type === 'item_list') {
            return !value || !Array.isArray(value) || value.length === 0;
          }
          return !value;
        })
        .map(field => field.label);
      
      if (missingFields.length > 0) {
        alert(`Please fill in required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Validate item_list items
      const itemListFields = formTemplate.fields.filter(f => f.type === 'item_list');
      for (const field of itemListFields) {
        const items = formData[field.name];
        if (items && Array.isArray(items)) {
          const incompleteItems = items.some((item: any) => !item.name || !item.quantity || !item.unitCost);
          if (incompleteItems) {
            alert('Please fill in all item details (name, quantity, and unit cost)');
            return;
          }
        }
      }
    }

    onSubmit({ ...formData, attachments }, isDraft);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.helpText && (
              <p className="text-sm text-gray-500">{field.helpText}</p>
            )}
            <Input
              id={field.name}
              type={field.type}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.helpText && (
              <p className="text-sm text-gray-500">{field.helpText}</p>
            )}
            <Textarea
              id={field.name}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
            />
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.helpText && (
              <p className="text-sm text-gray-500">{field.helpText}</p>
            )}
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              min={field.validation?.min}
              max={field.validation?.max}
            />
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.helpText && (
              <p className="text-sm text-gray-500">{field.helpText}</p>
            )}
            <Input
              id={field.name}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              required={field.required}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.helpText && (
              <p className="text-sm text-gray-500">{field.helpText}</p>
            )}
            <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value === true || value === 'true'}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <Label htmlFor={field.name} className="cursor-pointer">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      case 'item_list':
        return (
          <div key={field.id}>
            <ItemListField
              value={formData[field.name] || []}
              onChange={(items) => handleFieldChange(field.name, items)}
              required={field.required}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formTemplate.name}</CardTitle>
        <CardDescription>{formTemplate.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          {formTemplate.fields.map(renderField)}

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments (Optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <input
                type="file"
                id="attachments"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="attachments" className="cursor-pointer text-blue-600 hover:text-blue-700">
                Click to upload files
              </label>
              <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX, XLS, XLSX (Max 10MB)</p>
            </div>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {attachments.map((file, index) => (
                  <p key={index} className="text-sm text-gray-600">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => handleSubmit(true)}>
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button type="button" onClick={() => handleSubmit(false)}>
              <Send className="h-4 w-4 mr-2" />
              Submit Request
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
