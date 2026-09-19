import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Vehicle, Rental } from '../types';
import { TunisianPlateBadge } from './TunisianPlateBadge';
import { getVehicleAvailability } from '../utils/conflictUtils';
import { Search, X, ChevronDown, Check, Car, Filter } from 'lucide-react';

interface VehicleSearchableSelectProps {
  vehicles: Vehicle[];
  selectedVehicleId: string;
  onSelectVehicle: (vehicleId: string) => void;
  dateDepart: string;
  dateRetour: string;
  existingRentals: Rental[];
  excludeRentalId?: string;
}

export const VehicleSearchableSelect: React.FC<VehicleSearchableSelectProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  dateDepart,
  dateRetour,
  existingRentals,
  excludeRentalId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fermer la liste déroulante lors d'un clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus automatique sur le champ de recherche à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Trouver le véhicule actuellement sélectionné
  const selectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId);
  }, [vehicles, selectedVehicleId]);

  // Disponibilité du véhicule sélectionné
  const selectedVehicleAvailability = useMemo(() => {
    if (!selectedVehicle) return null;
    return getVehicleAvailability(
      selectedVehicle,
      existingRentals,
      dateDepart,
      dateRetour,
      excludeRentalId
    );
  }, [selectedVehicle, existingRentals, dateDepart, dateRetour, excludeRentalId]);

  // Filtrage dynamique instantané par marque, modèle ou matricule (ex: 7109 TUN 666)
  const filteredVehicles = useMemo(() => {
    const rawQuery = searchQuery.trim().toLowerCase();
    const queryTokens = rawQuery.split(/\s+/).filter(Boolean);

    return vehicles
      .map((veh) => {
        const avail = getVehicleAvailability(
          veh,
          existingRentals,
          dateDepart,
          dateRetour,
          excludeRentalId
        );
        return { veh, avail };
      })
      .filter(({ veh, avail }) => {
        if (onlyAvailable && !avail.isAvailable) {
          return false;
        }

        if (queryTokens.length === 0) return true;

        const brand = (veh.marque || '').toLowerCase();
        const model = (veh.modele || '').toLowerCase();
        const plate = (veh.matricule || '').toLowerCase();
        const cleanPlate = plate.replace(/[\s\-_]/g, '');

        // Chaque mot-clé recherché doit correspondre à la marque, au modèle ou au matricule
        return queryTokens.every((token) => {
          const cleanToken = token.replace(/[\s\-_]/g, '');
          return (
            brand.includes(token) ||
            model.includes(token) ||
            plate.includes(token) ||
            (cleanToken.length > 0 && cleanPlate.includes(cleanToken))
          );
        });
      });
  }, [vehicles, searchQuery, onlyAvailable, existingRentals, dateDepart, dateRetour, excludeRentalId]);

  const handleSelect = (vehId: string) => {
    onSelectVehicle(vehId);
    setIsOpen(false);
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectVehicle('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Bouton déclencheur avec aperçu du véhicule sélectionné */}
      <div
        id="vehicle-searchable-select-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[48px] px-3.5 py-2 bg-white dark:bg-slate-800 dark:text-slate-100 border dark:border-slate-600 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all shadow-2xs select-none ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
            : 'border-slate-300 hover:border-slate-400'
        }`}
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          } else if (e.key === 'Escape') {
            setIsOpen(false);
          }
        }}
      >
        {selectedVehicle ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <TunisianPlateBadge matricule={selectedVehicle.matricule} size="sm" />
            <div className="truncate flex items-center gap-1.5 text-xs sm:text-sm">
              <span className="font-bold text-slate-900 truncate">
                {selectedVehicle.marque} {selectedVehicle.modele}
              </span>
              {selectedVehicleAvailability?.isAvailable ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded border border-emerald-200 shrink-0">
                  🟢 Disponible
                </span>
              ) : (
                <span className="px-1.5 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 rounded border border-rose-200 shrink-0">
                  🔴 Indisponible
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm truncate">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">
              Rechercher par immatriculation, marque ou modèle…
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {selectedVehicle && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Désélectionner le véhicule"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600' : ''
            }`}
          />
        </div>
      </div>

      {/* Menu déroulant intégrant la barre de recherche dynamique */}
      {isOpen && (
        <div
          id="vehicle-searchable-select-dropdown"
          className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-2xl z-[80] overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col"
          style={{ maxHeight: '380px' }}
        >
          {/* Barre de recherche dynamique directement au sommet de la liste */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 space-y-2 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                id="input-filter-fleet-vehicle"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par immatriculation, marque ou modèle…"
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-white dark:bg-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400 font-medium text-slate-800"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  title="Effacer la recherche"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Statistiques rapides & Filtre de disponibilité */}
            <div className="flex items-center justify-between gap-2 text-[11px] px-1">
              <span className="text-slate-500 font-medium">
                {filteredVehicles.length} résultat{filteredVehicles.length > 1 ? 's' : ''} sur {vehicles.length} véhicules
              </span>
              <button
                type="button"
                onClick={() => setOnlyAvailable(!onlyAvailable)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition-colors ${
                  onlyAvailable
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>Disponibles uniquement</span>
              </button>
            </div>
          </div>

          {/* Liste déroulante des véhicules filtrés */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-64">
            {/* Option pour vider / saisie manuelle */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className="w-full px-3.5 py-2.5 text-left text-xs text-slate-500 hover:bg-slate-50 flex items-center justify-between transition-colors italic"
            >
              <span>-- Aucun véhicule (remplir manuellement ci-dessous) --</span>
              {!selectedVehicleId && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
            </button>

            {filteredVehicles.length === 0 ? (
              <div className="py-8 px-4 text-center text-slate-500">
                <Car className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Aucun véhicule trouvé pour &laquo;&nbsp;{searchQuery}&nbsp;&raquo;
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Vérifiez le matricule (ex : 7109 TUN 666) ou la marque/modèle du véhicule.
                </p>
              </div>
            ) : (
              filteredVehicles.map(({ veh, avail }) => {
                const isSelected = veh.id === selectedVehicleId;
                return (
                  <button
                    key={veh.id}
                    type="button"
                    onClick={() => handleSelect(veh.id)}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'bg-blue-50/90 text-blue-950 font-semibold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TunisianPlateBadge matricule={veh.matricule} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {veh.marque} {veh.modele}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                          {avail.isAvailable ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                              Disponible
                            </span>
                          ) : (
                            <span
                              className="text-rose-600 font-semibold flex items-center gap-1 truncate"
                              title={avail.conflictMessage}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block shrink-0" />
                              <span className="truncate">{avail.conflictMessage || 'Indisponible'}</span>
                            </span>
                          )}
                          {veh.prixParJour && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 font-mono">
                                {veh.prixParJour} TND/j
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isSelected && <Check className="w-4 h-4 text-blue-600 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
