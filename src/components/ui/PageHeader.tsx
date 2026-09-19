import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryActions,
}) => (
  <section className="ui-page-header" aria-labelledby={`page-${title.replace(/\s+/g, '-').toLowerCase()}`}>
    <div className="min-w-0">
      {eyebrow && <p className="ui-eyebrow">{eyebrow}</p>}
      <div className="flex items-start gap-3">
        <span className="ui-icon-box" aria-hidden="true"><Icon className="h-5 w-5" /></span>
        <div className="min-w-0">
          <h1 id={`page-${title.replace(/\s+/g, '-').toLowerCase()}`} className="ui-page-title">{title}</h1>
          {description && <p className="ui-page-description">{description}</p>}
        </div>
      </div>
    </div>
    {(primaryAction || secondaryActions) && (
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {secondaryActions}
        {primaryAction}
      </div>
    )}
  </section>
);
