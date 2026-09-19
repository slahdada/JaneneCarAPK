import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  totalResults?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = '🔍 Rechercher (marque, modèle, matricule, chauffeur, téléphone, statut)...',
  totalResults,
}) => {
  return (
    <div className="relative flex-1">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        id="search-rentals-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          title="Effacer la recherche"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
