import { Rental, RentalStatus, Vehicle, Driver, RentalHistoryItem } from '../types';
import { formatDisplayDate, parseDate, toIsoDate, calculateRentalDays } from '../utils/dateUtils';
import { validateMatricule, validateTelephone, cleanDriverName } from '../utils/validation';
import { checkRentalConflict } from '../utils/conflictUtils';

export interface CsvImportResult {
  success: boolean;
  importedRentals: Omit<Rental, 'id' | 'numero' | 'dateCreation' | 'dateModification'>[];
  importedVehicles: Omit<Vehicle, 'id'>[];
  isVehicleStockOnly: boolean;
  errors: string[];
  totalRows: number;
}

export interface VehicleCsvImportResult {
  success: boolean;
  importedVehicles: Omit<Vehicle, 'id'>[];
  errors: string[];
  totalRows: number;
}

const CSV_HEADERS = [
  'Marque',
  'Modèle',
  'Matricule',
  'Chauffeur',
  'Téléphone',
  'Départ',
  'Retour',
  'Nombre de jours',
  'Statut',
];

const STOCK_CSV_HEADERS = [
  'MARQUE',
  'MODÈLE',
  'MATRICULE',
  'ANNÉE',
  'CARBURANT',
  'PRIX_PAR_JOUR',
  'STATUT',
];

/**
 * Télécharge le modèle CSV pour l'importation de véhicules dans le stock.
 * Contient MARQUE, MODÈLE, MATRICULE et le reste des colonnes vierges.
 */
export function downloadStockImportTemplateCsv(filename = 'Modele_Import_Stock_Janen_Car.csv'): void {
  const headerLine = STOCK_CSV_HEADERS.join(';');
  const sampleRows = [
    'Toyota;Yaris;214 TUN 4521;;;;;',
    'Renault;Clio 5;198 TUN 8732;;;;;',
    'Peugeot;208;225 TUN 1490;;;;;',
    'Hyundai;i20;210 TUN 3582;;;;;',
    'Volkswagen;Polo;205 TUN 6310;;;;;',
    'Kia;Rio;220 TUN 3698;;;;;',
  ];
  const content = [headerLine, ...sampleRows].join('\r\n');
  downloadCsv(content, filename);
}

/**
 * Exporte les locations dans le fichier Janen_Car.csv avec encodage UTF-8 et BOM pour compatibilité Excel
 */
export function exportRentalsToCsv(rentals: Rental[]): void {
  // Entête standard
  const headerLine = CSV_HEADERS.join(';');

  const rows = rentals.map((r) => {
    return [
      escapeCsvField(r.marque),
      escapeCsvField(r.modele),
      escapeCsvField(r.matricule),
      escapeCsvField(r.chauffeur),
      escapeCsvField(r.telephone),
      escapeCsvField(formatDisplayDate(r.dateDepart)),
      escapeCsvField(formatDisplayDate(r.dateRetour)),
      escapeCsvField(String(r.nombreJours)),
      escapeCsvField(r.statut),
    ].join(';');
  });

  downloadCsv([headerLine, ...rows].join('\r\n'), 'Janen_Car.csv');
}

/**
 * Exporte les véhicules du parc en CSV avec encodage UTF-8 BOM pour compatibilité Excel
 */
export function exportVehiclesToCsv(vehicles: Vehicle[]): void {
  const headers = ['Matricule', 'Marque', 'Modèle', 'Année', 'Carburant', 'Prix par jour (TND)', 'Statut'];
  const headerLine = headers.join(';');

  const rows = vehicles.map((v) =>
    [
      escapeCsvField(v.matricule),
      escapeCsvField(v.marque),
      escapeCsvField(v.modele),
      escapeCsvField(String(v.annee || '')),
      escapeCsvField(v.carburant || 'Essence'),
      escapeCsvField(v.prixParJour != null ? String(v.prixParJour) : ''),
      escapeCsvField(v.statut),
    ].join(';')
  );

  downloadCsv([headerLine, ...rows].join('\r\n'), 'Vehicules_Janen_Car.csv');
}

/**
 * Exporte la liste des conducteurs en CSV avec encodage UTF-8 BOM pour compatibilité Excel
 */
export function exportDriversToCsv(drivers: Driver[]): void {
  const headers = ['Nom', 'Téléphone', 'CIN', 'N° Permis', 'Statut', 'Total locations'];
  const headerLine = headers.join(';');

  const rows = drivers.map((d) =>
    [
      escapeCsvField(d.nom),
      escapeCsvField(d.telephone),
      escapeCsvField(d.cin || ''),
      escapeCsvField(d.numeroPermis || ''),
      escapeCsvField(d.statut || 'Actif'),
      escapeCsvField(String(d.totalLocations ?? 0)),
    ].join(';')
  );

  downloadCsv([headerLine, ...rows].join('\r\n'), 'Conducteurs_Janen_Car.csv');
}

