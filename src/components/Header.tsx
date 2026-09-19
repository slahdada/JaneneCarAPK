import React, { useEffect, useState } from 'react';
import { ActiveTab } from '../types';
import {
  LayoutDashboard, Car, KeyRound, Users, BarChart3, Settings, Menu, X,
  Plus, AlertTriangle, Clock, Sun, Moon, ChevronLeft, ChevronRight, Maximize2, Minimize2,
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  rentalsCount: number;
  returnsTodayCount: number;
  lateRentalsCount?: number;
  onFilterByStatus?: (status: string) => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

const groups: Array<{ label: string; items: Array<{ tab: ActiveTab; label: string; icon: React.ElementType }> }> = [
  { label: 'Vue d’ensemble', items: [{ tab: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard }] },
  { label: 'Gestion', items: [
    { tab: 'rentals', label: 'Locations', icon: KeyRound },
    { tab: 'vehicles', label: 'Véhicules', icon: Car },
    { tab: 'drivers', label: 'Conducteurs', icon: Users },
  ] },
  { label: 'Suivi', items: [{ tab: 'reports', label: 'Rapports & historique', icon: BarChart3 }] },
  { label: 'Configuration', items: [{ tab: 'settings', label: 'Paramètres', icon: Settings }] },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab, onTabChange, onOpenAddModal, rentalsCount, returnsTodayCount,
  lateRentalsCount = 0, onFilterByStatus, theme = 'light', onToggleTheme,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  const go = (tab: ActiveTab) => { onTabChange(tab); setMobileOpen(false); };
  const nav = (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-4 dark:border-slate-800">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"><img src="/icon-192.png" alt="Icône Janen_Car" className="h-full w-full object-cover" /></div>
        {!collapsed && <div className="min-w-0"><p className="font-extrabold tracking-tight text-slate-950 dark:text-white">Janen_Car</p><p className="truncate text-[11px] text-slate-500">Gestion de location</p></div>}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            {!collapsed && <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{group.label}</p>}
            <div className="space-y-1">
              {group.items.map(({ tab, label, icon: Icon }) => (
                <button key={tab} onClick={() => go(tab)} className={`ui-nav-item ${activeTab === tab ? 'is-active' : ''}`} aria-current={activeTab === tab ? 'page' : undefined} title={collapsed ? label : undefined}>
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                  {!collapsed && tab === 'rentals' && rentalsCount > 0 && <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800">{rentalsCount}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200/80 p-3 dark:border-slate-800">
        <button onClick={onOpenAddModal} className="ui-btn-primary w-full justify-center" title={collapsed ? 'Nouvelle location' : undefined}><Plus className="h-4 w-4" />{!collapsed && 'Nouvelle location'}</button>
        <div className={`mt-3 flex ${collapsed ? 'flex-col' : ''} gap-2`}>
          <button onClick={onToggleTheme} className="ui-icon-button flex-1" aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'} title="Changer le thème">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          <button onClick={toggleFullscreen} className="ui-icon-button flex-1" aria-label={isFullscreen ? 'Quitter le plein écran' : 'Passer en plein écran'} title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}>{isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
          <button onClick={() => setCollapsed((v) => !v)} className="ui-icon-button hidden flex-1 lg:inline-flex" aria-label={collapsed ? 'Déployer la barre latérale' : 'Réduire la barre latérale'}>{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200/80 bg-white/95 backdrop-blur lg:flex lg:flex-col dark:border-slate-800 dark:bg-slate-950/95 ${collapsed ? 'w-20' : 'w-64'}`} data-sidebar={collapsed ? 'collapsed' : 'expanded'}>{nav}</aside>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/90">
        <button onClick={() => { setCollapsed(false); setMobileOpen(true); }} className="ui-icon-button" aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></button>
        <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"><img src="/icon-192.png" alt="Icône Janen_Car" className="h-full w-full object-cover" /></div><span className="font-extrabold">Janen_Car</span></div>
        <button onClick={onOpenAddModal} className="ui-icon-button text-blue-600" aria-label="Nouvelle location"><Plus className="h-5 w-5" /></button>
      </header>
      {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button className="absolute inset-0 bg-slate-950/45" onClick={() => setMobileOpen(false)} aria-label="Fermer le menu" /><aside className="relative flex h-full w-[86%] max-w-xs flex-col bg-white shadow-2xl dark:bg-slate-950"><button onClick={() => setMobileOpen(false)} className="ui-icon-button absolute right-3 top-3 z-10" aria-label="Fermer"><X className="h-5 w-5" /></button>{nav}</aside></div>}
      {(lateRentalsCount > 0 || returnsTodayCount > 0) && (
        <div className="fixed bottom-4 right-4 z-30 hidden max-w-sm gap-2 lg:flex">
          {lateRentalsCount > 0 && <button onClick={() => onFilterByStatus?.('En retard')} className="ui-alert-chip is-danger"><AlertTriangle className="h-4 w-4" />{lateRentalsCount} en retard</button>}
          {returnsTodayCount > 0 && <button onClick={() => onFilterByStatus?.("Retour aujourd'hui")} className="ui-alert-chip"><Clock className="h-4 w-4" />{returnsTodayCount} retour{returnsTodayCount > 1 ? 's' : ''}</button>}
        </div>
      )}
    </>
  );
};
