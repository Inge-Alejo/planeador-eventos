import React, { useState } from 'react';
import { Space, EventEntity } from '../../types';
import {
  Building2,
  Plus,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit,
  Layers,
} from 'lucide-react';
import { getBogotaToday, getBogotaCurrentTime, timeStringToMinutes, format12Hour } from '../../lib/timezone';
import { useAuth } from '../../context/AuthContext';

interface SpaceListProps {
  spaces: Space[];
  events: EventEntity[];
  onOpenCreateSpace: () => void;
  onEditSpace: (space: Space) => void;
  onSelectEvent: (eventId: string) => void;
  onReserveSpace: (spaceId: string) => void;
}

export const SpaceList: React.FC<SpaceListProps> = ({
  spaces,
  events,
  onOpenCreateSpace,
  onEditSpace,
  onSelectEvent,
  onReserveSpace,
}) => {
  const { isAdmin } = useAuth();
  const [filterType, setFilterType] = useState('todos');

  const today = getBogotaToday();
  const currentTime = getBogotaCurrentTime();
  const currentMinutes = timeStringToMinutes(currentTime);

  const filteredSpaces = spaces.filter((s) => {
    if (filterType !== 'todos' && s.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Barra Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Gestión de Espacios Físicos y Disponibilidad
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Control de aforos, equipamiento audiovisual y estado de ocupación en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="todos">Todos los tipos</option>
            <option value="auditorio">Auditorios</option>
            <option value="estudio">Estudios</option>
            <option value="sala_reuniones">Salas de Reuniones</option>
            <option value="laboratorio">Laboratorios</option>
            <option value="aula">Aulas</option>
          </select>

          {isAdmin && (
            <button
              onClick={onOpenCreateSpace}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Espacio</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid de Espacios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSpaces.map((space) => {
          // Eventos de hoy en este espacio
          const todayEvents = events
            .filter((e) => e.spaceId === space.id && e.date === today && e.status !== 'cancelado')
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          // Verificar si está ocupado justo ahora
          const currentOccupyingEvent = todayEvents.find((e) => {
            const start = timeStringToMinutes(e.startTime);
            const end = timeStringToMinutes(e.endTime);
            return currentMinutes >= start && currentMinutes <= end;
          });

          const isOccupiedNow = Boolean(currentOccupyingEvent);

          return (
            <div
              key={space.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3.5 w-3.5 rounded-full ring-2 ring-white shadow-xs shrink-0"
                      style={{ backgroundColor: space.color || '#4F46E5' }}
                    />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {space.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 capitalize">
                        {space.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Badge de ocupación actual */}
                    {isOccupiedNow ? (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                        Ocupado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                        Disponible
                      </span>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => onEditSpace(space)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded-lg ml-1"
                        title="Editar espacio"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{space.location || 'Sin ubicación específica'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Capacidad: {space.capacity} asistentes</span>
                  </div>
                </div>

                {/* Equipamiento */}
                {space.equipment && space.equipment.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {space.equipment.map((eq, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                )}

                {/* Agenda de Hoy para este Espacio */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Agenda de Hoy ({todayEvents.length} reservas)
                  </span>

                  {todayEvents.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">
                      Sin eventos programados para hoy. Todo el día disponible.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {todayEvents.map((evt) => (
                        <div
                          key={evt.id}
                          onClick={() => onSelectEvent(evt.id)}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/50 cursor-pointer transition-colors text-xs"
                        >
                          <span className="font-semibold text-slate-800 truncate pr-2">
                            {evt.title}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-500 shrink-0">
                            {evt.startTime} – {evt.endTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de acción */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onReserveSpace(space.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-700 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Programar en este Espacio</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
