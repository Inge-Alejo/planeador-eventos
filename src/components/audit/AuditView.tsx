import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { History, Shield, Search, Filter } from 'lucide-react';
import { formatBogotaDate } from '../../lib/timezone';

interface AuditViewProps {
  auditLogs: AuditLog[];
}

export const AuditView: React.FC<AuditViewProps> = ({ auditLogs }) => {
  const [query, setQuery] = useState('');
  const [filterAction, setFilterAction] = useState('todos');

  const filtered = auditLogs.filter((log) => {
    if (filterAction !== 'todos' && log.action !== filterAction) return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        log.user.name.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        JSON.stringify(log.details).toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Registro de Auditoría y Trazabilidad Operativa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historial inmutable de operaciones sensibles (creación, cambios de horario, cancelaciones y respuestas).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar por usuario o detalle..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
          >
            <option value="todos">Todas las acciones</option>
            <option value="EVENTO_CREADO">Eventos Creados</option>
            <option value="EVENTO_MODIFICADO">Eventos Modificados</option>
            <option value="EVENTO_CANCELADO">Eventos Cancelados</option>
            <option value="ESPACIO_RESERVADO">Espacios Reservados</option>
            <option value="SOLICITUD_CONFIRMADA">Solicitudes Confirmadas</option>
            <option value="SOLICITUD_RECHAZADA">Solicitudes Rechazadas</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No hay registros de auditoría que coincidan con la búsqueda.
            </div>
          ) : (
            filtered.map((log) => (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-bold text-xs shrink-0">
                    <Shield className="w-4 h-4 text-indigo-600" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{log.user.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">({log.user.email})</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-slate-600">
                      Entidad: <span className="font-semibold uppercase">{log.entityType}</span> —{' '}
                      {log.details.title || log.details.space || JSON.stringify(log.details)}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-[11px] text-slate-400 block">
                    {new Date(log.timestamp).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
                  </span>
                  <span className="text-[10px] text-slate-400">ID: {log.id}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
