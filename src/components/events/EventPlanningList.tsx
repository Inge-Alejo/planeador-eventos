import React, { useState } from 'react';
import { EventEntity, Space, Person, EventType, EventStatus } from '../../types';
import {
  CalendarCheck,
  Plus,
  Clock,
  MapPin,
  User,
  Users,
  Search,
  Filter,
  Trash2,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { formatFriendlyDate, formatShortDate, format12Hour } from '../../lib/timezone';
import { useAuth } from '../../context/AuthContext';
import { getEventTypeConfig } from '../../utils/eventTypeColors';

interface EventPlanningListProps {
  events: EventEntity[];
  spaces: Space[];
  people: Person[];
  onOpenCreateEvent: () => void;
  onSelectEvent: (eventId: string) => void;
  onEditEvent: (event: EventEntity) => void;
  onDeleteEvent: (eventId: string) => void;
  initialFilter?: string;
}

export const EventPlanningList: React.FC<EventPlanningListProps> = ({
  events,
  spaces,
  people,
  onOpenCreateEvent,
  onSelectEvent,
  onEditEvent,
  onDeleteEvent,
  initialFilter,
}) => {
  const { isAdmin, canEdit } = useAuth();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('todos');
  const [filterStatus, setFilterStatus] = useState(initialFilter || 'todos');
  const [filterSpace, setFilterSpace] = useState('todos');

  const filtered = events.filter((e) => {
    if (filterType !== 'todos' && e.type !== filterType) return false;
    if (filterStatus !== 'todos' && e.status !== filterStatus) return false;
    if (filterSpace !== 'todos' && e.spaceId !== filterSpace) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        e.spaceName.toLowerCase().includes(q) ||
        e.responsibleName.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'confirmado':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-bold">Confirmado</span>;
      case 'programado':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs font-bold">Programado</span>;
      case 'pendiente_confirmacion':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-xs font-bold">Pendiente</span>;
      case 'cancelado':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs font-bold">Cancelado</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold capitalize">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Cabecera y Filtros */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-600" />
              Eventos / Planeación Operativa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Administración central de actividades, filtros combinados y estado de aprobación.
            </p>
          </div>

          {canEdit && (
            <button
              onClick={onOpenCreateEvent}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 active:scale-[0.98] transition-all self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Evento</span>
            </button>
          )}
        </div>

        {/* Barra de Filtros Combinables */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <input
            type="text"
            placeholder="Buscar por título, responsable..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 capitalize"
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

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 capitalize"
          >
            <option value="todos">Todos los estados</option>
            <option value="confirmado">Confirmados</option>
            <option value="programado">Programados</option>
            <option value="pendiente_confirmacion">Pendientes de confirmación</option>
            <option value="en_ejecucion">En ejecución</option>
            <option value="cancelado">Cancelados</option>
          </select>

          <select
            value={filterSpace}
            onChange={(e) => setFilterSpace(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700"
          >
            <option value="todos">Todos los espacios</option>
            {spaces.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Eventos */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3.5 px-4">Evento / Actividad</th>
                <th className="py-3.5 px-4">Fecha y Horario</th>
                <th className="py-3.5 px-4">Espacio Físico</th>
                <th className="py-3.5 px-4">Responsable</th>
                <th className="py-3.5 px-4">Convocados</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No se encontraron eventos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filtered
                  .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`))
                  .map((evt) => (
                    <tr
                      key={evt.id}
                      onClick={() => onSelectEvent(evt.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 hover:text-indigo-600 transition-colors">
                          {evt.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                            style={{
                              backgroundColor: `${getEventTypeConfig(evt.type).color}15`,
                              borderColor: `${getEventTypeConfig(evt.type).color}40`,
                              color: getEventTypeConfig(evt.type).color,
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: getEventTypeConfig(evt.type).color }}
                            />
                            {getEventTypeConfig(evt.type).label}
                          </span>
                          {evt.isVirtual && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                              Virtual
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="font-semibold text-slate-800">{formatShortDate(evt.date)}</div>
                        <div className="text-slate-400">
                          {evt.startTime} – {evt.endTime}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{evt.spaceName}</div>
                      </td>
                      <td className="py-3.5 px-4">{evt.responsibleName}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          <Users className="w-3 h-3" />
                          {evt.peopleIds?.length || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(evt.status)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onSelectEvent(evt.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                            title="Ver detalle"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => onEditEvent(evt)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                                title="Editar"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`¿Cancelar evento "${evt.title}"?`)) {
                                    onDeleteEvent(evt.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
