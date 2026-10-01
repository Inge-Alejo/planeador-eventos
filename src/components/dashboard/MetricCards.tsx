import React from 'react';
import {
  CalendarDays,
  CalendarCheck2,
  Clock,
  AlertOctagon,
  Building,
  CheckCircle,
  XCircle,
  Users,
  Send,
  Sparkles,
} from 'lucide-react';
import { DashboardMetrics } from '../../types';

interface MetricCardsProps {
  metrics: DashboardMetrics;
  onNavigateToTab: (tab: any, filter?: any) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, onNavigateToTab }) => {
  const cards = [
    {
      title: 'Eventos Hoy',
      value: metrics.eventsToday,
      subtitle: 'Programados en agenda',
      icon: CalendarDays,
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-50',
      borderColor: 'hover:border-indigo-300',
      action: () => onNavigateToTab('calendario', { view: 'day' }),
      highlight: metrics.eventsToday > 0,
    },
    {
      title: 'Conflictos Activos',
      value: metrics.activeConflictsCount,
      subtitle: metrics.activeConflictsCount > 0 ? 'Requieren atención' : 'Sin cruces detectados',
      icon: AlertOctagon,
      iconColor: metrics.activeConflictsCount > 0 ? 'text-rose-600' : 'text-emerald-600',
      iconBg: metrics.activeConflictsCount > 0 ? 'bg-rose-50' : 'bg-emerald-50',
      borderColor: metrics.activeConflictsCount > 0 ? 'border-rose-300 hover:border-rose-400' : 'hover:border-emerald-300',
      badge: metrics.activeConflictsCount > 0 ? 'Alerta' : 'OK',
      badgeColor: metrics.activeConflictsCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700',
      action: () => onNavigateToTab('eventos', { filter: 'conflictos' }),
      isCritical: metrics.activeConflictsCount > 0,
    },
    {
      title: 'Espacios Ocupados',
      value: metrics.occupiedSpacesNow,
      subtitle: `${metrics.availableSpacesNow} disponibles ahora`,
      icon: Building,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      borderColor: 'hover:border-amber-300',
      action: () => onNavigateToTab('espacios'),
    },
    {
      title: 'Solicitudes Pendientes',
      value: metrics.pendingRequestsCount,
      subtitle: 'Personas por confirmar',
      icon: Send,
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-50',
      borderColor: 'hover:border-sky-300',
      action: () => onNavigateToTab('solicitudes'),
    },
    {
      title: 'Eventos Confirmados',
      value: metrics.eventsConfirmed,
      subtitle: 'Listos para ejecución',
      icon: CheckCircle,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      borderColor: 'hover:border-emerald-300',
      action: () => onNavigateToTab('eventos', { status: 'confirmado' }),
    },
    {
      title: 'Pendientes Confirmación',
      value: metrics.eventsPendingConfirmation,
      subtitle: 'A la espera de respuesta',
      icon: Clock,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
      borderColor: 'hover:border-purple-300',
      action: () => onNavigateToTab('eventos', { status: 'pendiente_confirmacion' }),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={card.action}
            className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-3.5 sm:p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${
              card.isCritical
                ? 'border-rose-200 bg-rose-50/20'
                : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${card.iconBg} ${card.iconColor} transition-colors`}>
                <Icon className="w-4 h-4" />
              </div>
              {card.badge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                  {card.badge}
                </span>
              )}
            </div>

            <div className="mt-3">
              <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                {card.value}
              </p>
              <h4 className="text-xs font-semibold text-slate-600 mt-0.5">{card.title}</h4>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
