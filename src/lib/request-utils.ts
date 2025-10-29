import { RequestStatus } from '@/types/request';

export function getStatusColor(status: RequestStatus): string {
  const colors: Record<RequestStatus, string> = {
    'Draft': 'bg-gray-100 text-gray-800 border-gray-300',
    'Submitted': 'bg-blue-100 text-blue-800 border-blue-300',
    'Under Review': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Approved': 'bg-green-100 text-green-800 border-green-300',
    'Denied': 'bg-red-100 text-red-800 border-red-300',
    'Completed': 'bg-purple-100 text-purple-800 border-purple-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function calculateHoursBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
}

export function isOverdue(submittedDate: string, timeoutHours: number): boolean {
  const now = new Date();
  const submitted = new Date(submittedDate);
  const hoursPassed = (now.getTime() - submitted.getTime()) / (1000 * 60 * 60);
  return hoursPassed > timeoutHours;
}

export function calculateTotalCost(items: Array<{ quantity: number; unit_cost: number }>): number {
  return items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
}

export function getPriorityColor(priority: 'low' | 'medium' | 'high'): string {
  const colors = {
    low: 'bg-green-100 text-green-800 border-green-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    high: 'bg-red-100 text-red-800 border-red-300',
  };
  return colors[priority];
}
