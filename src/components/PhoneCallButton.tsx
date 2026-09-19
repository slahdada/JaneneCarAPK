import React from 'react';
import { Phone } from 'lucide-react';

interface PhoneCallButtonProps {
  phone: string;
  chauffeurName?: string;
  variant?: 'button' | 'icon' | 'compact' | 'pill';
  size?: 'xs' | 'sm' | 'md';
  label?: string;
  className?: string;
}

export const PhoneCallButton: React.FC<PhoneCallButtonProps> = ({
  phone,
  chauffeurName,
  variant = 'icon',
  size = 'sm',
  label = 'Appeler',
  className = '',
}) => {
  if (!phone) return null;

  const cleanPhone = phone.replace(/\s+/g, '');
  const href = `tel:${cleanPhone}`;
  const title = `Appeler ${chauffeurName || phone}`;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
  };

  if (variant === 'button') {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-600/30 transition-all active:scale-95 ${className}`}
        title={title}
      >
        <Phone className="w-3.5 h-3.5" />
        <span>{label}</span>
      </a>
    );
  }

  if (variant === 'pill') {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors ${className}`}
        title={title}
      >
        <Phone className="w-3 h-3 text-blue-600" />
        <span>{label}</span>
      </a>
    );
  }

  if (variant === 'compact') {
    return (
      <a
        href={href}
        onClick={handleClick}
        className={`inline-flex items-center gap-1 p-1 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors ${className}`}
        title={title}
      >
        <Phone className="w-3.5 h-3.5" />
        <span className="text-[11px] font-semibold">{label}</span>
      </a>
    );
  }

  // Variant 'icon'
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  const btnPadding = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200/60 transition-all active:scale-95 ${btnPadding[size]} ${className}`}
      title={title}
      aria-label={`Appeler ${chauffeurName || phone}`}
    >
      <Phone className={iconSizes[size]} />
    </a>
  );
};
