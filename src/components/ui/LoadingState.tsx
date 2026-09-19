import React from 'react';

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Chargement des données…' }) => (
  <div className="grid gap-4" role="status" aria-live="polite" aria-label={label}>
    <div className="h-28 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[0,1,2,3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />)}
    </div>
    <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
    <span className="sr-only">{label}</span>
  </div>
);
