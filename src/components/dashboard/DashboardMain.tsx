import React, { useState } from 'react';
import {
  DashboardMetrics,
  ConflictItem,
  Space,
  EventEntity,
  Person,
  AuditLog,
} from '../../types';
import { MetricCards } from './MetricCards';
import { ConflictWidget } from './ConflictWidget';
import { SpaceOccupationChart } from './SpaceOccupationChart';
import { EventsChart } from './EventsChart';
import { UpcomingEventsList } from './UpcomingEventsList';
import { RecentActivityFeed } from './RecentActivityFeed';
import { getBogotaToday, formatFriendlyDate } from '../../lib/timezone';
import { Calendar, Filter, Sparkles } from 'lucide-react';

interface DashboardMainProps {
  metrics: DashboardMetrics;
  conflicts: ConflictItem[];
  spaces: Space[];
  events: EventEntity[];
  people: Person[];
  auditLogs: AuditLog[];
  onNavigateToTab: (tab: any, filter?: any) => void;
  onSelectEvent: (eventId: string) => void;
  onOpenCreateEvent: (preset?: { date?: string; time?: string; spaceId?: string }) => void;
}

export const DashboardMain: React.FC<DashboardMainProps> = ({
  metrics,
  conflicts,
  spaces,
  events,
  people,
  auditLogs,
  onNavigateToTab,
  onSelectEvent,
  onOpenCreateEvent,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getBogotaToday());

  return (
    <div className="space-y-6">
      {/* Saludo y selector de contexto de fecha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl border border-slate-200/80 bg-gradient-to-r from-white via-indigo-50/20 to-white p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
              <Sparkles className="w-3.5 h-3.5" />
              Centro de Control Operativo
            </span>
          </div>
          <h1 className="mt-1 text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Planeación y Monitoreo en Tiempo Real
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Detección automática de conflictos, disponibilidad de espacios y gestión de personal.
          </p>
        </div>

        {/* Selector de Fecha para el Timeline y visualización */}
        <div className="flex items-center gap-2 self-start sm:self-center bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <Calendar className="w-4 h-4 text-indigo-600 ml-2" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border-none bg-transparent px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none font-mono"
          />
          {selectedDate !== getBogotaToday() && (
            <button
              onClick={() => setSelectedDate(getBogotaToday())}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-lg"
            >
              Hoy
            </button>
          )}
        </div>
      </div>

      {/* 1. Indicadores Principales (Métricas Interactivas) */}
      <MetricCards metrics={metrics} onNavigateToTab={onNavigateToTab} />

      {/* 2. Bloque Destacado de Conflictos y Alertas */}
      <ConflictWidget conflicts={conflicts} onSelectEvent={onSelectEvent} />

      {/* 3. Matriz de Ocupación de Espacios (Timeline de Recursos) */}
      <SpaceOccupationChart
        spaces={spaces}
        events={events}
        selectedDate={selectedDate}
        onSelectEvent={onSelectEvent}
        onSelectSpaceTimeSlot={(spaceId, hour) => {
          onOpenCreateEvent({ date: selectedDate, time: hour, spaceId });
        }}
      />

      {/* 4. Gráficas Analíticas (Tipos, Estados y Carga por Persona) */}
      <EventsChart events={events} people={people} />

      {/* 5. Próximos Eventos y Actividad Reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingEventsList
          events={events}
          onSelectEvent={onSelectEvent}
          onViewAll={() => onNavigateToTab('eventos')}
        />
        <RecentActivityFeed
          logs={auditLogs}
          onViewAllAudit={() => onNavigateToTab('auditoria')}
        />
      </div>
    </div>
  );
};
