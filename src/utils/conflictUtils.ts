import { Rental, Vehicle, RentalStatus } from '../types';
import { parseDate, formatDisplayDate } from './dateUtils';

export interface RentalConflict {
  hasConflict: boolean;
  conflictType?: 'already_rented' | 'already_reserved' | 'in_maintenance' | 'overlapping_period';
  conflictingRental?: Rental;
  conflictingVehicle?: Vehicle;
  message?: string;
}

/**
 * Normalise un matricule tunisien pour la comparaison
 * ex: "1234 TUN 123" -> "1234TUN123"
 */
export function normalizeMatricule(matricule: string): string {
  if (!matricule) return '';
  return matricule.replace(/\s+/g, '').toUpperCase();
}

/**
 * Vérifie si deux plages de dates se chevauchent de manière inclusive
 */
export function doDateRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  if (!startA || !endA || !startB || !endB) return true; // En cas de doute, considérer un conflit potentiel

  const sA = parseDate(startA);
  const eA = parseDate(endA);
  const sB = parseDate(startB);
  const eB = parseDate(endB);

  if (!sA || !eA || !sB || !eB) return true;

  sA.setHours(0, 0, 0, 0);
  eA.setHours(0, 0, 0, 0);
  sB.setHours(0, 0, 0, 0);
  eB.setHours(0, 0, 0, 0);

  // Deux intervalles [sA, eA] et [sB, eB] se chevauchent si sA <= eB et eA >= sB
  return sA <= eB && eA >= sB;
}

/**
 * Statuts qui bloquent la disponibilité d'une voiture
 */
export const OCCUPIED_STATUSES: RentalStatus[] = [
  'Louée',
  'Réservée',
  'Retour aujourd\'hui',
  'En retard',
];

/**
 * Vérifie si un véhicule est déjà loué ou réservé sur la période demandée.
 * Renvoie des détails précis sur le conflit éventuel.
 */
export function checkRentalConflict(params: {
  matricule: string;
  dateDepart: string;
  dateRetour: string;
  statut: RentalStatus;
  excludeRentalId?: string;
  rentals: Rental[];
  vehicles?: Vehicle[];
}): RentalConflict {
  const { matricule, dateDepart, dateRetour, statut, excludeRentalId, rentals, vehicles } = params;

  const normMatricule = normalizeMatricule(matricule);
  if (!normMatricule) {
    return { hasConflict: false };
  }

  // 1. Si le véhicule est marqué 'En maintenance' dans la flotte
  if (vehicles && vehicles.length > 0) {
    const matchedVehicle = vehicles.find(
      (v) => normalizeMatricule(v.matricule) === normMatricule
    );
    if (matchedVehicle && matchedVehicle.statut === 'En maintenance') {
      return {
        hasConflict: true,
        conflictType: 'in_maintenance',
        conflictingVehicle: matchedVehicle,
        message: `Le véhicule ${matchedVehicle.marque} ${matchedVehicle.modele} (${matchedVehicle.matricule}) est actuellement en maintenance. Il ne peut pas être loué ou réservé.`,
      };
    }
  }

  // 2. Si le statut créé ou modifié est 'Disponible', il n'occupe pas le véhicule,
  // MAIS si le véhicule est DÉJÀ loué/réservé sur cette période par quelqu'un d'autre,
  // la réservation en question ne peut pas être dupliquée ou écrasée.
  const isRequestOccupying = OCCUPIED_STATUSES.includes(statut);

  // Vérification des locations existantes pour le même matricule
  for (const r of rentals) {
    // Ignorer la location en cours de modification
    if (excludeRentalId && r.id === excludeRentalId) {
      continue;
    }

    if (normalizeMatricule(r.matricule) !== normMatricule) {
      continue;
    }

    // Si la location existante occupe le véhicule
    if (OCCUPIED_STATUSES.includes(r.statut)) {
      // Vérifier le chevauchement des dates
      const overlaps = doDateRangesOverlap(dateDepart, dateRetour, r.dateDepart, r.dateRetour);

      if (overlaps) {
        const periodStr = `du ${formatDisplayDate(r.dateDepart)} au ${formatDisplayDate(r.dateRetour)}`;
        let statusLabel = 'loué';
        let conflictType: RentalConflict['conflictType'] = 'already_rented';

        if (r.statut === 'Réservée') {
          statusLabel = 'réservé';
          conflictType = 'already_reserved';
        } else if (r.statut === 'En retard') {
          statusLabel = 'en retard de retour';
          conflictType = 'already_rented';
        } else if (r.statut === "Retour aujourd'hui") {
          statusLabel = 'en cours de retour';
          conflictType = 'already_rented';
        }

        return {
          hasConflict: true,
          conflictType,
          conflictingRental: r,
          message: `Ce véhicule est déjà ${statusLabel} ${periodStr} (Location N°${r.numero} - Chauffeur: ${r.chauffeur}). Impossible d'effectuer une double réservation.`,
        };
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Calcule la disponibilité d'un véhicule spécifique de la flotte
 */
export function getVehicleAvailability(
  vehicle: Vehicle,
  rentals: Rental[],
  dateDepart?: string,
  dateRetour?: string,
  excludeRentalId?: string
): {
  isAvailable: boolean;
  statusBadge: RentalStatus;
  conflictMessage?: string;
  activeRental?: Rental;
} {
  const normMatricule = normalizeMatricule(vehicle.matricule);

  if (vehicle.statut === 'En maintenance') {
    return {
      isAvailable: false,
      statusBadge: 'En maintenance',
      conflictMessage: 'Véhicule en atelier de maintenance',
    };
  }

  // Chercher des locations actives en conflit
  for (const r of rentals) {
    if (excludeRentalId && r.id === excludeRentalId) continue;
    if (normalizeMatricule(r.matricule) !== normMatricule) continue;

    if (OCCUPIED_STATUSES.includes(r.statut)) {
      if (dateDepart && dateRetour) {
        if (doDateRangesOverlap(dateDepart, dateRetour, r.dateDepart, r.dateRetour)) {
          return {
            isAvailable: false,
            statusBadge: r.statut,
            conflictMessage: `Déjà ${r.statut.toLowerCase()} (${formatDisplayDate(r.dateDepart)} - ${formatDisplayDate(r.dateRetour)})`,
            activeRental: r,
          };
        }
      } else {
        return {
          isAvailable: false,
          statusBadge: r.statut,
          conflictMessage: `Actuellement ${r.statut.toLowerCase()} par ${r.chauffeur}`,
          activeRental: r,
        };
      }
    }
  }

  return {
    isAvailable: true,
    statusBadge: 'Disponible',
  };
}
