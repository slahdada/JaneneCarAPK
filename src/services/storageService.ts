import { Rental, Vehicle, Driver, RentalHistoryItem, RentalStatus } from '../types';
import { INITIAL_RENTALS, INITIAL_VEHICLES, INITIAL_DRIVERS, INITIAL_HISTORY } from '../data/demoData';
import { checkRentalConflict, normalizeMatricule, OCCUPIED_STATUSES } from '../utils/conflictUtils';
import { cleanDriverName } from '../utils/validation';
import { determineRentalStatusByDates } from '../utils/dateUtils';

const STORAGE_KEYS = {
  RENTALS: 'janenecar_rentals_v1',
  VEHICLES: 'janenecar_vehicles_v1',
  DRIVERS: 'janenecar_drivers_v1',
  HISTORY: 'janenecar_history_v1',
  BRANDS_MAP: 'janenecar_brands_map_v1',
};

/**
 * Interface pour la couche d'accès aux données.
 * Permet de basculer facilement de LocalStorage vers Supabase, Firebase, MySQL, PostgreSQL ou une API REST.
 */
export interface IDataService {
  getRentals(): Promise<Rental[]>;
  saveRentals(rentals: Rental[]): Promise<void>;
  addRental(rental: Omit<Rental, 'id' | 'numero' | 'dateCreation' | 'dateModification'>): Promise<Rental>;
  addRentalsBatch(rentals: Omit<Rental, 'id' | 'numero' | 'dateCreation' | 'dateModification'>[]): Promise<Rental[]>;
  updateRental(id: string, updates: Partial<Rental>): Promise<Rental>;
  deleteRental(id: string): Promise<boolean>;
  duplicateRental(id: string): Promise<Rental>;

