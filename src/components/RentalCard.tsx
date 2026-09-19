import React from 'react';
import { Rental } from '../types';
import { StatusBadge } from './StatusBadge';
import { TunisianPlateBadge } from './TunisianPlateBadge';
import { formatDisplayDate } from '../utils/dateUtils';
import { formatTelephone } from '../utils/validation';
import { downloadRentalContractPdf } from '../services/pdfService';
import { WhatsAppButton } from './WhatsAppButton';
import { PhoneCallButton } from './PhoneCallButton';
import { User, Phone, Calendar, Clock, Eye, Edit2, Copy, Trash2, FileDown } from 'lucide-react';

interface RentalCardProps {
  rental: Rental;
  onView: (rental: Rental) => void;
  onEdit: (rental: Rental) => void;
  onDuplicate: (rental: Rental) => void;
  onDelete: (rental: Rental) => void;
}

export const RentalCard: React.FC<RentalCardProps> = ({
  rental,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  return (
    <div
      id={`rental-card-${rental.numero}`}
      className="h-full min-w-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-2xs hover:shadow-md transition-shadow flex flex-col gap-3 overflow-hidden"
    >
      {/* Header: Car & Plate + Status */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">🚗</span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white break-words">
              {rental.marque} {rental.modele}
            </h4>
            <span className="text-xs font-semibold text-slate-400">
              #{rental.numero}
            </span>
          </div>
          <div className="mt-1.5">
            <TunisianPlateBadge matricule={rental.matricule} size="sm" />
          </div>
        </div>
        <div>
          <StatusBadge statut={rental.statut} size="sm" />
        </div>
      </div>

      {/* Driver and Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
        <div className="flex items-center gap-2">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold text-slate-500">Chauffeur :</span>
          <span className="font-bold text-slate-900 truncate">{rental.chauffeur}</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-500">Tél :</span>
            <a
              href={`tel:${rental.telephone.replace(/\s+/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="font-mono font-medium text-blue-600 hover:underline truncate"
              title={`Appeler ${rental.chauffeur}`}
            >
              {formatTelephone(rental.telephone)}
            </a>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <PhoneCallButton phone={rental.telephone} chauffeurName={rental.chauffeur} variant="icon" size="xs" />
            <WhatsAppButton
              phone={rental.telephone}
              chauffeurName={rental.chauffeur}
              matricule={rental.matricule}
              variant="compact"
            />
          </div>
        </div>
      </div>

      {/* Dates and Duration */}
      <div className="grid grid-cols-3 gap-2 text-xs text-slate-700">
        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-0.5">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Départ</span>
          </div>
          <span className="font-medium text-slate-900">
            {formatDisplayDate(rental.dateDepart)}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-0.5">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Retour</span>
          </div>
          <span className="font-medium text-slate-900">
            {formatDisplayDate(rental.dateRetour)}
          </span>
        </div>

        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-0.5">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Durée</span>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
            {rental.nombreJours} {rental.nombreJours > 1 ? 'jours' : 'jour'}
          </span>
        </div>
      </div>

      {/* Action Buttons bar (Voir | Modifier | Dupliquer | Supprimer) */}
      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
        <button
          onClick={() => onView(rental)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-blue-600" />
          <span>Voir</span>
        </button>

        <button
          onClick={() => downloadRentalContractPdf(rental)}
          className="inline-flex items-center justify-center p-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          title="Enregistrer le contrat en PDF"
        >
          <FileDown className="w-3.5 h-3.5 text-rose-600" />
        </button>

        <button
          onClick={() => onEdit(rental)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5 text-amber-600" />
          <span>Modifier</span>
        </button>

        <button
          onClick={() => onDuplicate(rental)}
          className="inline-flex items-center justify-center p-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
          title="Dupliquer"
        >
          <Copy className="w-3.5 h-3.5 text-emerald-600" />
        </button>

        <button
          onClick={() => onDelete(rental)}
          className="inline-flex items-center justify-center p-2 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
          title="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
