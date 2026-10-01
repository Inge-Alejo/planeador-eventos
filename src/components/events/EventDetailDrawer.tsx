import React from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  AlertTriangle,
  History,
  Trash2,
  Edit,
  Mail,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Share2,
} from 'lucide-react';
import { EventEntity, Space, Person, ParticipationRequest, AuditLog } from '../../types';
import { formatFriendlyDate, format12Hour } from '../../lib/timezone';
import { useAuth } from '../../context/AuthContext';

interface EventDetailDrawerProps {
  event: EventEntity | null;
  onClose: () => void;
  onEdit: (event: EventEntity) => void;
  onDelete: (eventId: string) => void;
  spaces: Space[];
  people: Person[];
  requests: ParticipationRequest[];
  auditLogs: AuditLog[];
  onOpenSimulatedEmail?: (request: ParticipationRequest) => void;
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
  event,
  onClose,
  onEdit,
  onDelete,
  spaces,
  people,
  requests,
  auditLogs,
  onOpenSimulatedEmail,
}) => {
  const { isAdmin } = useAuth();
  if (!event) return null;

  const space = spaces.find((s) => s.id === event.spaceId);
  const responsible = people.find((p) => p.id === event.responsibleId);
  const eventRequests = requests.filter((r) => r.eventId === event.id);
  const eventAudit = auditLogs.filter(
    (l) => l.entityId === event.id || (l.details && l.details.title === event.title)
  );

  const getStatusBadge = (status: EventEntity['status']) => {
    switch (status) {
      case 'confirmado':
        return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">Confirmado</span>;
      case 'programado':
        return <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold">Programado</span>;
      case 'pendiente_confirmacion':
        return <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">Pendiente de Confirmación</span>;
      case 'cancelado':
        return <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold">Cancelado</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold capitalize">{status}</span>;
    }
  };

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de cancelar y eliminar el evento "${event.title}"?`)) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header Drawer */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            {getStatusBadge(event.status)}
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {event.type}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit(event)}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Editar evento"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Cancelar/Eliminar evento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Título y Descripción */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
              {event.title}
            </h2>
            {event.description && (
              <p className="mt-2 text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60">
                {event.description}
              </p>
            )}
          </div>

          {/* Tarjeta de Horario y Espacio */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase text-indigo-700 block mb-1">
                Fecha y Horario
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {formatFriendlyDate(event.date)}
              </p>
              <p className="font-mono text-indigo-900 font-semibold mt-0.5">
                {format12Hour(event.startTime)} – {format12Hour(event.endTime)} ({event.durationMinutes} min)
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-indigo-700 block mb-1">
                Espacio Reservado
              </span>
              <p className="font-bold text-slate-900 text-sm">{event.spaceName}</p>
              <p className="text-slate-500 mt-0.5">
                {space?.location || 'Ubicación'} • Capacidad: {space?.capacity || 'N/A'}
              </p>
            </div>
          </div>

          {/* Responsable */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Responsable</span>
              <p className="text-xs font-bold text-slate-900">
                {event.responsibleName || 'No especificado'}
              </p>
              <p className="text-[11px] text-slate-500">{responsible?.roleTitle || 'Organizador'}</p>
            </div>
          </div>

          {/* Personas Involucradas y Estado de Confirmación */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Personas y Solicitudes ({event.peopleIds?.length || 0})
              </h3>
            </div>

            <div className="space-y-2">
              {event.peopleIds && event.peopleIds.length > 0 ? (
                event.peopleIds.map((pid) => {
                  const person = people.find((p) => p.id === pid);
                  const request = eventRequests.find((r) => r.personId === pid);

                  return (
                    <div
                      key={pid}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          {person ? `${person.firstName} ${person.lastName}` : 'Persona'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {person?.email} • {person?.roleTitle}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Badge de confirmación */}
                        {request?.status === 'confirmada' && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Confirmada
                          </span>
                        )}
                        {request?.status === 'rechazada' && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3.5 h-3.5" />
                            Rechazada
                          </span>
                        )}
                        {(!request || request.status === 'pendiente') && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <HelpCircle className="w-3.5 h-3.5" />
                            Pendiente
                          </span>
                        )}

                        {/* Botón Simular Ver Correo de Notificación */}
                        {request && onOpenSimulatedEmail && (
                          <button
                            onClick={() => onOpenSimulatedEmail(request)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Ver correo con enlace de confirmación"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  No hay personas adicionales convocadas para este evento.
                </div>
              )}
            </div>
          </div>

          {/* Historial / Trazabilidad de Auditoría */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-600" />
              Trazabilidad y Auditoría
            </h3>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50/50 p-3 max-h-40 overflow-y-auto text-xs">
              {eventAudit.length === 0 ? (
                <p className="text-[11px] text-slate-400 py-1">
                  Evento creado inicialmente por {event.createdBy?.name || 'Administrador'}.
                </p>
              ) : (
                eventAudit.map((log) => (
                  <div key={log.id} className="py-1.5 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-700">{log.user.name}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{log.action.replace(/_/g, ' ')}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
