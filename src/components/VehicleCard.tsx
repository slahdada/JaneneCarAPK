import React, { useState, useMemo } from 'react';
import { Vehicle, Rental, RentalStatus } from '../types';
import { TunisianPlateBadge } from './TunisianPlateBadge';
import { StatusBadge } from './StatusBadge';
import { normalizeMatricule } from '../utils/conflictUtils';
import { parseDate, formatDisplayDate } from '../utils/dateUtils';
import { PhoneCallButton } from './PhoneCallButton';
import { WhatsAppButton } from './WhatsAppButton';
import {
  Fuel,
  Calendar,
  CalendarDays,
  History,
  ChevronDown,
  ChevronUp,
  KeyRound,
  CalendarCheck,
  Trash2,
  Phone,
  User,
  ExternalLink,
  DollarSign,
  Clock,
  AlertTriangle,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';

export interface VehicleCardProps {
  vehicle: Vehicle;
  rentals?: Rental[];
  onUpdateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  onDeleteVehicle: (id: string) => void;
  onRentVehicle?: (vehicle: Vehicle) => void;
  onReserveVehicle?: (vehicle: Vehicle) => void;
  onViewRental?: (rental: Rental) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  rentals = [],
  onUpdateVehicle,
  onDeleteVehicle,
  onRentVehicle,
  onReserveVehicle,
  onViewRental,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Normalisation du matricule pour trouver toutes les locations associées à ce véhicule
  const vehicleRentals = useMemo(() => {
    const normMat = normalizeMatricule(vehicle.matricule);
    if (!normMat) return [];
    return rentals.filter((r) => normalizeMatricule(r.matricule) === normMat);
  }, [rentals, vehicle.matricule]);

  // Découpage temporel : Location active en cours, Prochaines réservations, Locations passées
  const { activeRental, upcomingReservations, pastRentals, totalDays, totalRevenue } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let active: Rental | null = null;
    const upcoming: Rental[] = [];
    const past: Rental[] = [];
    let daysSum = 0;
    let revSum = 0;

    vehicleRentals.forEach((r) => {
      const start = parseDate(r.dateDepart);
      const end = parseDate(r.dateRetour);

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(0, 0, 0, 0);

      // Calcul financier et jours
      const rentalDays = r.nombreJours || 1;
      const rentalAmount =
        r.montantTotal ??
        (r.prixParJour || vehicle.prixParJour || 0) * rentalDays;

      daysSum += rentalDays;
      revSum += rentalAmount;

      // Location active en cours (statuts en circulation ou date du jour incluse)
      const isCurrentlyActive =
        r.statut === 'Louée' ||
        r.statut === "Retour aujourd'hui" ||
        r.statut === 'En retard';

      if (isCurrentlyActive && !active) {
        active = r;
      } else if (r.statut === 'Réservée' || (start && start.getTime() > today.getTime())) {
        // Prochaine réservation future
        upcoming.push(r);
      } else {
        // Location passée terminée
        past.push(r);
      }
    });

    // Tri des prochaines réservations chronologiquement (les plus proches d'abord)
    upcoming.sort((a, b) => {
      const dateA = parseDate(a.dateDepart)?.getTime() || 0;
      const dateB = parseDate(b.dateDepart)?.getTime() || 0;
      return dateA - dateB;
    });

    // Tri de l'historique passé du plus récent au plus ancien
    past.sort((a, b) => {
      const dateA = parseDate(a.dateRetour)?.getTime() || 0;
      const dateB = parseDate(b.dateRetour)?.getTime() || 0;
      return dateB - dateA;
    });

    return {
      activeRental: active,
      upcomingReservations: upcoming,
      pastRentals: past,
      totalDays: daysSum,
      totalRevenue: revSum,
    };
  }, [vehicleRentals, vehicle.prixParJour]);

  // Prochaine réservation immédiate (pour le badge résumé de la carte)
  const nextReservation = upcomingReservations.length > 0 ? upcomingReservations[0] : null;

  return (
    <div
      id={`vehicle-card-${vehicle.id}`}
      className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
        isExpanded
          ? 'border-blue-300 ring-2 ring-blue-500/15 shadow-md col-span-1 md:col-span-2 lg:col-span-2'
          : 'border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300'
      }`}
    >
      {/* Contenu principal de la carte */}
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Entête du véhicule : Marque, Modèle, Statut & Plaque */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {vehicle.marque}
            </span>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight leading-snug">
              {vehicle.modele}
            </h3>
          </div>
          <StatusBadge statut={vehicle.statut} size="sm" />
        </div>

        {/* Plaque d'immatriculation & Prix par jour */}
        <div className="flex items-center justify-between gap-2">
          <TunisianPlateBadge matricule={vehicle.matricule} size="sm" />
          {vehicle.prixParJour ? (
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
              {vehicle.prixParJour} TND <span className="text-[10px] font-medium text-emerald-600">/ j</span>
            </span>
          ) : (
            <span className="text-xs text-slate-400 italic">Tarif non défini</span>
          )}
        </div>

        {/* Caractéristiques techniques */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5" title="Carburant">
            <Fuel className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{vehicle.carburant || 'Essence'}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Année de fabrication">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{vehicle.annee || 2023}</span>
          </div>
        </div>

        {/* Aperçu rapide : Location active en cours (si le véhicule est loué) */}
        {activeRental && (
          <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-900 space-y-1.5">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                En cours de location
              </span>
              <StatusBadge statut={activeRental.statut} size="sm" showIcon={false} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-blue-800">
              <span className="font-semibold">{activeRental.chauffeur}</span>
              <span>Retour : {formatDisplayDate(activeRental.dateRetour)}</span>
            </div>
            {activeRental.telephone && (
              <div className="flex items-center justify-between pt-0.5 border-t border-blue-200/60">
                <span className="font-mono text-[11px] text-blue-700">{activeRental.telephone}</span>
                <div className="flex items-center gap-1">
                  <PhoneCallButton
                    phone={activeRental.telephone}
                    chauffeurName={activeRental.chauffeur}
                    variant="pill"
                    label="Appeler"
                  />
                  <WhatsAppButton
                    phone={activeRental.telephone}
                    chauffeurName={activeRental.chauffeur}
                    matricule={activeRental.matricule}
                    variant="pill"
                    label="WhatsApp"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Indicateurs rapides de synthèse : Prochaine résa & Historique */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div
            className={`p-2 rounded-xl border flex flex-col justify-between ${
              nextReservation
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider">
              <CalendarDays className="w-3 h-3 shrink-0" />
              <span>Prochaine résa</span>
            </div>
            <p className="font-bold truncate mt-0.5">
              {nextReservation
                ? `${formatDisplayDate(nextReservation.dateDepart)}`
                : 'Aucune prévue'}
            </p>
            {nextReservation && (
              <p className="text-[10px] text-amber-700 truncate">{nextReservation.chauffeur}</p>
            )}
          </div>

          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex flex-col justify-between">
            <div className="flex items-center gap-1 font-semibold text-[10px] uppercase tracking-wider text-slate-500">
              <History className="w-3 h-3 shrink-0" />
              <span>Historique</span>
            </div>
            <p className="font-bold truncate mt-0.5">
              {pastRentals.length} location{pastRentals.length > 1 ? 's' : ''} passée{pastRentals.length > 1 ? 's' : ''}
            </p>
            <p className="text-[10px] text-slate-500">{totalDays} jours loués au total</p>
          </div>
        </div>

        {/* Bouton pour afficher/masquer la vue détaillée directement dans la carte */}
        <button
          id={`btn-toggle-details-${vehicle.id}`}
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all border ${
            isExpanded
              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <History className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              {isExpanded ? 'Masquer la vue détaillée' : 'Vue détaillée & Historique complet'}
            </span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-blue-100 text-blue-800 font-extrabold">
              {vehicleRentals.length}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {/* VUE DÉTAILLÉE INTÉGRÉE DANS LE COMPOSANT CARTE */}
        {isExpanded && (
          <div
            id={`vehicle-details-panel-${vehicle.id}`}
            className="pt-2 border-t border-slate-200 space-y-3.5 animate-in fade-in duration-200"
          >
            {/* 1. Tableau de bord statistiques du véhicule */}
            <div className="grid grid-cols-3 gap-2 bg-gradient-to-r from-blue-50 to-indigo-50/60 p-2.5 rounded-xl border border-blue-100 text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Locations</p>
                <p className="text-sm font-black text-blue-900">{vehicleRentals.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Jours cumulés</p>
                <p className="text-sm font-black text-indigo-900">{totalDays} j</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Revenus générés</p>
                <p className="text-sm font-black text-emerald-700">
                  {totalRevenue.toLocaleString()} <span className="text-[10px] font-bold">TND</span>
                </p>
              </div>
            </div>

            {/* 2. Navigation par onglets internes à la carte */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'upcoming'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Réservations prochaines</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'upcoming'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {upcomingReservations.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('past')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'past'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Historique passé</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'past'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {pastRentals.length}
                </span>
              </button>
            </div>

            {/* 3. Contenu de l'onglet actif */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {activeTab === 'upcoming' ? (
                /* Liste des réservations prochaines */
                upcomingReservations.length > 0 ? (
                  upcomingReservations.map((rental) => (
                    <div
                      key={rental.id}
                      className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl text-xs space-y-2 hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <CalendarDays className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            Du {formatDisplayDate(rental.dateDepart)} au{' '}
                            {formatDisplayDate(rental.dateRetour)}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                          {rental.nombreJours} jour{rental.nombreJours > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700 pt-1 border-t border-amber-200/60">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{rental.chauffeur}</span>
                        </div>
                        {rental.telephone && (
                          <a
                            href={`tel:${rental.telephone}`}
                            className="flex items-center gap-1 text-blue-600 hover:underline font-mono"
                            title="Appeler le client"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{rental.telephone}</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="font-bold text-emerald-700">
                          Total : {rental.montantTotal || (rental.prixParJour || 0) * rental.nombreJours} TND
                        </span>
                        {onViewRental && (
                          <button
                            type="button"
                            onClick={() => onViewRental(rental)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                          >
                            <span>Voir contrat</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 space-y-2">
                    <CalendarDays className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold">Aucune réservation future programmée</p>
                    <p className="text-[11px] text-slate-400">
                      Ce véhicule est disponible pour de futurs clients.
                    </p>
                    {onReserveVehicle ? (
                      <button
                        type="button"
                        onClick={() => onReserveVehicle(vehicle)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-2xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Créer une réservation</span>
                      </button>
                    ) : onRentVehicle ? (
                      <button
                        type="button"
                        onClick={() => onRentVehicle(vehicle)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Créer une réservation</span>
                      </button>
                    ) : null}
                  </div>
                )
              ) : (
                /* Historique complet des locations passées */
                pastRentals.length > 0 ? (
                  pastRentals.map((rental) => (
                    <div
                      key={rental.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-1.5 hover:border-slate-300 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Du {formatDisplayDate(rental.dateDepart)} au{' '}
                            {formatDisplayDate(rental.dateRetour)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {rental.nombreJours} j
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1 font-semibold text-slate-700">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{rental.chauffeur}</span>
                        </div>
                        {rental.telephone && (
                          <span className="font-mono text-[10px] text-slate-500">
                            {rental.telephone}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                        <span className="font-bold text-emerald-700">
                          {rental.montantTotal || (rental.prixParJour || 0) * rental.nombreJours} TND
                        </span>
                        {onViewRental && (
                          <button
                            type="button"
                            onClick={() => onViewRental(rental)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                          >
                            <span>Détails</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 space-y-1">
                    <History className="w-6 h-6 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold">Aucune location passée enregistrée</p>
                    <p className="text-[11px] text-slate-400">
                      Les futurs contrats archivés de ce véhicule s'afficheront ici.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Barre d'action inférieure : Sélecteur de statut, Louer & Supprimer */}
      <div className="p-3 bg-slate-50/80 border-t border-slate-100 rounded-b-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Sélecteur de statut du véhicule */}
        <select
          id={`select-status-${vehicle.id}`}
          value={vehicle.statut}
          onChange={(e) => onUpdateVehicle(vehicle.id, { statut: e.target.value as RentalStatus })}
          className="text-[11px] font-semibold py-1.5 px-2.5 border border-slate-300 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-0 shrink"
        >
          <option value="Disponible">Disponible</option>
          <option value="Louée">Louée</option>
          <option value="Réservée">Réservée</option>
          <option value="En maintenance">En maintenance</option>
          <option value="Retour aujourd'hui">Retour aujourd'hui</option>
          <option value="En retard">En retard</option>
        </select>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Bouton Réserver ce véhicule */}
          {vehicle.statut !== 'En maintenance' ? (
            <button
              id={`btn-reserve-vehicle-${vehicle.id}`}
              type="button"
              onClick={() => onReserveVehicle && onReserveVehicle(vehicle)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-300 rounded-xl shadow-2xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
              title={`Réserver ce véhicule (${vehicle.marque} ${vehicle.modele})`}
            >
              <CalendarCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>Réserve</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-100 rounded-xl cursor-not-allowed opacity-60 border border-slate-200"
              title="Véhicule en maintenance — réservation impossible"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Réserve</span>
            </button>
          )}

          {/* Bouton Louer ce véhicule */}
          {vehicle.statut === 'Disponible' ? (
            <button
              id={`btn-rent-vehicle-${vehicle.id}`}
              type="button"
              onClick={() => onRentVehicle && onRentVehicle(vehicle)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs shadow-blue-500/20 transition-all hover:scale-102 active:scale-98 cursor-pointer"
              title={`Louer ce véhicule (${vehicle.marque} ${vehicle.modele})`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Louer</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-100 rounded-xl cursor-not-allowed opacity-60 border border-slate-200"
              title={`Véhicule ${vehicle.statut.toLowerCase()} — indisponible`}
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Louer</span>
            </button>
          )}

          {/* Bouton Supprimer le véhicule avec confirmation */}
          {isDeleting ? (
            <div className="inline-flex items-center gap-1 animate-in fade-in">
              <button
                type="button"
                onClick={() => onDeleteVehicle(vehicle.id)}
                className="px-2 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                title="Confirmer la suppression"
              >
                Oui
              </button>
              <button
                type="button"
                onClick={() => setIsDeleting(false)}
                className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg"
              >
                Non
              </button>
            </div>
          ) : (
            <button
              id={`btn-delete-vehicle-${vehicle.id}`}
              type="button"
              onClick={() => setIsDeleting(true)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Supprimer ce véhicule"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
