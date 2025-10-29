import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { StatusBadge } from './StatusBadge';
import { 
  mockRequests, 
  mockRequestDetails, 
  mockUsers, 
  mockApprovalActions, 
  mockAttachments,
  mockFormTemplates,
  mockWorkflowTemplates
} from '../lib/mockData';
import { formatDateTime, formatFileSize } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { FileText, Download, CheckCircle, XCircle, Clock } from 'lucide-react';

interface RequestDetailsModalProps {
  requestId: string;
  onClose: () => void;
}

export function RequestDetailsModal({ requestId, onClose }: RequestDetailsModalProps) {
  const request = mockRequests.find(r => r.id === requestId);
  const details = mockRequestDetails.filter(d => d.requestId === requestId);
  const approvalActions = mockApprovalActions.filter(a => a.requestId === requestId);
  const attachments = mockAttachments.filter(a => a.requestId === requestId);
  const submitter = mockUsers.find(u => u.id === request?.staffUserId);
  const formTemplate = mockFormTemplates.find(ft => ft.requestType === request?.requestType);
  const workflowTemplate = mockWorkflowTemplates.find(wt => wt.id === formTemplate?.workflowTemplateId);

  if (!request) return null;

  const getFieldLabel = (fieldKey: string) => {
    const field = formTemplate?.fields.find(f => f.name === fieldKey);
    return field?.label || fieldKey;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Request Details - {request.id}
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
                  <p>{formTemplate?.name || request.requestType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted By</p>
                  <p>{submitter?.name} ({submitter?.email})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p>{submitter?.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <p className="capitalize">{request.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted Date</p>
                  <p>{formatDateTime(request.submittedDate)}</p>
                </div>
                {request.completedDate && (
                  <div>
                    <p className="text-sm text-gray-600">Completed Date</p>
                    <p>{formatDateTime(request.completedDate)}</p>
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
                    <p className="text-sm text-gray-600">{getFieldLabel(detail.fieldKey)}</p>
                    <p className="whitespace-pre-wrap">{detail.fieldValue}</p>
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
                          <p>{attachment.fileName}</p>
                          <p className="text-sm text-gray-600">
                            {formatFileSize(attachment.fileSize)} • Uploaded {formatDateTime(attachment.uploadedAt)}
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
                    const stepActions = approvalActions.filter(a => a.stepNumber === step.stepNumber);
                    const isCurrentStep = request.currentStep === step.stepNumber;
                    const isPastStep = request.currentStep > step.stepNumber;
                    
                    return (
                      <div key={step.stepNumber} className="flex items-start gap-4">
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
                          {step.stepNumber < workflowTemplate.steps.length && (
                            <div className={`w-0.5 h-12 ${isPastStep ? 'bg-green-600' : 'bg-gray-300'}`} />
                          )}
                        </div>
                        <div className="flex-1 pb-8">
                          <div className="flex items-center gap-2 mb-1">
                            <h4>{step.name}</h4>
                            {isCurrentStep && <Badge variant="outline">Current Step</Badge>}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Approver Roles: {step.approverRoles.join(', ')}
                          </p>
                          {stepActions.map((action) => {
                            const approver = mockUsers.find(u => u.id === action.approverId);
                            return (
                              <div key={action.id} className="mt-2 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm">
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
