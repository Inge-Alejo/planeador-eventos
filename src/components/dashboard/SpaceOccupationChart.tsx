import React, { useState } from 'react';
import { Space, EventEntity } from '../../types';
import { timeStringToMinutes, format12Hour, getBogotaToday, getBogotaCurrentTime } from '../../lib/timezone';
import {
  Building2,
  Clock,
  LayoutGrid,
  CalendarDays,
  SlidersHorizontal,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Sparkles,
  MapPin,
  Laptop,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SpaceOccupationChartProps {
  spaces: Space[];
  events: EventEntity[];
  selectedDate: string;
  onSelectEvent: (eventId: string) => void;
  onSelectSpaceTimeSlot: (spaceId: string, hour: string) => void;
}

type ViewMode = 'cards' | 'columns' | 'timeline';

export const SpaceOccupationChart: React.FC<SpaceOccupationChartProps> = ({
  spaces,
  events,
  selectedDate,
  onSelectEvent,
  onSelectSpaceTimeSlot,
}) => {
  const { canEdit } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');

  const START_HOUR = 7;
  const END_HOUR = 20;
  const TOTAL_HOURS = END_HOUR - START_HOUR;
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  // Fecha y hora actual en Colombia
  const today = getBogotaToday();
  const isToday = selectedDate === today;
  const currentTimeStr = getBogotaCurrentTime();
  const currentMinutes = timeStringToMinutes(currentTimeStr);

  // Filtrar eventos del día seleccionado no cancelados
  const dayEvents = events.filter((e) => e.date === selectedDate && e.status !== 'cancelado');

  // Filtrar espacios
  const filteredSpaces = spaces.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.location.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesType = typeFilter === 'todos' || s.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Métricas rápidas del día
  const occupiedCount = spaces.filter((s) => {
    const spaceEvents = dayEvents.filter((e) => e.spaceId === s.id);
    if (!isToday) return spaceEvents.length > 0;
    return spaceEvents.some((e) => {
      const start = timeStringToMinutes(e.startTime);
      const end = timeStringToMinutes(e.endTime);
      return currentMinutes >= start && currentMinutes < end;
    });
  }).length;

  const availableCount = spaces.length - occupiedCount;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all">
      {/* 1. Encabezado Principal y Selector de Vistas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Disponibilidad y Ocupación de Espacios
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {filteredSpaces.length} salas
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Consulta en tiempo real el uso de aulas, auditorios y estudios. Selecciona cualquier espacio libre para agendar.
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Modos de Visualización (Pestañas) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Indicadores rápidos de disponibilidad */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {availableCount} {isToday ? 'libres ahora' : 'sin reservas'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5 text-indigo-700">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              {occupiedCount} {isToday ? 'ocupadas ahora' : 'con eventos'}
            </span>
          </div>

          {/* Botones de alternancia de vista */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas en Vivo</span>
            </button>
            <button
              onClick={() => setViewMode('columns')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'columns'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Columnas por Espacio</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Línea de Tiempo</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Filtros de Búsqueda y Tipo de Espacio */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 mb-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar espacio o ubicación..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'auditorio', label: 'Auditorios' },
            { id: 'aula', label: 'Aulas' },
            { id: 'sala_reuniones', label: 'Salas de Juntas' },
            { id: 'laboratorio', label: 'Laboratorios' },
            { id: 'estudio', label: 'Estudios' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setTypeFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 ${
                typeFilter === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Contenido Dinámico según la Vista Seleccionada */}

      {/* VISTA 1: TARJETAS EN VIVO (Ultra visual e intuitiva) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {filteredSpaces.map((space) => {
            const spaceEvents = dayEvents
              .filter((e) => e.spaceId === space.id)
              .sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));

            // Determinar si hay evento activo en este momento
            const currentEvent = isToday
              ? spaceEvents.find((e) => {
                  const s = timeStringToMinutes(e.startTime);
                  const end = timeStringToMinutes(e.endTime);
                  return currentMinutes >= s && currentMinutes < end;
                })
              : null;

            // Próximo evento si está libre
            const nextEvent = spaceEvents.find((e) => timeStringToMinutes(e.startTime) > currentMinutes);

            const isOccupied = Boolean(currentEvent);

            return (
              <div
                key={space.id}
                className="group relative rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                {/* Cabecera de la Tarjeta */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: space.color || '#4F46E5' }}
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                          {space.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {space.capacity} pers.
                          </span>
                          <span>•</span>
                          <span className="capitalize">{space.type.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Insignia de Estado En Vivo */}
                    <div>
                      {isOccupied ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                          Ocupada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Disponible
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ubicación y Equipamiento rápido */}
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{space.location}</span>
                  </div>

                  {/* Estado detallado */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    {currentEvent ? (
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-rose-800 font-semibold mb-1">
                          <span>Evento en curso:</span>
                          <span>Hasta {format12Hour(currentEvent.endTime)}</span>
                        </div>
                        <p
                          onClick={() => onSelectEvent(currentEvent.id)}
                          className="font-bold text-slate-900 truncate hover:text-indigo-600 cursor-pointer"
                        >
                          {currentEvent.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          Por: {currentEvent.responsibleName}
                        </p>
                      </div>
                    ) : nextEvent ? (
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold mb-1">
                          <span>Libre actualmente</span>
                          <span className="text-slate-500 font-normal">
                            Próxima: {format12Hour(nextEvent.startTime)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate">
                          Próximo: <span className="font-semibold text-slate-800">{nextEvent.title}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-emerald-700 font-medium py-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Sin eventos programados para hoy</span>
                      </div>
                    )}
                  </div>

                  {/* Lista de Agenda de la Sala para este día */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      <span>Agenda del Día ({spaceEvents.length})</span>
                    </div>

                    {spaceEvents.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-1">Todo el día libre para reservas.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {spaceEvents.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={() => onSelectEvent(evt.id)}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all text-xs"
                          >
                            <div className="truncate flex-1">
                              <p className="font-semibold text-slate-800 truncate">{evt.title}</p>
                              <p className="text-[10px] text-slate-400">{evt.responsibleName}</p>
                            </div>
                            <span className="text-[11px] font-mono font-medium text-slate-600 shrink-0 bg-slate-100 px-1.5 py-0.5 rounded">
                              {evt.startTime} - {evt.endTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pie de Tarjeta con Botón de Reserva Rápida (Solo si canEdit) */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>07:00 a 20:00</span>
                  </div>

                  {canEdit && (
                    <button
                      onClick={() => onSelectSpaceTimeSlot(space.id, '08:00')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Reservar sala</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VISTA 2: COLUMNAS POR ESPACIO (Estilo Google Calendar / Agenda Diaria de Recursos) */}
      {viewMode === 'columns' && (
        <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${Math.max(800, filteredSpaces.length * 180 + 80)}px` }}>
              {/* Cabecera de Columnas (Nombres de los Espacios) */}
              <div
                className="grid border-b border-slate-200 bg-slate-50/90 text-xs font-bold text-slate-700 sticky top-0 z-20"
                style={{
                  gridTemplateColumns: `80px repeat(${filteredSpaces.length}, minmax(180px, 1fr))`,
                }}
              >
                <div className="p-3 text-center border-r border-slate-200 text-slate-400 font-mono text-[11px]">
                  HORA
                </div>
                {filteredSpaces.map((space) => {
                  const spaceEvtCount = dayEvents.filter((e) => e.spaceId === space.id).length;
                  return (
                    <div
                      key={space.id}
                      className="p-3 border-r border-slate-200/80 flex items-center justify-between gap-2"
                    >
                      <div className="truncate">
                        <p className="font-bold text-slate-900 truncate">{space.name}</p>
                        <p className="text-[10px] text-slate-500 font-normal">Cap: {space.capacity} • {space.type}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                        {spaceEvtCount}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Matriz Vertical: Horas y Columnas de Eventos */}
              <div
                className="relative grid"
                style={{
                  gridTemplateColumns: `80px repeat(${filteredSpaces.length}, minmax(180px, 1fr))`,
                }}
              >
                {/* Eje de Horas (Fila por fila de 1 hora = 56px de alto) */}
                <div className="border-r border-slate-200 divide-y divide-slate-100 bg-slate-50/40 text-center font-mono text-[11px] text-slate-400">
                  {hours.map((h) => (
                    <div key={h} className="h-14 flex items-center justify-center">
                      {String(h).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>

                {/* Columnas de cada Espacio con franjas clickeables y bloques de eventos */}
                {filteredSpaces.map((space) => {
                  const spaceEvents = dayEvents.filter((e) => e.spaceId === space.id);

                  return (
                    <div
                      key={space.id}
                      className="relative border-r border-slate-200/80 divide-y divide-slate-100 h-full"
                    >
                      {/* Celdas de fondo por cada hora (clic para reservar solo si canEdit) */}
                      {hours.map((h) => {
                        const hourStr = `${String(h).padStart(2, '0')}:00`;
                        return (
                          <div
                            key={h}
                            onClick={canEdit ? () => onSelectSpaceTimeSlot(space.id, hourStr) : undefined}
                            className={`h-14 transition-colors group flex items-center justify-center ${
                              canEdit ? 'hover:bg-emerald-50/40 cursor-pointer' : 'cursor-default'
                            }`}
                            title={canEdit ? `Hacer clic para reservar ${space.name} a las ${hourStr}` : undefined}
                          >
                            {canEdit && (
                              <span className="text-[10px] font-medium text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                + Reservar
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {/* Bloques de eventos posicionados en la columna */}
                      {spaceEvents.map((evt) => {
                        const startMin = timeStringToMinutes(evt.startTime);
                        const endMin = timeStringToMinutes(evt.endTime);
                        const chartStartMin = START_HOUR * 60;
                        const chartEndMin = END_HOUR * 60;

                        // Altura total del contenedor = TOTAL_HOURS * 56px
                        const totalHeightPx = TOTAL_HOURS * 56;
                        const totalMinutes = chartEndMin - chartStartMin;

                        const topPx = Math.max(0, ((startMin - chartStartMin) / totalMinutes) * totalHeightPx);
                        const heightPx = Math.max(
                          24,
                          ((endMin - Math.max(startMin, chartStartMin)) / totalMinutes) * totalHeightPx - 4
                        );

                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEvent(evt.id);
                            }}
                            style={{
                              top: `${topPx + 2}px`,
                              height: `${heightPx}px`,
                              backgroundColor: space.color || '#4F46E5',
                            }}
                            className="absolute left-1 right-1 z-10 rounded-xl p-2 text-white shadow-sm hover:brightness-110 cursor-pointer transition-all overflow-hidden flex flex-col justify-between"
                            title={`${evt.title} (${format12Hour(evt.startTime)} - ${format12Hour(evt.endTime)})`}
                          >
                            <div>
                              <p className="text-xs font-bold leading-tight truncate">{evt.title}</p>
                              <p className="text-[10px] opacity-90 truncate">{evt.responsibleName}</p>
                            </div>
                            <div className="flex items-center justify-between text-[9px] font-mono opacity-85 mt-1">
                              <span>{evt.startTime} - {evt.endTime}</span>
                              <span className="capitalize">{evt.type}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 3: LÍNEA DE TIEMPO GANTT HORIZONTAL (Rediseñada y expandida al 100%) */}
      {viewMode === 'timeline' && (
        <div className="mt-4 overflow-x-auto border border-slate-200 rounded-2xl bg-white p-3 shadow-xs">
          <div style={{ minWidth: '920px' }}>
            {/* Cabecera con horas */}
            <div
              className="grid border-b border-slate-200 pb-2.5 text-[11px] font-bold text-slate-400"
              style={{ gridTemplateColumns: '220px 1fr' }}
            >
              <div className="px-3">ESPACIO FÍSICO</div>
              <div
                className="grid text-center font-mono"
                style={{ gridTemplateColumns: `repeat(${hours.length}, minmax(0, 1fr))` }}
              >
                {hours.map((h) => (
                  <div key={h} className="text-center">
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Filas por cada espacio físico */}
            <div className="divide-y divide-slate-100">
              {filteredSpaces.map((space) => {
                const spaceEvents = dayEvents.filter((e) => e.spaceId === space.id);

                return (
                  <div
                    key={space.id}
                    className="grid items-center py-3 hover:bg-slate-50/60 transition-colors"
                    style={{ gridTemplateColumns: '220px 1fr' }}
                  >
                    {/* Datos del espacio */}
                    <div className="px-3 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: space.color || '#4F46E5' }}
                        />
                        <p className="text-xs font-bold text-slate-800 truncate">{space.name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 pl-4.5">
                        <span>Cap: {space.capacity}</span>
                        <span>•</span>
                        <span className="capitalize">{space.type.replace('_', ' ')}</span>
                      </div>
                    </div>

                    {/* Timeline de 13 horas que abarca el 100% de la pantalla */}
                    <div className="relative h-12 w-full rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex">
                      {/* Cuadrículas de cada hora */}
                      {hours.map((h) => {
                        const hourStr = `${String(h).padStart(2, '0')}:00`;
                        return (
                          <div
                            key={h}
                            onClick={canEdit ? () => onSelectSpaceTimeSlot(space.id, hourStr) : undefined}
                            title={canEdit ? `Reservar ${space.name} a las ${hourStr}` : undefined}
                            className={`flex-1 h-full border-r border-slate-200/40 transition-colors ${
                              canEdit ? 'hover:bg-emerald-50/50 cursor-pointer' : 'cursor-default'
                            }`}
                          />
                        );
                      })}

                      {/* Eventos sobrepuestos */}
                      {spaceEvents.map((evt) => {
                        const startMin = timeStringToMinutes(evt.startTime);
                        const endMin = timeStringToMinutes(evt.endTime);
                        const chartStartMin = START_HOUR * 60;
                        const chartEndMin = END_HOUR * 60;
                        const totalChartMin = chartEndMin - chartStartMin;

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
                            className="absolute top-1 bottom-1 z-10 flex items-center justify-between rounded-lg px-2.5 text-white shadow-xs hover:brightness-110 cursor-pointer transition-all overflow-hidden"
                          >
                            <span className="text-[11px] font-bold truncate leading-tight">
                              {evt.title}
                            </span>
                            <span className="text-[9px] font-mono opacity-85 ml-1 shrink-0 hidden sm:inline">
                              {evt.startTime} - {evt.endTime}
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
      )}
    </div>
  );
};
