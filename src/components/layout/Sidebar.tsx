import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Building2,
  Users,
  SendHorizontal,
  Bell,
  FileSpreadsheet,
  History,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type ActiveTab =
  | 'dashboard'
  | 'calendario'
  | 'eventos'
  | 'espacios'
  | 'personas'
  | 'solicitudes'
  | 'notificaciones'
  | 'reportes'
  | 'auditoria';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingRequestsCount: number;
  activeConflictsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  pendingRequestsCount,
  activeConflictsCount,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { isAdmin } = useAuth();

  const navItems = [
    { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendario' as ActiveTab, label: 'Calendario', icon: Calendar },
    { id: 'eventos' as ActiveTab, label: 'Eventos / Planeación', icon: CalendarCheck },
    { id: 'espacios' as ActiveTab, label: 'Espacios', icon: Building2 },
    { id: 'personas' as ActiveTab, label: 'Personas', icon: Users },
    {
      id: 'solicitudes' as ActiveTab,
      label: 'Solicitudes',
      icon: SendHorizontal,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    { id: 'notificaciones' as ActiveTab, label: 'Notificaciones', icon: Bell },
    { id: 'reportes' as ActiveTab, label: 'Reportes', icon: FileSpreadsheet },
    { id: 'auditoria' as ActiveTab, label: 'Auditoría', icon: History, adminOnly: true },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white shadow-xl lg:shadow-none transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base flex items-center gap-1">
                EventFlow
                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                  PRO
                </span>
              </span>
              <p className="text-[11px] text-slate-400 font-medium leading-none">
                Planeación Empresarial
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen de Conflictos Activos si existen */}
        {activeConflictsCount > 0 && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200/60">
            <div className="flex items-center justify-between text-xs font-semibold text-rose-800">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                Conflictos activos
              </span>
              <span className="rounded-full bg-rose-200/80 px-2 py-0.5 text-[11px] font-bold text-rose-900">
                {activeConflictsCount}
              </span>
            </div>
            <p className="text-[11px] text-rose-600 mt-1">
              Existen cruces de horario en espacios o personas.
            </p>
          </div>
        )}

        {/* Navegación Principal */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Módulos del Sistema
          </p>

          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                      item.badgeColor || 'bg-indigo-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer del Sidebar con indicador de zona horaria y estado */}
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Zona Horaria:</span>
              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">
                America/Bogota
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sincronización en vivo activa
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
