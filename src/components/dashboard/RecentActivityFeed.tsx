import React from 'react';
import { AuditLog } from '../../types';
import { History, PlusCircle, Edit3, Trash2, CheckCircle2, XCircle, Send } from 'lucide-react';
import { formatBogotaDate } from '../../lib/timezone';

interface RecentActivityFeedProps {
  logs: AuditLog[];
  onViewAllAudit?: () => void;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ logs, onViewAllAudit }) => {
  const getActionIcon = (action: AuditLog['action']) => {
    switch (action) {
      case 'EVENTO_CREADO':
        return <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />;
      case 'EVENTO_MODIFICADO':
        return <Edit3 className="w-3.5 h-3.5 text-amber-600" />;
      case 'EVENTO_CANCELADO':
        return <Trash2 className="w-3.5 h-3.5 text-rose-600" />;
      case 'SOLICITUD_CONFIRMADA':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'SOLICITUD_RECHAZADA':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      case 'PERSONA_SOLICITADA':
        return <Send className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return <History className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    return `Hace ${Math.floor(diffHours / 24)} d`;
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Actividad y Trazabilidad Reciente</h3>
        </div>
        {onViewAllAudit && (
          <button
            onClick={onViewAllAudit}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Ver auditoría
          </button>
        )}
      </div>

      <div className="mt-3 space-y-3 max-h-80 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No hay registros de actividad todavía.
          </div>
        ) : (
          logs.slice(0, 7).map((log) => (
            <div key={log.id} className="flex items-start gap-3 text-xs">
              <div className="mt-0.5 p-1 rounded-md bg-slate-100 shrink-0">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800 truncate">
                    {log.user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatTimeAgo(log.timestamp)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {log.action.replace(/_/g, ' ')}: {log.details.title || log.details.space || JSON.stringify(log.details)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
