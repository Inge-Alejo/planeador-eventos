import React, { useState } from 'react';
import { ParticipationRequest } from '../../types';
import {
  SendHorizontal,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Search,
} from 'lucide-react';
import { formatShortDate, format12Hour } from '../../lib/timezone';

interface RequestsListProps {
  requests: ParticipationRequest[];
  onOpenEmailModal: (request: ParticipationRequest) => void;
  onSelectEvent: (eventId: string) => void;
}

export const RequestsList: React.FC<RequestsListProps> = ({
  requests,
  onOpenEmailModal,
  onSelectEvent,
}) => {
  const [filter, setFilter] = useState<'todos' | 'pendiente' | 'confirmada' | 'rechazada'>('todos');
  const [query, setQuery] = useState('');

  const filtered = requests.filter((r) => {
    if (filter !== 'todos' && r.status !== filter) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        r.personName.toLowerCase().includes(q) ||
        r.eventTitle.toLowerCase().includes(q) ||
        r.personEmail.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Cabecera y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <SendHorizontal className="w-5 h-5 text-indigo-600" />
            Solicitudes de Participación y Convocatorias
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo en tiempo real de invitaciones enviadas y estados de confirmación de personas convocadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtros de estado */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs">
            <button
              onClick={() => setFilter('todos')}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-all ${
                filter === 'todos' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Todos ({requests.length})
            </button>
            <button
              onClick={() => setFilter('pendiente')}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-all ${
                filter === 'pendiente' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Pendientes ({requests.filter((r) => r.status === 'pendiente').length})
            </button>
            <button
              onClick={() => setFilter('confirmada')}
              className={`px-2.5 py-1 font-semibold rounded-lg transition-all ${
                filter === 'confirmada' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Confirmadas ({requests.filter((r) => r.status === 'confirmada').length})
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Solicitudes */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No hay solicitudes que coincidan con los filtros seleccionados.
            </div>
          ) : (
            filtered.map((req) => (
              <div
                key={req.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 font-bold text-xs shrink-0">
                    {req.personName.charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{req.personName}</h4>
                      <span className="text-xs text-slate-400 font-mono">({req.personEmail})</span>
                    </div>

                    <p
                      onClick={() => onSelectEvent(req.eventId)}
                      className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer mt-0.5"
                    >
                      Evento: {req.eventTitle}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatShortDate(req.eventDate)} ({format12Hour(req.eventStartTime)} – {format12Hour(req.eventEndTime)})
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {req.spaceName}
                      </span>
                    </div>

                    {req.responseNotes && (
                      <p className="mt-1.5 text-xs text-slate-600 italic bg-slate-50 px-2 py-1 rounded-md border border-slate-200/50">
                        Respuesta: "{req.responseNotes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  {/* Badge */}
                  {req.status === 'confirmada' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Confirmada
                    </span>
                  )}
                  {req.status === 'rechazada' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                      <XCircle className="w-3.5 h-3.5" />
                      Rechazada
                    </span>
                  )}
                  {req.status === 'pendiente' && (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Pendiente
                    </span>
                  )}

                  {/* Botón para abrir el correo simulado */}
                  <button
                    onClick={() => onOpenEmailModal(req)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shadow-2xs transition-all"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Ver Correo / Responder</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
