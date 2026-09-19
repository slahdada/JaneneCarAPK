import React from 'react';
import { Rental } from '../types';
import { StatusBadge } from './StatusBadge';
import { TunisianPlateBadge } from './TunisianPlateBadge';
import { formatDisplayDate } from '../utils/dateUtils';
import { formatTelephone } from '../utils/validation';
import { downloadRentalContractPdf } from '../services/pdfService';
import { WhatsAppButton } from './WhatsAppButton';
import { PhoneCallButton } from './PhoneCallButton';
import { EmptyState } from './ui/EmptyState';
import { Eye, Edit2, Copy, Trash2, Calendar, Phone, User, FileDown, MoreHorizontal } from 'lucide-react';

interface RentalTableProps {
  rentals: Rental[];
  onView: (rental: Rental) => void;
  onEdit: (rental: Rental) => void;
  onDuplicate: (rental: Rental) => void;
  onDelete: (rental: Rental) => void;
}

export const RentalTable: React.FC<RentalTableProps> = ({ rentals, onView, onEdit, onDuplicate, onDelete }) => {
  if (rentals.length === 0) {
    return <EmptyState icon={Calendar} title="Aucune location trouvée" description="Aucune location ne correspond à votre recherche. Modifiez les filtres ou créez une nouvelle location." />;
  }

  return (
    <div className="ui-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/70">
            <tr>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Véhicule</th>
              <th className="px-4 py-3">Conducteur</th>
              <th className="hidden px-4 py-3 xl:table-cell">Période</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rentals.map((rental) => (
              <tr key={rental.id} id={`rental-row-${rental.numero}`} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3"><span className="font-bold text-slate-900 dark:text-white">#{rental.numero}</span><p className="mt-0.5 text-xs text-slate-500">{rental.nombreJours} jour{rental.nombreJours > 1 ? 's' : ''}</p></td>
                <td className="px-4 py-3"><p className="font-semibold text-slate-900 dark:text-white">{rental.marque} {rental.modele}</p><div className="mt-1"><TunisianPlateBadge matricule={rental.matricule} size="sm" /></div></td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><User className="h-4 w-4 shrink-0 text-slate-400" /><div className="min-w-0"><p className="truncate font-medium text-slate-800 dark:text-slate-200">{rental.chauffeur}</p><div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><a href={`tel:${rental.telephone.replace(/\s+/g, '')}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-blue-600 hover:underline font-mono" title={`Appeler ${rental.chauffeur}`}><Phone className="h-3 w-3" />{formatTelephone(rental.telephone)}</a><PhoneCallButton phone={rental.telephone} chauffeurName={rental.chauffeur} variant="icon" size="xs" /><WhatsAppButton phone={rental.telephone} chauffeurName={rental.chauffeur} matricule={rental.matricule} variant="icon" size="xs" /></div></div></div></td>
                <td className="hidden px-4 py-3 xl:table-cell"><p className="font-medium text-slate-700 dark:text-slate-300">{formatDisplayDate(rental.dateDepart)}</p><p className="mt-0.5 text-xs text-slate-500">au {formatDisplayDate(rental.dateRetour)}</p></td>
                <td className="px-4 py-3"><StatusBadge statut={rental.statut} size="sm" /></td>
                <td className="px-4 py-3"><div className="flex items-center justify-end gap-2"><button id={`btn-view-${rental.numero}`} type="button" onClick={() => onView(rental)} className="ui-btn-secondary min-h-9 px-3 py-1.5 text-xs"><Eye className="h-4 w-4" />Voir</button><details className="relative"><summary className="ui-icon-button h-9 w-9 list-none" aria-label={`Plus d’actions pour la location ${rental.numero}`}><MoreHorizontal className="h-4 w-4" /></summary><div className="absolute right-0 z-30 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-left shadow-xl dark:border-slate-700 dark:bg-slate-900"><button onClick={() => downloadRentalContractPdf(rental)} className="ui-menu-action"><FileDown className="h-4 w-4" />Enregistrer le contrat</button><button onClick={() => onEdit(rental)} className="ui-menu-action"><Edit2 className="h-4 w-4" />Modifier</button><button onClick={() => onDuplicate(rental)} className="ui-menu-action"><Copy className="h-4 w-4" />Dupliquer</button><button onClick={() => onDelete(rental)} className="ui-menu-action text-rose-600 dark:text-rose-300"><Trash2 className="h-4 w-4" />Supprimer</button></div></details></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
