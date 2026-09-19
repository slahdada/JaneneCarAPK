import React, { useEffect, useMemo, useState } from 'react';
import { Rental, FilterState } from '../types';
import { SearchBar } from '../components/SearchBar';
import { Filters } from '../components/Filters';
import { RentalTable } from '../components/RentalTable';
import { RentalCard } from '../components/RentalCard';
import { exportRentalsListPdf, downloadBlankContractPdf } from '../services/pdfService';
import { Plus, Download, FileDown, Upload, KeyRound, Edit2, MoreHorizontal, ChevronLeft, ChevronRight, Grid2X2, List } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';

interface RentalsViewProps {
  rentals: Rental[];
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onResetFilters: () => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onExportCsv: () => void;
  onView: (rental: Rental) => void;
  onEdit: (rental: Rental) => void;
  onDuplicate: (rental: Rental) => void;
  onDelete: (rental: Rental) => void;
  onOpenBlankContractEditor: () => void;
}

export const RentalsView: React.FC<RentalsViewProps> = ({
  rentals,
  filters,
  onFilterChange,
  onResetFilters,
  onOpenAddModal,
  onOpenImportModal,
  onExportCsv,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onOpenBlankContractEditor,
}) => {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const pageSize = 10;

  // Extract distinct drivers list for filter
  const availableDrivers = useMemo(() => {
    const set = new Set<string>();
    rentals.forEach((r) => {
      if (r.chauffeur) set.add(r.chauffeur);
    });
    return Array.from(set).sort();
  }, [rentals]);

  // Compute active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.marque) count++;
    if (filters.modele) count++;
    if (filters.chauffeur) count++;
    if (filters.statut) count++;
    if (filters.dateDepart) count++;
    if (filters.dateRetour) count++;
    return count;
  }, [filters]);

  // Filtered and searched rentals
  const filteredRentals = useMemo(() => {
    return rentals.filter((r) => {
      // Free search
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        const matches =
          r.marque.toLowerCase().includes(query) ||
          r.modele.toLowerCase().includes(query) ||
          r.matricule.toLowerCase().includes(query) ||
          r.chauffeur.toLowerCase().includes(query) ||
          r.telephone.replace(/\s+/g, '').includes(query.replace(/\s+/g, '')) ||
          r.statut.toLowerCase().includes(query);

        if (!matches) return false;
      }

      // Marque filter
      if (filters.marque && r.marque.toLowerCase() !== filters.marque.toLowerCase()) {
        return false;
      }

      // Modèle filter
      if (filters.modele && r.modele.toLowerCase() !== filters.modele.toLowerCase()) {
        return false;
      }

      // Chauffeur filter
      if (filters.chauffeur && r.chauffeur.toLowerCase() !== filters.chauffeur.toLowerCase()) {
        return false;
      }

      // Statut filter
      if (filters.statut && r.statut !== filters.statut) {
        return false;
      }

      // Date départ filter
      if (filters.dateDepart && r.dateDepart < filters.dateDepart) {
        return false;
      }

      // Date retour filter
      if (filters.dateRetour && r.dateRetour > filters.dateRetour) {
        return false;
      }

      return true;
    });
  }, [rentals, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredRentals.length / pageSize));
  const paginatedRentals = useMemo(() => filteredRentals.slice((page - 1) * pageSize, page * pageSize), [filteredRentals, page]);

  useEffect(() => { setPage(1); }, [filters]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  return (
    <div className="space-y-4">
      <PageHeader
        icon={KeyRound}
        eyebrow="Gestion"
        title="Locations"
        description={`${filteredRentals.length} location${filteredRentals.length > 1 ? 's' : ''} affichée${filteredRentals.length > 1 ? 's' : ''}. Recherchez, filtrez ou ouvrez une location pour afficher ses détails.`}
        primaryAction={
          <button id="btn-rentals-add" onClick={onOpenAddModal} className="ui-btn-primary">
            <Plus className="h-4 w-4" />Nouvelle location
          </button>
        }
        secondaryActions={
          <details className="relative">
            <summary className="ui-btn-secondary list-none"><MoreHorizontal className="h-4 w-4" />Plus d’actions</summary>
            <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <button onClick={onOpenBlankContractEditor} className="ui-menu-action"><Edit2 className="h-4 w-4" />Saisir un contrat vierge</button>
              <button onClick={downloadBlankContractPdf} className="ui-menu-action"><FileDown className="h-4 w-4" />Télécharger un contrat vierge</button>
              <button onClick={onOpenImportModal} className="ui-menu-action"><Upload className="h-4 w-4" />Importer un fichier CSV</button>
              <button onClick={onExportCsv} className="ui-menu-action"><Download className="h-4 w-4" />Exporter en CSV</button>
              <button onClick={() => exportRentalsListPdf(filteredRentals)} className="ui-menu-action"><FileDown className="h-4 w-4" />Enregistrer la liste en PDF</button>
            </div>
          </details>
        }
      />

      {/* Search Bar (Section 17) */}
      <div>
        <SearchBar
          value={filters.search}
          onChange={(val) => onFilterChange('search', val)}
          totalResults={filteredRentals.length}
        />
      </div>

      {/* Filters (Section 18) */}
      <Filters
        filters={filters}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
        availableDrivers={availableDrivers}
        activeCount={activeFiltersCount}
      />

      <div className="hidden md:flex justify-end" aria-label="Mode d’affichage des locations">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
          <button type="button" onClick={() => setViewMode('grid')} aria-pressed={viewMode === 'grid'} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}><Grid2X2 className="h-4 w-4" />Grille</button>
          <button type="button" onClick={() => setViewMode('list')} aria-pressed={viewMode === 'list'} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}><List className="h-4 w-4" />Liste</button>
        </div>
      </div>

      {viewMode === 'list' && <div className="hidden md:block">
        <RentalTable rentals={paginatedRentals} onView={onView} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />
      </div>}

      {viewMode === 'grid' && <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        {paginatedRentals.map((r) => <RentalCard key={r.id} rental={r} onView={onView} onEdit={onEdit} onDuplicate={onDuplicate} onDelete={onDelete} />)}
      </div>}

      <div className="md:hidden space-y-3">
        {filteredRentals.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700">Aucune location trouvée</p>
            <p className="text-xs text-slate-400 mt-1">Modifiez vos critères de recherche.</p>
          </div>
        ) : (
          paginatedRentals.map((r) => (
            <RentalCard
              key={r.id}
              rental={r}
              onView={onView}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {filteredRentals.length > pageSize && (
        <nav className="ui-card flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" aria-label="Pagination des locations">
          <p className="text-xs text-slate-500">Affichage {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filteredRentals.length)} sur {filteredRentals.length}</p>
          <div className="flex items-center gap-2">
            <button className="ui-btn-secondary min-h-9 px-3 py-1.5 text-xs" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" />Précédent</button>
            <span className="px-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Page {page} / {totalPages}</span>
            <button className="ui-btn-secondary min-h-9 px-3 py-1.5 text-xs" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Suivant<ChevronRight className="h-4 w-4" /></button>
          </div>
        </nav>
      )}

    </div>
  );
};
