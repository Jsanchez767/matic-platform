"use client";

import { RequestStatus } from '@/types/request';
import { Badge } from '@/ui-components/badge';
import { getStatusColor } from '@/lib/request-utils';

interface StatusBadgeProps {
  status: RequestStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorClass = getStatusColor(status);
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      {status}
    </span>
  );
}