  getVehicles(): Promise<Vehicle[]>;
  saveVehicles(vehicles: Vehicle[]): Promise<void>;
  addVehicle(vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle>;
  addVehicles(vehicles: Omit<Vehicle, 'id'>[]): Promise<Vehicle[]>;
  updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle>;
  deleteVehicle(id: string): Promise<boolean>;

  getDrivers(): Promise<Driver[]>;
  saveDrivers(drivers: Driver[]): Promise<void>;
  addDriver(driver: Omit<Driver, 'id'>): Promise<Driver>;
  updateDriver(id: string, updates: Partial<Driver>): Promise<Driver>;
  deleteDriver(id: string): Promise<boolean>;

  getHistory(): Promise<RentalHistoryItem[]>;
  addHistoryItem(item: Omit<RentalHistoryItem, 'id' | 'date'>): Promise<void>;

  resetToDemo(): Promise<void>;
  clearAllData(): Promise<void>;
}

class LocalStorageService implements IDataService {
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private hasKey(key: string): boolean {
    if (!this.isBrowser()) return false;
    return localStorage.getItem(key) !== null;
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.isBrowser()) return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      return JSON.parse(stored);
    } catch (e) {
      console.error(`Erreur lecture LocalStorage [${key}]`, e);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Erreur écriture LocalStorage [${key}]`, e);
    }
  }

  // --- RENTALS ---
  async getRentals(): Promise<Rental[]> {
    let list: Rental[];
    const isCleared = this.isBrowser() && localStorage.getItem('janenecar_data_cleared') === 'true';

    if (isCleared) {
      list = this.getItem<Rental[]>(STORAGE_KEYS.RENTALS, []);
    } else if (!this.hasKey(STORAGE_KEYS.RENTALS)) {
      list = [...INITIAL_RENTALS];
      this.setItem(STORAGE_KEYS.RENTALS, list);
    } else {
      list = this.getItem<Rental[]>(STORAGE_KEYS.RENTALS, []);
      // Assurer la présence des nouvelles données de démonstration (passées et futures) sans écraser les données utilisateur
      const existingIds = new Set(list.map((r) => r.id));
      const missingDemo = INITIAL_RENTALS.filter((r) => !existingIds.has(r.id));
      if (missingDemo.length > 0) {
        list = [...list, ...missingDemo];
        this.setItem(STORAGE_KEYS.RENTALS, list);
      }
    }

    // Synchronisation automatique des statuts selon les dates de départ et de retour
    // pour les contrats actifs (sauf ceux marqués Disponible ou En maintenance)
    let hasStatusUpdates = false;
    const updated = list.map((r) => {
      const cleanChauffeur = cleanDriverName(r.chauffeur);
      if (r.statut === 'Disponible' || r.statut === 'En maintenance') {
        if (cleanChauffeur !== r.chauffeur) {
          hasStatusUpdates = true;
          return { ...r, chauffeur: cleanChauffeur };
        }
        return r;
      }

      const autoStatus = determineRentalStatusByDates(r.dateDepart, r.dateRetour);
      if (autoStatus !== r.statut || cleanChauffeur !== r.chauffeur) {
        hasStatusUpdates = true;
        return {
          ...r,
          statut: autoStatus,
          chauffeur: cleanChauffeur,
        };
      }
      return r;
    });

    if (hasStatusUpdates) {
      this.setItem(STORAGE_KEYS.RENTALS, updated);
      await this.syncVehiclesWithRentals(updated);
    }

    return updated;
  }

  async saveRentals(rentals: Rental[]): Promise<void> {
    const sanitized = rentals.map((r) => ({
      ...r,
      chauffeur: cleanDriverName(r.chauffeur),
    }));
    this.setItem(STORAGE_KEYS.RENTALS, sanitized);
  }

  /**
   * Synchronise l'état de chaque véhicule de la flotte en fonction des contrats actifs
   */
  async syncVehiclesWithRentals(rentalsList: Rental[]): Promise<void> {
    const vehicles = await this.getVehicles();
    let changed = false;

    const updatedVehicles = vehicles.map((v) => {
      // Si la voiture est en maintenance technique manuelle, on respecte ce statut
      if (v.statut === 'En maintenance') return v;

      const normMat = normalizeMatricule(v.matricule);
      const activeContracts = rentalsList.filter(
        (r) => normalizeMatricule(r.matricule) === normMat && OCCUPIED_STATUSES.includes(r.statut)
      );

      let targetStatus: RentalStatus = 'Disponible';
      if (activeContracts.some((r) => r.statut === 'En retard')) {
        targetStatus = 'En retard';
      } else if (activeContracts.some((r) => r.statut === "Retour aujourd'hui")) {
        targetStatus = "Retour aujourd'hui";
      } else if (activeContracts.some((r) => r.statut === 'Louée')) {
        targetStatus = 'Louée';
      } else if (activeContracts.some((r) => r.statut === 'Réservée')) {
        targetStatus = 'Réservée';
      }

      if (v.statut !== targetStatus) {
        changed = true;
        return { ...v, statut: targetStatus };
      }
      return v;
    });

    if (changed) {
      await this.saveVehicles(updatedVehicles);
    }
  }

  async addRental(data: Omit<Rental, 'id' | 'numero' | 'dateCreation' | 'dateModification'>): Promise<Rental> {
    const rentals = await this.getRentals();
    const vehicles = await this.getVehicles();

    // Vérification stricte anti-double réservation
    const conflict = checkRentalConflict({
      matricule: data.matricule,
      dateDepart: data.dateDepart,
      dateRetour: data.dateRetour,
      statut: data.statut,
      rentals,
      vehicles,
    });

    if (conflict.hasConflict) {
      throw new Error(conflict.message || `Impossible d'enregistrer : ce véhicule (${data.matricule}) est déjà loué ou réservé.`);
    }

    const nextNum = rentals.length > 0 ? Math.max(...rentals.map((r) => r.numero)) + 1 : 1;
    const now = new Date().toISOString();

