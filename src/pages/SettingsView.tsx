import React, { useState } from 'react';
import { getCarBrands, getAllModelsForBrand } from '../data/carBrands';
import {
  Settings,
  Database,
  Smartphone,
  RotateCcw,
  Building2,
  Car,
  Download,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Code2,
  Sun,
  Moon,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { PageHeader } from '../components/ui/PageHeader';


interface SettingsViewProps {
  onResetData: () => void;
  onExportCsv: () => void;
  onOpenImportModal: () => void;
  theme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onResetData,
  onExportCsv,
  onOpenImportModal,
  theme = 'light',
  onThemeChange,
}) => {
  const [selectedBrand, setSelectedBrand] = useState('Toyota');
  const configuredBrands = getCarBrands();
  const configuredModels = getAllModelsForBrand(selectedBrand);

  const handleDeleteAll = async () => {
    const isConfirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer INTÉGRALEMENT toutes les données ?\n\nCette action va vider tout votre stock de véhicules, vos clients/chauffeurs et l'historique complet de vos locations. Cette action est irréversible !"
    );
    
    if (!isConfirmed) return;

    const confirmationPrompt = window.prompt(
      'Pour confirmer la suppression définitive de toutes les données de Janen_Car, veuillez saisir "SUPPRIMER" ci-dessous :'
    );

    if (confirmationPrompt !== 'SUPPRIMER') {
      alert('Suppression annulée. Le mot de passe de confirmation saisi est incorrect.');
      return;
    }

    try {
      await storageService.clearAllData();
      alert('Toutes les données ont été effacées avec succès. L\'application va maintenant redémarrer propre et vierge.');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Une erreur est survenue lors de la suppression des données.');
    }
  };


  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={Settings}
        eyebrow="Configuration"
        title="Paramètres"
        description="Personnalisez l’affichage, consultez les informations de l’agence et gérez les opérations de sauvegarde ou de remise à zéro."
      />

      {/* Apparence & Thème (Thème Sombre / Mode Nuit) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Apparence & Thème d'affichage
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adaptez l'interface pour un confort optimal en journée ou dans des conditions de faible luminosité
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Option Mode Clair */}
          <div
            id="setting-theme-light"
            onClick={() => onThemeChange && onThemeChange('light')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 flex items-start gap-3.5 ${
              theme === 'light'
                ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${theme === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
              <Sun className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Thème Clair (Jour)
                </span>
                {theme === 'light' && (
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    Actif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Fond blanc et ardoise claire, idéal pour les environnements bien éclairés et le travail de jour.
              </p>
            </div>
          </div>

          {/* Option Mode Sombre */}
          <div
            id="setting-theme-dark"
            onClick={() => onThemeChange && onThemeChange('dark')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 flex items-start gap-3.5 ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-950/40 shadow-sm'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-indigo-900/60 text-indigo-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
              <Moon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Thème Sombre (Nuit / Faible luminosité)
                </span>
                {theme === 'dark' && (
                  <span className="text-xs font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded-full border border-blue-800">
                    Actif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Fond sombre reposant, réduit la fatigue oculaire le soir et préserve la batterie des écrans OLED.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Agency Identity */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4 transition-colors">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Identité de l'Agence
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Nom commercial
            </label>
            <input
              type="text"
              readOnly
              value="Janen_Car"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Slogan de l'application
            </label>
            <input
              type="text"
              readOnly
              value="Gestion intelligente de location de voitures"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Format d'immatriculation configuré
            </label>
            <input
              type="text"
              readOnly
              value="Tunisie (ex : 1234 TUN 123)"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Devise de facturation
            </label>
            <input
              type="text"
              readOnly
              value="Dinar Tunisien (TND)"
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold"
            />
          </div>
        </div>
      </div>

      {/* Car Brands & Models Catalog Viewer */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Catalogue des Marques & Modèles
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {configuredBrands.length} marques configurées avec relation Marque → Modèles
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Choisir une marque :
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
            >
              {configuredBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Modèles associés à {selectedBrand} ({configuredModels.length}) :
            </label>
            <div className="flex flex-wrap gap-1.5 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[50px]">
              {configuredModels.map((m) => (
                <span
                  key={m}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 shadow-2xs"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CSV Backup & Restore */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4 transition-colors">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Sauvegarde et Restauration CSV
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exportation dans Janen_Car.csv et importation sécurisée avec validation
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Exporter Janen_Car.csv</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <Upload className="w-4 h-4" />
            <span>Importer un fichier CSV</span>
          </button>
        </div>
      </div>

      {/* Architecture & Future Extensions (Database & Android) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Migration Guide */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Évolution Base de données
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            L'application est conçue avec une couche de service abstraite (<code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-700 dark:text-blue-400">IDataService</code> dans <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-700 dark:text-slate-300">storageService.ts</code>).
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
            <li><strong>Supabase / Firebase :</strong> Remplacer simplement l'adaptateur local par le client SDK officiel.</li>
            <li><strong>PostgreSQL / MySQL :</strong> Créer un point d'entrée REST API pour stocker les contrats.</li>
            <li>Aucun composant d'interface n'a besoin d'être modifié !</li>
          </ul>
        </div>

        {/* Android Conversion Guide */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Smartphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Transformation en Application Android
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Grâce à son interface responsive sans défilement horizontal et ses composants tactiles adaptés :
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
            <li><strong>Capacitor :</strong> Exécutez <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-indigo-700 dark:text-indigo-400">npx cap add android</code> puis <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-indigo-700 dark:text-indigo-400">npx cap run android</code> pour compiler l'APK.</li>
            <li><strong>PWA :</strong> Installable immédiatement sur écran d'accueil Android et iOS.</li>
          </ul>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/60 p-6 shadow-2xs space-y-6 transition-colors">
        <h3 className="text-base font-bold text-rose-900 dark:text-rose-200 border-b border-rose-100 dark:border-rose-900/40 pb-2">
          Zone de Danger
        </h3>

        {/* Reset Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Réinitialiser les données de l'application
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
              Efface toutes les données personnalisées du LocalStorage et recharge les données de démonstration initiales (Toyota Yaris, Peugeot 208, clients de démo, etc.).
            </p>
          </div>

          <button
            id="btn-settings-reset-data"
            onClick={onResetData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Réinitialiser les données</span>
          </button>
        </div>

        <div className="border-t border-rose-150 dark:border-rose-900/40 my-2" />

        {/* Clear All Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Vider intégralement l'application (Stock réel)
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
              Efface STRICTEMENT TOUTES les données (véhicules, réservations, chauffeurs et historique de démonstration). L'application deviendra entièrement vierge et prête pour vos vrais véhicules.
            </p>
          </div>

          <button
            id="btn-settings-clear-all-data"
            onClick={handleDeleteAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Supprimer toutes les données</span>
          </button>
        </div>
      </div>
    </div>
  );
};
