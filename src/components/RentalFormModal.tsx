import React, { useState, useEffect, useMemo } from 'react';
import { Rental, RentalStatus, Driver, Vehicle } from '../types';
import { getCarBrands, getAllModelsForBrand } from '../data/carBrands';
import { validateMatricule, formatMatriculeInput, validateTelephone, cleanDriverName } from '../utils/validation';
import { capitalizeSentence, formatHumanName } from '../utils/textFormat';
import { calculateRentalDays, validateDates, getTodayDateString, determineRentalStatusByDates, toDateInputValue } from '../utils/dateUtils';
import { TunisianPlateBadge } from './TunisianPlateBadge';
import { VehicleSearchableSelect } from './VehicleSearchableSelect';
import { checkRentalConflict, RentalConflict, getVehicleAvailability } from '../utils/conflictUtils';
import { X, Calendar, AlertCircle, UserPlus, Car, Check, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';

interface RentalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Rental, 'id' | 'numero' | 'dateCreation' | 'dateModification'>) => void;
  initialData?: Rental | null;
  mode: 'add' | 'edit' | 'duplicate';
  availableDrivers: Driver[];
  availableVehicles?: Vehicle[];
  existingRentals?: Rental[];
  onAddNewDriver?: (name: string, phone: string) => void;
}

