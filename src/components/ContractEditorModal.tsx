import React, { useState, useEffect } from 'react';
import { Rental, Vehicle } from '../types';
import { generateRentalContractPdf, downloadRentalContractPdf, printRentalContract } from '../services/pdfService';
import { X, Save, Printer, FileDown, Eye, Check, RefreshCw, Car } from 'lucide-react';
import { toDateInputValue } from '../utils/dateUtils';

interface ContractEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rental: Rental;
  onSave?: (updatedRental: Rental) => void;
  vehicles: Vehicle[];
}

export const ContractEditorModal: React.FC<ContractEditorModalProps> = ({
  isOpen,
  onClose,
  rental,
  onSave,
  vehicles,
}) => {
  const [editedRental, setEditedRental] = useState<Rental>({ ...rental });
  const [fuelLevel, setFuelLevel] = useState<string>('Plein');
  const [paymentMode, setPaymentMode] = useState<string>('Espèces');

  useEffect(() => {
    if (isOpen) {
      setEditedRental({
        ...rental,
        dateNaissance: toDateInputValue(rental.dateNaissance || ''),
        dateEntreeTunisie: toDateInputValue(rental.dateEntreeTunisie || ''),
        cinDate: toDateInputValue(rental.cinDate || ''),
        permisDate: toDateInputValue(rental.permisDate || ''),
        conducteurSecCinDate: toDateInputValue(rental.conducteurSecCinDate || ''),
        conducteurSecPermisDate: toDateInputValue(rental.conducteurSecPermisDate || ''),
        dateDepart: toDateInputValue(rental.dateDepart || ''),
        dateRetour: toDateInputValue(rental.dateRetour || ''),
      });
    }
  }, [isOpen, rental]);

  if (!isOpen) return null;

  const handleFieldChange = (key: keyof Rental, value: any) => {
    setEditedRental((prev) => {
      const updated = { ...prev, [key]: value };
      
      // Auto-recalculate total price if days and daily price change
      if (key === 'nombreJours' || key === 'prixParJour') {
        const days = Number(key === 'nombreJours' ? value : prev.nombreJours) || 0;
        const rate = Number(key === 'prixParJour' ? value : prev.prixParJour) || 0;
        updated.montantTotal = days * rate;
      }
      return updated;
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...editedRental,
        dateModification: new Date().toISOString(),
      });
    }
    onClose();
  };

  const handleDownload = () => {
    const doc = generateRentalContractPdf(editedRental);
    const cleanMatricule = (editedRental.matricule || 'Vierge').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Contrat_Janen_Car_${editedRental.numero || '64647'}_${cleanMatricule}.pdf`);
  };

  const handlePrint = () => {
    printRentalContract(editedRental);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                <Printer className="w-5 h-5" />
              </span>
              Éditeur de Contrat Interactif (Saisie au Clavier)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Remplissez le contrat directement sur votre écran, comme sur un papier officiel, puis imprimez ou enregistrez.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200/50">
              Contrat N° {editedRental.numero || '64647'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le Contrat</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-all"
            >
              <FileDown className="w-4 h-4 text-rose-600" />
              <span>Télécharger le PDF</span>
            </button>

            {onSave && (
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-lg transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Enregistrer & Fermer</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>

        {/* Live Form Container - Styled to look like the physical white contract page */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200 dark:bg-slate-950/50 flex justify-center">
          <div className="w-full max-w-4xl bg-white text-slate-900 p-8 shadow-lg rounded-lg border border-slate-300 relative font-sans space-y-6">
            
            {/* Header section (Paper replica) */}
            <div className="border-b-2 border-slate-800 pb-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h1 className="text-2xl font-black tracking-tight text-slate-900">CAR DEL JANENE</h1>
                  <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Location de Voitures / Car Rental</p>
                  <p className="text-[9px] text-slate-500 leading-tight">
                    Siège : Bardo, Tunis • Capital : 100 000 TND • Code TVA : 1456789/A/M/000
                  </p>
                  <p className="text-[9px] font-bold text-slate-700">
                    Tél : +216 27 005 005 / 27 272 760
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <div className="inline-block border-2 border-amber-500 bg-amber-50 px-4 py-2 rounded-lg text-center">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase">Contrat N° / Agreement No</span>
                    <input
                      type="number"
                      value={editedRental.numero || ''}
                      onChange={(e) => handleFieldChange('numero', Number(e.target.value))}
                      className="text-center text-lg font-extrabold text-slate-900 w-24 bg-transparent border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                  <p className="text-[8px] text-slate-400 italic">Document contractuel édité numériquement</p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <h2 className="text-sm font-black tracking-widest text-white bg-slate-900 py-1.5 rounded-md uppercase">
                  CONTRAT DE LOCATION • RENTAL AGREEMENT
                </h2>
              </div>
            </div>

            {/* Main two columns layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* LEFT COLUMN: LOCATAIRE & CONDUCTEURS */}
              <div className="space-y-4">
                
                {/* Identification Locataire Frame */}
                <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                    I - IDENTIFICATION DU LOCATAIRE / RENTER
                  </div>
                  <div className="p-3.5 space-y-2.5 text-xs bg-white">
                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Nom & Prénom :</span>
                      <input
                        type="text"
                        placeholder="Slah Ben Rabah Ayari"
                        value={editedRental.chauffeur || ''}
                        onChange={(e) => handleFieldChange('chauffeur', e.target.value)}
                        className="flex-1 font-bold text-slate-900 bg-amber-50/50 px-2 py-1 rounded border-b border-dashed border-slate-400 focus:outline-none focus:bg-amber-50 focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Né(e) le :</span>
                      <input
                        type="date"
                        value={editedRental.dateNaissance || ''}
                        onChange={(e) => handleFieldChange('dateNaissance', e.target.value)}
                        className="w-32 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                      <span className="font-bold text-slate-700">à :</span>
                      <input
                        type="text"
                        placeholder="Tunis"
                        value={editedRental.lieuNaissance || ''}
                        onChange={(e) => handleFieldChange('lieuNaissance', e.target.value)}
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Téléphone TN / Phone :</span>
                      <input
                        type="tel"
                        placeholder="+216 27 005 005"
                        value={editedRental.telephone || ''}
                        onChange={(e) => handleFieldChange('telephone', e.target.value)}
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Nationalité d'origine :</span>
                      <input
                        type="text"
                        placeholder="Tunisienne"
                        value={editedRental.nationalite || ''}
                        onChange={(e) => handleFieldChange('nationalite', e.target.value)}
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">N° CIN ou Passeport :</span>
                      <input
                        type="text"
                        placeholder="08765432 / N123456"
                        value={editedRental.cinOuPasseport || ''}
                        onChange={(e) => handleFieldChange('cinOuPasseport', e.target.value)}
                        className="flex-1 font-semibold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Délivré le :</span>
                      <input
                        type="date"
                        placeholder="12/04/2020"
                        value={editedRental.cinDate || ''}
                        onChange={(e) => handleFieldChange('cinDate', e.target.value)}
                        className="w-24 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                      <span className="font-bold text-slate-700">à :</span>
                      <input
                        type="text"
                        placeholder="Tunis"
                        value={editedRental.cinLieu || ''}
                        onChange={(e) => handleFieldChange('cinLieu', e.target.value)}
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Date d'entrée en TN :</span>
                      <input
                        type="date"
                        placeholder="Non-Résident : 10/09/2026"
                        value={editedRental.dateEntreeTunisie || ''}
                        onChange={(e) => handleFieldChange('dateEntreeTunisie', e.target.value)}
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">N° Permis Conduire :</span>
                      <input
                        type="text"
                        placeholder="99/123456"
                        value={editedRental.permisNumero || ''}
                        onChange={(e) => handleFieldChange('permisNumero', e.target.value)}
                        className="flex-1 font-semibold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Délivré le :</span>
                      <input
                        type="date"
                        placeholder="20/05/2018"
                        value={editedRental.permisDate || ''}
                        onChange={(e) => handleFieldChange('permisDate', e.target.value)}
                        className="w-24 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                      <span className="font-bold text-slate-700">à :</span>
                      <input
                        type="text"
                        placeholder="Tunis"
                        value={editedRental.permisLieu || ''}
                        onChange={(e) => handleFieldChange('permisLieu', e.target.value)}
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 block">Adresse de résidence permanente (à l'étranger) :</span>
                      <input
                        type="text"
                        placeholder="12 Rue de la Liberté, 75001 Paris, France"
                        value={editedRental.adressePermanente || ''}
                        onChange={(e) => handleFieldChange('adressePermanente', e.target.value)}
                        className="w-full text-slate-900 bg-slate-50 px-2 py-1 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-700 block">Adresse locale de séjour (en Tunisie) :</span>
                      <input
                        type="text"
                        placeholder="Résidence Janene, Hammamet"
                        value={editedRental.adresseTunisie || ''}
                        onChange={(e) => handleFieldChange('adresseTunisie', e.target.value)}
                        className="w-full text-slate-900 bg-slate-50 px-2 py-1 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Identification Conducteur Secondaire Frame */}
                <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                    II - AUTRES CONDUCTEURS / SECONDARY DRIVER
                  </div>
                  <div className="p-3.5 space-y-2.5 text-xs bg-white">
                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Nom & Prénom :</span>
                      <input
                        type="text"
                        placeholder="Saisir conducteur secondaire si applicable..."
                        value={editedRental.conducteurSecNom || ''}
                        onChange={(e) => handleFieldChange('conducteurSecNom', e.target.value)}
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">N° CIN / Passeport :</span>
                      <input
                        type="text"
                        placeholder="CIN"
                        value={editedRental.conducteurSecCin || ''}
                        onChange={(e) => handleFieldChange('conducteurSecCin', e.target.value)}
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                      <span className="font-bold text-slate-700">du :</span>
                      <input
                        type="date"
                        placeholder="Date"
                        value={editedRental.conducteurSecCinDate || ''}
                        onChange={(e) => handleFieldChange('conducteurSecCinDate', e.target.value)}
                        className="w-24 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Permis de Conduire :</span>
                      <input
                        type="text"
                        placeholder="N° Permis"
                        value={editedRental.conducteurSecPermis || ''}
                        onChange={(e) => handleFieldChange('conducteurSecPermis', e.target.value)}
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                      <span className="font-bold text-slate-700">du :</span>
                      <input
                        type="date"
                        placeholder="Date"
                        value={editedRental.conducteurSecPermisDate || ''}
                        onChange={(e) => handleFieldChange('conducteurSecPermisDate', e.target.value)}
                        className="w-24 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Adresse / Téléphone:</span>
                      <input
                        type="text"
                        placeholder="Adresse"
                        value={editedRental.conducteurSecAdresse || ''}
                        onChange={(e) => handleFieldChange('conducteurSecAdresse', e.target.value)}
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                      <input
                        type="text"
                        placeholder="Téléphone"
                        value={editedRental.conducteurSecTelephone || ''}
                        onChange={(e) => handleFieldChange('conducteurSecTelephone', e.target.value)}
                        className="w-28 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: VÉHICULE, DATES, FINANCIALS */}
              <div className="space-y-4">
                
                {/* Véhicule Frame */}
                <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                    III - VÉHICULE / VEHICLE DETAILS
                  </div>
                  <div className="p-3.5 space-y-2.5 text-xs bg-white">
                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Marque & Type :</span>
                      <input
                        type="text"
                        placeholder="Volkswagen Virtus"
                        value={`${editedRental.marque || ''} ${editedRental.modele || ''}`.trim()}
                        onChange={(e) => {
                          const val = e.target.value;
                          const spaceIndex = val.indexOf(' ');
                          if (spaceIndex !== -1) {
                            handleFieldChange('marque', val.substring(0, spaceIndex));
                            handleFieldChange('modele', val.substring(spaceIndex + 1));
                          } else {
                            handleFieldChange('marque', val);
                          }
                        }}
                        className="flex-1 font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Immatriculation :</span>
                      <input
                        type="text"
                        placeholder="9397 TU 246"
                        value={editedRental.matricule || ''}
                        onChange={(e) => handleFieldChange('matricule', e.target.value)}
                        className="flex-1 font-bold text-blue-800 tracking-wide bg-amber-50/50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Kilométrage Départ :</span>
                      <input
                        type="number"
                        placeholder="124500"
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                      <span className="font-bold text-slate-700">Retour :</span>
                      <input
                        type="number"
                        placeholder="Km Retour"
                        className="w-24 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Dates & Lieux Frame */}
                <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                    IV - DATES, HEURES & LIEUX / RENTAL DURATION
                  </div>
                  <div className="p-3.5 space-y-2.5 text-xs bg-white">
                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Lieu de Départ :</span>
                      <input
                        type="text"
                        defaultValue="Bardo, Tunis"
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Date de Départ :</span>
                      <input
                        type="date"
                        value={editedRental.dateDepart || ''}
                        onChange={(e) => handleFieldChange('dateDepart', e.target.value)}
                        className="w-32 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                      <span className="font-bold text-slate-700">à :</span>
                      <input
                        type="time"
                        defaultValue="12:00"
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Lieu de Retour :</span>
                      <input
                        type="text"
                        defaultValue="Bardo, Tunis"
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold min-w-[120px] text-slate-700">Date de Retour :</span>
                      <input
                        type="date"
                        value={editedRental.dateRetour || ''}
                        onChange={(e) => handleFieldChange('dateRetour', e.target.value)}
                        className="w-32 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                      <span className="font-bold text-slate-700">à :</span>
                      <input
                        type="time"
                        defaultValue="12:00"
                        className="flex-1 text-slate-900 bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <div className="flex items-center gap-2 border-t border-slate-100 pt-2">
                      <span className="font-bold min-w-[120px] text-slate-700">DURÉE TOTAL :</span>
                      <input
                        type="number"
                        value={editedRental.nombreJours || 0}
                        onChange={(e) => handleFieldChange('nombreJours', Number(e.target.value))}
                        className="w-16 font-extrabold text-blue-600 text-center bg-amber-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none"
                      />
                      <span className="font-bold text-slate-700">Jours / Days</span>
                    </div>
                  </div>
                </div>

                {/* Financials Frame */}
                <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-slate-900 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
                    V - DÉTAILS FINANCIERS / FINANCIALS (TND)
                  </div>
                  <div className="p-3.5 space-y-2.5 text-xs bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Prix Journalier de Location :</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          placeholder="120"
                          value={editedRental.prixParJour || ''}
                          onChange={(e) => handleFieldChange('prixParJour', Number(e.target.value))}
                          className="w-20 font-bold text-right bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none"
                        />
                        <span className="font-semibold text-slate-500">TND</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Autres charges / Combustible :</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          defaultValue={0}
                          className="w-20 text-right bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none"
                        />
                        <span className="font-semibold text-slate-500">TND</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700">Caution de Garantie / Deposit :</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          placeholder="Ex: 500"
                          className="w-20 text-right bg-slate-50 px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none"
                        />
                        <span className="font-semibold text-slate-500">TND</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-2 font-black">
                      <span className="text-slate-900 text-sm">TOTAL GÉNÉRAL TTC :</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={editedRental.montantTotal || 0}
                          onChange={(e) => handleFieldChange('montantTotal', Number(e.target.value))}
                          className="w-24 text-right font-black text-emerald-600 bg-amber-50 text-sm px-2 py-0.5 rounded border-b border-dashed border-slate-400 focus:outline-none"
                        />
                        <span className="text-slate-900 text-sm">TND</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* LOWER PORTION: DAMAGES & CHECKBOXES */}
            <div className="border-t-2 border-slate-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Box: Fuel & Damages (Paper layout) */}
              <div className="border border-slate-300 p-4 rounded-lg bg-slate-50/50 space-y-4">
                <span className="font-bold text-xs text-slate-800 block border-b pb-1">ÉTAT EXTÉRIEUR DU VÉHICULE & NIVEAU CARBURANT</span>
                
                {/* Visual indicator of Fuel Level */}
                <div className="space-y-1.5">
                  <span className="font-bold text-[11px] text-slate-600 block">Niveau de carburant au départ :</span>
                  <div className="flex flex-wrap gap-3">
                    {['1/4', '2/4', '3/4', '4/4', 'Plein'].map((level) => (
                      <label key={level} className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <input
                          type="radio"
                          name="fuel"
                          checked={fuelLevel === level}
                          onChange={() => setFuelLevel(level)}
                          className="accent-slate-900"
                        />
                        <span className={fuelLevel === level ? 'font-bold text-slate-900' : 'text-slate-600'}>{level}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-center flex-col">
                  <Car className="w-12 h-12 text-slate-300" />
                  <span className="text-[10px] text-slate-500 font-medium text-center mt-1">
                    Schéma de carrosserie standard de CAR DEL JANENE intégré dans l'impression PDF officielle
                  </span>
                </div>
              </div>

              {/* Right Box: Mode of Payment & Signatures (Paper layout) */}
              <div className="border border-slate-300 p-4 rounded-lg bg-slate-50/50 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="font-bold text-xs text-slate-800 block border-b pb-1">RÈGLEMENT & SIGNATURES</span>
                  
                  <div className="space-y-1.5">
                    <span className="font-bold text-[11px] text-slate-600 block">Mode de règlement convenu :</span>
                    <div className="flex flex-wrap gap-3">
                      {['Espèces', 'Carte', 'Chèque', 'Virement'].map((mode) => (
                        <label key={mode} className="flex items-center gap-1.5 cursor-pointer text-xs">
                          <input
                            type="radio"
                            name="payment"
                            checked={paymentMode === mode}
                            onChange={() => setPaymentMode(mode)}
                            className="accent-slate-900"
                          />
                          <span className={paymentMode === mode ? 'font-bold text-slate-900' : 'text-slate-600'}>{mode}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 text-[10px] font-bold text-slate-500">
                  <div className="space-y-8">
                    <span>Signature Client / Renter :</span>
                    <div className="border-b border-dashed border-slate-300 h-6"></div>
                    <span className="italic text-slate-400">Lu et approuvé</span>
                  </div>
                  <div className="space-y-8">
                    <span>Signature Agent / Company :</span>
                    <div className="border-b border-dashed border-slate-300 h-6"></div>
                    <span>Le {new Date().toLocaleDateString('fr-FR')} au Bardo</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Compliance Footer message */}
            <div className="text-center text-[9px] text-slate-400 border-t border-slate-200 pt-4 font-bold tracking-widest uppercase">
              CONTRAT EXÉCUTABLE JANEN_CAR — DOCUMENT CONTRACTUEL ÉDITÉ ET SÉCURISÉ NUMÉRIQUEMENT
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
