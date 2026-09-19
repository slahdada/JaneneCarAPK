import React, { useState, useRef } from 'react';
import { parseAndValidateCsv, CsvImportResult } from '../services/csvService';
import { Rental, Vehicle } from '../types';
import { Upload, AlertTriangle, CheckCircle2, FileText, X, AlertCircle, Car } from 'lucide-react';
import { TunisianPlateBadge } from './TunisianPlateBadge';
import { formatDisplayDate } from '../utils/dateUtils';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (
    rentals: Omit<Rental, 'id' | 'numero' | 'dateCreation' | 'dateModification'>[],
    vehicles?: Omit<Vehicle, 'id'>[]
  ) => void;
  existingRentals?: Rental[];
  vehicles?: Vehicle[];
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  existingRentals = [],
  vehicles = [],
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    try {
      const res = await parseAndValidateCsv(selectedFile, existingRentals, vehicles);
      setResult(res);
    } catch (err) {
      console.error(err);
      setResult({
        success: false,
        importedRentals: [],
        importedVehicles: [],
        isVehicleStockOnly: false,
        errors: ["Erreur de lecture du fichier CSV."],
        totalRows: 0,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (result && (result.importedRentals.length > 0 || result.importedVehicles.length > 0)) {
      onImportSuccess(result.importedRentals, result.importedVehicles);
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  const itemsCount = result
    ? result.isVehicleStockOnly
      ? result.importedVehicles.length
      : result.importedRentals.length
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div
        id="csv-import-modal-container"
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {result?.isVehicleStockOnly
                  ? 'Importer des véhicules dans le parc automobile'
                  : 'Importer depuis un fichier CSV'}
              </h3>
              <p className="text-xs text-slate-500">
                Reconnaissance automatique des colonnes et validation des matricules
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Dropzone */}
          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Glissez votre fichier CSV ici ou cliquez pour parcourir
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Colonnes acceptées : Marque, Modèle, Matricule (colonnes contrat optionnelles ou vierges)
              </p>
              <span className="inline-block mt-3 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                Fichier .csv (séparateur point-virgule ou virgule)
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} Ko</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                }}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Changer de fichier
              </button>
            </div>
          )}

          {/* Validation Feedback */}
          {isProcessing && (
            <div className="py-6 text-center text-sm font-medium text-slate-600">
              Vérification des lignes et des formats en cours...
            </div>
          )}

          {result && !isProcessing && (
            <div className="space-y-3">
              {/* Informative banner if stock vehicles detected */}
              {result.isVehicleStockOnly && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                  <Car className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Fichier de véhicules de stock détecté : </span>
                    <span>
                      {result.importedVehicles.length} véhicule{result.importedVehicles.length > 1 ? 's' : ''} (MARQUE, MODÈLE, MATRICULE) avec colonnes de contrat vierges. Ils seront ajoutés directement à votre Parc Automobile avec le statut « Disponible ».
                    </span>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lignes valides : {itemsCount}</span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {result.isVehicleStockOnly
                      ? 'Véhicules prêts à être importés dans le stock'
                      : 'Prêtes à être importées'}
                  </p>
                </div>

                <div
                  className={`p-3 rounded-xl border ${
                    result.errors.length > 0
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {result.errors.length > 0 ? (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-slate-500" />
                    )}
                    <span>Erreurs détectées : {result.errors.length}</span>
                  </div>
                  <p className="text-xs mt-0.5 opacity-80">
                    {result.errors.length > 0 ? 'Ignorées lors de l\'import' : 'Aucune erreur'}
                  </p>
                </div>
              </div>

              {/* Errors list */}
              {result.errors.length > 0 && (
                <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 max-h-36 overflow-y-auto">
                  <h5 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Détail des erreurs rencontrées :
                  </h5>
                  <ul className="text-xs text-rose-700 space-y-1 list-disc list-inside">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview of first valid rows */}
              {itemsCount > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Aperçu des données à importer ({itemsCount} {result.isVehicleStockOnly ? 'véhicules' : 'lignes'}) :
                  </h5>
                  <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-48 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 sticky top-0 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-2.5">Véhicule</th>
                          <th className="py-2 px-2.5">Matricule</th>
                          {!result.isVehicleStockOnly && (
                            <>
                              <th className="py-2 px-2.5">Chauffeur</th>
                              <th className="py-2 px-2.5">Dates</th>
                            </>
                          )}
                          <th className="py-2 px-2.5">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(result.isVehicleStockOnly
                          ? result.importedVehicles
                          : result.importedRentals
                        )
                          .slice(0, 5)
                          .map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2 px-2.5 font-medium">
                                {item.marque} {item.modele}
                              </td>
                              <td className="py-2 px-2.5">
                                <TunisianPlateBadge matricule={item.matricule} size="sm" />
                              </td>
                              {!result.isVehicleStockOnly && 'chauffeur' in item && (
                                <>
                                  <td className="py-2 px-2.5">{(item as Rental).chauffeur}</td>
                                  <td className="py-2 px-2.5 whitespace-nowrap">
                                    {formatDisplayDate((item as Rental).dateDepart)} → {formatDisplayDate((item as Rental).dateRetour)} ({(item as Rental).nombreJours} j)
                                  </td>
                                </>
                              )}
                              <td className="py-2 px-2.5">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                                  {item.statut || 'Disponible'}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {itemsCount > 5 && (
                    <p className="text-[11px] text-slate-400 mt-1 text-right">
                      + {itemsCount - 5} autres véhicules
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            id="btn-confirm-import-csv"
            onClick={handleConfirmImport}
            disabled={!result || itemsCount === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {result?.isVehicleStockOnly
                ? `Importer ${itemsCount} véhicule${itemsCount > 1 ? 's' : ''} dans le stock`
                : `Importer ${itemsCount} location${itemsCount > 1 ? 's' : ''}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
