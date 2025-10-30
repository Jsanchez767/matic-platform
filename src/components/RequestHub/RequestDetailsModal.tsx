"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui-components/dialog';
import { StatusBadge } from './StatusBadge';
import { formatDateTime, formatFileSize } from '@/lib/request-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui-components/card';
import { Badge } from '@/ui-components/badge';
import { FileText, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Request, RequestDetail, RequestUser, ApprovalActionRecord, Attachment, FormTemplate, WorkflowTemplate } from '@/types/request';

interface RequestDetailsModalProps {
  requestId: string;
  request: Request;
  details: RequestDetail[];
  submitter: RequestUser;
  formTemplate?: FormTemplate;
  workflowTemplate?: WorkflowTemplate;
  approvalActions: ApprovalActionRecord[];
  attachments: Attachment[];
  users: RequestUser[];
  onClose: () => void;
}

export function RequestDetailsModal({ 
  requestId,
  request,
  details,
  submitter,
  formTemplate,
  workflowTemplate,
  approvalActions,
  attachments,
  users,
  onClose 
}: RequestDetailsModalProps) {
  const getFieldLabel = (fieldKey: string) => {
    const field = formTemplate?.fields.find(f => f.name === fieldKey);
    return field?.label || fieldKey;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Request Details - {request.id.slice(0, 8)}
            <StatusBadge status={request.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Request Type</p>
                  <p className="font-medium">{formTemplate?.name || request.request_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted By</p>
                  <p className="font-medium">{submitter?.name} ({submitter?.email})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-medium">{submitter?.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <p className="capitalize font-medium">{request.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted Date</p>
                  <p className="font-medium">{formatDateTime(request.submitted_date)}</p>
                </div>
                {request.completed_date && (
                  <div>
                    <p className="text-sm text-gray-600">Completed Date</p>
                    <p className="font-medium">{formatDateTime(request.completed_date)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Request Details */}
          {details.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {details.map((detail) => (
                  <div key={detail.id}>
                    <p className="text-sm text-gray-600 font-medium">{getFieldLabel(detail.field_key)}</p>
                    <p className="whitespace-pre-wrap mt-1">{detail.field_value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{attachment.file_name}</p>
                          <p className="text-sm text-gray-600">
                            {formatFileSize(attachment.file_size)} • Uploaded {formatDateTime(attachment.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approval Workflow */}
          {workflowTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Approval Workflow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workflowTemplate.steps.map((step) => {
                    const stepActions = approvalActions.filter(a => a.step_number === step.step_number);
                    const isCurrentStep = request.current_step === step.step_number;
                    const isPastStep = request.current_step > step.step_number;
                    
                    return (
                      <div key={step.step_number} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          {stepActions.length > 0 ? (
                            stepActions[0].action === 'approve' ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : (
                              <XCircle className="h-6 w-6 text-red-600" />
                            )
                          ) : isCurrentStep ? (
                            <Clock className="h-6 w-6 text-yellow-600" />
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                          )}
                          {step.step_number < workflowTemplate.steps.length && (
                            <div className={`w-0.5 h-12 ${isPastStep ? 'bg-green-600' : 'bg-gray-300'}`} />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{step.name}</h4>
                            {isCurrentStep && <Badge variant="outline">Current Step</Badge>}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Approver Roles: {step.approver_roles.join(', ')}
                          </p>
                          {stepActions.map((action) => {
                            const approver = users.find(u => u.id === action.approver_id);
                            return (
                              <div key={action.id} className="mt-2 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-medium">
                                    <span className="capitalize">{action.action}</span> by {approver?.name}
                                  </p>
                                  <p className="text-sm text-gray-600">{formatDateTime(action.timestamp)}</p>
                                </div>
                                {action.comments && (
                                  <p className="text-sm text-gray-700 mt-1">{action.comments}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
