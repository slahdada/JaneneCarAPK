import React, { useState } from 'react';
import { Driver, Rental } from '../types';
import { validateTelephone, formatTelephone, cleanDriverName } from '../utils/validation';
import { formatHumanName } from '../utils/textFormat';
import { exportDriversListPdf } from '../services/pdfService';
import { exportDriversToCsv } from '../services/csvService';
import { WhatsAppButton } from '../components/WhatsAppButton';
import { PageHeader } from '../components/ui/PageHeader';
import {
  Users,
  Plus,
  Search,
  Phone,
  CreditCard,
  Award,
  Trash2,
  Edit2,
  X,
  Check,
  AlertCircle,
  UserCheck,
  FileDown,
  LayoutGrid,
  List,
  MoreHorizontal,
} from 'lucide-react';

interface DriversViewProps {
  drivers: Driver[];
  rentals?: Rental[];
  onAddDriver: (driver: Omit<Driver, 'id'>) => void;
  onUpdateDriver: (id: string, updates: Partial<Driver>) => void;
  onDeleteDriver: (id: string) => void;
}

export const DriversView: React.FC<DriversViewProps> = ({
  drivers,
  rentals = [],
  onAddDriver,
  onUpdateDriver,
  onDeleteDriver,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('drivers_view_mode') as 'grid' | 'list') || 'grid';
  });
  const [deletingDriverId, setDeletingDriverId] = useState<string | null>(null);

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('drivers_view_mode', mode);
  };

  // Form states
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [cin, setCin] = useState('');
  const [numeroPermis, setNumeroPermis] = useState('');
  const [statut, setStatut] = useState<'Actif' | 'En congé' | 'Inactif'>('Actif');
  const [errorMsg, setErrorMsg] = useState('');

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setNom('');
    setTelephone('');
    setCin('');
    setNumeroPermis('');
    setStatut('Actif');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Driver) => {
    setEditingDriver(d);
    setNom(cleanDriverName(d.nom));
    setTelephone(d.telephone);
    setCin(d.cin || '');
    setNumeroPermis(d.numeroPermis || '');
    setStatut(d.statut || 'Actif');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNom = formatHumanName(cleanDriverName(nom));
    if (!cleanNom) {
      setErrorMsg('Veuillez saisir le nom du chauffeur.');
      return;
    }

    const telVal = validateTelephone(telephone);
    if (!telVal.isValid) {
      setErrorMsg(telVal.error || 'Format de téléphone tunisien incorrect.');
      return;
    }

    if (editingDriver) {
      onUpdateDriver(editingDriver.id, {
        nom: cleanNom,
        telephone: telephone.trim(),
        cin: cin.trim(),
        numeroPermis: numeroPermis.trim(),
        statut,
      });
    } else {
      onAddDriver({
        nom: cleanNom,
        telephone: telephone.trim(),
        cin: cin.trim(),
        numeroPermis: numeroPermis.trim(),
        statut,
        totalLocations: 0,
      });
    }

    setIsModalOpen(false);
  };

  const filteredDrivers = drivers.filter((d) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      !q ||
      d.nom.toLowerCase().includes(q) ||
      d.telephone.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) ||
      (d.cin && d.cin.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      <PageHeader
        icon={Users}
        eyebrow="Gestion"
        title="Conducteurs"
        description={`${drivers.length} conducteur${drivers.length > 1 ? 's' : ''} enregistré${drivers.length > 1 ? 's' : ''}. Retrouvez rapidement les coordonnées et l’historique de location.`}
        primaryAction={<button onClick={handleOpenAdd} className="ui-btn-primary"><Plus className="h-4 w-4" />Ajouter un conducteur</button>}
        secondaryActions={
          <details className="relative">
            <summary className="ui-btn-secondary list-none"><MoreHorizontal className="h-4 w-4" />Plus d'actions</summary>
            <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <button onClick={() => exportDriversToCsv(drivers)} className="ui-menu-action"><FileDown className="h-4 w-4" />Exporter en CSV</button>
              <button onClick={() => exportDriversListPdf(drivers, rentals)} className="ui-menu-action"><FileDown className="h-4 w-4" />Enregistrer en PDF</button>
            </div>
          </details>
        }
      />

      {/* Search Bar & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone tunisien ou CIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* View Switcher: Grid vs List */}
        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleViewModeChange('grid')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-slate-800 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Affichage en Grille"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleViewModeChange('list')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-slate-800 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Affichage en Liste"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drivers List or Table */}
      {filteredDrivers.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrivers.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                      {d.nom.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{d.nom}</h3>
                      <span
                        className={`inline-block px-2 py-0.2 rounded text-[10px] font-bold ${
                          d.statut === 'Actif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.statut === 'En congé'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {d.statut || 'Actif'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(d)}
                      className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteDriver(d.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3.5 h-3.5" /> Téléphone :
                    </span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${d.telephone.replace(/\s+/g, '')}`}
                        className="font-mono font-bold text-blue-600 hover:underline"
                        title="Appeler par téléphone"
                      >
                        {formatTelephone(d.telephone)}
                      </a>
                      <WhatsAppButton
                        phone={d.telephone}
                        chauffeurName={d.nom}
                        variant="icon"
                        size="xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <CreditCard className="w-3.5 h-3.5" /> CIN :
                    </span>
                    <span className="font-mono font-medium">{d.cin || 'Non renseigné'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Award className="w-3.5 h-3.5" /> Permis :
                    </span>
                    <span className="font-mono font-medium">{d.numeroPermis || 'TN-VALIDE'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Locations effectuées :</span>
                  </span>
                  <span className="font-bold text-slate-800">{d.totalLocations || 1}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 text-left">Chauffeur</th>
                    <th className="py-3 px-4 text-left">N° CIN</th>
                    <th className="py-3 px-4 text-left">Téléphone</th>
                    <th className="py-3 px-4 text-left">N° Permis</th>
                    <th className="py-3 px-4 text-center">Locations</th>
                    <th className="py-3 px-4 text-left">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDrivers.map((d) => {
                    const isDeleting = deletingDriverId === d.id;
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/40 transition-colors">
                        {/* Name and avatar */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-100 shrink-0">
                              {d.nom.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="font-bold text-slate-900 text-sm">
                              {d.nom}
                            </div>
                          </div>
                        </td>

                        {/* CIN */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {d.cin || 'Non renseigné'}
                          </span>
                        </td>

                        {/* Telephone & WhatsApp */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-xs">
                            <a
                              href={`tel:${d.telephone.replace(/\s+/g, '')}`}
                              className="font-mono font-bold text-blue-600 hover:underline"
                              title="Appeler par téléphone"
                            >
                              {formatTelephone(d.telephone)}
                            </a>
                            <WhatsAppButton
                              phone={d.telephone}
                              chauffeurName={d.nom}
                              variant="icon"
                              size="xs"
                            />
                          </div>
                        </td>

                        {/* Permis */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-xs text-slate-700">
                            {d.numeroPermis || 'TN-VALIDE'}
                          </span>
                        </td>

                        {/* Total Locations count */}
                        <td className="py-3 px-4 text-center whitespace-nowrap font-bold text-slate-700 text-sm">
                          {d.totalLocations || 1}
                        </td>

                        {/* Statut Dropdown Quick Select */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <select
                            value={d.statut || 'Actif'}
                            onChange={(e) => onUpdateDriver(d.id, { statut: e.target.value as any })}
                            className={`text-xs font-bold py-1 px-2 border rounded-lg bg-white cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                              d.statut === 'Actif'
                                ? 'text-emerald-700 border-emerald-300 bg-emerald-50/30'
                                : d.statut === 'En congé'
                                ? 'text-amber-700 border-amber-300 bg-amber-50/30'
                                : 'text-slate-600 border-slate-300 bg-slate-50'
                            }`}
                          >
                            <option value="Actif">Actif</option>
                            <option value="En congé">En congé</option>
                            <option value="Inactif">Inactif</option>
                          </select>
                        </td>

                        {/* Actions: Edit & Delete */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(d)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {isDeleting ? (
                              <div className="inline-flex items-center gap-1 px-1 py-0.5 bg-rose-50 border border-rose-200 rounded-lg animate-in fade-in">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteDriver(d.id);
                                    setDeletingDriverId(null);
                                  }}
                                  className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md"
                                  title="Confirmer la suppression"
                                >
                                  Oui
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingDriverId(null)}
                                  className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-md"
                                >
                                  Non
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingDriverId(d.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          Aucun chauffeur trouvé correspondant à votre recherche.
        </div>
      )}

      {/* Driver Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="text-base font-bold text-slate-900">
                {editingDriver ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nom et prénom <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(formatHumanName(e.target.value))}
                  placeholder="Ex. Mohamed Ben Salah"
                  autoComplete="name"
                  className="ui-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Numéro de téléphone tunisien <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="Ex. 22 123 456"
                  autoComplete="tel"
                  className="ui-field font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    N° CIN
                  </label>
                  <input
                    type="text"
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    placeholder="Ex. 01234567"
                    className="ui-field font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    N° Permis
                  </label>
                  <input
                    type="text"
                    value={numeroPermis}
                    onChange={(e) => setNumeroPermis(e.target.value)}
                    placeholder="Ex. TN-12345"
                    className="ui-field font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Statut
                </label>
                <select
                  value={statut}
                  onChange={(e) => setStatut(e.target.value as any)}
                  className="ui-field"
                >
                  <option value="Actif">Actif</option>
                  <option value="En congé">En congé</option>
                  <option value="Inactif">Inactif</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingDriver ? 'Enregistrer les modifications' : 'Ajouter le conducteur'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
