/**
 * Utilities for Tunisian license plate validation & auto-formatting
 * Format requis: 1234 TUN 123
 * - Première partie : 1 à 4 chiffres
 * - Espace
 * - 'TUN'
 * - Espace
 * - Exactement 3 chiffres à la fin
 */

export const TUNISIAN_PLATE_REGEX = /^\d{1,4}\s*(?:TUN|تونس)\s*\d{1,4}$/i;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateMatricule(matricule: string): ValidationResult {
  const cleaned = (matricule || '')
    .trim()
    .toUpperCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ');

  if (!cleaned) {
    return {
      isValid: false,
      error: 'Le matricule est obligatoire.',
    };
  }

  // Format tunisien standard : 1-4 chiffres, TUN ou تونس, 1-4 chiffres (ex: 7110 TUN 666 ou 214 TUN 4521)
  if (TUNISIAN_PLATE_REGEX.test(cleaned)) {
    return { isValid: true };
  }

  // Tolérance pour formats avec tirets (ex: 7110-TUN-666) ou matricules spéciaux
  const cleanedWithTirets = cleaned.replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
  if (TUNISIAN_PLATE_REGEX.test(cleanedWithTirets)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: 'Format de matricule incorrect. Exemple : 7110 TUN 666 ou 214 TUN 4521',
  };
}

/**
 * Intelligent auto-formatting for Tunisian license plates during typing.
 * E.g., typing '1234tun123' -> '1234 TUN 123'
 * or typing '1234 123' -> '1234 TUN 123'
 */
export function formatMatriculeInput(input: string): string {
  if (!input) return '';
  let upper = input.toUpperCase().replace(/[^0-9A-Z\s]/g, '');

  // Extract digits and TUN
  // If user types numbers, then TUN or space, then numbers
  // Clean multiple spaces
  upper = upper.replace(/\s+/g, ' ');

  // Match pattern like: (\d{1,4})[ ]*(?:TUN)?[ ]*(\d{0,3})
  const match = upper.match(/^(\d{1,4})(?:\s*TUN|\s+)?(?:\s*(\d{0,3}))?.*$/);
  if (match) {
    const part1 = match[1];
    const part2 = match[2];
    if (part2 !== undefined && part2.length > 0) {
      return `${part1} TUN ${part2}`;
    }
    if (upper.includes('TUN') || upper.endsWith(' ') || upper.length > 4) {
      return `${part1} TUN `;
    }
    return part1;
  }

  return upper.slice(0, 12);
}

/**
 * Validation for Tunisian phone numbers
 * Accepted formats:
 * - 22 123 456
 * - +216 22 123 456
 * - 22123456 or +21622123456
 */
export function validateTelephone(phone: string): ValidationResult {
  const cleaned = (phone || '').trim().replace(/[\s.-]/g, '');
  if (!cleaned) {
    return {
      isValid: false,
      error: 'Le numéro de téléphone est obligatoire.',
    };
  }

  // Check Tunisian format: 8 digits starting with 2, 3, 4, 5, 7, 9 or +216 followed by 8 digits
  const localPattern = /^(2|3|4|5|7|9)\d{7}$/;
  const intlPattern = /^\+216(2|3|4|5|7|9)\d{7}$/;

  if (!localPattern.test(cleaned) && !intlPattern.test(cleaned)) {
    return {
      isValid: false,
      error: 'Format de téléphone invalide. Exemple : 22 123 456 ou +216 22 123 456',
    };
  }

  return { isValid: true };
}

/**
 * Format Tunisian phone number for display
 */
export function formatTelephone(phone: string): string {
  const cleaned = (phone || '').trim().replace(/[\s.-]/g, '');
  if (cleaned.startsWith('+216')) {
    const rest = cleaned.slice(4);
    if (rest.length === 8) {
      return `+216 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`;
    }
    return phone;
  }
  if (cleaned.length === 8) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Generate a direct WhatsApp contact/call link for Tunisian and international numbers.
 * Supports wa.me standard with proper +216 country code handling and optional custom message.
 */
export function formatWhatsAppLink(phone: string, message?: string): string {
  if (!phone) return '#';
  let cleaned = phone.trim().replace(/[\s.-]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.length === 8) {
    // Standard Tunisian 8-digit phone number without prefix
    cleaned = `216${cleaned}`;
  }

  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${cleaned}${query}`;
}

/**
 * Nettoie le nom d'un chauffeur/conducteur pour s'assurer qu'aucun numéro de téléphone
 * ou formatage entre parenthèses n'y figure (ex : "slah (20 987 654)" -> "slah").
 * Capitalise également automatiquement la première lettre de chaque mot (nom, prénom).
 */
export function cleanDriverName(name: string): string {
  if (!name) return '';
  const cleaned = name
    .replace(/\s*\(\+?[\d\s.-]+\)\s*$/g, '') // Supprime "(20 987 654)" ou "(+216 20 987 654)" à la fin
    .replace(/\s*-\s*\+?[\d\s.-]+$/g, '')    // Supprime "- 20 987 654" à la fin
    .replace(/\s*:\s*\+?[\d\s.-]+$/g, '');   // Supprime ": 20 987 654" à la fin

  // Capitalise la première lettre de chaque mot (gère aussi les prénoms composés avec tiret comme Jean-Luc)
  return cleaned
    .split(/(\s+)/) // Conserver les espaces originaux pour préserver la saisie en cours
    .map(part => {
      if (!part || /^\s+$/.test(part)) return part;
      
      if (part.includes('-')) {
        return part
          .split('-')
          .map(subWord => subWord ? subWord.charAt(0).toUpperCase() + subWord.slice(1).toLowerCase() : '')
          .join('-');
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join('');
}

