import React, { useMemo, useState } from 'react';
import { Vehicle, Rental, RentalStatus } from '../types';
import { addCustomBrand, addCustomModel, getAllModelsForBrand, getCarBrands } from '../data/carBrands';
import { validateMatricule, formatMatriculeInput } from '../utils/validation';
import { normalizeMatricule } from '../utils/conflictUtils';
import { downloadStockImportTemplateCsv, exportVehiclesToCsv } from '../services/csvService';
import { exportVehiclesListPdf } from '../services/pdfService';
import { VehicleCsvImportModal } from '../components/VehicleCsvImportModal';
import { VehicleCard } from '../components/VehicleCard';
import { TunisianPlateBadge } from '../components/TunisianPlateBadge';
import { StatusBadge } from '../components/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { CreatableCombobox } from '../components/ui/CreatableCombobox';
import {
  Car,
  Plus,
  Search,
  X,
  Check,
  AlertCircle,
  FileSpreadsheet,
  FileDown,
  Upload,
  LayoutGrid,
  List,
  CalendarCheck,
  KeyRound,
  Trash2,
  Fuel,
  MoreHorizontal,
} from 'lucide-react';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  rentals?: Rental[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  onDeleteVehicle: (id: string) => void;
  onImportVehicles?: (vehicles: Omit<Vehicle, 'id'>[]) => void;
  onNotify?: (message: string, type: 'success' | 'error' | 'info') => void;
  onRentVehicle?: (vehicle: Vehicle) => void;
  onReserveVehicle?: (vehicle: Vehicle) => void;
  onViewRental?: (rental: Rental) => void;
  initialStatusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({
  vehicles,
  rentals = [],
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onImportVehicles,
  onNotify,
  onRentVehicle,
  onReserveVehicle,
  onViewRental,
  initialStatusFilter = '',
  onStatusFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('vehicles_view_mode') as 'grid' | 'list') || 'grid';
  });
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('vehicles_view_mode', mode);
  };

  React.useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  const rentalsByVehicle = useMemo(() => {
    const grouped = new Map<string, Rental[]>();
    rentals.forEach((rental) => {
      const key = normalizeMatricule(rental.matricule);
      if (!key) return;
      const list = grouped.get(key);
      if (list) list.push(rental);
      else grouped.set(key, [rental]);
    });
    return grouped;
  }, [rentals]);

  // Form states
  const [marque, setMarque] = useState('Toyota');
  const [modele, setModele] = useState('Corolla');
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [matricule, setMatricule] = useState('');
  const [annee, setAnnee] = useState(2023);
  const [carburant, setCarburant] = useState<'Essence' | 'Diesel' | 'Hybride' | 'Électrique'>('Essence');
  const [prixParJour, setPrixParJour] = useState<string | number>('');
  const [statut, setStatut] = useState<RentalStatus>('Disponible');
  const [formError, setFormError] = useState('');

  const brandOptions = useMemo(() => getCarBrands(), [catalogVersion]);
  const availableModels = useMemo(() => getAllModelsForBrand(marque), [marque, catalogVersion]);

  const handleMarqueChange = (newMarque: string) => {
    setMarque(newMarque);
    const models = getAllModelsForBrand(newMarque);
    setModele(models[0] || '');
  };

  const handleMatriculeChange = (val: string) => {
    setMatricule(formatMatriculeInput(val));
    if (formError) setFormError('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!marque.trim()) { setFormError('Veuillez sélectionner une marque.'); return; }
    if (!modele.trim()) { setFormError('Veuillez sélectionner un modèle.'); return; }
    const val = validateMatricule(matricule);
    if (!val.isValid) {
      setFormError(val.error || 'Format de matricule incorrect. Exemple : 1234 TUN 123');
      return;
    }

    onAddVehicle({
      marque,
      modele,
      matricule: matricule.trim().toUpperCase(),
      annee: Number(annee),
      carburant,
      prixParJour:
        prixParJour !== '' && !isNaN(Number(prixParJour)) && Number(prixParJour) > 0
          ? Number(prixParJour)
          : undefined,
      statut,
    });

    setIsAddModalOpen(false);
    setMatricule('');
    setFormError('');
  };

  const filteredVehicles = vehicles.filter((v) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      v.marque.toLowerCase().includes(query) ||
      v.modele.toLowerCase().includes(query) ||
      v.matricule.toLowerCase().includes(query);

    const matchesStatus = !statusFilter || v.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Car}
        eyebrow="Gestion"
        title="Véhicules"
        description={`${vehicles.length} véhicule${vehicles.length > 1 ? 's' : ''} dans la flotte. Recherchez un véhicule, vérifiez son statut ou lancez une location.`}
        primaryAction={<button id="btn-add-vehicle" type="button" onClick={() => setIsAddModalOpen(true)} className="ui-btn-primary"><Plus className="h-4 w-4" />Ajouter un véhicule</button>}
        secondaryActions={
          <details className="relative">
            <summary className="ui-btn-secondary list-none"><MoreHorizontal className="h-4 w-4" />Plus d’actions</summary>
            <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <button onClick={() => { downloadStockImportTemplateCsv(); onNotify?.("Modèle d'import CSV téléchargé.", 'success'); }} className="ui-menu-action"><FileSpreadsheet className="h-4 w-4" />Télécharger le modèle CSV</button>
              <button onClick={() => setIsImportModalOpen(true)} className="ui-menu-action"><Upload className="h-4 w-4" />Importer des véhicules</button>
              <button onClick={() => exportVehiclesToCsv(vehicles)} className="ui-menu-action"><FileDown className="h-4 w-4" />Exporter en CSV</button>
              <button onClick={() => exportVehiclesListPdf(vehicles)} className="ui-menu-action"><FileDown className="h-4 w-4" />Enregistrer le parc en PDF</button>
            </div>
          </details>
        }
      />

      {/* Search & Status Filter & View Mode Switcher */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher par marque, modèle ou matricule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter: Disponible (Prêt pour la location) */}
          <button
            id="btn-quick-filter-disponible"
            type="button"
            onClick={() => {
              const target = statusFilter === 'Disponible' ? '' : 'Disponible';
              setStatusFilter(target);
              if (onStatusFilterChange) {
                onStatusFilterChange(target);
              }
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
              statusFilter === 'Disponible'
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-bold'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70'
            }`}
            title="Afficher uniquement les véhicules disponibles (prêts à la location)"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>Disponible (Prêt pour location)</span>
          </button>

          {/* Traditional Select Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => {
              const val = e.target.value;
              setStatusFilter(val);
              if (onStatusFilterChange) {
                onStatusFilterChange(val);
              }
            }}
            className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            <option value="Disponible">Disponible</option>
            <option value="Louée">Louée</option>
            <option value="Réservée">Réservée</option>
            <option value="En maintenance">En maintenance</option>
            <option value="Retour aujourd'hui">Retour aujourd'hui</option>
            <option value="En retard">En retard</option>
          </select>

          {/* View Switcher: Grid vs List */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Affichage en Grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Affichage en Liste"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or List of Vehicles */}
      {filteredVehicles.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
            {filteredVehicles.map((v) => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                rentals={rentalsByVehicle.get(normalizeMatricule(v.matricule)) || []}
                onUpdateVehicle={onUpdateVehicle}
                onDeleteVehicle={onDeleteVehicle}
                onRentVehicle={onRentVehicle}
                onReserveVehicle={onReserveVehicle}
                onViewRental={onViewRental}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold text-slate-400 text-left">Véhicule</th>
                    <th className="py-3 px-4 font-bold text-slate-400 text-left">Immatriculation</th>
                    <th className="py-3 px-4 font-bold text-slate-400 text-left">Statut</th>
                    <th className="py-3 px-4 font-bold text-slate-400 text-left">Tarif / Jour</th>
                    <th className="py-3 px-4 font-bold text-slate-400 text-left">Changer Statut</th>
                    <th className="py-3 px-4 font-bold text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVehicles.map((v) => {
                    const isDeleting = deletingVehicleId === v.id;
                    return (
                      <tr key={v.id} className="hover:bg-slate-50/40 transition-colors">
                        {/* Vehicle Brand, Model, Fuel, Year */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-slate-50 text-slate-500 rounded-xl border border-slate-100 shrink-0">
                              <Car className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm">
                                {v.marque} {v.modele}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                <span className="flex items-center gap-0.5">
                                  <Fuel className="w-3 h-3 text-slate-400" /> {v.carburant}
                                </span>
                                <span>•</span>
                                <span>{v.annee}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Tunisian Plate */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <TunisianPlateBadge matricule={v.matricule} size="sm" />
                        </td>

                        {/* Current Status Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <StatusBadge statut={v.statut} size="sm" />
                        </td>

                        {/* Tariff per Day */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {v.prixParJour ? (
                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 shadow-3xs">
                              {v.prixParJour} TND <span className="text-[10px] font-medium text-emerald-600">/ j</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Non défini</span>
                          )}
                        </td>

                        {/* Direct Update Dropdown */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <select
                            value={v.statut}
                            onChange={(e) => onUpdateVehicle(v.id, { statut: e.target.value as RentalStatus })}
                            className="text-xs font-semibold py-1 px-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                          >
                            <option value="Disponible">Disponible</option>
                            <option value="Louée">Louée</option>
                            <option value="Réservée">Réservée</option>
                            <option value="En maintenance">En maintenance</option>
                            <option value="Retour aujourd'hui">Retour aujourd'hui</option>
                            <option value="En retard">En retard</option>
                          </select>
                        </td>

                        {/* Actions buttons */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Reserve Button */}
                            {v.statut !== 'En maintenance' ? (
                              <button
                                type="button"
                                onClick={() => onReserveVehicle && onReserveVehicle(v)}
                                className="inline-flex items-center gap-1 p-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg shadow-3xs cursor-pointer"
                                title={`Réserver ce véhicule (${v.marque} ${v.modele})`}
                              >
                                <CalendarCheck className="w-3.5 h-3.5 text-amber-700" />
                                <span className="hidden sm:inline">Réserve</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="inline-flex items-center gap-1 p-1.5 text-xs font-medium text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed opacity-55"
                                title="Véhicule en maintenance — réservation impossible"
                              >
                                <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
                                <span className="hidden sm:inline">Réserve</span>
                              </button>
                            )}

                            {/* Rent Button */}
                            {v.statut === 'Disponible' ? (
                              <button
                                type="button"
                                onClick={() => onRentVehicle && onRentVehicle(v)}
                                className="inline-flex items-center gap-1 p-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-3xs cursor-pointer"
                                title={`Louer ce véhicule (${v.marque} ${v.modele})`}
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Louer</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="inline-flex items-center gap-1 p-1.5 text-xs font-medium text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed opacity-55"
                                title={`Véhicule ${v.statut.toLowerCase()} — indisponible`}
                              >
                                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                                <span className="hidden sm:inline">Louer</span>
                              </button>
                            )}

                            {/* Delete Button with confirmation */}
                            {isDeleting ? (
                              <div className="inline-flex items-center gap-1 px-1 py-0.5 bg-rose-50 border border-rose-200 rounded-lg animate-in fade-in">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteVehicle(v.id);
                                    setDeletingVehicleId(null);
                                  }}
                                  className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md"
                                  title="Confirmer la suppression"
                                >
                                  Oui
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingVehicleId(null)}
                                  className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-md"
                                >
                                  Non
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingVehicleId(v.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Supprimer ce véhicule"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 space-y-2">
          <Car className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Aucun véhicule trouvé</p>
          <p className="text-xs text-slate-400">
            Essayez de modifier votre recherche ou ajoutez un nouveau véhicule au parc.
          </p>
        </div>
      )}

      {/* Add Vehicle Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-visible my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ajouter un nouveau véhicule
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Les champs marqués d’un <span className="font-bold text-rose-500">*</span> sont obligatoires. Si une marque ou un modèle manque, ajoutez-le ici sans quitter le formulaire.</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <CreatableCombobox
                    id="vehicle-brand"
                    label="Marque"
                    required
                    value={marque}
                    options={brandOptions}
                    placeholder="Ex. Toyota"
                    searchPlaceholder="Rechercher une marque..."
                    createLabel="Ajouter une nouvelle marque"
                    helperText="Recherchez une marque existante ou créez-en une nouvelle."
                    onChange={handleMarqueChange}
                    onCreate={(input) => {
                      const result = addCustomBrand(input);
                      setCatalogVersion((version) => version + 1);
                      return result;
                    }}
                    onCreateFeedback={(value, created) => {
                      onNotify?.(created ? `Marque ${value} ajoutée.` : 'Cette marque existe déjà.', created ? 'success' : 'info');
                    }}
                  />

                  <CreatableCombobox
                    id="vehicle-model"
                    label="Modèle"
                    required
                    disabled={!marque}
                    value={modele}
                    options={availableModels}
                    placeholder={marque ? 'Ex. Yaris' : 'Sélectionnez d’abord une marque'}
                    searchPlaceholder="Rechercher un modèle..."
                    createLabel="Ajouter un nouveau modèle"
                    helperText="Le modèle sera associé à la marque sélectionnée."
                    onChange={setModele}
                    onCreate={(input) => {
                      const result = addCustomModel(marque, input);
                      setCatalogVersion((version) => version + 1);
                      return result;
                    }}
                    onCreateFeedback={(value, created) => {
                      onNotify?.(created ? `Modèle ${value} ajouté.` : 'Ce modèle existe déjà pour cette marque.', created ? 'success' : 'info');
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="ui-label" htmlFor="vehicle-plate">
                  Immatriculation <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="vehicle-plate"
                    type="text"
                    value={matricule}
                    onChange={(e) => handleMatriculeChange(e.target.value)}
                    placeholder="Ex. 1234 TUN 123"
                    aria-describedby="vehicle-plate-help"
                    className="ui-field flex-1 font-mono uppercase"
                  />
                  {matricule && (
                    <div className="shrink-0">
                      <TunisianPlateBadge matricule={matricule} size="md" />
                    </div>
                  )}
                </div>
                <p id="vehicle-plate-help" className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Format attendu : 1234 TUN 123</p>
                {formError && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {formError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="ui-label">
                    Année
                  </label>
                  <input
                    type="number"
                    value={annee}
                    onChange={(e) => setAnnee(Number(e.target.value))}
                    className="ui-field"
                  />
                </div>
                <div>
                  <label className="ui-label">
                    Carburant
                  </label>
                  <select
                    value={carburant}
                    onChange={(e) => setCarburant(e.target.value as any)}
                    className="ui-field"
                  >
                    <option value="Essence">Essence</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybride">Hybride</option>
                    <option value="Électrique">Électrique</option>
                  </select>
                </div>
                <div>
                  <label className="ui-label">
                    Prix par jour
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex. 120 TND"
                    value={prixParJour}
                    onChange={(e) => setPrixParJour(e.target.value)}
                    className="ui-field font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Ajouter le véhicule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'importation CSV pour les véhicules du stock */}
      <VehicleCsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        existingVehicles={vehicles}
        onImportSuccess={(newVehicles) => {
          if (onImportVehicles) {
            onImportVehicles(newVehicles);
          } else {
            newVehicles.forEach((v) => onAddVehicle(v));
            if (onNotify) {
              onNotify(
                `${newVehicles.length} véhicule${newVehicles.length > 1 ? 's' : ''} importé${newVehicles.length > 1 ? 's' : ''} avec succès dans le stock.`,
                'success'
              );
            }
          }
        }}
      />

    </div>
  );
};
