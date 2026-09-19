import React from 'react';
import { RentalStatus } from '../types';
import { CheckCircle2, Clock, CalendarCheck, AlertTriangle, Wrench, ShieldAlert } from 'lucide-react';

interface StatusBadgeProps {
  statut: RentalStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  statut,
  size = 'md',
  showIcon = true,
}) => {
  const getBadgeConfig = (statusStr: string) => {
    switch (statusStr) {
      case 'Disponible':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          label: 'Disponible',
          symbol: '🟢',
        };
      case 'Louée':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10',
          dot: 'bg-rose-500',
          icon: Clock,
          label: 'Louée',
          symbol: '🔴',
        };
      case 'Réservée':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/10',
          dot: 'bg-amber-500',
          icon: CalendarCheck,
          label: 'Réservée',
          symbol: '🟠',
        };
      case 'En maintenance':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300 ring-slate-600/10',
          dot: 'bg-slate-500',
          icon: Wrench,
          label: 'En maintenance',
          symbol: '🔧',
        };
      case 'Retour aujourd\'hui':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-600/10',
          dot: 'bg-purple-500',
          icon: Clock,
          label: 'Retour aujourd\'hui',
          symbol: '🟣',
        };
      case 'En retard':
        return {
          bg: 'bg-red-100 text-red-800 border-red-300 ring-red-600/20 font-semibold',
          dot: 'bg-red-600 animate-pulse',
          icon: AlertTriangle,
          label: 'En retard',
          symbol: '⚠️',
        };
      default:
        return {
          bg: 'bg-gray-100 text-gray-700 border-gray-200 ring-gray-600/10',
          dot: 'bg-gray-400',
          icon: ShieldAlert,
          label: statusStr,
          symbol: '⚪',
        };
    }
  };

  const config = getBadgeConfig(statut);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-medium px-3 py-1.5 gap-2',
  };

  return (
    <span
      id={`status-badge-${statut.replace(/\s+/g, '-').toLowerCase()}`}
      className={`inline-flex items-center rounded-full border ring-1 ring-inset whitespace-nowrap transition-colors ${config.bg} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />}
      <span>{config.label}</span>
    </span>
  );
};
