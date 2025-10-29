import { RequestStatus } from '../types';
import { getStatusColor } from '../lib/utils';

interface StatusBadgeProps {
  status: RequestStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full border ${getStatusColor(status)}`}>
      {status}
    </span>
  );
}
