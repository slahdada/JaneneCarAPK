import React from 'react';
import { MessageCircle, PhoneCall } from 'lucide-react';
import { formatWhatsAppLink } from '../utils/validation';

interface WhatsAppButtonProps {
  phone: string;
  chauffeurName?: string;
  matricule?: string;
  message?: string;
  variant?: 'button' | 'icon' | 'compact' | 'pill';
  size?: 'xs' | 'sm' | 'md';
  label?: string;
  className?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phone,
  chauffeurName,
  matricule,
  message,
  variant = 'icon',
  size = 'sm',
  label = 'WhatsApp',
  className = '',
}) => {
  if (!phone) return null;

  // Message par défaut courtois et professionnel pour l'agence Janen_Car
  const defaultMessage = message || (chauffeurName
    ? `Bonjour ${chauffeurName}, je vous contacte depuis l'agence Janen_Car${matricule ? ` concernant le véhicule (${matricule})` : ''}.`
    : "Bonjour, je vous contacte depuis l'agence de location Janen_Car.");

  const link = formatWhatsAppLink(phone, defaultMessage);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
  };

  if (variant === 'button') {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-600/30 transition-all active:scale-95 ${className}`}
        title={`Appeler ou envoyer un message WhatsApp à ${chauffeurName || phone}`}
      >
        <MessageCircle className="w-3.5 h-3.5 fill-current" />
        <span>{label}</span>
      </a>
    );
  }

  if (variant === 'pill') {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors ${className}`}
        title={`Contacter par WhatsApp (${phone})`}
      >
        <MessageCircle className="w-3 h-3 text-emerald-600 fill-emerald-600/20" />
        <span>{label}</span>
      </a>
    );
  }

  if (variant === 'compact') {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={`inline-flex items-center gap-1 p-1 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors ${className}`}
        title={`Contacter sur WhatsApp (${phone})`}
      >
        <MessageCircle className="w-3.5 h-3.5 fill-emerald-600/20" />
        <span className="text-[11px] font-semibold">WhatsApp</span>
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
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200/60 transition-all active:scale-95 ${btnPadding[size]} ${className}`}
      title={`Appeler / Écrire par WhatsApp (${phone})`}
      aria-label="Appeler par WhatsApp"
    >
      <MessageCircle className={`${iconSizes[size]} fill-emerald-600/20`} />
    </a>
  );
};
