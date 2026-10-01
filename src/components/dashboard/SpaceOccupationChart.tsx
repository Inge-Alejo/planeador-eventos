import React from 'react';
import { Space, EventEntity } from '../../types';
import { timeStringToMinutes, format12Hour } from '../../lib/timezone';
import { Building2, Clock } from 'lucide-react';

interface SpaceOccupationChartProps {
  spaces: Space[];
  events: EventEntity[];
  selectedDate: string;
  onSelectEvent: (eventId: string) => void;
  onSelectSpaceTimeSlot: (spaceId: string, hour: string) => void;
}

export const SpaceOccupationChart: React.FC<SpaceOccupationChartProps> = ({
  spaces,
  events,
  selectedDate,
  onSelectEvent,
  onSelectSpaceTimeSlot,
}) => {
  // Rango de horas a mostrar en el timeline: 07:00 a 20:00 (13 horas)
  const START_HOUR = 7;
  const END_HOUR = 20;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  // Filtrar eventos del día seleccionado no cancelados
  const dayEvents = events.filter((e) => e.date === selectedDate && e.status !== 'cancelado');

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Matriz de Ocupación de Espacios (Timeline de Recursos)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Vista horizontal de disponibilidad por espacio para el día seleccionado. Haz clic en un bloque libre para reservar.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-emerald-500/20 border border-emerald-500"></span>
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-indigo-600"></span>
            <span>Ocupado</span>
          </div>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Cabecera con horas */}
          <div className="grid grid-cols-[200px_repeat(13,_minmax(45px,_1fr))] border-b border-slate-100 pb-2 text-[11px] font-semibold text-slate-400">
            <div className="px-2">Espacio Físico</div>
            {hours.slice(0, -1).map((h) => (
              <div key={h} className="text-center">
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Filas por cada espacio */}
          <div className="divide-y divide-slate-100">
            {spaces.map((space) => {
              const spaceEvents = dayEvents.filter((e) => e.spaceId === space.id);

              return (
                <div
                  key={space.id}
                  className="grid grid-cols-[200px_repeat(13,_minmax(45px,_1fr))] items-center py-2.5 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Etiqueta del Espacio */}
                  <div className="px-2 pr-4">
                    <p className="text-xs font-bold text-slate-800 truncate">{space.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>Cap: {space.capacity}</span>
                      <span>•</span>
                      <span className="capitalize">{space.type.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Barra interactiva de tiempo */}
                  <div className="col-span-13 relative h-10 w-full rounded-xl bg-slate-50 border border-slate-200/70 p-1 flex">
                    {/* Celdas clickeables por cada hora */}
                    {hours.slice(0, -1).map((h) => {
                      const hourStr = `${String(h).padStart(2, '0')}:00`;
                      return (
                        <div
                          key={h}
                          onClick={() => onSelectSpaceTimeSlot(space.id, hourStr)}
                          title={`Reservar ${space.name} a las ${hourStr}`}
                          className="flex-1 h-full border-r border-slate-200/30 hover:bg-indigo-50/60 cursor-pointer transition-colors"
                        />
                      );
                    })}

                    {/* Bloques de eventos sobrepuestos con posicionamiento absoluto */}
                    {spaceEvents.map((evt) => {
                      const startMin = timeStringToMinutes(evt.startTime);
                      const endMin = timeStringToMinutes(evt.endTime);
                      const chartStartMin = START_HOUR * 60;
                      const chartEndMin = END_HOUR * 60;
                      const totalChartMin = chartEndMin - chartStartMin;

                      // Calcular porcentaje de inicio y ancho
                      const leftPercent = Math.max(0, ((startMin - chartStartMin) / totalChartMin) * 100);
                      const widthPercent = Math.min(
                        100 - leftPercent,
                        ((endMin - Math.max(startMin, chartStartMin)) / totalChartMin) * 100
                      );

                      if (widthPercent <= 0) return null;

                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(evt.id);
                          }}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            backgroundColor: space.color || '#4F46E5',
                          }}
                          title={`${evt.title} (${format12Hour(evt.startTime)} - ${format12Hour(evt.endTime)})`}
                          className="absolute top-1 bottom-1 z-10 flex items-center justify-between rounded-lg px-2 text-white shadow-xs hover:brightness-110 cursor-pointer transition-all overflow-hidden"
                        >
                          <span className="text-[11px] font-semibold truncate leading-tight">
                            {evt.title}
                          </span>
                          <span className="text-[9px] font-mono opacity-80 hidden md:inline ml-1 shrink-0">
                            {evt.startTime}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
