import { RentalStatus } from '../types';

/**
 * Date utilities for JaneneCar
 * Format d'affichage requis: 12/09/2026
 */

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Handle ISO format YYYY-MM-DD
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
  }
  // Handle French format DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Normalise une date (ISO YYYY-MM-DD ou français DD/MM/YYYY)
 * vers la valeur attendue par <input type="date">.
 */
export function toDateInputValue(dateStr: string): string {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const d = parseDate(dateStr);
  return d ? toIsoDate(d) : '';
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date to standard French display format DD/MM/YYYY
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = parseDate(dateStr);
  if (!d) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Calculate difference in days between start and end date.
 * If end is same day as start, it is 1 day (or 0 depending on convention, prompt says:
 * Départ : 12/09/2026, Retour : 15/09/2026 -> Résultat : 3 jours, so (15 - 12 = 3).
 * If same date (12/09 to 12/09), 1 day rental minimum or 0 if same time. Let's do Math.max(1, diff) or (end - start).
 */
export function calculateRentalDays(dateDepart: string, dateRetour: string): number {
  if (!dateDepart || !dateRetour) return 0;
  const start = parseDate(dateDepart);
  const end = parseDate(dateRetour);
  if (!start || !end) return 0;

  // Clear times to prevent DST issues
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return 0;

  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return days === 0 ? 1 : days; // Minimum 1 day if rented same day
}

export function validateDates(dateDepart: string, dateRetour: string): { isValid: boolean; error?: string } {
  if (!dateDepart) {
    return { isValid: false, error: 'Veuillez saisir une date de départ.' };
  }
  if (!dateRetour) {
    return { isValid: false, error: 'Veuillez saisir une date de retour.' };
  }

  const start = parseDate(dateDepart);
  const end = parseDate(dateRetour);

  if (!start) {
    return { isValid: false, error: 'Date de départ invalide.' };
  }
  if (!end) {
    return { isValid: false, error: 'Date de retour invalide.' };
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (end < start) {
    return {
      isValid: false,
      error: 'La date de retour doit être postérieure ou égale à la date de départ.',
    };
  }

  return { isValid: true };
}

export function isDateToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = parseDate(dateStr);
  if (!d) return false;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function isDatePast(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = parseDate(dateStr);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

export function getTodayDateString(): string {
  return toIsoDate(new Date());
}

/**
 * Détermine automatiquement le statut de la location par rapport à la date de départ (et de retour)
 * par rapport à aujourd'hui :
 * - Date de départ postérieure à aujourd'hui (dans le futur) -> 'Réservée'
 * - Date de départ aujourd'hui ou passée :
 *     - Si Date de retour < aujourd'hui -> 'En retard'
 *     - Si Date de retour == aujourd'hui -> "Retour aujourd'hui"
 *     - Si Date de retour > aujourd'hui -> 'Louée'
 */
export function determineRentalStatusByDates(dateDepart: string, dateRetour?: string): RentalStatus {
  if (!dateDepart) return 'Louée';
  const start = parseDate(dateDepart);
  if (!start) return 'Louée';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  // Date de départ dans le futur : le véhicule est réservé
  if (start.getTime() > today.getTime()) {
    return 'Réservée';
  }

  // Date de départ aujourd'hui ou passée
  if (dateRetour) {
    const end = parseDate(dateRetour);
    if (end) {
      end.setHours(0, 0, 0, 0);
      if (end.getTime() < today.getTime()) {
        return 'En retard';
      }
      if (end.getTime() === today.getTime()) {
        return "Retour aujourd'hui";
      }
    }
  }

  return 'Louée';
}
