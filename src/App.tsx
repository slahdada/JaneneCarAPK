import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Rental,
  Vehicle,
  Driver,
  RentalHistoryItem,
  ActiveTab,
  FilterState,
} from './types';
import { storageService } from './services/storageService';
import { exportRentalsToCsv } from './services/csvService';
import { getInitialTheme, applyTheme } from './utils/themeUtils';
import { createEmptyFilters } from './utils/filterUtils';
import { createBlankRental, createImmediateRental, createReservation } from './utils/rentalFactory';
import { useNotifications } from './hooks/useNotifications';

// Components
import { Header } from './components/Header';
import { NotificationToast } from './components/NotificationToast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { LoadingState } from './components/ui/LoadingState';

// Pages


const RentalFormModal = lazy(() => import('./components/RentalFormModal').then((m) => ({ default: m.RentalFormModal })));
const RentalDetailModal = lazy(() => import('./components/RentalDetailModal').then((m) => ({ default: m.RentalDetailModal })));
const CsvImportModal = lazy(() => import('./components/CsvImportModal').then((m) => ({ default: m.CsvImportModal })));
const ContractEditorModal = lazy(() => import('./components/ContractEditorModal').then((m) => ({ default: m.ContractEditorModal })));
const DashboardView = lazy(() => import('./pages/DashboardView').then((m) => ({ default: m.DashboardView })));
const RentalsView = lazy(() => import('./pages/RentalsView').then((m) => ({ default: m.RentalsView })));
const VehiclesView = lazy(() => import('./pages/VehiclesView').then((m) => ({ default: m.VehiclesView })));
const DriversView = lazy(() => import('./pages/DriversView').then((m) => ({ default: m.DriversView })));
const ReportsView = lazy(() => import('./pages/ReportsView').then((m) => ({ default: m.ReportsView })));
const SettingsView = lazy(() => import('./pages/SettingsView').then((m) => ({ default: m.SettingsView })));

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getInitialTheme());
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [history, setHistory] = useState<RentalHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronise le thème avec le document et le localStorage
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Filters state
  const [filters, setFilters] = useState<FilterState>(createEmptyFilters);

  // Modal form state
  const [formModal, setFormModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit' | 'duplicate';
    initialData: Rental | null;
  }>({
    isOpen: false,
    mode: 'add',
    initialData: null,
  });

  // View modal state
  const [viewRental, setViewRental] = useState<Rental | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // CSV Import modal
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);

  // Filter state for the Vehicles tab
  const [vehicleFilter, setVehicleFilter] = useState<string>('');

  // Keyboard Contract Editor Modal State
  const [contractEditor, setContractEditor] = useState<{
    isOpen: boolean;
    rental: Rental | null;
  }>({
    isOpen: false,
    rental: null,
  });

  const { notifications, addNotification, dismissNotification } = useNotifications();

  // Load all initial data from storage service
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [r, v, d, h] = await Promise.all([
        storageService.getRentals(),
        storageService.getVehicles(),
        storageService.getDrivers(),
        storageService.getHistory(),
      ]);
      setRentals(r);
      setVehicles(v);
      setDrivers(d);
      setHistory(h);
    } catch (err) {
      console.error('Erreur chargement données', err);
      addNotification('Erreur lors du chargement des données locales.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshRentalData = useCallback(async () => {
    const [updatedRentals, updatedVehicles, updatedHistory] = await Promise.all([
      storageService.getRentals(),
      storageService.getVehicles(),
      storageService.getHistory(),
    ]);
    setRentals(updatedRentals);
    setVehicles(updatedVehicles);
    setHistory(updatedHistory);
  }, []);

  // Filter actions
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = useCallback(() => {
    setFilters(createEmptyFilters());
  }, []);

  // Navigate to Rentals tab with optional status filter preset
  const handleNavigateToRentals = (statusFilter?: string) => {
    if (statusFilter !== undefined) {
      setFilters((prev) => ({ ...prev, statut: statusFilter, search: '' }));
    }
    setActiveTab('rentals');
  };

  // Smart navigation from dashboard cards based on metrics (Vehicles vs Rentals)
  const handleNavigateFromDashboard = (statusFilter: string) => {
    if (statusFilter === 'all' || statusFilter === 'Disponible' || statusFilter === 'En maintenance') {
      const targetFilter = statusFilter === 'all' ? '' : statusFilter;
      setVehicleFilter(targetFilter);
      setActiveTab('vehicles');
    } else {
      setFilters((prev) => ({ ...prev, statut: statusFilter, search: '' }));
      setActiveTab('rentals');
    }
  };

  // Reset sub-filters on explicit tab navigation from Header
  const handleTabChange = (tab: ActiveTab) => {
    if (tab === 'vehicles') {
      setVehicleFilter('');
    } else if (tab === 'rentals') {
      setFilters((prev) => ({ ...prev, statut: '', search: '' }));
    }
    setActiveTab(tab);
  };

  // CRUD Actions for Rentals
  const handleOpenAdd = () => {
    setFormModal({
      isOpen: true,
      mode: 'add',
      initialData: null,
    });
  };

  const handleRentVehicle = useCallback((vehicle: Vehicle) => {
    setFormModal({
      isOpen: true,
      mode: 'add',
      initialData: createImmediateRental(vehicle),
    });
  }, []);

  const handleReserveVehicle = useCallback((vehicle: Vehicle) => {
    setFormModal({
      isOpen: true,
      mode: 'add',
      initialData: createReservation(vehicle, rentals),
    });
  }, [rentals]);

  const handleOpenEdit = (rental: Rental) => {
    setFormModal({
      isOpen: true,
      mode: 'edit',
      initialData: rental,
    });
  };

  const handleOpenDuplicate = (rental: Rental) => {
    setFormModal({
      isOpen: true,
      mode: 'duplicate',
      initialData: {
        ...rental,
        statut: 'Disponible',
      },
    });
  };

  const handleFormSubmit = async (data: Omit<Rental, 'id' | 'numero' | 'dateCreation' | 'dateModification'>) => {
    try {
      if (formModal.mode === 'add' || formModal.mode === 'duplicate') {
        await storageService.addRental(data);
        addNotification('Location ajoutée avec succès.', 'success');
      } else if (formModal.mode === 'edit' && formModal.initialData) {
        await storageService.updateRental(formModal.initialData.id, data);
        addNotification('Location modifiée avec succès.', 'success');
      }
      // Recharger locations et véhicules synchronisés
      await refreshRentalData();
      setFormModal((prev) => ({ ...prev, isOpen: false }));
    } catch (e: any) {
      console.error(e);
      addNotification(e.message || 'Une erreur est survenue lors de l\'enregistrement.', 'error');
    }
  };

  const handleDeleteRental = (rental: Rental) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Supprimer la location',
      message: `La location #${rental.numero} de ${rental.chauffeur || 'ce client'} sera supprimée définitivement. Cette opération est irréversible.`,
      confirmText: 'Supprimer',
      onConfirm: async () => {
        try {
          await storageService.deleteRental(rental.id);
          await refreshRentalData();
          addNotification('Location supprimée avec succès.', 'success');
        } catch (err: any) {
          addNotification('Erreur lors de la suppression.', 'error');
        }
      },
    });
  };

  // Interactive Contract Editor handlers
  const handleOpenContractEditor = useCallback((rental: Rental) => {
    setContractEditor({
      isOpen: true,
      rental,
    });
  }, []);

  const handleOpenBlankContractEditor = useCallback(() => {
    handleOpenContractEditor(createBlankRental());
  }, [handleOpenContractEditor]);

  const handleSaveContractEditor = async (updatedRental: Rental) => {
    try {
      let updatedRentals: Rental[];
      let isNew = false;
      let finalRental = { ...updatedRental };

      if (updatedRental.id.startsWith('blank-')) {
        isNew = true;
        finalRental.id = `rent-${Date.now()}`;
        // Set a default status if none
        if (!finalRental.statut) {
          finalRental.statut = 'Louée';
        }
        updatedRentals = [finalRental, ...rentals];
      } else {
        updatedRentals = rentals.map((r) => (r.id === updatedRental.id ? updatedRental : r));
      }

      setRentals(updatedRentals);
      await storageService.saveRentals(updatedRentals);
      
      await storageService.addHistoryItem({
        action: isNew ? 'creation' : 'modification',
        titre: isNew ? `Nouveau contrat #${finalRental.numero}` : `Mise à jour contrat #${finalRental.numero}`,
        details: isNew 
          ? `Nouveau contrat de location créé au clavier pour le chauffeur ${finalRental.chauffeur || 'Non renseigné'}`
          : `Données du contrat modifiées au clavier pour le chauffeur ${finalRental.chauffeur || 'Non renseigné'}`,
        matricule: finalRental.matricule,
        chauffeur: finalRental.chauffeur
      });
      const updatedHistory = await storageService.getHistory();
      setHistory(updatedHistory);
      
      addNotification(
        isNew 
          ? `Le contrat #${finalRental.numero} a été créé et enregistré avec succès.`
          : `Le contrat #${finalRental.numero} a été mis à jour avec succès au clavier.`, 
        'success'
      );
    } catch (err) {
      console.error(err);
      addNotification('Erreur lors de la sauvegarde du contrat.', 'error');
    }
  };

  // CSV Import and Export
  const handleExportCsv = () => {
    try {
      exportRentalsToCsv(rentals);
      addNotification('Fichier Janen_Car.csv exporté avec succès.', 'success');
    } catch (e) {
      console.error(e);
      addNotification('Erreur lors de l\'exportation CSV.', 'error');
    }
  };

  const handleImportCsvSuccess = async (
    newRentals: Omit<Rental, 'id' | 'numero' | 'dateCreation' | 'dateModification'>[],
    newVehicles?: Omit<Vehicle, 'id'>[]
  ) => {
    try {
      setIsLoading(true);

      // 1. Si des véhicules sont détectés (stock ou colonnes vierges), les ajouter au parc
      if (newVehicles && newVehicles.length > 0) {
        await storageService.addVehicles(newVehicles);
      }

      // 2. Si des locations actives sont présentes (chauffeur renseigné)
      const activeRentals = newRentals.filter((r) => r.chauffeur && r.chauffeur !== '—');
      if (activeRentals.length > 0) {
        await storageService.addRentalsBatch(activeRentals);
      }

      await refreshRentalData();

      const totalCount = (newVehicles && newVehicles.length > 0) ? newVehicles.length : newRentals.length;
      addNotification(
        `${totalCount} élément${totalCount > 1 ? 's' : ''} importé${totalCount > 1 ? 's' : ''} avec succès dans Janen_Car.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de l'enregistrement des données importées.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Data reset (LocalStorage)
  const handleResetData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Réinitialiser toutes les données',
      message: 'Les données actuelles seront remplacées par les données de démonstration initiales. Les modifications locales non exportées seront perdues.',
      confirmText: 'Réinitialiser',
      onConfirm: async () => {
        await storageService.resetToDemo();
        await loadData();
        handleResetFilters();
        addNotification('Données réinitialisées avec succès.', 'info');
      },
    });
  };

  // Fleet & Drivers Handlers
  const handleAddVehicle = async (vehData: Omit<Vehicle, 'id'>) => {
    const newVeh = await storageService.addVehicle(vehData);
    setVehicles((prev) => [newVeh, ...prev]);
    addNotification(`Véhicule ${newVeh.marque} ${newVeh.modele} (${newVeh.matricule}) ajouté.`, 'success');
  };

  const handleImportVehicles = async (newVehs: Omit<Vehicle, 'id'>[]) => {
    try {
      setIsLoading(true);
      await storageService.addVehicles(newVehs);
      const updated = await storageService.getVehicles();
      setVehicles(updated);
      addNotification(
        `${newVehs.length} véhicule${newVehs.length > 1 ? 's' : ''} importé${newVehs.length > 1 ? 's' : ''} avec succès dans le parc automobile.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de l'importation des véhicules.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    const updated = await storageService.updateVehicle(id, updates);
    setVehicles((prev) => prev.map((v) => (v.id === id ? updated : v)));
    addNotification('Statut du véhicule mis à jour.', 'info');
  };

  const handleDeleteVehicle = async (id: string) => {
    await storageService.deleteVehicle(id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    addNotification('Véhicule retiré de la flotte.', 'info');
  };

  const handleAddDriver = async (drvData: Omit<Driver, 'id'>) => {
    const newDrv = await storageService.addDriver(drvData);
    setDrivers((prev) => [...prev, newDrv]);
    addNotification(`Chauffeur ${newDrv.nom} ajouté avec succès.`, 'success');
  };

  const handleUpdateDriver = async (id: string, updates: Partial<Driver>) => {
    const updated = await storageService.updateDriver(id, updates);
    setDrivers((prev) => prev.map((d) => (d.id === id ? updated : d)));
    addNotification('Chauffeur mis à jour.', 'info');
  };

  const handleDeleteDriver = async (id: string) => {
    await storageService.deleteDriver(id);
    setDrivers((prev) => prev.filter((d) => d.id !== id));
    addNotification('Chauffeur supprimé.', 'info');
  };

  const handleClearAllData = async () => {
    try {
      setIsLoading(true);
      await storageService.clearAllData();
      setRentals([]);
      setVehicles([]);
      setDrivers([]);
      setHistory([]);
      setViewRental(null);
      setFormModal({ isOpen: false, mode: 'add', initialData: null });
      addNotification(
        "Toutes les données ont été supprimées avec succès. L'application est remise à neuf.",
        'success'
      );
    } catch (err) {
      console.error(err);
      addNotification("Erreur lors de la suppression des données.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const { returnsTodayCount, lateRentalsCount } = useMemo(() => ({
    returnsTodayCount: rentals.filter((r) => r.statut === "Retour aujourd'hui").length,
    lateRentalsCount: rentals.filter((r) => r.statut === 'En retard').length,
  }), [rentals]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-200 font-sans">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenAddModal={handleOpenAdd}
        rentalsCount={rentals.length}
        returnsTodayCount={returnsTodayCount}
        lateRentalsCount={lateRentalsCount}
        onFilterByStatus={handleNavigateToRentals}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Content Area */}
      <div className="app-shell-main transition-[padding] duration-200">
      <main className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
        {isLoading ? (
          <LoadingState label="Chargement de Janen_Car…" />
        ) : (
          <Suspense fallback={<div className="min-h-[240px] flex items-center justify-center text-sm font-semibold text-slate-500">Chargement de la vue...</div>}>
            {activeTab === 'dashboard' && (
              <DashboardView
                rentals={rentals}
                vehicles={vehicles}
                drivers={drivers}
                onOpenAddModal={handleOpenAdd}
                onOpenImportModal={() => setIsCsvModalOpen(true)}
                onExportCsv={handleExportCsv}
                onNavigateToRentals={handleNavigateFromDashboard}
                onViewRental={setViewRental}
                onClearAllData={handleClearAllData}
              />
            )}

            {activeTab === 'rentals' && (
              <RentalsView
                rentals={rentals}
                filters={filters}
                onFilterChange={handleFilterChange}
                onResetFilters={handleResetFilters}
                onOpenAddModal={handleOpenAdd}
                onOpenImportModal={() => setIsCsvModalOpen(true)}
                onExportCsv={handleExportCsv}
                onView={setViewRental}
                onEdit={handleOpenEdit}
                onDuplicate={handleOpenDuplicate}
                onDelete={handleDeleteRental}
                onOpenBlankContractEditor={handleOpenBlankContractEditor}
              />
            )}

            {activeTab === 'vehicles' && (
              <VehiclesView
                vehicles={vehicles}
                rentals={rentals}
                onAddVehicle={handleAddVehicle}
                onImportVehicles={handleImportVehicles}
                onUpdateVehicle={handleUpdateVehicle}
                onDeleteVehicle={handleDeleteVehicle}
                onNotify={addNotification}
                onRentVehicle={handleRentVehicle}
                onReserveVehicle={handleReserveVehicle}
                onViewRental={setViewRental}
                initialStatusFilter={vehicleFilter}
                onStatusFilterChange={setVehicleFilter}
              />
            )}

            {activeTab === 'drivers' && (
              <DriversView
                drivers={drivers}
                rentals={rentals}
                onAddDriver={handleAddDriver}
                onUpdateDriver={handleUpdateDriver}
                onDeleteDriver={handleDeleteDriver}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                rentals={rentals}
                vehicles={vehicles}
                history={history}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                onResetData={handleResetData}
                onExportCsv={handleExportCsv}
                onOpenImportModal={() => setIsCsvModalOpen(true)}
                theme={theme}
                onThemeChange={setTheme}
              />
            )}
          </Suspense>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <div className="max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-medium">
            🚗 <strong className="text-slate-800">Janen_Car</strong> — Gestion intelligente d'une agence de location de voitures
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Format Matricule : 1234 TUN 123</span>
            <span>•</span>
            <span>Sauvegarde Locale & Prêt Cloud</span>
          </div>
        </div>
      </footer>
      </div>

      <Suspense fallback={null}>
      {/* Modal Form (Add / Edit / Duplicate) */}
      {formModal.isOpen && <RentalFormModal
        isOpen={formModal.isOpen}
        mode={formModal.mode}
        initialData={formModal.initialData}
        onClose={() => setFormModal((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={handleFormSubmit}
        availableDrivers={drivers}
        availableVehicles={vehicles}
        existingRentals={rentals}
        onAddNewDriver={(name, phone) => {
          handleAddDriver({
            nom: name,
            telephone: phone,
            statut: 'Actif',
            totalLocations: 1,
          });
        }}
      />}

      {/* Detail Modal (Voir) */}
      {viewRental && <RentalDetailModal
        rental={viewRental}
        isOpen={!!viewRental}
        onClose={() => setViewRental(null)}
        onEdit={(r) => {
          setViewRental(null);
          handleOpenEdit(r);
        }}
        onOpenContractEditor={handleOpenContractEditor}
      />}

      {/* Contract Editor Modal */}
      {contractEditor.isOpen && contractEditor.rental && (
        <ContractEditorModal
          isOpen={contractEditor.isOpen}
          onClose={() => setContractEditor({ isOpen: false, rental: null })}
          rental={contractEditor.rental}
          onSave={handleSaveContractEditor}
          vehicles={vehicles}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* CSV Import Modal */}
      {isCsvModalOpen && <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportSuccess={handleImportCsvSuccess}
        existingRentals={rentals}
        vehicles={vehicles}
      />}

      </Suspense>

      {/* Floating Toasts */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}
