import React, { useState, useRef } from 'react';
import { parseAndValidateVehicleCsv, downloadStockImportTemplateCsv, VehicleCsvImportResult } from '../services/csvService';
import { Vehicle } from '../types';
import { TunisianPlateBadge } from './TunisianPlateBadge';
import {
  Upload,
  AlertTriangle,
  CheckCircle2,
  FileText,
  X,
  AlertCircle,
  Download,
  FileSpreadsheet,
  Car,
} from 'lucide-react';

interface VehicleCsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (vehicles: Omit<Vehicle, 'id'>[]) => void;
  existingVehicles?: Vehicle[];
}

export const VehicleCsvImportModal: React.FC<VehicleCsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  existingVehicles = [],
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<VehicleCsvImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsProcessing(true);
    setResult(null);

    try {
      const res = await parseAndValidateVehicleCsv(selectedFile, existingVehicles);
      setResult(res);
    } catch (err: any) {
      setResult({
        success: false,
        importedVehicles: [],
        errors: [err?.message || 'Erreur inconnue lors de la lecture du fichier.'],
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
    if (result && result.importedVehicles.length > 0) {
      onImportSuccess(result.importedVehicles);
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div
        id="vehicle-csv-import-modal-container"
        className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Importer des véhicules dans le stock (CSV)
              </h3>
              <p className="text-xs text-slate-500">
                Format requis : MARQUE, MODÈLE, MATRICULE (les autres colonnes peuvent être vierges)
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
          {/* Bloc de téléchargement du modèle CSV vierge / exemple */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">Modèle CSV pour le stock</p>
                <p className="text-[11px] text-slate-600">
                  Contient <strong>MARQUE</strong>, <strong>MODÈLE</strong>, <strong>MATRICULE</strong> et le reste des colonnes vierges.
                </p>
              </div>
            </div>
            <button
              type="button"
              id="btn-modal-download-stock-template"
              onClick={() => downloadStockImportTemplateCsv()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger le modèle</span>
            </button>
          </div>

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
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Glissez votre fichier CSV ici ou cliquez pour parcourir
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Colonnes acceptées : MARQUE, MODÈLE, MATRICULE (séparateur point-virgule ou virgule)
              </p>
              <span className="inline-block mt-3 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
                Fichier .csv UTF-8
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

          {/* Feedback de chargement */}
          {isProcessing && (
            <div className="py-6 text-center text-sm font-medium text-slate-600">
              Analyse et validation des véhicules en cours...
            </div>
          )}

          {/* Résultats de validation */}
          {result && !isProcessing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-xs text-emerald-700 font-semibold block">
                    Véhicules prêts à être importés
                  </span>
                  <span className="text-xl font-bold text-emerald-800">
                    {result.importedVehicles.length}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-xl border ${
                    result.errors.length > 0
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold block ${
                      result.errors.length > 0 ? 'text-rose-700' : 'text-slate-600'
                    }`}
                  >
                    Lignes ignorées / erreurs
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      result.errors.length > 0 ? 'text-rose-800' : 'text-slate-700'
                    }`}
                  >
                    {result.errors.length}
                  </span>
                </div>
              </div>

              {/* Aperçu des véhicules valides */}
              {result.importedVehicles.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 border-b border-slate-200 flex items-center justify-between">
                    <span>Aperçu des véhicules valides ({result.importedVehicles.length})</span>
                    <span className="text-[10px] text-slate-500 font-normal">Colonnes vierges complétées par défaut</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {result.importedVehicles.map((v, i) => (
                      <div key={i} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-800">
                            {v.marque} {v.modele}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">{v.carburant || 'Essence'}</span>
                        </div>
                        <div>
                          <TunisianPlateBadge matricule={v.matricule} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Erreurs éventuelles */}
              {result.errors.length > 0 && (
                <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 max-h-40 overflow-y-auto text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Détails des erreurs ({result.errors.length})</span>
                  </div>
                  {result.errors.map((err, idx) => (
                    <p key={idx} className="text-rose-700 flex items-start gap-1">
                      <span className="text-rose-500">•</span>
                      <span>{err}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Fermer
          </button>
          <button
            type="button"
            disabled={!result || result.importedVehicles.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Confirmer l'importation ({result?.importedVehicles.length || 0})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