export const RentalFormModal: React.FC<RentalFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  availableDrivers,
  availableVehicles = [],
  existingRentals = [],
  onAddNewDriver,
}) => {
  const [marque, setMarque] = useState<string>('');
  const [modele, setModele] = useState<string>('');
  const [matricule, setMatricule] = useState<string>('');
  const [chauffeur, setChauffeur] = useState<string>('');
  const [telephone, setTelephone] = useState<string>('');
  const [dateDepart, setDateDepart] = useState<string>('');
  const [dateRetour, setDateRetour] = useState<string>('');
  const [statut, setStatut] = useState<RentalStatus>('Louée');
  const [prixParJour, setPrixParJour] = useState<number | string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedFleetVehicleId, setSelectedFleetVehicleId] = useState<string>('');

  // Détails d'identification supplémentaires du locataire
  const [dateNaissance, setDateNaissance] = useState<string>('');
  const [lieuNaissance, setLieuNaissance] = useState<string>('');
  const [nationalite, setNationalite] = useState<string>('');
  const [dateEntreeTunisie, setDateEntreeTunisie] = useState<string>('');
  const [cinOuPasseport, setCinOuPasseport] = useState<string>('');
  const [cinDate, setCinDate] = useState<string>('');
  const [cinLieu, setCinLieu] = useState<string>('');
  const [adressePermanente, setAdressePermanente] = useState<string>('');
  const [adresseTunisie, setAdresseTunisie] = useState<string>('');
  const [permisNumero, setPermisNumero] = useState<string>('');
  const [permisDate, setPermisDate] = useState<string>('');
  const [permisLieu, setPermisLieu] = useState<string>('');

  // Conducteur secondaire (Autres conducteurs)
  const [conducteurSecNom, setConducteurSecNom] = useState<string>('');
  const [conducteurSecCin, setConducteurSecCin] = useState<string>('');
  const [conducteurSecCinDate, setConducteurSecCinDate] = useState<string>('');
  const [conducteurSecPermis, setConducteurSecPermis] = useState<string>('');
  const [conducteurSecPermisDate, setConducteurSecPermisDate] = useState<string>('');
  const [conducteurSecAdresse, setConducteurSecAdresse] = useState<string>('');
  const [conducteurSecTelephone, setConducteurSecTelephone] = useState<string>('');

  // Expandable sections toggle
  const [showExtraDetails, setShowExtraDetails] = useState<boolean>(false);
  const [showSecondaryDriver, setShowSecondaryDriver] = useState<boolean>(false);

  // Mode adding new driver inline
  const [isCustomDriver, setIsCustomDriver] = useState<boolean>(false);

  // Errors map
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or initialize fields
  useEffect(() => {
    if (initialData) {
      const today = getTodayDateString();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      const returnDateStr = threeDaysLater.toISOString().split('T')[0];

      const matchingVeh = availableVehicles.find(
        (v) =>
          initialData.matricule &&
          v.matricule.trim().toUpperCase() === initialData.matricule.trim().toUpperCase()
      );

      const initDepart = initialData.dateDepart || today;
      const initRetour = initialData.dateRetour || returnDateStr;

      setMarque(initialData.marque || (matchingVeh ? matchingVeh.marque : 'Toyota'));
      setModele(initialData.modele || (matchingVeh ? matchingVeh.modele : 'Yaris'));
      setMatricule(initialData.matricule || (matchingVeh ? matchingVeh.matricule : ''));
      setChauffeur(cleanDriverName(initialData.chauffeur || ''));
      setTelephone(initialData.telephone || '');
      setDateDepart(toDateInputValue(initDepart));
      setDateRetour(toDateInputValue(initRetour));
      if (mode === 'duplicate') {
        setStatut(determineRentalStatusByDates(initDepart, initRetour));
      } else {
        setStatut(initialData.statut || determineRentalStatusByDates(initDepart, initRetour));
      }
      // Ne conserver le tarif existant qu'en mode 'edit' (modification).
      // En mode 'add' ou 'duplicate', le tarif reste vierge pour forcer la saisie manuelle.
      if (mode === 'edit' && initialData.prixParJour !== undefined && initialData.prixParJour !== null) {
        setPrixParJour(initialData.prixParJour);
      } else {
        setPrixParJour('');
      }
      setNotes(initialData.notes || '');
      setIsCustomDriver(false);
      setSelectedFleetVehicleId(matchingVeh ? matchingVeh.id : '');

      // Load additional fields
      setDateNaissance(toDateInputValue(initialData.dateNaissance || ''));
      setLieuNaissance(initialData.lieuNaissance || '');
      setNationalite(initialData.nationalite || '');
      setDateEntreeTunisie(toDateInputValue(initialData.dateEntreeTunisie || ''));
      setCinOuPasseport(initialData.cinOuPasseport || '');
      setCinDate(toDateInputValue(initialData.cinDate || ''));
      setCinLieu(initialData.cinLieu || '');
      setAdressePermanente(initialData.adressePermanente || '');
      setAdresseTunisie(initialData.adresseTunisie || '');
      setPermisNumero(initialData.permisNumero || '');
      setPermisDate(toDateInputValue(initialData.permisDate || ''));
      setPermisLieu(initialData.permisLieu || '');

      setConducteurSecNom(initialData.conducteurSecNom || '');
      setConducteurSecCin(initialData.conducteurSecCin || '');
      setConducteurSecCinDate(toDateInputValue(initialData.conducteurSecCinDate || ''));
      setConducteurSecPermis(initialData.conducteurSecPermis || '');
      setConducteurSecPermisDate(toDateInputValue(initialData.conducteurSecPermisDate || ''));
      setConducteurSecAdresse(initialData.conducteurSecAdresse || '');
      setConducteurSecTelephone(initialData.conducteurSecTelephone || '');
      
      // Auto-expand if fields have values
      setShowExtraDetails(
        !!(initialData.dateNaissance || initialData.lieuNaissance || initialData.nationalite || 
           initialData.cinOuPasseport || initialData.adressePermanente || initialData.permisNumero)
      );
      setShowSecondaryDriver(!!initialData.conducteurSecNom);

    } else {
      const today = getTodayDateString();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      const returnDateStr = threeDaysLater.toISOString().split('T')[0];

      setMarque('Toyota');
      setModele('Yaris');
      setMatricule('');
      setChauffeur('');
      setTelephone('');
      setDateDepart(today);
      setDateRetour(returnDateStr);
      setStatut(determineRentalStatusByDates(today, returnDateStr));
      setPrixParJour('');
      setNotes('');
      setIsCustomDriver(false);
      setSelectedFleetVehicleId('');

      // Clear additional fields
      setDateNaissance('');
      // Valeurs par défaut pour une nouvelle fiche uniquement.
      // Elles restent modifiables par l'utilisateur et ne sont pas appliquées aux fiches existantes.
      setLieuNaissance('Tunis');
      setNationalite('Tunisienne');
      setDateEntreeTunisie('');
      setCinOuPasseport('');
      setCinDate('');
      setCinLieu('Tunis');
      setAdressePermanente('');
      setAdresseTunisie('');
      setPermisNumero('');
      setPermisDate('');
      setPermisLieu('Tunis');

      setConducteurSecNom('');
      setConducteurSecCin('');
      setConducteurSecCinDate('');
      setConducteurSecPermis('');
      setConducteurSecPermisDate('');
      setConducteurSecAdresse('');
      setConducteurSecTelephone('');
      
      setShowExtraDetails(false);
      setShowSecondaryDriver(false);
    }
    setErrors({});
  }, [initialData, isOpen, mode, availableVehicles]);

  // When marque changes, reset modele if current is not in the new brand's list
  const brandOptions = useMemo(() => getCarBrands(), [isOpen]);
  const availableModels = useMemo(() => marque ? getAllModelsForBrand(marque) : [], [marque, isOpen]);

  const handleMarqueChange = (newMarque: string) => {
    setMarque(newMarque);
    const models = getAllModelsForBrand(newMarque);
    if (models.length > 0) {
      setModele(models[0]);
    } else {
      setModele('');
    }
    setSelectedFleetVehicleId('');
    if (errors.marque) {
      setErrors((prev) => ({ ...prev, marque: '' }));
    }
  };

  // Selection directe depuis la flotte de véhicules
  const handleFleetVehicleSelect = (vehId: string) => {
    setSelectedFleetVehicleId(vehId);
    if (!vehId) return;

    const found = availableVehicles.find((v) => v.id === vehId);
    if (found) {
      setMarque(found.marque);
      setModele(found.modele);
      setMatricule(found.matricule);
      // Ne pas pré-remplir automatiquement le tarif pour laisser la saisie manuelle libre
      setErrors((prev) => ({ ...prev, marque: '', modele: '', matricule: '' }));
    }
  };

  // Live calculation of rental days and manual pricing
  const rentalDays = calculateRentalDays(dateDepart, dateRetour);
  const parsedPrix =
    typeof prixParJour === 'number'
      ? prixParJour
      : parseFloat(String(prixParJour).trim());
  const hasValidPrice = !isNaN(parsedPrix) && parsedPrix > 0;
  const numericPrixParJour = hasValidPrice ? parsedPrix : 0;
  // Attends que le montant soit fourni avant de calculer et d'intégrer les frais de location au total
  const totalAmount = hasValidPrice ? rentalDays * numericPrixParJour : 0;

  // Mise à jour automatique du statut selon la date de départ et de retour
  const handleDateDepartChange = (newDepart: string) => {
    setDateDepart(newDepart);
    if (errors.dateRetour) setErrors((prev) => ({ ...prev, dateRetour: '' }));
    if (newDepart) {
      const autoStatus = determineRentalStatusByDates(newDepart, dateRetour);
      setStatut(autoStatus);
    }
  };

  const handleDateRetourChange = (newRetour: string) => {
    setDateRetour(newRetour);
    if (errors.dateRetour) setErrors((prev) => ({ ...prev, dateRetour: '' }));
    if (dateDepart) {
      const autoStatus = determineRentalStatusByDates(dateDepart, newRetour);
      setStatut(autoStatus);
    }
  };

  // Auto-fill phone when choosing an existing driver
  const handleDriverSelect = (driverName: string) => {
    if (driverName === '__new__') {
      setIsCustomDriver(true);
      setChauffeur('');
      setTelephone('');
      return;
    }
    setIsCustomDriver(false);
    const cleaned = cleanDriverName(driverName);
    setChauffeur(cleaned);
    const found = availableDrivers.find(
      (d) => cleanDriverName(d.nom).toLowerCase() === cleaned.toLowerCase()
    );
    if (found) {
      setTelephone(found.telephone);
    }
    if (errors.chauffeur) {
      setErrors((prev) => ({ ...prev, chauffeur: '' }));
    }
  };

  // Smart formatting of matricule
  const handleMatriculeChange = (val: string) => {
    const formatted = formatMatriculeInput(val);
    setMatricule(formatted);
    setSelectedFleetVehicleId('');
    // Real-time error clearance if valid
    const validation = validateMatricule(formatted);
    if (validation.isValid && errors.matricule) {
      setErrors((prev) => ({ ...prev, matricule: '' }));
    }
  };

  // Détection en temps réel de conflit de double réservation
  const conflictInfo: RentalConflict = useMemo(() => {
    if (!matricule.trim() || !dateDepart || !dateRetour) {
      return { hasConflict: false };
    }

    return checkRentalConflict({
      matricule,
      dateDepart,
      dateRetour,
      statut,
      excludeRentalId: mode === 'edit' ? initialData?.id : undefined,
      rentals: existingRentals,
      vehicles: availableVehicles,
    });
  }, [
    matricule,
    dateDepart,
    dateRetour,
    statut,
    mode,
    initialData?.id,
    existingRentals,
    availableVehicles,
  ]);

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!marque.trim()) {
      newErrors.marque = 'Veuillez sélectionner une marque.';
    }

    if (!modele.trim()) {
      newErrors.modele = 'Veuillez sélectionner un modèle.';
    }

    const matValidation = validateMatricule(matricule);
    if (!matValidation.isValid) {
      newErrors.matricule = matValidation.error || 'Format de matricule incorrect. Exemple : 1234 TUN 123';
    }

    if (!chauffeur.trim()) {
      newErrors.chauffeur = 'Veuillez sélectionner ou saisir un chauffeur.';
    }

    const telValidation = validateTelephone(telephone);
    if (!telValidation.isValid) {
      newErrors.telephone = telValidation.error || 'Format de téléphone invalide. Exemple : 22 123 456';
    }

    const dateVal = validateDates(dateDepart, dateRetour);
    if (!dateVal.isValid) {
      newErrors.dateRetour = dateVal.error || 'La date de retour doit être postérieure ou égale à la date de départ.';
    }

    // Règle d'or : interdire la double location / réservation du même véhicule
    if (conflictInfo.hasConflict) {
      newErrors.matricule = conflictInfo.message || 'Ce véhicule est déjà loué ou réservé sur cette période.';
    }

    // Le tarif journalier est facultatif. S'il est saisi, il doit être un montant positif valide
    if (prixParJour !== '' && prixParJour !== null && prixParJour !== undefined) {
      const parsed = parseFloat(String(prixParJour).trim());
      if (isNaN(parsed) || parsed < 0) {
        newErrors.prixParJour = 'Veuillez saisir un montant positif valide ou laisser le champ vide.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;

    const finalChauffeur = cleanDriverName(chauffeur.trim());

    // If new driver entered, trigger driver addition
    if (isCustomDriver && onAddNewDriver && finalChauffeur && telephone) {
      onAddNewDriver(finalChauffeur, telephone.trim());
    }

    onSubmit({
      marque: marque.trim(),
      modele: modele.trim(),
      matricule: matricule.trim().toUpperCase(),
      chauffeur: finalChauffeur,
      telephone: telephone.trim(),
      dateDepart,
      dateRetour,
      nombreJours: rentalDays,
      statut,
      prixParJour: hasValidPrice ? numericPrixParJour : undefined,
      montantTotal: hasValidPrice ? totalAmount : undefined,
      notes: notes.trim(),
      // Additional fields
      dateNaissance: dateNaissance.trim() || undefined,
      lieuNaissance: lieuNaissance.trim() || undefined,
      nationalite: nationalite.trim() || undefined,
      dateEntreeTunisie: dateEntreeTunisie.trim() || undefined,
      cinOuPasseport: cinOuPasseport.trim() || undefined,
      cinDate: cinDate.trim() || undefined,
      cinLieu: cinLieu.trim() || undefined,
      adressePermanente: adressePermanente.trim() || undefined,
      adresseTunisie: adresseTunisie.trim() || undefined,
      permisNumero: permisNumero.trim() || undefined,
      permisDate: permisDate.trim() || undefined,
      permisLieu: permisLieu.trim() || undefined,
      // Secondary Driver
      conducteurSecNom: conducteurSecNom.trim() || undefined,
      conducteurSecCin: conducteurSecCin.trim() || undefined,
      conducteurSecCinDate: conducteurSecCinDate.trim() || undefined,
      conducteurSecPermis: conducteurSecPermis.trim() || undefined,
      conducteurSecPermisDate: conducteurSecPermisDate.trim() || undefined,
      conducteurSecAdresse: conducteurSecAdresse.trim() || undefined,
      conducteurSecTelephone: conducteurSecTelephone.trim() || undefined,
    });
  };

  if (!isOpen) return null;

  const titleMap = {
    add: 'Nouvelle location de véhicule',
    edit: `Modifier la location N°${initialData?.numero}`,
    duplicate: `Dupliquer la location N°${initialData?.numero}`,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-2 sm:p-5 animate-in fade-in duration-150">
      <div
        id="rental-form-modal-container"
        role="dialog" aria-modal="true" aria-labelledby="rental-form-title" className="relative my-2 sm:my-5 w-full max-w-4xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 id="rental-form-title" className="text-lg font-bold text-slate-900 dark:text-white">{titleMap[mode]}</h2>
              <p className="text-xs text-slate-500">
                Renseignez les informations essentielles. Les champs marqués * sont obligatoires.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs leading-5 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200"><strong>Conseil :</strong> commencez par choisir un véhicule de la flotte. Les informations du véhicule seront préremplies automatiquement.</div>
          {/* Sélection rapide depuis le parc automobile avec recherche dynamique intégrée */}
          {availableVehicles && availableVehicles.length > 0 && (
            <div className="relative z-30 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 dark:bg-slate-800/70 dark:border-slate-700">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="vehicle-searchable-select-trigger"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Car className="w-3.5 h-3.5 text-blue-600" />
                  Choisir un véhicule depuis la flotte de l'agence
                </label>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                  {availableVehicles.length} véhicules enregistrés
                </span>
              </div>
              <VehicleSearchableSelect
                vehicles={availableVehicles}
                selectedVehicleId={selectedFleetVehicleId}
                onSelectVehicle={handleFleetVehicleSelect}
                dateDepart={dateDepart}
                dateRetour={dateRetour}
                existingRentals={existingRentals}
                excludeRentalId={mode === 'edit' ? initialData?.id : undefined}
              />
            </div>
          )}

          {/* Row 1: Marque & Modèle (Marque -> Modèles correspondants) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Marque <span className="text-rose-500">*</span>
              </label>
              <select
                id="form-select-marque"
                value={marque}
                onChange={(e) => handleMarqueChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                  errors.marque ? 'border-rose-300 ring-rose-200 bg-rose-50/20' : 'border-slate-300'
                }`}
              >
                <option value="">-- Sélectionner une marque --</option>
                {brandOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              {errors.marque && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.marque}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Modèle (dépendant de la marque) <span className="text-rose-500">*</span>
              </label>
              <select
                id="form-select-modele"
                value={modele}
                onChange={(e) => {
                  setModele(e.target.value);
                  setSelectedFleetVehicleId('');
                  if (errors.modele) setErrors((prev) => ({ ...prev, modele: '' }));
                }}
                disabled={!marque}
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                  !marque
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : errors.modele
                    ? 'border-rose-300 ring-rose-200 bg-rose-50/20'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {!marque ? (
                  <option value="">Veuillez d'abord choisir une marque</option>
                ) : (
                  <>
                    <option value="">-- Sélectionner un modèle --</option>
                    {availableModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {errors.modele && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.modele}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Matricule en français avec auto-formatage & aperçu de la plaque & statut de dispo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Matricule en français <span className="text-rose-500">*</span>
              </label>
              {matricule && validateMatricule(matricule).isValid && (
                <div>
                  {conflictInfo.hasConflict ? (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      Déjà loué / réservé
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Véhicule disponible
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                id="form-input-matricule"
                type="text"
                value={matricule}
                onChange={(e) => handleMatriculeChange(e.target.value)}
                placeholder="Ex. 1234 TUN 123"
                maxLength={13}
                className={`flex-1 px-3.5 py-2.5 text-sm font-mono uppercase bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all ${
                  conflictInfo.hasConflict || errors.matricule
                    ? 'border-rose-300 ring-rose-200 bg-rose-50/20 text-rose-900 font-bold'
                    : 'border-slate-300 text-slate-900'
                }`}
              />
              {matricule && (
                <div className="shrink-0 flex items-center">
                  <TunisianPlateBadge matricule={matricule} size="md" />
                </div>
              )}
            </div>

            {errors.matricule && !conflictInfo.hasConflict && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.matricule}
              </p>
            )}

            {!errors.matricule && !conflictInfo.hasConflict && (
              <p className="text-[11px] text-slate-500 mt-1">
                Format en français : <strong>1234 TUN 123</strong>. Saisissez les chiffres, TUN se formate automatiquement.
              </p>
            )}
          </div>

          {/* BANNIÈRE D'ALERTE STRICTE ANTI-DOUBLE RÉSERVATION */}
          {conflictInfo.hasConflict && (
            <div
              id="alert-double-booking-conflict"
              className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start gap-3 shadow-xs animate-in fade-in"
            >
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-rose-900">
                    Véhicule indisponible — Réservation impossible
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-rose-200 text-rose-800 rounded-md">
                    Non autorisée
                  </span>
                </div>
                <p className="text-rose-700 mt-1 text-xs sm:text-sm leading-relaxed">
                  {conflictInfo.message}
                </p>
                <div className="mt-2 text-xs text-rose-800 font-medium bg-rose-100/70 p-2 rounded-lg">
                  💡 <strong>Solution :</strong> Choisissez un autre véhicule disponible dans la liste ci-dessus ou modifiez la date de départ/retour de ce contrat.
                </div>
              </div>
            </div>
          )}

          {/* Row 3: Chauffeur & Téléphone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Chauffeur / Conducteur <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomDriver(!isCustomDriver)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
                >
                  {isCustomDriver ? 'Choisir existant' : '+ Nouveau chauffeur'}
                </button>
              </div>

              {!isCustomDriver ? (
                <select
                  id="form-select-chauffeur"
                  value={chauffeur}
                  onChange={(e) => handleDriverSelect(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                    errors.chauffeur ? 'border-rose-300 ring-rose-200 bg-rose-50/20' : 'border-slate-300'
                  }`}
                >
                  <option value="">-- Sélectionner un chauffeur --</option>
                  {availableDrivers.map((d) => {
                    const cleanNom = cleanDriverName(d.nom);
                    return (
                      <option key={d.id} value={cleanNom}>
                        {cleanNom}
                      </option>
                    );
                  })}
                  <option value="__new__">+ Nouveau chauffeur...</option>
                </select>
              ) : (
                <div className="relative">
                  <input
                    id="form-input-custom-chauffeur"
                    type="text"
                    value={chauffeur}
                    onChange={(e) => {
                      setChauffeur(e.target.value);
                      if (errors.chauffeur) setErrors((prev) => ({ ...prev, chauffeur: '' }));
                    }}
                    placeholder="Ex. Mohamed Ben Salah"
                    autoComplete="name"
                    onBlur={() => setChauffeur(formatHumanName(cleanDriverName(chauffeur))) }
                    className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      errors.chauffeur ? 'border-rose-300 ring-rose-200 bg-rose-50/20' : 'border-slate-300'
                    }`}
                  />
                  <div className="absolute right-3 top-2.5 text-slate-400">
                    <UserPlus className="w-4 h-4" />
                  </div>
                </div>
              )}

              {errors.chauffeur && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.chauffeur}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Téléphone (Tunisien) <span className="text-rose-500">*</span>
              </label>
              <input
                id="form-input-telephone"
                type="tel"
                value={telephone}
                onChange={(e) => {
                  setTelephone(e.target.value);
                  if (errors.telephone) setErrors((prev) => ({ ...prev, telephone: '' }));
                }}
                placeholder="Ex. 22 123 456"
                autoComplete="tel"
                className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.telephone ? 'border-rose-300 ring-rose-200 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              {errors.telephone && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.telephone}
                </p>
              )}
            </div>
          </div>

          {/* Row 4: Date de départ, Date de retour & Nombre de jours calculé */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-blue-50/30 p-3.5 rounded-xl border border-blue-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date de départ <span className="text-rose-500">*</span>
              </label>
              <input
                id="form-input-date-depart"
                type="date"
                value={dateDepart}
                onChange={(e) => handleDateDepartChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date de retour <span className="text-rose-500">*</span>
              </label>
              <input
                id="form-input-date-retour"
                type="date"
                value={dateRetour}
                onChange={(e) => handleDateRetourChange(e.target.value)}
                className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                  errors.dateRetour ? 'border-rose-300 ring-rose-200' : 'border-slate-300'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nombre de jours (auto)
              </label>
              <div className="flex items-center h-[38px] px-3 bg-white border border-blue-200 rounded-lg text-sm font-bold text-blue-700">
                <Calendar className="w-4 h-4 mr-1.5 text-blue-500" />
                <span>
                  {rentalDays > 0 ? `${rentalDays} jour${rentalDays > 1 ? 's' : ''}` : '-'}
                </span>
              </div>
            </div>

            {errors.dateRetour && (
              <div className="sm:col-span-3">
                <p className="text-xs text-rose-600 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.dateRetour}
                </p>
              </div>
            )}
          </div>

          {/* Row 5: Statut & Prix par jour */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Statut de la location <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ⚡ Auto selon date départ
                </span>
              </div>
              <select
                id="form-select-statut"
                value={statut}
                onChange={(e) => setStatut(e.target.value as RentalStatus)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-800"
              >
                <option value="Disponible">🟢 Disponible</option>
                <option value="Louée">🔴 Louée (en cours)</option>
                <option value="Réservée">🟠 Réservée (départ futur)</option>
                <option value="Retour aujourd'hui">🟣 Retour aujourd'hui</option>
                <option value="En retard">⚠️ En retard</option>
                <option value="En maintenance">🔧 En maintenance</option>
              </select>
              <p className="mt-1 text-[11px] text-slate-500">
                {statut === 'Réservée' && '📅 Date de départ future : véhicule réservé'}
                {statut === 'Louée' && '🚗 Location en cours d\'exécution'}
                {statut === "Retour aujourd'hui" && '🔔 Restitution du véhicule prévue aujourd\'hui'}
                {statut === 'En retard' && '⚠️ Date de restitution échue'}
                {statut === 'Disponible' && '✅ Véhicule clôturé et libre'}
                {statut === 'En maintenance' && '🔧 Maintenance mécanique'}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tarif journalier (TND / jour) <span className="text-slate-400 font-normal lowercase">(facultatif)</span>
                </label>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  Optionnel
                </span>
              </div>
              <div className="relative">
                <input
                  id="form-input-prix"
                  type="number"
                  min="0"
                  step="any"
                  value={prixParJour}
                  onChange={(e) => {
                    setPrixParJour(e.target.value);
                    if (errors.prixParJour) {
                      setErrors((prev) => ({ ...prev, prixParJour: '' }));
                    }
                  }}
                  placeholder="Ex. 120 TND"
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12 font-mono transition-all ${
                    errors.prixParJour
                      ? 'border-rose-300 ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  TND/j
                </span>
              </div>
              {errors.prixParJour && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.prixParJour}
                </p>
              )}

              {/* Total estimé : calculé uniquement lorsque le montant a été fourni par l'utilisateur */}
              <div className="mt-2 text-xs">
                {hasValidPrice ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center justify-between">
                    <span>
                      Total calculé pour <strong>{rentalDays} jour{rentalDays > 1 ? 's' : ''}</strong> ({numericPrixParJour} TND/j) :
                    </span>
                    <strong className="text-sm font-mono font-bold text-emerald-900">
                      {totalAmount} TND
                    </strong>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                    <span>
                      Tarif non renseigné — vous pouvez enregistrer sans prix ou le définir plus tard.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 6: Notes additionnelles */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes & Observations (facultatif)
            </label>
            <textarea
              id="form-textarea-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Conditions particulières, bagages, siège enfant, mode de règlement..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 resize-none"
            />
          </div>

          {/* SECTION COLLAPSIBLE: DÉTAILS D'IDENTIFICATION DU LOCATAIRE */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowExtraDetails(!showExtraDetails)}
              className="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-blue-50 text-blue-600">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800">Détails d'identification du locataire</span>
                  <p className="text-[10px] text-slate-500">Pour le contrat de location PDF officiel (CIN, Permis, Adresse...)</p>
                </div>
              </div>
              {showExtraDetails ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            
            {showExtraDetails && (
              <div className="p-4 border-t border-slate-100 bg-white space-y-4 animate-in slide-in-from-top-1 duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Date de Naissance
                    </label>
                    <input
                      type="date"
                      value={dateNaissance}
                      onChange={(e) => setDateNaissance(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Lieu de Naissance
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. Tunis"
                      value={lieuNaissance}
                      onChange={(e) => setLieuNaissance(capitalizeSentence(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nationalité d'origine
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. Tunisienne"
                      value={nationalite}
                      onChange={(e) => setNationalite(capitalizeSentence(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Date d'entrée en Tunisie
                    </label>
                    <input
                      type="date"
                      value={dateEntreeTunisie}
                      onChange={(e) => setDateEntreeTunisie(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                  <span className="text-xs font-bold text-slate-700 block border-b pb-1">Pièce d'identité (CIN ou Passeport)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Numéro CIN / Passeport</label>
                      <input
                        type="text"
                        placeholder="Ex. 01234567 / P123456"
                        value={cinOuPasseport}
                        onChange={(e) => setCinOuPasseport(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Délivré le</label>
                      <input
                        type="text"
                        placeholder="Ex. 12/04/2020"
                        value={cinDate}
                        onChange={(e) => setCinDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Etabli à / Issued at</label>
                      <input
                        type="text"
                        placeholder="Ex. Tunis"
                        value={cinLieu}
                        onChange={(e) => setCinLieu(capitalizeSentence(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/40 rounded-lg border border-blue-100/50 space-y-3">
                  <span className="text-xs font-bold text-blue-900 block border-b pb-1">Permis de Conduire</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-bold text-blue-800 uppercase mb-1">Numéro du Permis</label>
                      <input
                        type="text"
                        placeholder="Ex. 99/123456"
                        value={permisNumero}
                        onChange={(e) => setPermisNumero(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-blue-800 uppercase mb-1">Délivré le</label>
                      <input
                        type="text"
                        placeholder="Ex. 20/05/2018"
                        value={permisDate}
                        onChange={(e) => setPermisDate(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-blue-800 uppercase mb-1">Délivré à</label>
                      <input
                        type="text"
                        placeholder="Ex. Tunis"
                        value={permisLieu}
                        onChange={(e) => setPermisLieu(capitalizeSentence(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Adresse Permanente
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. 12 Avenue Habib Bourguiba, Tunis"
                      autoComplete="street-address"
                      value={adressePermanente}
                      onChange={(e) => setAdressePermanente(capitalizeSentence(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Adresse en Tunisie
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. Avenue Habib Bourguiba, Tunis"
                      autoComplete="street-address"
                      value={adresseTunisie}
                      onChange={(e) => setAdresseTunisie(capitalizeSentence(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION COLLAPSIBLE: AUTRES CONDUCTEURS / SECONDARY DRIVER */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowSecondaryDriver(!showSecondaryDriver)}
              className="w-full px-4 py-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-amber-50 text-amber-700">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800">Conducteur Secondaire (Facultatif)</span>
                  <p className="text-[10px] text-slate-500">Ajouter les informations d'un autre conducteur sur le contrat</p>
                </div>
              </div>
              {showSecondaryDriver ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            
            {showSecondaryDriver && (
              <div className="p-4 border-t border-slate-100 bg-white space-y-4 animate-in slide-in-from-top-1 duration-150">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nom & Prénom du Conducteur Secondaire
                  </label>
                  <input
                    type="text"
                    placeholder="Ex. Mohamed Ben Salah"
                    autoComplete="name"
                    value={conducteurSecNom}
                    onChange={(e) => setConducteurSecNom(e.target.value)}
                    onBlur={() => setConducteurSecNom(formatHumanName(conducteurSecNom))}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Téléphone Conducteur Sec.
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex. 22 123 456"
                      autoComplete="tel"
                      value={conducteurSecTelephone}
                      onChange={(e) => setConducteurSecTelephone(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Adresse Conducteur Sec.
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. Bardo, Tunis"
                      value={conducteurSecAdresse}
                      onChange={(e) => setConducteurSecAdresse(capitalizeSentence(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Numéro CIN / Passeport
                    </label>
                    <input
                      type="text"
                      placeholder="CIN ou Passeport et Date"
                      value={conducteurSecCin}
                      onChange={(e) => setConducteurSecCin(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Date CIN / Passeport
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. 24/08/2021"
                      value={conducteurSecCinDate}
                      onChange={(e) => setConducteurSecCinDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Numéro de Permis
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. 95/432109"
                      value={conducteurSecPermis}
                      onChange={(e) => setConducteurSecPermis(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Délivré le
                    </label>
                    <input
                      type="text"
                      placeholder="Ex. 11/12/2019"
                      value={conducteurSecPermisDate}
                      onChange={(e) => setConducteurSecPermisDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex items-center justify-end gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:-mx-6 sm:-mb-6 sm:px-6">
            <button
              id="btn-form-cancel"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              id="btn-form-submit"
              type="submit"
              disabled={conflictInfo.hasConflict}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
                conflictInfo.hasConflict
                  ? 'bg-rose-300 text-rose-100 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm shadow-blue-500/30'
              }`}
              title={
                conflictInfo.hasConflict
                  ? 'Véhicule déjà loué ou réservé sur cette période'
                  : 'Enregistrer la location'
              }
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {conflictInfo.hasConflict ? 'Véhicule indisponible' : mode === 'edit' ? 'Enregistrer les modifications' : 'Créer la location'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
