import type { Rental, RentalStatus, Vehicle } from '../types';
import { normalizeMatricule } from './conflictUtils';
import { getTodayDateString, parseDate } from './dateUtils';

const DEFAULT_RENTAL_DAYS = 3;

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function vehicleRentalData(
  vehicle: Vehicle,
  dateDepart: string,
  dateRetour: string,
  statut: RentalStatus,
): Rental {
  return {
    id: '',
    numero: 0,
    marque: vehicle.marque,
    modele: vehicle.modele,
    matricule: vehicle.matricule,
    chauffeur: '',
    telephone: '',
    dateDepart,
    dateRetour,
    nombreJours: DEFAULT_RENTAL_DAYS,
    statut,
    prixParJour: vehicle.prixParJour,
    montantTotal: (vehicle.prixParJour || 0) * DEFAULT_RENTAL_DAYS,
    notes: '',
    // Valeurs par défaut pour les nouveaux contrats/fiches.
    // Les fiches existantes ne passent pas par cette initialisation.
    lieuNaissance: 'Tunis',
    nationalite: 'Tunisienne',
    cinLieu: 'Tunis',
    permisLieu: 'Tunis',
    dateCreation: '',
    dateModification: '',
  };
}

export function createImmediateRental(vehicle: Vehicle): Rental {
  const startDate = new Date();
  return vehicleRentalData(
    vehicle,
    getTodayDateString(),
    toIsoDate(addDays(startDate, DEFAULT_RENTAL_DAYS)),
    'Louée',
  );
}

export function createReservation(vehicle: Vehicle, rentals: Rental[]): Rental {
  const matricule = normalizeMatricule(vehicle.matricule);
  const activeRental = rentals.find(
    (rental) =>
      normalizeMatricule(rental.matricule) === matricule &&
      (rental.statut === 'Louée' ||
        rental.statut === "Retour aujourd'hui" ||
        rental.statut === 'En retard'),
  );

  let startDate = addDays(new Date(), 1);

  if (activeRental?.dateRetour) {
    const activeRentalEnd = parseDate(activeRental.dateRetour);
    if (activeRentalEnd && activeRentalEnd.getTime() > Date.now()) {
      startDate = addDays(activeRentalEnd, 1);
    }
  }

  return vehicleRentalData(
    vehicle,
    toIsoDate(startDate),
    toIsoDate(addDays(startDate, DEFAULT_RENTAL_DAYS)),
    'Réservée',
  );
}

export function createBlankRental(): Rental {
  const now = new Date();
  const isoNow = now.toISOString();

  return {
    id: `blank-${Date.now()}`,
    numero: Math.floor(10000 + Math.random() * 90000),
    marque: '',
    modele: '',
    matricule: '',
    chauffeur: '',
    telephone: '',
    dateDepart: toIsoDate(now),
    dateRetour: toIsoDate(addDays(now, 1)),
    nombreJours: 1,
    statut: 'Disponible',
    prixParJour: 0,
    montantTotal: 0,
    // Valeurs par défaut pour un nouveau document vierge.
    lieuNaissance: 'Tunis',
    nationalite: 'Tunisienne',
    cinLieu: 'Tunis',
    permisLieu: 'Tunis',
    dateCreation: isoNow,
    dateModification: isoNow,
  };
}
