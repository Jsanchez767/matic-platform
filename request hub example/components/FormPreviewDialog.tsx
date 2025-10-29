import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { DynamicForm } from './DynamicForm';
import { FormTemplate } from '../types';

interface FormPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: {
    name: string;
    description: string;
    requestType: string;
    workflowTemplateId: string;
    fields: FormTemplate['fields'];
  };
}

export function FormPreviewDialog({ open, onOpenChange, template }: FormPreviewDialogProps) {
  const previewTemplate: FormTemplate = {
    id: 'preview',
    requestType: template.requestType || 'preview',
    name: template.name || 'Preview Form',
    description: template.description || 'Form preview',
    workflowTemplateId: template.workflowTemplateId || 'wt1',
    fields: template.fields,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handlePreviewSubmit = () => {
    // Do nothing - this is just a preview
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Preview</DialogTitle>
          <DialogDescription>
            This is how the form will appear to users
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <DynamicForm
            formTemplate={previewTemplate}
            onSubmit={handlePreviewSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
