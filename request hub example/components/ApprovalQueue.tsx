import { useState } from 'react';
import { Request, User, ApprovalAction } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { StatusBadge } from './StatusBadge';
import { formatDateTime } from '../lib/utils';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { 
  mockRequests, 
  mockUsers, 
  mockRequestDetails, 
  mockWorkflowTemplates,
  mockFormTemplates 
} from '../lib/mockData';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';

interface ApprovalQueueProps {
  currentUser: User;
  onApprovalAction: (requestId: string, action: ApprovalAction, comments?: string) => void;
}

export function ApprovalQueue({ currentUser, onApprovalAction }: ApprovalQueueProps) {
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [comments, setComments] = useState('');
  const [actionType, setActionType] = useState<ApprovalAction>('approve');

  // Filter requests that need approval from current user
  const pendingRequests = mockRequests.filter(request => {
    if (request.status !== 'Submitted' && request.status !== 'Under Review') return false;
    
    const formTemplate = mockFormTemplates.find(ft => ft.requestType === request.requestType);
    const workflow = mockWorkflowTemplates.find(wt => wt.id === formTemplate?.workflowTemplateId);
    
    if (!workflow) return false;
    
    const currentStep = workflow.steps.find(s => s.stepNumber === request.currentStep);
    return currentStep?.approverRoles.includes(currentUser.role);
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
    return mockRequestDetails.filter(d => d.requestId === requestId);
  };

  const getSubmitterName = (userId: string) => {
    return mockUsers.find(u => u.id === userId)?.name || 'Unknown';
  };

  const getRequestTypeName = (type: string) => {
    const template = mockFormTemplates.find(ft => ft.requestType === type);
    return template?.name || type;
  };

  return (
    <>
      <div className="space-y-4">
        {pendingRequests.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No pending approvals</p>
          </Card>
        ) : (
          pendingRequests.map((request) => {
            const details = getRequestDetails(request.id);
            const submitter = mockUsers.find(u => u.id === request.staffUserId);

            return (
              <Card key={request.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3>{getRequestTypeName(request.requestType)}</h3>
                        <StatusBadge status={request.status} />
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Submitted by: {getSubmitterName(request.staffUserId)}</p>
                        <p>Department: {submitter?.department}</p>
                        <p>Submitted: {formatDateTime(request.submittedDate)}</p>
                        <p>Priority: <span className="capitalize">{request.priority}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Request Details Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <h4 className="text-sm">Request Summary</h4>
                    {details.slice(0, 3).map((detail) => (
                      <div key={detail.id} className="text-sm">
                        <span className="text-gray-600">{detail.fieldKey}: </span>
                        <span className="line-clamp-1">{detail.fieldValue}</span>
                      </div>
                    ))}
                  </div>

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
                {actionType === 'approve' ? 'Approve' : 'Deny'} Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p>
                Are you sure you want to {actionType} this {getRequestTypeName(selectedRequest.requestType)}?
              </p>
              <div className="space-y-2">
                <Label htmlFor="comments">
                  Comments {actionType === 'deny' && <span className="text-red-500">*</span>}
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
                disabled={actionType === 'deny' && !comments.trim()}
              >
                {actionType === 'approve' ? 'Approve' : 'Deny'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
