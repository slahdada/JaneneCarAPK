import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => (
  <div className="ui-empty-state" role="status">
    <span className="ui-empty-icon" aria-hidden="true"><Icon className="h-6 w-6" /></span>
    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
    <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);
