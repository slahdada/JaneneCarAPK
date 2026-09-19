import React from 'react';
import { FilterState, RentalStatus } from '../types';
import { getCarBrands, getAllModelsForBrand } from '../data/carBrands';
import { RotateCcw, Filter } from 'lucide-react';

interface FiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onResetFilters: () => void;
  availableDrivers: string[];
  activeCount: number;
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  availableDrivers,
  activeCount,
}) => {
  const brands = getCarBrands();
  const models = filters.marque ? getAllModelsForBrand(filters.marque) : [];

  const statuses: RentalStatus[] = [
    'Disponible',
    'Louée',
    'Réservée',
    'En maintenance',
    'Retour aujourd\'hui',
    'En retard',
  ];

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Filtres de recherche
          </h3>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800">
              {activeCount} actif{activeCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {activeCount > 0 && (
          <button
            id="btn-reset-filters"
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser les filtres</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
        {/* Filtre Marque */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Marque
          </label>
          <select
            id="filter-marque"
            value={filters.marque}
            onChange={(e) => {
              onFilterChange('marque', e.target.value);
              if (filters.modele) onFilterChange('modele', '');
            }}
            className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Toutes les marques</option>
            {brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre Modèle (dépendant de la marque) */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Modèle
          </label>
          <select
            id="filter-modele"
            value={filters.modele}
            onChange={(e) => onFilterChange('modele', e.target.value)}
            disabled={!filters.marque}
            className={`w-full text-xs py-2 px-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              !filters.marque
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white'
            }`}
          >
            <option value="">
              {filters.marque ? 'Tous les modèles' : 'Sélectionnez une marque'}
            </option>
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre Chauffeur */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Chauffeur
          </label>
          <select
            id="filter-chauffeur"
            value={filters.chauffeur}
            onChange={(e) => onFilterChange('chauffeur', e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tous les chauffeurs</option>
            {availableDrivers.map((driver) => (
              <option key={driver} value={driver}>
                {driver}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre Statut */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Statut
          </label>
          <select
            id="filter-statut"
            value={filters.statut}
            onChange={(e) => onFilterChange('statut', e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tous les statuts</option>
            {statuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre Date départ */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Date départ
          </label>
          <input
            id="filter-date-depart"
            type="date"
            value={filters.dateDepart}
            onChange={(e) => onFilterChange('dateDepart', e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filtre Date retour */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Date retour
          </label>
          <input
            id="filter-date-retour"
            type="date"
            value={filters.dateRetour}
            onChange={(e) => onFilterChange('dateRetour', e.target.value)}
            className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
