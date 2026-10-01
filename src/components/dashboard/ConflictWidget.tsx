import React from 'react';
import { AlertOctagon, AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ConflictItem } from '../../types';

interface ConflictWidgetProps {
  conflicts: ConflictItem[];
  onSelectEvent: (eventId: string) => void;
}

export const ConflictWidget: React.FC<ConflictWidgetProps> = ({ conflicts, onSelectEvent }) => {
  if (conflicts.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/50 to-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Operación sin Conflictos</h3>
            <p className="text-xs text-slate-500">
              Todos los espacios físicos y agendas de personas asignadas están perfectamente sincronizados y disponibles.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Conflictos y Alertas Detectadas</h3>
            <p className="text-xs text-rose-600 font-medium">
              {conflicts.length} situación(es) requieren revisión inmediata
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 divide-y divide-slate-100 max-h-72 overflow-y-auto">
        {conflicts.map((c) => {
          const isBlocker = c.severity === 'bloqueo';
          return (
            <div
              key={c.id}
              className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isBlocker ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                      <AlertOctagon className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        isBlocker
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {c.severity}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800">{c.title}</h4>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{c.message}</p>
                </div>
              </div>

              {c.conflictingEventId && (
                <button
                  onClick={() => onSelectEvent(c.conflictingEventId!)}
                  className="self-end sm:self-center shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                >
                  <span>Ver evento</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
