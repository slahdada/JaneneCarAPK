export type RentalStatus = 
  | 'Disponible'
  | 'Louée'
  | 'Réservée'
  | 'En maintenance'
  | 'Retour aujourd\'hui'
  | 'En retard';

export interface Rental {
  id: string;
  numero: number;
  marque: string;
  modele: string;
  matricule: string;
  chauffeur: string;
  telephone: string;
  dateDepart: string; // ISO format: YYYY-MM-DD
  dateRetour: string;  // ISO format: YYYY-MM-DD
  nombreJours: number;
  statut: RentalStatus;
  prixParJour?: number;
  montantTotal?: number;
  notes?: string;
  dateCreation: string;
  dateModification: string;

  // Détails d'identification supplémentaires du locataire
  dateNaissance?: string;
  lieuNaissance?: string;
  nationalite?: string;
  dateEntreeTunisie?: string;
  cinOuPasseport?: string;
  cinDate?: string;
  cinLieu?: string;
  adressePermanente?: string;
  adresseTunisie?: string;
  permisNumero?: string;
  permisDate?: string;
  permisLieu?: string;

  // Conducteur secondaire (Autres conducteurs)
  conducteurSecNom?: string;
  conducteurSecCin?: string;
  conducteurSecCinDate?: string;
  conducteurSecPermis?: string;
  conducteurSecPermisDate?: string;
  conducteurSecAdresse?: string;
  conducteurSecTelephone?: string;
}

export interface Vehicle {
  id: string;
  marque: string;
  modele: string;
  matricule: string;
  annee?: number;
  carburant?: 'Essence' | 'Diesel' | 'Hybride' | 'Électrique';
  statut: RentalStatus;
  prixParJour?: number;
}

export interface Driver {
  id: string;
  nom: string;
  telephone: string;
  cin?: string;
  numeroPermis?: string;
  statut?: 'Actif' | 'En congé' | 'Inactif';
  totalLocations?: number;
}

export interface RentalHistoryItem {
  id: string;
  date: string;
  action: 'creation' | 'modification' | 'suppression' | 'duplication' | 'statut';
  titre: string;
  details: string;
  matricule?: string;
  chauffeur?: string;
}

export interface FilterState {
  search: string;
  marque: string;
  modele: string;
  chauffeur: string;
  statut: string;
  dateDepart: string;
  dateRetour: string;
}

export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export type ActiveTab = 'dashboard' | 'rentals' | 'vehicles' | 'drivers' | 'reports' | 'settings';