    const newRental: Rental = {
      ...data,
      id: `rent-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      numero: nextNum,
      dateCreation: now,
      dateModification: now,
    };

    const updated = [newRental, ...rentals];
    await this.saveRentals(updated);
    await this.syncVehiclesWithRentals(updated);

    // Add audit history
    await this.addHistoryItem({
      action: 'creation',
      titre: 'Location ajoutée',
      details: `${newRental.marque} ${newRental.modele} (${newRental.matricule}) louée à ${newRental.chauffeur} pour ${newRental.nombreJours} jours.`,
      matricule: newRental.matricule,
      chauffeur: newRental.chauffeur,
    });

    return newRental;
  }

  async addRentalsBatch(items: Omit<Rental, 'id' | 'numero' | 'dateCreation' | 'dateModification'>[]): Promise<Rental[]> {
    if (items.length === 0) return [];
    const rentals = await this.getRentals();
    let nextNum = rentals.length > 0 ? Math.max(...rentals.map((r) => r.numero)) + 1 : 1;
    const now = new Date().toISOString();

    const created: Rental[] = items.map((data, index) => ({
      ...data,
      id: `rent-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
      numero: nextNum++,
      dateCreation: now,
      dateModification: now,
    }));

    const updated = [...created, ...rentals];
    await this.saveRentals(updated);
    await this.syncVehiclesWithRentals(updated);

    await this.addHistoryItem({
      action: 'creation',
      titre: 'Importation CSV en masse',
      details: `${created.length} contrat(s) de location importé(s) avec succès.`,
    });

    return created;
  }

  async updateRental(id: string, updates: Partial<Rental>): Promise<Rental> {
    const rentals = await this.getRentals();
    const index = rentals.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error(`Location introuvable avec l'ID: ${id}`);
    }

    const current = rentals[index];
    const now = new Date().toISOString();
    const updatedRental: Rental = {
      ...current,
      ...updates,
      id: current.id,
      numero: current.numero,
      dateModification: now,
    };

    // Vérification de non-conflit lors de la mise à jour
    const vehicles = await this.getVehicles();
    const conflict = checkRentalConflict({
      matricule: updatedRental.matricule,
      dateDepart: updatedRental.dateDepart,
      dateRetour: updatedRental.dateRetour,
      statut: updatedRental.statut,
      excludeRentalId: id,
      rentals,
      vehicles,
    });

    if (conflict.hasConflict) {
      throw new Error(conflict.message || `Impossible d'enregistrer : ce véhicule (${updatedRental.matricule}) est déjà loué ou réservé sur cette période.`);
    }

    rentals[index] = updatedRental;
    await this.saveRentals(rentals);
    await this.syncVehiclesWithRentals(rentals);

    await this.addHistoryItem({
      action: 'modification',
      titre: 'Location modifiée',
      details: `Modification de la location N°${updatedRental.numero} (${updatedRental.matricule} - ${updatedRental.chauffeur}).`,
      matricule: updatedRental.matricule,
      chauffeur: updatedRental.chauffeur,
    });

    return updatedRental;
  }

  async deleteRental(id: string): Promise<boolean> {
    const rentals = await this.getRentals();
    const toDelete = rentals.find((r) => r.id === id);
    const filtered = rentals.filter((r) => r.id !== id);
    if (filtered.length === rentals.length) return false;

    await this.saveRentals(filtered);
    await this.syncVehiclesWithRentals(filtered);

    if (toDelete) {
      await this.addHistoryItem({
        action: 'suppression',
        titre: 'Location supprimée',
        details: `Suppression de la location N°${toDelete.numero} (${toDelete.marque} ${toDelete.modele} - ${toDelete.matricule}).`,
        matricule: toDelete.matricule,
        chauffeur: toDelete.chauffeur,
      });
    }

    return true;
  }

  async duplicateRental(id: string): Promise<Rental> {
    const rentals = await this.getRentals();
    const source = rentals.find((r) => r.id === id);
    if (!source) {
      throw new Error(`Location source introuvable.`);
    }

    const { id: _ignoredId, numero: _ignoredNum, dateCreation: _ignoredC, dateModification: _ignoredM, ...rest } = source;
    const duplicated = await this.addRental({
      ...rest,
      notes: source.notes ? `[Copie de N°${source.numero}] ${source.notes}` : `Copie de la location N°${source.numero}`,
    });

    return duplicated;
  }

  /**
   * Nettoie le doublement marque/modèle (ex: modele = "Renault Trafic" alors que marque = "Renault Trafic").
   * Si le modèle commence par la marque (insensible à la casse), on retire le préfixe de la marque du modèle.
   */
  private deduplicateVehicleNames(vehicles: Vehicle[]): { cleaned: Vehicle[]; changed: boolean } {
    let changed = false;
    const cleaned = vehicles.map((v) => {
      const marqueNorm = v.marque.trim().toLowerCase();
      const modeleNorm = v.modele.trim().toLowerCase();
      // Si le modèle commence par la marque suivie d'un espace (ex: "Renault Trafic" commence par "Renault ")
      if (marqueNorm && modeleNorm.startsWith(marqueNorm + ' ')) {
        const correctedModele = v.modele.trim().slice(v.marque.trim().length).trim();
        if (correctedModele) {
          changed = true;
          return { ...v, modele: correctedModele };
        }
      }
      // Si le modèle est exactement identique à la marque (doublement complet)
      if (marqueNorm && modeleNorm === marqueNorm) {
        changed = true;
        return { ...v, modele: v.modele.trim() }; // on garde tel quel, la marque s'affiche déjà séparément
      }
      return v;
    });
    return { cleaned, changed };
  }

  // --- VEHICLES ---
  async getVehicles(): Promise<Vehicle[]> {
    const isCleared = this.isBrowser() && localStorage.getItem('janenecar_data_cleared') === 'true';
    if (isCleared) {
      const raw = this.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, []);
      const { cleaned, changed } = this.deduplicateVehicleNames(raw);
      if (changed) this.setItem(STORAGE_KEYS.VEHICLES, cleaned);
      return cleaned;
    }
    if (!this.hasKey(STORAGE_KEYS.VEHICLES)) {
      this.setItem(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
      return [...INITIAL_VEHICLES];
    }
    const raw = this.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, []);
    const { cleaned, changed } = this.deduplicateVehicleNames(raw);
    if (changed) this.setItem(STORAGE_KEYS.VEHICLES, cleaned);
    return cleaned;
  }

  async saveVehicles(vehicles: Vehicle[]): Promise<void> {
    this.setItem(STORAGE_KEYS.VEHICLES, vehicles);
  }

  async addVehicle(data: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const vehicles = await this.getVehicles();
    const newVehicle: Vehicle = {
      ...data,
      id: `veh-${Date.now()}`,
    };
    const updated = [newVehicle, ...vehicles];
    await this.saveVehicles(updated);
    return newVehicle;
  }

  async addVehicles(items: Omit<Vehicle, 'id'>[]): Promise<Vehicle[]> {
    if (items.length === 0) return [];
    const vehicles = await this.getVehicles();
    const existingMap = new Map<string, Vehicle>();
    vehicles.forEach((v) => existingMap.set(normalizeMatricule(v.matricule), v));

    const timestamp = Date.now();
    const created: Vehicle[] = [];
    const updatedList: Vehicle[] = [...vehicles];

    items.forEach((data, index) => {
      const norm = normalizeMatricule(data.matricule);
      if (!norm) return;
      const existing = existingMap.get(norm);
      if (existing) {
        // Met à jour les infos du véhicule sans créer de doublon
        const idx = updatedList.findIndex((v) => v.id === existing.id);
        if (idx !== -1) {
          updatedList[idx] = {
            ...updatedList[idx],
            marque: data.marque || updatedList[idx].marque,
            modele: data.modele || updatedList[idx].modele,
            statut: data.statut || updatedList[idx].statut,
          };
        }
      } else {
        const newVehicle: Vehicle = {
          ...data,
          id: `veh-${timestamp}-${index}`,
        };
        existingMap.set(norm, newVehicle);
        created.push(newVehicle);
        updatedList.unshift(newVehicle);
      }
    });

    await this.saveVehicles(updatedList);
    return created;
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    const vehicles = await this.getVehicles();
    const index = vehicles.findIndex((v) => v.id === id);
    if (index === -1) throw new Error('Véhicule introuvable.');
    const updated = { ...vehicles[index], ...updates };
    vehicles[index] = updated;
    await this.saveVehicles(vehicles);
    return updated;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const vehicles = await this.getVehicles();
    const filtered = vehicles.filter((v) => v.id !== id);
    await this.saveVehicles(filtered);
    return true;
  }

  // --- DRIVERS ---
  async getDrivers(): Promise<Driver[]> {
    let list: Driver[];
    const isCleared = this.isBrowser() && localStorage.getItem('janenecar_data_cleared') === 'true';

    if (isCleared) {
      list = this.getItem<Driver[]>(STORAGE_KEYS.DRIVERS, []);
    } else if (!this.hasKey(STORAGE_KEYS.DRIVERS)) {
      list = [...INITIAL_DRIVERS];
      this.setItem(STORAGE_KEYS.DRIVERS, list);
    } else {
      list = this.getItem<Driver[]>(STORAGE_KEYS.DRIVERS, []);
    }
    // Assurer que le nom du chauffeur ne contient jamais de numéro de téléphone
    return list.map((d) => ({
      ...d,
      nom: cleanDriverName(d.nom),
    }));
  }

  async saveDrivers(drivers: Driver[]): Promise<void> {
    const sanitized = drivers.map((d) => ({
      ...d,
      nom: cleanDriverName(d.nom),
    }));
    this.setItem(STORAGE_KEYS.DRIVERS, sanitized);
  }

  async addDriver(data: Omit<Driver, 'id'>): Promise<Driver> {
    const drivers = await this.getDrivers();
    const newDriver: Driver = {
      ...data,
      nom: cleanDriverName(data.nom),
      id: `drv-${Date.now()}`,
      totalLocations: data.totalLocations ?? 1,
    };
    const updated = [...drivers, newDriver];
    await this.saveDrivers(updated);
    return newDriver;
  }

  async updateDriver(id: string, updates: Partial<Driver>): Promise<Driver> {
    const drivers = await this.getDrivers();
    const index = drivers.findIndex((d) => d.id === id);
    if (index === -1) throw new Error('Chauffeur introuvable.');
    const updated = {
      ...drivers[index],
      ...updates,
      ...(updates.nom ? { nom: cleanDriverName(updates.nom) } : {}),
    };
    drivers[index] = updated;
    await this.saveDrivers(drivers);
    return updated;
  }

  async deleteDriver(id: string): Promise<boolean> {
    const drivers = await this.getDrivers();
    const filtered = drivers.filter((d) => d.id !== id);
    await this.saveDrivers(filtered);
    return true;
  }

  // --- HISTORY ---
  async getHistory(): Promise<RentalHistoryItem[]> {
    const isCleared = this.isBrowser() && localStorage.getItem('janenecar_data_cleared') === 'true';
    if (isCleared) {
      return this.getItem<RentalHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
    }
    if (!this.hasKey(STORAGE_KEYS.HISTORY)) {
      this.setItem(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
      return [...INITIAL_HISTORY];
    }
    return this.getItem<RentalHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
  }

  async addHistoryItem(item: Omit<RentalHistoryItem, 'id' | 'date'>): Promise<void> {
    const history = await this.getHistory();
    const newItem: RentalHistoryItem = {
      ...item,
      id: `hist-${Date.now()}`,
      date: new Date().toISOString(),
    };
    const updated = [newItem, ...history].slice(0, 100); // Keep last 100 entries
    this.setItem(STORAGE_KEYS.HISTORY, updated);
  }

  // --- RESET & CLEAR ---
  async resetToDemo(): Promise<void> {
    if (this.isBrowser()) {
      localStorage.removeItem(STORAGE_KEYS.RENTALS);
      localStorage.removeItem(STORAGE_KEYS.VEHICLES);
      localStorage.removeItem(STORAGE_KEYS.DRIVERS);
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
      localStorage.removeItem('janenecar_data_cleared');
    }
    this.setItem(STORAGE_KEYS.RENTALS, INITIAL_RENTALS);
    this.setItem(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
    this.setItem(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
    this.setItem(STORAGE_KEYS.HISTORY, INITIAL_HISTORY);
  }

  /**
   * Nettoyage complet de la base de données locale (voitures, contrats, réservations, historique, chauffeurs)
   * afin de remettre l'application entièrement à neuf.
   */
  async clearAllData(): Promise<void> {
    if (this.isBrowser()) {
      this.setItem(STORAGE_KEYS.RENTALS, []);
      this.setItem(STORAGE_KEYS.VEHICLES, []);
      this.setItem(STORAGE_KEYS.DRIVERS, []);
      this.setItem(STORAGE_KEYS.HISTORY, []);
      localStorage.removeItem(STORAGE_KEYS.BRANDS_MAP);
      localStorage.setItem('janenecar_data_cleared', 'true');
    }
  }
}

// Instance singleton exportée pour l'application
export const storageService = new LocalStorageService();
