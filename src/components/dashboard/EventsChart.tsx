import React from 'react';
import { EventEntity, Person } from '../../types';
import { PieChart, BarChart3, Users2 } from 'lucide-react';

interface EventsChartProps {
  events: EventEntity[];
  people: Person[];
}

export const EventsChart: React.FC<EventsChartProps> = ({ events, people }) => {
  const activeEvents = events.filter((e) => e.status !== 'cancelado');

  // Conteo por tipo de evento
  const typesMap: Record<string, number> = {
    academico: 0,
    simposio: 0,
    curso: 0,
    transmision: 0,
    catedra: 0,
    congreso: 0,
    conferencia: 0,
    taller: 0,
    reunion: 0,
    grabacion: 0,
    institucional: 0,
    otro: 0,
  };

  activeEvents.forEach((e) => {
    if (typesMap[e.type] !== undefined) typesMap[e.type]++;
    else typesMap.otro = (typesMap.otro || 0) + 1;
  });

  const typeColors: Record<string, string> = {
    academico: 'bg-indigo-500',
    simposio: 'bg-teal-500',
    curso: 'bg-blue-500',
    transmision: 'bg-fuchsia-500',
    catedra: 'bg-orange-500',
    congreso: 'bg-purple-600',
    conferencia: 'bg-violet-500',
    taller: 'bg-amber-500',
    reunion: 'bg-emerald-500',
    grabacion: 'bg-cyan-500',
    institucional: 'bg-rose-500',
    otro: 'bg-slate-400',
  };

  const typeLabels: Record<string, string> = {
    academico: 'Académico',
    simposio: 'Simposio',
    curso: 'Curso',
    transmision: 'Transmisión',
    catedra: 'Cátedra',
    congreso: 'Congreso',
    conferencia: 'Conferencia',
    taller: 'Taller',
    reunion: 'Reunión',
    grabacion: 'Grabación',
    institucional: 'Institucional',
    otro: 'Otro',
  };

  // Conteo por estado
  const statusMap: Record<string, number> = {
    confirmado: 0,
    programado: 0,
    pendiente_confirmacion: 0,
    finalizado: 0,
    cancelado: 0,
  };

  events.forEach((e) => {
    if (statusMap[e.status] !== undefined) statusMap[e.status]++;
  });

  // Carga de trabajo por persona (Top 5)
  const workloadMap: Record<string, { count: number; name: string }> = {};
  people.forEach((p) => {
    workloadMap[p.id] = { count: 0, name: `${p.firstName} ${p.lastName}` };
  });

  activeEvents.forEach((e) => {
    if (Array.isArray(e.peopleIds)) {
      e.peopleIds.forEach((pid) => {
        if (workloadMap[pid]) workloadMap[pid].count++;
      });
    }
  });

  const sortedWorkload = Object.values(workloadMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxWorkload = Math.max(1, ...sortedWorkload.map((w) => w.count));

  // Filtrar tipos más relevantes para mostrar en la gráfica
  const displayTypes = Object.entries(typesMap)
    .filter(([t, count]) => count > 0 || ['academico', 'simposio', 'curso', 'conferencia', 'congreso'].includes(t))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. Eventos por Tipo */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <PieChart className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Distribución por Tipo
            </h3>
          </div>

          <div className="mt-4 space-y-2.5">
            {displayTypes.map(([type, count]) => {
              const percent = activeEvents.length > 0 ? Math.round((count / activeEvents.length) * 100) : 0;
              return (
                <div key={type} className="text-xs">
                  <div className="flex justify-between items-center text-slate-700 mb-1">
                    <span className="font-medium">{typeLabels[type] || type}</span>
                    <span className="font-semibold text-slate-900">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${typeColors[type] || 'bg-slate-400'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
          Total: {activeEvents.length} actividades activas
        </div>
      </div>

      {/* 2. Distribución por Estado */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Estado de los Eventos
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-xs font-semibold text-emerald-900">Confirmados</span>
              <span className="text-sm font-extrabold text-emerald-700">{statusMap.confirmado}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-xs font-semibold text-indigo-900">Programados</span>
              <span className="text-sm font-extrabold text-indigo-700">{statusMap.programado}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/60 border border-purple-100">
              <span className="text-xs font-semibold text-purple-900">Pendientes de Confirmación</span>
              <span className="text-sm font-extrabold text-purple-700">{statusMap.pendiente_confirmacion}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/60 border border-rose-100">
              <span className="text-xs font-semibold text-rose-900">Cancelados</span>
              <span className="text-sm font-extrabold text-rose-700">{statusMap.cancelado}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
          Tasa de confirmación: {activeEvents.length > 0 ? Math.round((statusMap.confirmado / activeEvents.length) * 100) : 0}%
        </div>
      </div>

      {/* 3. Carga de Trabajo por Persona */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users2 className="w-4 h-4 text-cyan-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Carga de Trabajo (Top Integrantes)
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            {sortedWorkload.map((w, idx) => {
              const barPercent = Math.round((w.count / maxWorkload) * 100);
              return (
                <div key={idx} className="text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{w.name}</span>
                    <span className="font-bold text-indigo-600 text-xs">{w.count} eventos</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
          Distribución de asignaciones sobre personal activo
        </div>
      </div>
    </div>
  );
};
