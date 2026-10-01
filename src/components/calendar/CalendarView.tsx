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
import { formatFriendlyDate, formatShortDate, format12Hour, getBogotaToday, timeStringToMinutes } from '../../lib/timezone';
import { useAuth } from '../../context/AuthContext';
import { getEventTypeConfig, EVENT_TYPE_CONFIG } from '../../utils/eventTypeColors';

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
  const { canEdit } = useAuth();
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

    // Completar hasta cuadrícula de semanas completas (mínimo 35 días, o 42 si excede 35)
    let nextDayCount = 1;
    while (days.length % 7 !== 0 || days.length < 35) {
      const nextM = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextY = currentMonth === 12 ? currentYear + 1 : currentYear;
      days.push({
        dateStr: `${nextY}-${String(nextM).padStart(2, '0')}-${String(nextDayCount).padStart(2, '0')}`,
        dayNumber: nextDayCount,
        isCurrentMonth: false,
      });
      nextDayCount++;
    }

    return days;
  }, [currentYear, currentMonth]);

  // Cálculo de los 7 días de la semana para la vista de Semana
  const weekDays = useMemo(() => {
    const current = new Date(currentYear, currentMonth - 1, currentDay);
    const dayOfWeek = current.getDay(); // 0 = Domingo
    const diffToMonday = (dayOfWeek + 6) % 7; // Lunes = 0
    const monday = new Date(currentYear, currentMonth - 1, currentDay - diffToMonday);

    const days: { dateStr: string; dayNumber: number; dayName: string; isToday: boolean }[] = [];
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;

      days.push({
        dateStr,
        dayNumber: d.getDate(),
        dayName: dayNames[i],
        isToday: dateStr === getBogotaToday(),
      });
    }

    return days;
  }, [currentYear, currentMonth, currentDay]);

  // Formato del título superior
  const currentTitle = useMemo(() => {
    const d = new Date(currentYear, currentMonth - 1, currentDay);
    if (viewMode === 'mes') {
      return new Intl.DateTimeFormat('es-CO', {
        month: 'long',
        year: 'numeric',
      }).format(d);
    }
    if (viewMode === 'semana') {
      const start = weekDays[0];
      const end = weekDays[6];
      const monthName = new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(d);
      return `Semana: ${start.dayNumber} - ${end.dayNumber} de ${monthName}. ${d.getFullYear()}`;
    }
    if (viewMode === 'dia') {
      return new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(d);
    }
    return `Agenda de ${new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(d)}`;
  }, [currentYear, currentMonth, currentDay, viewMode, weekDays]);

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

        {/* Filtros Rápidos y Botones de Acción */}
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

          {/* Botón "+ Nuevo Evento" (Visible SOLO si canEdit) */}
          {canEdit && (
            <button
              onClick={() => onOpenCreateEvent()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all ml-1"
              title="Programar nuevo evento institucional"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Evento</span>
            </button>
          )}
        </div>
      </div>

      {/* VISTA 1: MES (Completo, responsivo y sin recortes) */}
      {viewMode === 'mes' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto min-w-full">
            <div className="min-w-[700px] flex flex-col flex-1">
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
                      onClick={canEdit ? () => onOpenCreateEvent({ date: d.dateStr }) : undefined}
                      className={`min-h-[115px] sm:min-h-[135px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors ${
                        canEdit ? 'hover:bg-indigo-50/20 cursor-pointer' : 'cursor-default'
                      } ${!d.isCurrentMonth ? 'bg-slate-50/40 text-slate-300' : 'bg-white'}`}
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
                          const typeConfig = getEventTypeConfig(evt.type);
                          return (
                            <div
                              key={evt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectEvent(evt.id);
                              }}
                              style={{ borderLeftColor: typeConfig.color }}
                              className="group rounded-md border-l-4 bg-slate-50 hover:bg-slate-100 p-1 text-[11px] shadow-2xs transition-all hover:scale-[1.01] cursor-pointer"
                            >
                              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                                <div className="flex items-center gap-1 truncate">
                                  <span
                                    className="h-1.5 w-1.5 rounded-full shrink-0"
                                    style={{ backgroundColor: typeConfig.color }}
                                  />
                                  <span>{evt.startTime}</span>
                                </div>
                                <span className="truncate max-w-[55px] text-slate-400 hidden sm:inline text-[9px]">
                                  {evt.spaceName}
                                </span>
                              </div>
                              <p className="font-bold text-slate-800 truncate leading-tight group-hover:text-indigo-600 mt-0.5">
                                {evt.title}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span
                                  className="text-[9px] font-semibold px-1 rounded truncate leading-tight"
                                  style={{
                                    color: typeConfig.color,
                                    backgroundColor: `${typeConfig.color}15`,
                                  }}
                                >
                                  {typeConfig.label}
                                </span>
                                {evt.isVirtual && (
                                  <span className="text-[9px] font-bold px-1 rounded bg-cyan-100 text-cyan-800 leading-tight">
                                    Virtual
                                  </span>
                                )}
                              </div>
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
          </div>
        </div>
      )}

      {/* VISTA 2: SEMANA (7 Días completos desplegados en columnas) */}
      {viewMode === 'semana' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto min-w-full">
            <div className="min-w-[780px]">
              {/* Cabecera de 7 días de la semana */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center py-3">
                {weekDays.map((wd) => (
                  <div key={wd.dateStr} className="flex flex-col items-center justify-center">
                    <span className="text-[11px] font-bold uppercase text-slate-500">{wd.dayName}</span>
                    <span
                      className={`mt-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        wd.isToday
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                          : 'text-slate-800'
                      }`}
                    >
                      {wd.dayNumber}
                    </span>
                  </div>
                ))}
              </div>

              {/* Columnas con eventos de cada día de la semana */}
              <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[420px]">
                {weekDays.map((wd) => {
                  const dayEvents = filteredEvents
                    .filter((e) => e.date === wd.dateStr)
                    .sort((a, b) => a.startTime.localeCompare(b.startTime));

                  return (
                    <div
                      key={wd.dateStr}
                      className={`p-2 flex flex-col justify-between transition-colors ${
                        wd.isToday ? 'bg-indigo-50/20' : 'bg-white'
                      }`}
                    >
                      <div className="space-y-2 flex-1">
                        {dayEvents.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center py-10 text-center text-[11px] text-slate-300">
                            <span>Sin actividades</span>
                          </div>
                        ) : (
                          dayEvents.map((evt) => {
                            const typeConfig = getEventTypeConfig(evt.type);
                            return (
                              <div
                                key={evt.id}
                                onClick={() => onSelectEvent(evt.id)}
                                style={{ borderLeftColor: typeConfig.color }}
                                className="group rounded-lg border-l-4 bg-slate-50 hover:bg-slate-100 p-2 text-xs shadow-2xs transition-all hover:scale-[1.01] cursor-pointer"
                              >
                                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-0.5">
                                  <span className="font-mono">{evt.startTime} - {evt.endTime}</span>
                                </div>
                                <p className="font-bold text-slate-900 group-hover:text-indigo-600 truncate leading-snug">
                                  {evt.title}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {evt.spaceName}
                                </p>
                                <div className="mt-1 flex items-center gap-1">
                                  <span
                                    className="text-[9px] font-semibold px-1 rounded truncate leading-tight"
                                    style={{
                                      color: typeConfig.color,
                                      backgroundColor: `${typeConfig.color}15`,
                                    }}
                                  >
                                    {typeConfig.label}
                                  </span>
                                  {evt.isVirtual && (
                                    <span className="text-[9px] font-bold px-1 rounded bg-cyan-100 text-cyan-800 leading-tight">
                                      Virtual
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Botón rápido para programar en este día (Solo si canEdit) */}
                      {canEdit && (
                        <button
                          onClick={() => onOpenCreateEvent({ date: wd.dateStr })}
                          className="mt-2 w-full flex items-center justify-center gap-1 py-1 rounded-lg border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-[10px] font-bold text-slate-400 hover:text-indigo-700 transition-colors"
                          title={`Programar actividad para el ${wd.dayName} ${wd.dayNumber}`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Agregar</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 3: DÍA (Horario cronológico detallado) */}
      {viewMode === 'dia' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Horario Detallado para {formatFriendlyDate(currentDate)}
            </h3>
            {canEdit && (
              <button
                onClick={() => onOpenCreateEvent({ date: currentDate })}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                <Plus className="w-4 h-4" />
                <span>Programar en este día</span>
              </button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {filteredEvents.filter((e) => e.date === currentDate).length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No hay actividades programadas para este día.{' '}
                {canEdit && (
                  <button
                    onClick={() => onOpenCreateEvent({ date: currentDate })}
                    className="text-indigo-600 font-semibold underline hover:text-indigo-800 ml-1"
                  >
                    Haz clic para programar una
                  </button>
                )}
              </div>
            ) : (
              filteredEvents
                .filter((e) => e.date === currentDate)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((evt) => {
                  const typeConfig = getEventTypeConfig(evt.type);
                  return (
                    <div
                      key={evt.id}
                      onClick={() => onSelectEvent(evt.id)}
                      className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="flex flex-col items-center justify-center p-2 rounded-lg text-white font-mono font-bold text-xs shrink-0 shadow-xs"
                          style={{ backgroundColor: typeConfig.color }}
                        >
                          <span>{evt.startTime}</span>
                          <span className="text-[10px] opacity-90">{evt.endTime}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{evt.title}</h4>
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border"
                              style={{
                                backgroundColor: `${typeConfig.color}15`,
                                borderColor: `${typeConfig.color}40`,
                                color: typeConfig.color,
                              }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: typeConfig.color }}
                              />
                              {typeConfig.label}
                            </span>
                            {evt.isVirtual && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                                Virtual
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{evt.description}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span className="flex items-center gap-1 font-semibold text-indigo-700">
                              <MapPin className="w-3.5 h-3.5 text-indigo-500" />
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
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* VISTA 4: AGENDA / LISTADO */}
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
                .sort((a, b) => {
                  if (a.date !== b.date) return a.date.localeCompare(b.date);
                  return a.startTime.localeCompare(b.startTime);
                })
                .map((evt) => {
                  const typeConfig = getEventTypeConfig(evt.type);
                  return (
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
                              className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs"
                              style={{ backgroundColor: typeConfig.color }}
                            />
                            <h4 className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                              {evt.title}
                            </h4>
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border"
                              style={{
                                backgroundColor: `${typeConfig.color}15`,
                                borderColor: `${typeConfig.color}40`,
                                color: typeConfig.color,
                              }}
                            >
                              {typeConfig.label}
                            </span>
                            {evt.isVirtual && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                                Virtual
                              </span>
                            )}
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
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Convención / Leyenda interactiva de Colores por Tipo de Evento */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Convención de Colores por Tipo de Evento
            </h4>
          </div>
          {filterType !== 'todos' && (
            <button
              onClick={() => setFilterType('todos')}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Restablecer todos los tipos
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map((tKey) => {
            const config = EVENT_TYPE_CONFIG[tKey];
            const isSelected = filterType === tKey;
            return (
              <button
                key={tKey}
                onClick={() => setFilterType(filterType === tKey ? 'todos' : tKey)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 shadow-xs'
                    : 'hover:bg-slate-50'
                }`}
                style={{
                  borderColor: isSelected ? config.color : `${config.color}40`,
                  backgroundColor: isSelected ? `${config.color}25` : `${config.color}0D`,
                  color: config.color,
                }}
                title={`Filtrar por ${config.label}`}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: config.color }}
                />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
