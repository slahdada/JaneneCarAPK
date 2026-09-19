import React, { useState } from 'react';
import { Rental, Vehicle, RentalHistoryItem } from '../types';
import { exportReportsPdf } from '../services/pdfService';
import { exportRentalsToCsv, exportHistoryToCsv } from '../services/csvService';
import { PageHeader } from '../components/ui/PageHeader';
import {
  BarChart3,
  History,
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  CheckCircle2,
  Clock,
  Car,
  Layers,
  Receipt,
  Info,
  FileDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { formatDisplayDate } from '../utils/dateUtils';

interface ReportsViewProps {
  rentals: Rental[];
  vehicles: Vehicle[];
  history: RentalHistoryItem[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  rentals,
  vehicles,
  history,
}) => {
  const [revenueFilter, setRevenueFilter] = useState<'active' | 'all'>('active');
  const [showRevenueBreakdown, setShowRevenueBreakdown] = useState(true);

  const totalVehiclesCount = vehicles.length > 0 ? vehicles.length : rentals.length;
  
  const rentedCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === 'Louée').length
    : rentals.filter((r) => r.statut === 'Louée').length;

  const reservedCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === 'Réservée').length
    : rentals.filter((r) => r.statut === 'Réservée').length;

  const availableCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === 'Disponible').length
    : rentals.filter((r) => r.statut === 'Disponible').length;

  const maintenanceCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === 'En maintenance').length
    : rentals.filter((r) => r.statut === 'En maintenance').length;

  const returnsTodayCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === "Retour aujourd'hui").length
    : rentals.filter((r) => r.statut === "Retour aujourd'hui").length;

  const lateCount = vehicles.length > 0
    ? vehicles.filter((v) => v.statut === 'En retard').length
    : rentals.filter((r) => r.statut === 'En retard').length;

  const occupiedCount = rentedCount + reservedCount + returnsTodayCount + lateCount;
  const occupancyRate = totalVehiclesCount > 0
    ? Math.round((occupiedCount / totalVehiclesCount) * 100)
    : 0;

  // Calcul fiable du montant d'un contrat sans conversion indésirable de 0
  const getRentalAmount = (r: Rental): number => {
    if (typeof r.montantTotal === 'number' && !isNaN(r.montantTotal)) {
      return r.montantTotal;
    }
    if (typeof r.prixParJour === 'number' && !isNaN(r.prixParJour) && r.prixParJour > 0) {
      return r.nombreJours * r.prixParJour;
    }
    return 0;
  };

  const isContractActive = (statut: string) =>
    statut === 'Louée' ||
    statut === 'Réservée' ||
    statut === "Retour aujourd'hui" ||
    statut === 'En retard';

  // Les contrats actifs (un véhicule en stock 'Disponible' ne doit pas gonfler le chiffre d'affaires)
  const activeRentals = rentals.filter((r) => isContractActive(r.statut));

  const displayedRentalsForRevenue =
    revenueFilter === 'active' ? activeRentals : rentals;

  const totalEstimatedRevenue = displayedRentalsForRevenue.reduce((acc, r) => {
    return acc + getRentalAmount(r);
  }, 0);

  const averageDuration = rentals.length > 0
    ? (rentals.reduce((acc, r) => acc + r.nombreJours, 0) / rentals.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        eyebrow="Suivi"
        title="Rapports & historique"
        description="Analysez l’occupation de la flotte, les revenus estimés et les événements enregistrés dans le journal d’activité."
        secondaryActions={
          <details className="relative">
            <summary className="ui-btn-secondary list-none"><FileDown className="h-4 w-4" />Exporter</summary>
            <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <button onClick={() => exportRentalsToCsv(rentals)} className="ui-menu-action"><FileDown className="h-4 w-4" />Locations en CSV</button>
              <button onClick={() => exportHistoryToCsv(history)} className="ui-menu-action"><FileDown className="h-4 w-4" />Historique en CSV</button>
              <button onClick={() => exportReportsPdf(rentals, vehicles)} className="ui-menu-action"><FileDown className="h-4 w-4" />Enregistrer PDF</button>
            </div>
          </details>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Taux d'occupation flotte</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-blue-600 font-outfit">
            {occupancyRate}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {rentedCount + reservedCount} véhicules engagés sur {totalVehiclesCount}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Chiffre d'affaires {revenueFilter === 'active' ? 'actif' : 'global'}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 font-mono">
            {totalEstimatedRevenue.toLocaleString()} <span className="text-base">TND</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {revenueFilter === 'active'
              ? 'Contrats engagés (Loués, Réservés, Retards)'
              : 'Toutes les entrées (y compris stock)'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Durée moyenne de location</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-outfit">
            {averageDuration} <span className="text-base font-medium">jours</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Moyenne sur l'ensemble des contrats
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Disponibilité immédiate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-outfit">
            {availableCount} <span className="text-base font-medium text-slate-500">véhicules</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Prêts à louer sans délai
          </p>
        </div>
      </div>

      {/* Audit financier détaillé / Décomposition du chiffre d'affaires */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Décomposition du chiffre d'affaires par contrat
              </h3>
              <p className="text-xs text-slate-500">
                Audit ligne par ligne pour vérifier l'exactitude de chaque montant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRevenueFilter('active')}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  revenueFilter === 'active'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Contrats actifs ({activeRentals.length})
              </button>
              <button
                type="button"
                onClick={() => setRevenueFilter('all')}
                className={`px-2.5 py-1.5 rounded-md transition-all ${
                  revenueFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous ({rentals.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowRevenueBreakdown(!showRevenueBreakdown)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title={showRevenueBreakdown ? 'Masquer le tableau' : 'Afficher le tableau'}
            >
              {showRevenueBreakdown ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {showRevenueBreakdown && (
          <>
            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-[11px] leading-relaxed">
                <p>
                  <strong>Vérification des montants :</strong> Le total affiché correspond strictement à la somme des montants enregistrés pour chaque contrat listé ci-dessous.
                </p>
                <p className="text-blue-800">
                  Si vous constatez un écart (par exemple 453 TND au lieu de 450 TND), examinez la colonne <strong>Montant comptabilisé</strong> ci-dessous pour identifier immédiatement la ligne responsable (par exemple un contrat test ou un tarif ajusté à 3 TND ou 1 TND/j).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">N°</th>
                    <th className="py-2.5 px-3">Véhicule</th>
                    <th className="py-2.5 px-3">Chauffeur</th>
                    <th className="py-2.5 px-3">Statut</th>
                    <th className="py-2.5 px-3">Période</th>
                    <th className="py-2.5 px-3 text-center">Durée</th>
                    <th className="py-2.5 px-3 text-right">Tarif / j</th>
                    <th className="py-2.5 px-3 text-right">Montant comptabilisé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedRentalsForRevenue.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        Aucun contrat trouvé dans cette catégorie.
                      </td>
                    </tr>
                  ) : (
                    displayedRentalsForRevenue.map((rental) => {
                      const amount = getRentalAmount(rental);
                      return (
                        <tr
                          key={rental.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">
                            #{rental.numero}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-900">
                              {rental.marque} {rental.modele}
                            </span>
                            <span className="block font-mono text-[11px] text-slate-500">
                              {rental.matricule}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-800">
                            {rental.chauffeur || '—'}
                          </td>
                          <td className="py-2.5 px-3">
                            <StatusBadge statut={rental.statut} size="sm" />
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px] font-mono">
                            {formatDisplayDate(rental.dateDepart)} → {formatDisplayDate(rental.dateRetour)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold">
                            {rental.nombreJours} j
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                            {rental.prixParJour !== undefined && rental.prixParJour !== null
                              ? `${rental.prixParJour} TND`
                              : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            {amount > 0 ? (
                              <span className="text-emerald-700">
                                {amount.toLocaleString()} TND
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">
                                0 TND
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900">
                    <td colSpan={7} className="py-3 px-3 text-right uppercase tracking-wider text-xs">
                      Total Chiffre d'Affaires :
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-base text-emerald-800 font-black">
                      {totalEstimatedRevenue.toLocaleString()} TND
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Fleet breakdown & Status distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PieChart className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Répartition des statuts de la flotte
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Loués ({rentedCount})</span>
                <span>{totalVehiclesCount ? Math.round((rentedCount / totalVehiclesCount) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all"
                  style={{ width: `${totalVehiclesCount ? (rentedCount / totalVehiclesCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Disponibles ({availableCount})</span>
                <span>{totalVehiclesCount ? Math.round((availableCount / totalVehiclesCount) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${totalVehiclesCount ? (availableCount / totalVehiclesCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Réservés ({reservedCount})</span>
                <span>{totalVehiclesCount ? Math.round((reservedCount / totalVehiclesCount) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${totalVehiclesCount ? (reservedCount / totalVehiclesCount) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>En maintenance ({maintenanceCount})</span>
                <span>{totalVehiclesCount ? Math.round((maintenanceCount / totalVehiclesCount) * 100) : 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-400 rounded-full transition-all"
                  style={{ width: `${totalVehiclesCount ? (maintenanceCount / totalVehiclesCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Audit History Log (Section 32) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Journal d'historique des opérations
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Derniers événements
            </span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                Aucun historique enregistré pour l'instant.
              </p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      {item.titre}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.date).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{item.details}</p>
                  {(item.matricule || item.chauffeur) && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium pt-0.5">
                      {item.matricule && <span>Matricule: {item.matricule}</span>}
                      {item.chauffeur && <span>• Chauffeur: {item.chauffeur}</span>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
