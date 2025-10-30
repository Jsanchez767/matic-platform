"use client";

import { useState } from 'react';
import { Request, RequestUser, ApprovalAction, RequestDetail, FormTemplate, WorkflowTemplate } from '@/types/request';
import { Card } from '@/ui-components/card';
import { Button } from '@/ui-components/button';
import { Textarea } from '@/ui-components/textarea';
import { Label } from '@/ui-components/label';
import { StatusBadge } from './StatusBadge';
import { formatDateTime } from '@/lib/request-utils';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/ui-components/dialog';

interface ApprovalQueueProps {
  requests: Request[];
  currentUser: RequestUser;
  users: RequestUser[];
  requestDetails: RequestDetail[];
  formTemplates: FormTemplate[];
  workflowTemplates: WorkflowTemplate[];
  onApprovalAction: (requestId: string, action: ApprovalAction, comments?: string) => void;
}

export function ApprovalQueue({ 
  requests,
  currentUser, 
  users,
  requestDetails,
  formTemplates,
  workflowTemplates,
  onApprovalAction 
}: ApprovalQueueProps) {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [comments, setComments] = useState('');
  const [actionType, setActionType] = useState<ApprovalAction>('approve');

  // Filter requests that need approval from current user
  const pendingRequests = requests.filter(request => {
    if (request.status !== 'Submitted' && request.status !== 'Under Review') return false;
    
    const formTemplate = formTemplates.find(ft => ft.request_type === request.request_type);
    const workflow = workflowTemplates.find(wt => wt.id === formTemplate?.workflow_template_id);
    
    if (!workflow) return false;
    
    const currentStep = workflow.steps.find(s => s.step_number === request.current_step);
    return currentStep?.approver_roles.includes(currentUser.role);
  });

  const handleOpenApprovalDialog = (request: Request, action: ApprovalAction) => {
    setSelectedRequest(request);
    setActionType(action);
    setComments('');
  };

  const handleSubmitApproval = () => {
    if (selectedRequest) {
      onApprovalAction(selectedRequest.id, actionType, comments);
      setSelectedRequest(null);
      setComments('');
    }
  };

  const getRequestDetails = (requestId: string) => {
    return requestDetails.filter(d => d.request_id === requestId);
  };

  const getSubmitterName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown';
  };

  const getRequestTypeName = (type: string) => {
    const template = formTemplates.find(ft => ft.request_type === type);
    return template?.name || type;
  };

  return (
    <>
      <div className="space-y-4">
        {pendingRequests.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No pending approvals</p>
            <p className="text-sm mt-2">You're all caught up!</p>
          </Card>
        ) : (
          pendingRequests.map((request) => {
            const details = getRequestDetails(request.id);
            const submitter = users.find(u => u.id === request.staff_user_id);

            return (
              <Card key={request.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{getRequestTypeName(request.request_type)}</h3>
                        <StatusBadge status={request.status} />
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Submitted by: <span className="font-medium">{getSubmitterName(request.staff_user_id)}</span></p>
                        <p>Department: <span className="font-medium">{submitter?.department || 'N/A'}</span></p>
                        <p>Submitted: <span className="font-medium">{formatDateTime(request.submitted_date)}</span></p>
                        <p>Priority: <span className="capitalize font-medium">{request.priority}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Request Details Summary */}
                  {details.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h4 className="text-sm font-semibold">Request Summary</h4>
                      {details.slice(0, 3).map((detail) => (
                        <div key={detail.id} className="text-sm">
                          <span className="text-gray-600">{detail.field_key}: </span>
                          <span className="line-clamp-1">{detail.field_value}</span>
                        </div>
                      ))}
                      {details.length > 3 && (
                        <p className="text-xs text-gray-500">+{details.length - 3} more fields</p>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="default" 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleOpenApprovalDialog(request, 'approve')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleOpenApprovalDialog(request, 'deny')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Deny
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleOpenApprovalDialog(request, 'request_changes')}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Request Changes
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Approval Dialog */}
      {selectedRequest && (
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'approve' ? 'Approve' : actionType === 'deny' ? 'Deny' : 'Request Changes for'} Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p>
                Are you sure you want to {actionType.replace('_', ' ')} this {getRequestTypeName(selectedRequest.request_type)}?
              </p>
              <div className="space-y-2">
                <Label htmlFor="comments">
                  Comments {(actionType === 'deny' || actionType === 'request_changes') && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add your comments here..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Cancel
              </Button>
              <Button
                variant={actionType === 'approve' ? 'default' : 'destructive'}
                onClick={handleSubmitApproval}
                disabled={(actionType === 'deny' || actionType === 'request_changes') && !comments.trim()}
              >
                {actionType === 'approve' ? 'Approve' : actionType === 'deny' ? 'Deny' : 'Request Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
