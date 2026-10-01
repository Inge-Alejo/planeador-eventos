import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Plus,
  Clock,
  MapPin,
  User,
  List,
  Grid3X3,
  Columns,
  CalendarDays,
} from 'lucide-react';
import { EventEntity, Space, Person, EventType, EventStatus, PeopleGroup } from '../../types';
import {
  formatFriendlyDate,
  formatShortDate,
  format12Hour,
  getBogotaToday,
  timeStringToMinutes,
} from '../../lib/timezone';

export type CalendarViewMode = 'mes' | 'semana' | 'dia' | 'agenda';

interface CalendarViewProps {
  events: EventEntity[];
  spaces: Space[];
  people: Person[];
  groups?: PeopleGroup[];
  onSelectEvent: (eventId: string) => void;
  onOpenCreateEvent: (preset?: { date?: string; time?: string; spaceId?: string }) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  spaces,
  people,
  groups = [],
  onSelectEvent,
  onOpenCreateEvent,
}) => {
  const [currentDate, setCurrentDate] = useState<string>(getBogotaToday());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('mes');

  // Filtros interactivos del calendario
  const [filterSpaceId, setFilterSpaceId] = useState<string>('todos');
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterGroupId, setFilterGroupId] = useState<string>('todos');

  // Descomponer año, mes y día de currentDate
  const [currentYear, currentMonth, currentDay] = useMemo(() => {
    const [y, m, d] = currentDate.split('-').map(Number);
    return [y, m, d];
  }, [currentDate]);

  // Filtrado de eventos
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterSpaceId !== 'todos' && e.spaceId !== filterSpaceId) return false;
      if (filterType !== 'todos' && e.type !== filterType) return false;
      if (filterStatus !== 'todos' && e.status !== filterStatus) return false;
      if (filterGroupId !== 'todos') {
        const group = groups.find((g) => g.id === filterGroupId);
        if (group) {
          const hasMember =
            group.memberIds.some((mId) => (e.peopleIds || []).includes(mId)) ||
            group.memberIds.includes(e.responsibleId);
          if (!hasMember) return false;
        }
      }
      return true;
    });
  }, [events, filterSpaceId, filterType, filterStatus, filterGroupId, groups]);

  // Navegación
  const goToToday = () => setCurrentDate(getBogotaToday());

  const handlePrev = () => {
    const d = new Date(currentYear, currentMonth - 1, currentDay);
    if (viewMode === 'mes') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'semana') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);

    const newYear = d.getFullYear();
    const newMonth = String(d.getMonth() + 1).padStart(2, '0');
    const newDay = String(d.getDate()).padStart(2, '0');
    setCurrentDate(`${newYear}-${newMonth}-${newDay}`);
  };

  const handleNext = () => {
    const d = new Date(currentYear, currentMonth - 1, currentDay);
    if (viewMode === 'mes') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'semana') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);

    const newYear = d.getFullYear();
    const newMonth = String(d.getMonth() + 1).padStart(2, '0');
    const newDay = String(d.getDate()).padStart(2, '0');
    setCurrentDate(`${newYear}-${newMonth}-${newDay}`);
  };

  // Cálculo de días para la vista de Mes
  const monthDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Domingo
    // Ajustar a Lunes como primer día de la semana (0 = Lunes, 6 = Domingo)
    const startingOffset = (firstDayOfMonth + 6) % 7;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate();

    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

    // Días del mes anterior
    for (let i = startingOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevM = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevY = currentMonth === 1 ? currentYear - 1 : currentYear;
      days.push({
        dateStr: `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
        dayNumber: dayNum,
        isCurrentMonth: false,
      });
    }

    // Días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        dateStr: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        dayNumber: i,
        isCurrentMonth: true,
      });
    }

    // Completar hasta múltiplo de 7 (35 o 42 días)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextY = currentMonth === 12 ? currentYear + 1 : currentYear;
      days.push({
        dateStr: `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        dayNumber: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Formato del título superior
  const currentTitle = useMemo(() => {
    const d = new Date(currentYear, currentMonth - 1, currentDay);
    return new Intl.DateTimeFormat('es-CO', {
      month: 'long',
      year: 'numeric',
    }).format(d);
  }, [currentYear, currentMonth, currentDay]);

  const getSpaceColor = (spaceId: string) => {
    const space = spaces.find((s) => s.id === spaceId);
    return space?.color || '#4F46E5';
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Barra de Control del Calendario */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        {/* Controles de Navegación y Fecha */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-1 bg-slate-50">
            <button
              onClick={handlePrev}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white rounded-lg transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 capitalize">
            {currentTitle}
          </h2>
        </div>

        {/* Filtros Rápidos */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Espacio */}
          <select
            value={filterSpaceId}
            onChange={(e) => setFilterSpaceId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="todos">Todos los espacios</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Selector de Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="todos">Todos los tipos</option>
            <option value="academico">Académico</option>
            <option value="simposio">Simposio</option>
            <option value="curso">Curso</option>
            <option value="transmision">Transmisión</option>
            <option value="catedra">Cátedra</option>
            <option value="congreso">Congreso</option>
            <option value="conferencia">Conferencia</option>
            <option value="taller">Taller</option>
            <option value="reunion">Reunión</option>
            <option value="grabacion">Grabación</option>
            <option value="institucional">Institucional</option>
            <option value="otro">Otro</option>
          </select>

          {/* Selector de Grupo de Personas */}
          {groups.length > 0 && (
            <select
              value={filterGroupId}
              onChange={(e) => setFilterGroupId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="todos">Todos los grupos</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  Grupo: {g.name} ({g.memberIds.length})
                </option>
              ))}
            </select>
          )}

          {/* Selector de Modos de Vista */}
          <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 p-1 bg-slate-50">
            <button
              onClick={() => setViewMode('mes')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'mes'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mes</span>
            </button>
            <button
              onClick={() => setViewMode('semana')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'semana'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Semana</span>
            </button>
            <button
              onClick={() => setViewMode('dia')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'dia'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Día</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'agenda'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>
        </div>
      </div>

      {/* VISTA 1: MES */}
      {viewMode === 'mes' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col flex-1">
          {/* Cabecera de días de la semana */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center text-xs font-bold text-slate-600 py-2.5">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div className="text-indigo-600">Sáb</div>
            <div className="text-rose-500">Dom</div>
          </div>

          {/* Cuadrícula de 7 columnas */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 flex-1">
            {monthDays.map((d, idx) => {
              const dayEvents = filteredEvents.filter((e) => e.date === d.dateStr);
              const isToday = d.dateStr === getBogotaToday();

              return (
                <div
                  key={idx}
                  onClick={() => onOpenCreateEvent({ date: d.dateStr })}
                  className={`min-h-[110px] sm:min-h-[130px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors hover:bg-indigo-50/20 cursor-pointer ${
                    !d.isCurrentMonth ? 'bg-slate-50/40 text-slate-300' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : d.isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {d.dayNumber}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayEvents.length} act.
                      </span>
                    )}
                  </div>

                  {/* Lista de eventos del día */}
                  <div className="mt-1 space-y-1 overflow-hidden flex-1">
                    {dayEvents.slice(0, 3).map((evt) => {
                      const spaceColor = getSpaceColor(evt.spaceId);
                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(evt.id);
                          }}
                          style={{ borderLeftColor: spaceColor }}
                          className="group rounded-md border-l-3 bg-slate-50 hover:bg-slate-100 p-1 text-[11px] shadow-2xs transition-all hover:scale-[1.01]"
                        >
                          <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                            <span>{evt.startTime}</span>
                            <span className="truncate max-w-[60px] text-slate-400 hidden sm:inline">
                              {evt.spaceName}
                            </span>
                          </div>
                          <p className="font-bold text-slate-800 truncate leading-tight group-hover:text-indigo-600">
                            {evt.title}
                          </p>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] font-bold text-indigo-600 text-center pt-0.5">
                        +{dayEvents.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: AGENDA / LISTADO */}
      {viewMode === 'agenda' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Listado Cronológico de Actividades</h3>
            <span className="text-xs text-slate-500 font-medium">
              {filteredEvents.length} eventos filtrados
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No se encontraron actividades con los filtros actuales.
              </div>
            ) : (
              filteredEvents
                .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
                .map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent(evt.id)}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 p-3 rounded-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      {/* Fecha */}
                      <div className="flex flex-col items-center justify-center h-12 w-14 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 shrink-0">
                        <span className="text-[10px] font-bold uppercase">{evt.date.split('-')[1]}</span>
                        <span className="text-lg font-black leading-none">{evt.date.split('-')[2]}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: getSpaceColor(evt.spaceId) }}
                          />
                          <h4 className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                            {evt.title}
                          </h4>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 capitalize">
                            {evt.type}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {format12Hour(evt.startTime)} – {format12Hour(evt.endTime)} ({evt.durationMinutes} min)
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {evt.spaceName}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {evt.responsibleName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="self-end sm:self-center">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          evt.status === 'confirmado'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : evt.status === 'pendiente_confirmacion'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {evt.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* VISTA 3: DÍA / SEMANA */}
      {(viewMode === 'dia' || viewMode === 'semana') && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Horario Detallado para {formatFriendlyDate(currentDate)}
            </h3>
            <button
              onClick={() => onOpenCreateEvent({ date: currentDate })}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="w-4 h-4" />
              <span>Programar en este día</span>
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {filteredEvents.filter((e) => e.date === currentDate).length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No hay actividades programadas para este día.{' '}
                <button
                  onClick={() => onOpenCreateEvent({ date: currentDate })}
                  className="text-indigo-600 font-semibold underline hover:text-indigo-800 ml-1"
                >
                  Haz clic para programar una
                </button>
              </div>
            ) : (
              filteredEvents
                .filter((e) => e.date === currentDate)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent(evt.id)}
                    className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs shrink-0">
                        <span>{evt.startTime}</span>
                        <span className="text-[10px] opacity-80">{evt.endTime}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{evt.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{evt.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-semibold text-indigo-700">
                            <MapPin className="w-3.5 h-3.5" />
                            {evt.spaceName}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Responsable: {evt.responsibleName}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