/**
 * Exporte le journal d'activité (historique) en CSV avec encodage UTF-8 BOM pour compatibilité Excel
 */
export function exportHistoryToCsv(history: RentalHistoryItem[]): void {
  const headers = ['Date', 'Action', 'Titre', 'Détails', 'Matricule', 'Chauffeur'];
  const headerLine = headers.join(';');

  const rows = history.map((h) => {
    const date = h.date ? new Date(h.date).toLocaleString('fr-TN', { dateStyle: 'short', timeStyle: 'short' }) : '';
    return [
      escapeCsvField(date),
      escapeCsvField(h.action),
      escapeCsvField(h.titre),
      escapeCsvField(h.details),
      escapeCsvField(h.matricule || ''),
      escapeCsvField(h.chauffeur || ''),
    ].join(';');
  });

  downloadCsv([headerLine, ...rows].join('\r\n'), 'Historique_Janen_Car.csv');
}

/**
 * Télécharge un fichier CSV avec UTF-8 BOM pour assurer la compatibilité Excel
 */
function downloadCsv(content: string, filename: string): void {
  const csvContent = '\uFEFF' + content;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvField(val: string): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Analyse une ligne CSV en tenant compte des guillemets et séparateurs (; ou ,)
 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Importe et valide un fichier CSV de locations
 * Vérifie également qu'un véhicule déjà loué ou réservé ne subit pas de double réservation
 */
export async function parseAndValidateCsv(
  file: File,
  existingRentals: Rental[] = [],
  vehicles: Vehicle[] = []
): Promise<CsvImportResult> {
  const text = (await file.text()).replace(/^\uFEFF/, '');
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) {
    return {
      success: false,
      importedRentals: [],
      importedVehicles: [],
      isVehicleStockOnly: false,
      errors: ['Le fichier CSV est vide.'],
      totalRows: 0,
    };
  }

  // Déterminer le délimiteur (; ou , ou \t)
  const firstLine = rawLines[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  let delimiter = ';';
  if (tabCount > semicolonCount && tabCount > commaCount) delimiter = '\t';
  else if (commaCount > semicolonCount) delimiter = ',';

  // Analyser l'entête
  const headers = parseCsvLine(firstLine, delimiter).map((h) =>
    h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  );

  // Indexation automatique des colonnes
  const colIndex = {
    marque: headers.findIndex((h) => h.includes('marque')),
    modele: headers.findIndex((h) => h.includes('modele')),
    matricule: headers.findIndex((h) => h.includes('matricule') || h.includes('immat') || h.includes('plaque')),
    chauffeur: headers.findIndex((h) => h.includes('chauffeur') || h.includes('conducteur') || h.includes('client')),
    telephone: headers.findIndex((h) => h.includes('tel') || h.includes('phone') || h.includes('contact')),
    depart: headers.findIndex((h) => h.includes('depart') || h.includes('debut')),
    retour: headers.findIndex((h) => h.includes('retour') || h.includes('fin')),
    jours: headers.findIndex((h) => h.includes('jour') || h.includes('duree')),
    statut: headers.findIndex((h) => h.includes('statut') || h.includes('etat')),
  };

  // Seules Marque, Modèle et Matricule sont requises pour identifier les véhicules
  const missingCols: string[] = [];
  if (colIndex.marque === -1) missingCols.push('Marque');
  if (colIndex.modele === -1) missingCols.push('Modèle');
  if (colIndex.matricule === -1) missingCols.push('Matricule');

  if (missingCols.length > 0) {
    return {
      success: false,
      importedRentals: [],
      importedVehicles: [],
      isVehicleStockOnly: false,
      errors: [`Colonnes obligatoires manquantes dans l'entête : ${missingCols.join(', ')}`],
      totalRows: rawLines.length - 1,
    };
  }

  const validRentals: Omit<Rental, 'id' | 'numero' | 'dateCreation' | 'dateModification'>[] = [];
  const validVehicles: Omit<Vehicle, 'id'>[] = [];
  const errors: string[] = [];

  // Suivi temporaire des locations cumulées pour empêcher les doublons au sein du même CSV
  const cumulativeRentals: Rental[] = [...existingRentals];

  for (let i = 1; i < rawLines.length; i++) {
    const rowNum = i + 1;
    const values = parseCsvLine(rawLines[i], delimiter);
    if (values.length === 0 || values.every((v) => !v.trim())) continue; // ignore ligne complètement vide

    const marque = (values[colIndex.marque] || '').trim();
    const modele = (values[colIndex.modele] || '').trim();
    const rawMatricule = colIndex.matricule !== -1 ? (values[colIndex.matricule] || '') : '';
    const matricule = rawMatricule
      .trim()
      .toUpperCase()
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ');

    const chauffeur = colIndex.chauffeur !== -1 ? (values[colIndex.chauffeur] || '').trim() : '';
    const telephone = colIndex.telephone !== -1 ? (values[colIndex.telephone] || '').trim() : '';
    const rawDepart = colIndex.depart !== -1 ? (values[colIndex.depart] || '').trim() : '';
    const rawRetour = colIndex.retour !== -1 ? (values[colIndex.retour] || '').trim() : '';
    const rawStatut = colIndex.statut !== -1 ? (values[colIndex.statut] || '').trim() : '';

    // Si la ligne ne contient aucune donnée clé, ignorer
    if (!marque && !modele && !matricule) continue;

    // Validation des données requises
    if (!marque) {
      errors.push(`Ligne ${rowNum} : Marque manquante.`);
      continue;
    }
    if (!modele) {
      errors.push(`Ligne ${rowNum} : Modèle manquant.`);
      continue;
    }

    const matValidation = validateMatricule(matricule);
    if (!matValidation.isValid) {
      errors.push(`Ligne ${rowNum} : Matricule "${matricule}" incorrect. Exemple attendu : 7110 TUN 666 ou 214 TUN 4521`);
      continue;
    }

    // Normaliser statut
    let statut: RentalStatus = 'Disponible';
    const sLow = (rawStatut || '').toLowerCase();
    if (sLow.includes('lou')) statut = 'Louée';
    else if (sLow.includes('reser')) statut = 'Réservée';
    else if (sLow.includes('maint')) statut = 'En maintenance';
    else if (sLow.includes('aujourd')) statut = "Retour aujourd'hui";
    else if (sLow.includes('retard')) statut = 'En retard';
    else statut = 'Disponible';

    // Créer le véhicule pour le stock
    const vehicleItem: Omit<Vehicle, 'id'> = {
      marque,
      modele,
      matricule,
      annee: new Date().getFullYear(),
      carburant: 'Essence',
      prixParJour: undefined,
      statut,
    };
    validVehicles.push(vehicleItem);

    // Vérifier si la ligne contient un contrat de location actif (Chauffeur et/ou Dates)
    const hasRentalDetails = Boolean(chauffeur || (rawDepart && rawRetour));

    if (hasRentalDetails) {
      const validChauffeur = cleanDriverName(chauffeur || 'Client Janen_Car');
      const validTel = telephone || '—';

      const dateD = parseDate(rawDepart) || new Date();
      const dateR = parseDate(rawRetour) || new Date(dateD.getTime() + 3 * 86400000);

      const dateDepartIso = toIsoDate(dateD);
      const dateRetourIso = toIsoDate(dateR);
      const nombreJours = calculateRentalDays(dateDepartIso, dateRetourIso);
      const rentalStatut = statut === 'Disponible' ? 'Louée' : statut;

      // Conflit éventuel
      const conflict = checkRentalConflict({
        matricule,
        dateDepart: dateDepartIso,
        dateRetour: dateRetourIso,
        statut: rentalStatut,
        rentals: cumulativeRentals,
        vehicles,
      });

      if (conflict.hasConflict) {
        errors.push(`Ligne ${rowNum} : Conflit de réservation - ${conflict.message}`);
        continue;
      }

      const newRentalItem = {
        marque,
        modele,
        matricule,
        chauffeur: validChauffeur,
        telephone: validTel,
        dateDepart: dateDepartIso,
        dateRetour: dateRetourIso,
        nombreJours: Math.max(1, nombreJours),
        statut: rentalStatut,
        notes: `Importé depuis le fichier CSV ${file.name}`,
      };

      validRentals.push(newRentalItem);
      cumulativeRentals.push({
        ...newRentalItem,
        id: `temp-csv-${rowNum}`,
        numero: cumulativeRentals.length + 1,
        dateCreation: new Date().toISOString(),
        dateModification: new Date().toISOString(),
      });
    } else {
      // Véhicule disponible en stock (colonnes Chauffeur/Téléphone/Dates vierges)
      const availableRentalItem = {
        marque,
        modele,
        matricule,
        chauffeur: '—',
        telephone: '—',
        dateDepart: toIsoDate(new Date()),
        dateRetour: toIsoDate(new Date()),
        nombreJours: 1,
        statut: 'Disponible' as RentalStatus,
        notes: `Véhicule importé dans le stock depuis ${file.name}`,
      };
      validRentals.push(availableRentalItem);
    }
  }

  const isVehicleStockOnly = validRentals.length > 0 && validRentals.every((r) => r.chauffeur === '—' || r.statut === 'Disponible');

  return {
    success: (validRentals.length > 0 || validVehicles.length > 0) && errors.length === 0,
    importedRentals: validRentals,
    importedVehicles: validVehicles,
    isVehicleStockOnly,
    errors,
    totalRows: rawLines.length - 1,
  };
}

/**
 * Analyse et valide un fichier CSV de véhicules pour le stock.
 * Requiert obligatoirement MARQUE, MODÈLE, MATRICULE.
 * Toutes les autres colonnes (Année, Carburant, Prix/jour, Statut) peuvent être vierges.
 */
export async function parseAndValidateVehicleCsv(
  file: File,
  existingVehicles: Vehicle[] = []
): Promise<VehicleCsvImportResult> {
  const text = (await file.text()).replace(/^\uFEFF/, '');
  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (rawLines.length === 0) {
    return {
      success: false,
      importedVehicles: [],
      errors: ['Le fichier CSV est vide.'],
      totalRows: 0,
    };
  }

  // Déterminer le délimiteur (; ou , ou \t)
  const firstLine = rawLines[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  let delimiter = ';';
  if (tabCount > semicolonCount && tabCount > commaCount) delimiter = '\t';
  else if (commaCount > semicolonCount) delimiter = ',';

  // Analyser l'entête
  const headers = parseCsvLine(firstLine, delimiter).map((h) =>
    h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  );

  const colIndex = {
    marque: headers.findIndex((h) => h.includes('marque') || h.includes('brand')),
    modele: headers.findIndex((h) => h.includes('modele') || h.includes('model')),
    matricule: headers.findIndex((h) => h.includes('matricule') || h.includes('immat') || h.includes('plaque')),
    annee: headers.findIndex((h) => h.includes('annee') || h.includes('year')),
    carburant: headers.findIndex((h) => h.includes('carburant') || h.includes('fuel') || h.includes('energie')),
    prix: headers.findIndex((h) => h.includes('prix') || h.includes('tarif') || h.includes('price')),
    statut: headers.findIndex((h) => h.includes('statut') || h.includes('etat') || h.includes('status')),
  };

  // Détecter si "Marque & Modèle" est une colonne combinée (même index pour marque et modèle)
  const isCombinedMarqueModele = colIndex.marque !== -1 && colIndex.marque === colIndex.modele;

  /**
   * Sépare intelligemment une valeur combinée "Marque Modèle" en deux parties.
   * Exemple : "Renault Trafic" → { marque: "Renault", modele: "Trafic" }
   *           "Mercedes CLA"  → { marque: "Mercedes", modele: "CLA" }
   *           "Volkswagen Caddy" → { marque: "Volkswagen", modele: "Caddy" }
   *           "Lynk & Co 1" → { marque: "Lynk & Co", modele: "1" }
   */
  function splitMarqueModele(combined: string): { marque: string; modele: string } {
    const trimmed = combined.trim();
    if (!trimmed) return { marque: '', modele: '' };

    // Liste de marques multi-mots connues (ordre : les plus longues d'abord)
    const KNOWN_MULTI_WORD_BRANDS = [
      'Alfa Romeo', 'Aston Martin', 'Land Rover', 'Rolls Royce', 'Rolls-Royce',
      'Lynk & Co', 'Great Wall', 'Dongfeng', 'GAC Motor', 'Mercedes Benz',
      'Mercedes-Benz', 'Volkswagen', 'Citroën', 'Citroen',
    ];

    for (const brand of KNOWN_MULTI_WORD_BRANDS) {
      const brandLower = brand.toLowerCase();
      if (trimmed.toLowerCase().startsWith(brandLower + ' ')) {
        return {
          marque: trimmed.slice(0, brand.length),
          modele: trimmed.slice(brand.length).trim(),
        };
      }
    }

    // Fallback : premier mot = marque, reste = modèle
    const spaceIdx = trimmed.indexOf(' ');
    if (spaceIdx === -1) return { marque: trimmed, modele: trimmed };
    return {
      marque: trimmed.slice(0, spaceIdx).trim(),
      modele: trimmed.slice(spaceIdx + 1).trim(),
    };
  }

  const missingCols: string[] = [];
  if (colIndex.marque === -1) missingCols.push('MARQUE');
  if (colIndex.modele === -1) missingCols.push('MODÈLE');
  if (colIndex.matricule === -1) missingCols.push('MATRICULE');

  if (missingCols.length > 0) {
    return {
      success: false,
      importedVehicles: [],
      errors: [`Colonnes obligatoires manquantes dans l'entête : ${missingCols.join(', ')}`],
      totalRows: rawLines.length - 1,
    };
  }

  const validVehicles: Omit<Vehicle, 'id'>[] = [];
  const errors: string[] = [];
  const seenMatriculesInCsv = new Set<string>();

  for (let i = 1; i < rawLines.length; i++) {
    const rowNum = i + 1;
    const values = parseCsvLine(rawLines[i], delimiter);
    // Ignorer les lignes totalement vides
    if (values.length === 0 || values.every((v) => !v.trim())) continue;

    let marque: string;
    let modele: string;

    if (isCombinedMarqueModele) {
      // Colonne combinée "Marque & Modèle" → on sépare intelligemment
      const combined = (values[colIndex.marque] || '').trim();
      const split = splitMarqueModele(combined);
      marque = split.marque;
      modele = split.modele;
    } else {
      marque = (values[colIndex.marque] || '').trim();
      modele = (values[colIndex.modele] || '').trim();
    }

    const rawMatricule = (values[colIndex.matricule] || '')
      .trim()
      .toUpperCase()
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ');

    if (!marque && !modele && !rawMatricule) continue;

    if (!marque) {
      errors.push(`Ligne ${rowNum} : Marque manquante.`);
      continue;
    }
    if (!modele) {
      errors.push(`Ligne ${rowNum} : Modèle manquant.`);
      continue;
    }

    const matValidation = validateMatricule(rawMatricule);
    if (!matValidation.isValid) {
      errors.push(`Ligne ${rowNum} : Matricule "${rawMatricule}" invalide. Format attendu : 7110 TUN 666 ou 214 TUN 4521`);
      continue;
    }

    const normMat = rawMatricule.replace(/\s+/g, '');

    if (seenMatriculesInCsv.has(normMat)) {
      errors.push(`Ligne ${rowNum} : Doublon dans le fichier CSV pour le matricule "${rawMatricule}".`);
      continue;
    }
    seenMatriculesInCsv.add(normMat);

    // Valeurs par défaut si le reste des colonnes est vierge
    let annee: number | undefined;
    if (colIndex.annee !== -1 && values[colIndex.annee]) {
      const parsedAnnee = parseInt(values[colIndex.annee], 10);
      if (!isNaN(parsedAnnee) && parsedAnnee >= 1990 && parsedAnnee <= 2030) {
        annee = parsedAnnee;
      }
    }
    if (!annee) annee = new Date().getFullYear();

    let carburant: 'Essence' | 'Diesel' | 'Hybride' | 'Électrique' = 'Essence';
    if (colIndex.carburant !== -1 && values[colIndex.carburant]) {
      const rawC = values[colIndex.carburant].toLowerCase();
      if (rawC.includes('diesel')) carburant = 'Diesel';
      else if (rawC.includes('hybr')) carburant = 'Hybride';
      else if (rawC.includes('elec')) carburant = 'Électrique';
    }

    let prixParJour: number | undefined = undefined;
    if (colIndex.prix !== -1 && values[colIndex.prix]) {
      const parsedPrix = parseFloat(values[colIndex.prix].replace(/[^0-9.]/g, ''));
      if (!isNaN(parsedPrix) && parsedPrix > 0) prixParJour = parsedPrix;
    }

    let statut: RentalStatus = 'Disponible';
    if (colIndex.statut !== -1 && values[colIndex.statut]) {
      const rawS = values[colIndex.statut].toLowerCase();
      if (rawS.includes('maint')) statut = 'En maintenance';
      else if (rawS.includes('lou')) statut = 'Louée';
      else if (rawS.includes('reser')) statut = 'Réservée';
    }

    validVehicles.push({
      marque: marque.trim(),
      modele: modele.trim(),
      matricule: rawMatricule,
      annee,
      carburant,
      prixParJour,
      statut,
    });
  }

  return {
    success: validVehicles.length > 0 && errors.length === 0,
    importedVehicles: validVehicles,
    errors,
    totalRows: rawLines.length - 1,
  };
}
