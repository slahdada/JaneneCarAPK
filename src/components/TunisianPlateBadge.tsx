import React from 'react';

interface TunisianPlateBadgeProps {
  matricule: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TunisianPlateBadge: React.FC<TunisianPlateBadgeProps> = ({ matricule, size = 'md' }) => {
  const upper = (matricule || '').trim().toUpperCase();
  // Format en français : e.g. "1234 TUN 123"
  const parts = upper.split('TUN');
  const part1 = parts[0]?.trim() || upper;
  const part2 = parts[1]?.trim() || '';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-mono tracking-wider gap-1',
    md: 'px-2.5 py-1 text-xs sm:text-sm font-mono tracking-wider gap-1.5',
    lg: 'px-3 py-1.5 text-sm sm:text-base font-mono tracking-wider gap-2',
  };

  const badgeTunClasses = {
    sm: 'px-1 py-0.2 text-[9px] font-sans font-black tracking-wider',
    md: 'px-1.5 py-0.5 text-[10px] sm:text-xs font-sans font-black tracking-wider',
    lg: 'px-2 py-0.5 text-xs font-sans font-black tracking-wider',
  };

  return (
    <div
      className={`inline-flex items-center justify-center bg-slate-950 text-white font-bold border border-slate-700 rounded shadow-xs select-all whitespace-nowrap ${sizeClasses[size]}`}
      title={`Matricule : ${upper}`}
    >
      <span className="text-slate-100 font-mono font-bold tracking-wider">{part1}</span>
      {part2 ? (
        <>
          <span
            className={`bg-red-600 text-white rounded font-sans font-black uppercase shadow-2xs ${badgeTunClasses[size]}`}
          >
            TUN
          </span>
          <span className="text-slate-100 font-mono font-bold tracking-wider">{part2}</span>
        </>
      ) : null}
    </div>
  );
};
