import React, { useMemo } from 'react';
import { Rental, Vehicle, Driver } from '../types';
import { StatisticsCards } from '../components/StatisticsCards';
import { StatusBadge } from '../components/StatusBadge';
import { TunisianPlateBadge } from '../components/TunisianPlateBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatDisplayDate } from '../utils/dateUtils';
import { exportDashboardPdf, exportReportsPdf, downloadBlankContractPdf } from '../services/pdfService';
import { EmptyState } from '../components/ui/EmptyState';
import {
  Plus, Download, FileDown, Upload, Clock, ArrowRight, TrendingUp,
  AlertTriangle, Car, KeyRound, Eye, Trash2, CalendarDays, MoreHorizontal,
} from 'lucide-react';

interface DashboardViewProps {
  rentals: Rental[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onExportCsv: () => void;
  onNavigateToRentals: (statusFilter?: string) => void;
  onViewRental: (rental: Rental) => void;
  onClearAllData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ rentals, vehicles, drivers, onOpenAddModal, onOpenImportModal, onExportCsv, onNavigateToRentals, onViewRental, onClearAllData }) => {
  const [isConfirmResetOpen, setIsConfirmResetOpen] = React.useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const metrics = useMemo(() => {
    const source = vehicles.length ? vehicles : rentals;
    return {
      total: source.length,
      available: source.filter((v) => v.statut === 'Disponible').length,
      rented: source.filter((v) => v.statut === 'Louée').length,
      reserved: source.filter((v) => v.statut === 'Réservée').length,
      maintenance: source.filter((v) => v.statut === 'En maintenance').length,
      returns: source.filter((v) => v.statut === "Retour aujourd'hui").length,
      late: source.filter((v) => v.statut === 'En retard').length,
    };
  }, [rentals, vehicles]);

  const todayEvents = useMemo(() => rentals.filter((r) => r.dateDepart === today || r.dateRetour === today || r.statut === "Retour aujourd'hui" || r.statut === 'En retard'), [rentals, today]);
  const attention = useMemo(() => rentals.filter((r) => r.statut === 'En retard'), [rentals]);
  const recentRentals = useMemo(() => [...rentals].sort((a, b) => (b.dateModification || '').localeCompare(a.dateModification || '')).slice(0, 5), [rentals]);

  return (
    <div className="space-y-6">
      <section className="ui-card overflow-hidden p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <p className="ui-eyebrow">Vue d’ensemble</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl dark:text-white">Bonjour, voici l’activité de Janen_Car</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Consultez les priorités du jour, l’état du parc et les actions qui nécessitent votre attention.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <details className="relative">
              <summary className="ui-btn-secondary list-none"><MoreHorizontal className="h-4 w-4" />Plus d’actions</summary>
              <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <button onClick={downloadBlankContractPdf} className="ui-menu-action"><FileDown className="h-4 w-4" />Télécharger un contrat vierge</button>
                <button onClick={() => exportDashboardPdf(rentals, vehicles, drivers)} className="ui-menu-action"><FileDown className="h-4 w-4" />Exporter le tableau de bord PDF</button>
                <button onClick={() => exportReportsPdf(rentals, vehicles)} className="ui-menu-action"><TrendingUp className="h-4 w-4" />Exporter le rapport flotte</button>
                <button onClick={onExportCsv} className="ui-menu-action"><Download className="h-4 w-4" />Exporter les données CSV</button>
                <button onClick={onOpenImportModal} className="ui-menu-action"><Upload className="h-4 w-4" />Importer un fichier CSV</button>
              </div>
            </details>
            <button onClick={onOpenAddModal} className="ui-btn-primary"><Plus className="h-4 w-4" />Nouvelle location</button>
          </div>
        </div>
      </section>

      {attention.length > 0 && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/70 dark:bg-rose-950/30" aria-labelledby="attention-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3"><span className="rounded-xl bg-rose-100 p-2 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"><AlertTriangle className="h-5 w-5" /></span><div><h2 id="attention-title" className="font-bold text-rose-950 dark:text-rose-100">Attention requise</h2><p className="text-sm text-rose-700 dark:text-rose-300">{attention.length} location{attention.length > 1 ? 's' : ''} en retard. Vérifiez le retour et contactez le client si nécessaire.</p></div></div>
            <button onClick={() => onNavigateToRentals('En retard')} className="ui-btn-secondary border-rose-200 text-rose-700 dark:border-rose-800 dark:text-rose-200">Voir les retards <ArrowRight className="h-4 w-4" /></button>
          </div>
        </section>
      )}

      <section aria-labelledby="kpi-title">
        <div className="mb-3 flex items-center justify-between"><div><h2 id="kpi-title" className="text-base font-bold text-slate-950 dark:text-white">Situation du parc</h2><p className="text-xs text-slate-500">Cliquez sur un indicateur pour afficher les éléments concernés.</p></div></div>
        <StatisticsCards totalVehicles={metrics.total} availableCount={metrics.available} rentedCount={metrics.rented} reservedCount={metrics.reserved} maintenanceCount={metrics.maintenance} returnsTodayCount={metrics.returns} lateCount={metrics.late} onFilterByStatus={onNavigateToRentals} />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="ui-card p-5 xl:col-span-5" aria-labelledby="today-title">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800"><div className="flex items-center gap-3"><span className="ui-icon-box"><CalendarDays className="h-5 w-5" /></span><div><h2 id="today-title" className="font-bold text-slate-950 dark:text-white">Aujourd’hui</h2><p className="text-xs text-slate-500">Départs, retours et urgences du jour</p></div></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{todayEvents.length}</span></div>
          {todayEvents.length === 0 ? <EmptyState icon={Clock} title="Rien d’urgent aujourd’hui" description="Aucun départ, retour ou retard n’est signalé pour aujourd’hui." /> : <div className="space-y-2">{todayEvents.slice(0, 7).map((r) => <button key={r.id} onClick={() => onViewRental(r)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-blue-950/20"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-bold text-slate-900 dark:text-white">{r.marque} {r.modele}</span><TunisianPlateBadge matricule={r.matricule} size="sm" /></div><p className="mt-1 truncate text-xs text-slate-500">{r.chauffeur || 'Client non renseigné'} · Retour {formatDisplayDate(r.dateRetour)}</p></div><StatusBadge statut={r.statut} size="sm" /></button>)}</div>}
        </section>

        <section className="ui-card p-5 xl:col-span-7" aria-labelledby="recent-title">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800"><div className="flex items-center gap-3"><span className="ui-icon-box"><KeyRound className="h-5 w-5" /></span><div><h2 id="recent-title" className="font-bold text-slate-950 dark:text-white">Activité récente</h2><p className="text-xs text-slate-500">Les dernières locations enregistrées</p></div></div><button onClick={() => onNavigateToRentals()} className="text-xs font-bold text-blue-600 hover:text-blue-700">Voir toutes</button></div>
          {recentRentals.length === 0 ? <EmptyState icon={Car} title="Aucune location enregistrée" description="Commencez par créer votre première location pour voir l’activité ici." action={<button onClick={onOpenAddModal} className="ui-btn-primary"><Plus className="h-4 w-4" />Nouvelle location</button>} /> : <div className="divide-y divide-slate-100 dark:divide-slate-800">{recentRentals.map((r) => <div key={r.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-slate-900 dark:text-white">#{r.numero} · {r.marque} {r.modele}</span><StatusBadge statut={r.statut} size="sm" /></div><p className="mt-1 truncate text-xs text-slate-500">{r.chauffeur || 'Client non renseigné'} · {formatDisplayDate(r.dateDepart)} → {formatDisplayDate(r.dateRetour)}</p></div><button onClick={() => onViewRental(r)} className="ui-icon-button" aria-label={`Voir la location ${r.numero}`} title="Voir la location"><Eye className="h-4 w-4" /></button></div>)}</div>}
        </section>
      </div>

      <section className="ui-card flex flex-col gap-3 border-rose-100 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-rose-950"><div><p className="text-sm font-semibold text-slate-900 dark:text-white">Zone sensible</p><p className="text-xs text-slate-500">La suppression complète est réservée aux remises à zéro de l’application.</p></div><button onClick={() => setIsConfirmResetOpen(true)} className="inline-flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700"><Trash2 className="h-4 w-4" />Supprimer toutes les données</button></section>

      <ConfirmDialog isOpen={isConfirmResetOpen} onClose={() => setIsConfirmResetOpen(false)} onConfirm={onClearAllData} title="Supprimer toutes les données ?" message="Toutes les voitures, locations, réservations et l’historique seront supprimés définitivement. Cette opération est irréversible." confirmText="Supprimer définitivement" cancelText="Annuler" isDangerous />
    </div>
  );
};
