import React from 'react';
import { PaymentStatus } from '../types';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: PaymentStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const normStatus = (status || 'unpaid').toLowerCase() as PaymentStatus;

  const config = {
    paid: {
      label: 'Paid',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      dot: 'bg-emerald-500',
    },
    partial: {
      label: 'Partial',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Clock,
      dot: 'bg-amber-500',
    },
    unpaid: {
      label: 'Unpaid',
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      icon: AlertCircle,
      dot: 'bg-rose-500',
    },
  }[normStatus] || {
    label: normStatus,
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: Clock,
    dot: 'bg-slate-400',
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-medium px-3 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide whitespace-nowrap ${config.bg} ${sizeClasses}`}
    >
      {showIcon && <Icon size={iconSizes} className="shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
};
