import React from 'react';
import { EventEntity } from '../../types';
import { formatShortDate, format12Hour } from '../../lib/timezone';
import { Calendar, Clock, MapPin, User, ArrowRight } from 'lucide-react';

interface UpcomingEventsListProps {
  events: EventEntity[];
  onSelectEvent: (eventId: string) => void;
  onViewAll: () => void;
}

export const UpcomingEventsList: React.FC<UpcomingEventsListProps> = ({
  events,
  onSelectEvent,
  onViewAll,
}) => {
  // Ordenar por fecha y hora más cercana
  const sorted = [...events]
    .filter((e) => e.status !== 'cancelado')
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`))
    .slice(0, 5);

  const getStatusBadge = (status: EventEntity['status']) => {
    switch (status) {
      case 'confirmado':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Confirmado</span>;
      case 'programado':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Programado</span>;
      case 'pendiente_confirmacion':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Pendiente</span>;
      case 'en_ejecucion':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">En ejecución</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize">{status}</span>;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Próximos Eventos Proyectados</h3>
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <span>Ver todos</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-3 divide-y divide-slate-100">
        {sorted.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No hay eventos próximos programados.
          </div>
        ) : (
          sorted.map((evt) => (
            <div
              key={evt.id}
              onClick={() => onSelectEvent(evt.id)}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-3">
                {/* Badge Fecha */}
                <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 group-hover:border-indigo-300 group-hover:bg-indigo-50/50 transition-colors shrink-0">
                  <span className="text-[10px] font-extrabold uppercase text-indigo-600 leading-none">
                    {evt.date.split('-')[1]}
                  </span>
                  <span className="text-base font-black text-slate-800 leading-none mt-0.5">
                    {evt.date.split('-')[2]}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {evt.title}
                  </h4>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {format12Hour(evt.startTime)} – {format12Hour(evt.endTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {evt.spaceName}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {evt.responsibleName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0">{getStatusBadge(evt.status)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
