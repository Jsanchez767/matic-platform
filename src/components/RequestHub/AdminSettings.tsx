"use client";

import { useState } from "react";
import { Card } from "@/ui-components/card";
import { Button } from "@/ui-components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui-components/tabs";
import { Plus, Edit, Trash2, FileText, GitBranch } from "lucide-react";
import { FormBuilder } from "./FormBuilder";
import { WorkflowBuilder } from "./WorkflowBuilder";
import type { FormTemplate, WorkflowTemplate } from "@/types/request";

interface AdminSettingsProps {
  hubId: string;
  onClose?: () => void;
}

export function AdminSettings({ hubId, onClose }: AdminSettingsProps) {
  const [activeTab, setActiveTab] = useState<"forms" | "workflows">("forms");
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState<FormTemplate | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowTemplate | null>(null);

  // Mock data - will be replaced with real API calls
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);

  const handleSaveForm = (formData: any) => {
    console.log("Saving form:", formData);
    // TODO: Implement API call to save form
    alert("Form saved successfully!");
    setShowFormBuilder(false);
    setEditingForm(null);
  };

  const handleSaveWorkflow = (workflowData: any) => {
    console.log("Saving workflow:", workflowData);
    // TODO: Implement API call to save workflow
    alert("Workflow saved successfully!");
    setShowWorkflowBuilder(false);
    setEditingWorkflow(null);
  };

  const handleDeleteForm = (formId: string) => {
    if (confirm("Are you sure you want to delete this form?")) {
      console.log("Deleting form:", formId);
      // TODO: Implement API call to delete form
    }
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    if (confirm("Are you sure you want to delete this workflow?")) {
      console.log("Deleting workflow:", workflowId);
      // TODO: Implement API call to delete workflow
    }
  };

  const handleEditForm = (form: FormTemplate) => {
    setEditingForm(form);
    setShowFormBuilder(true);
  };

  const handleEditWorkflow = (workflow: WorkflowTemplate) => {
    setEditingWorkflow(workflow);
    setShowWorkflowBuilder(true);
  };

  if (showFormBuilder) {
    return (
      <div className="p-6">
        <FormBuilder
          template={editingForm}
          workflows={workflows.map((w) => ({ id: w.id, name: w.name }))}
          onSave={handleSaveForm}
          onCancel={() => {
            setShowFormBuilder(false);
            setEditingForm(null);
          }}
        />
      </div>
    );
  }

  if (showWorkflowBuilder) {
    return (
      <div className="p-6">
        <WorkflowBuilder
          template={editingWorkflow}
          onSave={handleSaveWorkflow}
          onCancel={() => {
            setShowWorkflowBuilder(false);
            setEditingWorkflow(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Admin Settings</h2>
        <p className="text-gray-600 mt-1">
          Manage forms and approval workflows for this hub
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="forms">
            <FileText className="h-4 w-4 mr-2" />
            Form Templates
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <GitBranch className="h-4 w-4 mr-2" />
            Approval Workflows
          </TabsTrigger>
        </TabsList>

        {/* Forms Tab */}
        <TabsContent value="forms" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Create and manage request form templates
            </p>
            <Button onClick={() => setShowFormBuilder(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </div>

          {forms.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Form Templates
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first form template to start accepting requests
              </p>
              <Button onClick={() => setShowFormBuilder(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Form Template
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {forms.map((form) => (
                <Card key={form.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {form.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {form.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>{form.fields.length} fields</span>
                        <span>•</span>
                        <span>Type: {form.request_type}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditForm(form)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteForm(form.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Create and manage approval workflow templates
            </p>
            <Button onClick={() => setShowWorkflowBuilder(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </div>

          {workflows.length === 0 ? (
            <Card className="p-8 text-center">
              <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Workflow Templates
              </h3>
              <p className="text-gray-600 mb-4">
                Create your first workflow to define approval processes
              </p>
              <Button onClick={() => setShowWorkflowBuilder(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow Template
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {workflow.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {workflow.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>{workflow.steps.length} steps</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditWorkflow(workflow)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
