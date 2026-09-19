import React from 'react';
import { Rental } from '../types';
import { StatusBadge } from './StatusBadge';
import { TunisianPlateBadge } from './TunisianPlateBadge';
import { formatDisplayDate } from '../utils/dateUtils';
import { formatTelephone } from '../utils/validation';
import { downloadRentalContractPdf, printRentalContract } from '../services/pdfService';
import { WhatsAppButton } from './WhatsAppButton';
import { PhoneCallButton } from './PhoneCallButton';
import {
  X,
  Printer,
  FileDown,
  Edit2,
  Calendar,
  Clock,
  Phone,
  User,
  Car,
  FileText,
  BadgePercent,
  CheckCircle2,
} from 'lucide-react';

interface RentalDetailModalProps {
  rental: Rental | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (rental: Rental) => void;
  onOpenContractEditor: (rental: Rental) => void;
}

export const RentalDetailModal: React.FC<RentalDetailModalProps> = ({
  rental,
  isOpen,
  onClose,
  onEdit,
  onOpenContractEditor,
}) => {
  if (!isOpen || !rental) return null;

  const handlePrint = () => {
    printRentalContract(rental);
  };

  const handleDownloadPdf = () => {
    downloadRentalContractPdf(rental);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div
        id="rental-detail-modal-container"
        className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 print:shadow-none print:border-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Détails de la location #{rental.numero}
                </h3>
                <StatusBadge statut={rental.statut} size="sm" />
              </div>
              <p className="text-xs text-slate-500">
                Fiche de réservation et contrat Janen_Car
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors print:hidden"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Car Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-2xs">
                🚗
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Véhicule assigné
                </span>
                <h4 className="text-lg font-extrabold text-slate-900">
                  {rental.marque} {rental.modele}
                </h4>
              </div>
            </div>
            <div className="sm:text-right">
              <span className="block text-xs font-semibold text-slate-500 mb-1">
                Immatriculation
              </span>
              <TunisianPlateBadge matricule={rental.matricule} size="md" />
            </div>
          </div>

          {/* Driver details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <User className="w-4 h-4 text-blue-600" />
                <span>Chauffeur / Client</span>
              </div>
              <p className="text-base font-bold text-slate-900">{rental.chauffeur}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>Téléphone de contact</span>
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                <a
                  href={`tel:${rental.telephone.replace(/\s+/g, '')}`}
                  className="text-base font-bold font-mono text-slate-900 hover:text-blue-600 hover:underline"
                >
                  {formatTelephone(rental.telephone)}
                </a>
                <div className="flex items-center gap-2">
                  <PhoneCallButton
                    phone={rental.telephone}
                    chauffeurName={rental.chauffeur}
                    variant="button"
                    label="Appeler"
                  />
                  <WhatsAppButton
                    phone={rental.telephone}
                    chauffeurName={rental.chauffeur}
                    matricule={rental.matricule}
                    variant="button"
                    label="Appeler WhatsApp"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dates and Duration */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">
                  Date de départ
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900">
                  {formatDisplayDate(rental.dateDepart)}
                </span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">
                  Date de retour
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900">
                  {formatDisplayDate(rental.dateRetour)}
                </span>
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-500 mb-1">
                  Durée totale
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-600 text-white">
                  {rental.nombreJours} {rental.nombreJours > 1 ? 'jours' : 'jour'}
                </span>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <BadgePercent className="w-4 h-4 text-emerald-600" />
              <span>Tarif journalier :</span>
              <span className="font-bold font-mono text-slate-900">
                {rental.prixParJour !== undefined && rental.prixParJour !== null
                  ? `${rental.prixParJour} TND / jour`
                  : 'Non renseigné'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 mr-1">Montant total :</span>
              <span className="text-lg font-black text-emerald-700 font-mono">
                {rental.montantTotal !== undefined && rental.montantTotal !== null
                  ? `${rental.montantTotal} TND`
                  : rental.prixParJour
                  ? `${rental.nombreJours * rental.prixParJour} TND`
                  : '— TND'}
              </span>
            </div>
          </div>

          {/* Identité & Conducteur Sec. s'ils sont saisis */}
          {(rental.cinOuPasseport || rental.permisNumero || rental.conducteurSecNom || rental.dateNaissance || rental.adressePermanente) && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block border-b pb-1">
                Informations complémentaires du contrat :
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                {rental.cinOuPasseport && (
                  <div>
                    <span className="font-semibold text-slate-500">CIN/Passeport :</span> {rental.cinOuPasseport} {rental.cinDate ? `du ${rental.cinDate}` : ''} {rental.cinLieu ? `à ${rental.cinLieu}` : ''}
                  </div>
                )}
                {rental.permisNumero && (
                  <div>
                    <span className="font-semibold text-slate-500">Permis de conduire :</span> {rental.permisNumero} {rental.permisDate ? `du ${rental.permisDate}` : ''} {rental.permisLieu ? `à ${rental.permisLieu}` : ''}
                  </div>
                )}
                {rental.dateNaissance && (
                  <div>
                    <span className="font-semibold text-slate-500">Né le :</span> {rental.dateNaissance} {rental.lieuNaissance ? `à ${rental.lieuNaissance}` : ''}
                  </div>
                )}
                {rental.nationalite && (
                  <div>
                    <span className="font-semibold text-slate-500">Nationalité :</span> {rental.nationalite}
                  </div>
                )}
                {rental.adressePermanente && (
                  <div className="sm:col-span-2">
                    <span className="font-semibold text-slate-500">Adresse Perm :</span> {rental.adressePermanente}
                  </div>
                )}
                {rental.conducteurSecNom && (
                  <div className="sm:col-span-2 pt-1 border-t border-slate-200/60 mt-1">
                    <span className="font-bold text-slate-700">Conducteur secondaire :</span> {rental.conducteurSecNom} {rental.conducteurSecTelephone ? `(${rental.conducteurSecTelephone})` : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {rental.notes && (
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs">
              <span className="font-bold text-slate-700 block mb-1">
                Notes & Remarques :
              </span>
              <p className="text-slate-600 whitespace-pre-wrap">{rental.notes}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-3">
            <span>Créée le : {new Date(rental.dateCreation).toLocaleString('fr-FR')}</span>
            <span>Dernière mise à jour : {new Date(rental.dateModification).toLocaleString('fr-FR')}</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-print-contract-modal"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
              title="Lancer l'impression directe du contrat de location"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimer contrat</span>
            </button>

            <button
              id="btn-download-pdf-contract-modal"
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shadow-2xs"
              title="Télécharger le contrat officiel au format PDF"
            >
              <FileDown className="w-4 h-4 text-rose-600" />
              <span>Enregistrer PDF</span>
            </button>


            <button
              id="btn-keyboard-contract-modal"
              type="button"
              onClick={() => {
                onClose();
                onOpenContractEditor(rental);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-amber-400 hover:bg-amber-500 rounded-xl border border-amber-300 transition-colors shadow-2xs"
              title="Remplir et éditer ce contrat interactif directement au clavier"
            >
              <Edit2 className="w-4 h-4 text-slate-900" />
              <span>Saisir au Clavier (Pro)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(rental);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Modifier</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
