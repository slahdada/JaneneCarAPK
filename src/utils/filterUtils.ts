import type { FilterState } from '../types';

export const createEmptyFilters = (): FilterState => ({
  search: '',
  marque: '',
  modele: '',
  chauffeur: '',
  statut: '',
  dateDepart: '',
  dateRetour: '',
});
