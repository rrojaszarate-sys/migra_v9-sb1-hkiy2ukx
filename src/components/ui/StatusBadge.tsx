import React from 'react';
import { MainStatus, getStatusDisplayName, getStatusColor } from '../../utils/workflow';

interface StatusBadgeProps {
  status: MainStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const STATUS_ICONS: Record<MainStatus, string> = {
  'Draft': '📝',
  'Quoted': '💰',
  'Approved': '✅',
  'Scheduled': '📅',
  'In Progress': '⚡',
  'Completed': '🎯',
  'Invoiced': '🧾',
  'Paid': '💳',
  'Cancelled': '❌'
};

export function StatusBadge({ 
  status, 
  className = '', 
  size = 'md',
  showIcon = true 
}: StatusBadgeProps) {
  const colorClass = getStatusColor(status);
  const displayName = getStatusDisplayName(status);
  const icon = STATUS_ICONS[status];
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <span 
      className={`status-badge ${colorClass} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label={`Estado: ${displayName}`}
    >
      {showIcon && (
        <span className="mr-1" aria-hidden="true">
          {icon}
        </span>
      )}
      {displayName}
    </span>
  );
}

export default StatusBadge;