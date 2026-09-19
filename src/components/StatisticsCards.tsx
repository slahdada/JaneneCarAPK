import React from 'react';
import {
  Car,
  CheckCircle2,
  KeyRound,
  CalendarCheck,
  Wrench,
  Clock,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { RentalStatus } from '../types';

interface StatisticsCardsProps {
  totalVehicles: number;
  availableCount: number;
  rentedCount: number;
  reservedCount: number;
  maintenanceCount: number;
  returnsTodayCount: number;
  lateCount: number;
  onFilterByStatus?: (status: RentalStatus | 'all') => void;
  selectedStatus?: string;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  totalVehicles,
  availableCount,
  rentedCount,
  reservedCount,
  maintenanceCount,
  returnsTodayCount,
  lateCount,
  onFilterByStatus,
  selectedStatus,
}) => {
  const cards = [
    {
      id: 'total',
      title: 'Total des véhicules',
      count: totalVehicles,
      subtitle: 'Flotte automobile totale',
      icon: Car,
      textColor: 'text-slate-900',
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      iconBg: 'bg-slate-100 text-slate-700',
      filterValue: 'all',
    },
    {
      id: 'disponible',
      title: 'Disponibles',
      count: availableCount,
      subtitle: 'Prêts pour la location',
      icon: CheckCircle2,
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50/40',
      borderColor: 'border-emerald-200',
      iconBg: 'bg-emerald-100 text-emerald-700',
      filterValue: 'Disponible',
    },
    {
      id: 'loues',
      title: 'Loués',
      count: rentedCount,
      subtitle: 'Actuellement sur route',
      icon: KeyRound,
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-50/40',
      borderColor: 'border-rose-200',
      iconBg: 'bg-rose-100 text-rose-700',
      filterValue: 'Louée',
    },
    {
      id: 'reserves',
      title: 'Réservés',
      count: reservedCount,
      subtitle: 'Départs à venir',
      icon: CalendarCheck,
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50/40',
      borderColor: 'border-amber-200',
      iconBg: 'bg-amber-100 text-amber-700',
      filterValue: 'Réservée',
    },
    {
      id: 'maintenance',
      title: 'En maintenance',
      count: maintenanceCount,
      subtitle: 'Atelier & réparations',
      icon: Wrench,
      textColor: 'text-slate-700',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-300',
      iconBg: 'bg-slate-200 text-slate-700',
      filterValue: 'En maintenance',
    },
    {
      id: 'retours_aujourdhui',
      title: "Retours aujourd'hui",
      count: returnsTodayCount,
      subtitle: 'À restituer ce jour',
      icon: Clock,
      textColor: 'text-purple-700',
      bgColor: 'bg-purple-50/40',
      borderColor: 'border-purple-200',
      iconBg: 'bg-purple-100 text-purple-700',
      filterValue: 'Retour aujourd\'hui',
      highlight: returnsTodayCount > 0,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = selectedStatus === card.filterValue;

          return (
            <div
              key={card.id}
              id={`stat-card-${card.id}`}
              onClick={() => onFilterByStatus && onFilterByStatus(card.filterValue as any)}
              className={`relative rounded-xl p-4 border transition-all duration-200 ${
                card.bgColor
              } ${card.borderColor} ${
                onFilterByStatus ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
              } ${isSelected ? 'ring-2 ring-blue-600 shadow-md' : 'shadow-2xs'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 line-clamp-1">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${card.textColor}`}>
                  {card.count}
                </span>
                {onFilterByStatus && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>

              <p className="mt-1 text-[11px] font-medium text-slate-500 truncate">
                {card.subtitle}
              </p>

              {card.highlight && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {lateCount > 0 && (
        <div
          onClick={() => onFilterByStatus && onFilterByStatus('En retard')}
          className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 cursor-pointer hover:bg-red-100 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-200 text-red-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold">
                Attention : {lateCount} véhicule{lateCount > 1 ? 's' : ''} en retard de restitution !
              </span>
              <p className="text-xs text-red-600">
                La date de retour prévue est dépassée. Cliquez ici pour filtrer les locations en retard.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-600 text-white">
            Voir les retards
          </span>
        </div>
      )}
    </div>
  );
};
