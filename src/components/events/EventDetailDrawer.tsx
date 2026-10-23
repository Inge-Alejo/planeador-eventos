import React, { useState } from 'react';
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
  CheckSquare,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Bell,
  Repeat,
  Plus,
} from 'lucide-react';
import {
  EventEntity,
  Space,
  Person,
  ParticipationRequest,
  AuditLog,
  EventTask,
  EventTaskStage,
  EventTaskStatus,
  EventTaskPriority,
} from '../../types';
import { formatFriendlyDate, format12Hour } from '../../lib/timezone';
import { isInstitutionalSuperAdmin, canEditEventGeneralInfo } from '../../services/businessRules';
import { useAuth } from '../../context/AuthContext';
import { useDismissable } from '../../hooks/useDismissable';

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
  onUpdateTaskStatus?: (eventId: string, taskId: string, newStatus: EventTaskStatus, note?: string) => Promise<void>;
  onAddTaskUpdate?: (eventId: string, taskId: string, update: { text: string; authorUid: string; authorName: string; statusChange?: EventTaskStatus }) => Promise<void>;
  onResolveExceptionalApproval?: (eventId: string, decision: 'aprobado' | 'rechazado', notes: string) => Promise<void>;
  onSaveEventTask?: (eventId: string, task: any) => Promise<any>;
  onDeleteEventTask?: (eventId: string, taskId: string) => Promise<void>;
  onSaveEvent?: (event: EventEntity) => Promise<any>;
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
  onUpdateTaskStatus,
  onAddTaskUpdate,
  onResolveExceptionalApproval,
  onSaveEventTask,
  onDeleteEventTask,
  onSaveEvent,
}) => {
  const { user } = useAuth();
  const [activeTaskUpdatingId, setActiveTaskUpdatingId] = useState<string | null>(null);
  const [updateText, setUpdateText] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Estado para crear nueva tarea directamente en el drawer
  const [newTaskStage, setNewTaskStage] = useState<EventTaskStage | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<EventTaskPriority>('media');
  const [newTaskResponsibleId, setNewTaskResponsibleId] = useState('');
  const [newTaskDueTime, setNewTaskDueTime] = useState('');
  const [isSavingTask, setIsSavingTask] = useState(false);

  const { contentRef, handleBackdropClick } = useDismissable({
    onDismiss: onClose,
    isOpen: Boolean(event),
  });

  if (!event) return null;

  const isSuperAdmin = isInstitutionalSuperAdmin(user);
  const canEditGeneral = canEditEventGeneralInfo(event, user);

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
      case 'pendiente_autorizacion':
        return <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">⚠️ Requiere Autorización</span>;
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

  const handleSendTaskUpdate = async (taskId: string) => {
    if (!updateText.trim()) return;
    if (onAddTaskUpdate) {
      await onAddTaskUpdate(event.id, taskId, {
        text: updateText.trim(),
        authorUid: user?.uid || 'user-anon',
        authorName: user?.displayName || user?.email || 'Usuario',
      });
      setUpdateText('');
      setActiveTaskUpdatingId(null);
    }
  };

  const handleCreateEventTask = async (stage: EventTaskStage) => {
    if (!newTaskName.trim()) {
      alert('Por favor indica el nombre de la tarea.');
      return;
    }
    setIsSavingTask(true);
    try {
      const taskPayload = {
        name: newTaskName.trim(),
        description: newTaskDesc.trim() || undefined,
        stage,
        status: 'pendiente' as EventTaskStatus,
        priority: newTaskPriority,
        responsibleIds: newTaskResponsibleId ? [newTaskResponsibleId] : [],
        dueDate: event.date,
        dueTime: newTaskDueTime || undefined,
        exclusiveAttention: false,
        updates: [
          {
            id: `upd-${Date.now()}`,
            authorUid: user?.uid || 'user-anon',
            authorName: user?.displayName || user?.email || 'Organizador',
            text: 'Tarea asignada e incorporada a la agenda del evento.',
            createdAt: new Date().toISOString(),
          },
        ],
      };
      if (onSaveEventTask) {
        await onSaveEventTask(event.id, taskPayload);
      }
      setNewTaskName('');
      setNewTaskDesc('');
      setNewTaskResponsibleId('');
      setNewTaskDueTime('');
      setNewTaskStage(null);
    } catch (err: any) {
      alert('Error guardando la tarea: ' + err.message);
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleApprovalAction = async (decision: 'aprobado' | 'rechazado') => {
    if (!onResolveExceptionalApproval) return;
    setIsProcessingApproval(true);
    try {
      await onResolveExceptionalApproval(event.id, decision, approvalNotes);
      setApprovalNotes('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del Evento"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200 cursor-default"
      >
        {/* Header Drawer */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2">
            {getStatusBadge(event.status)}
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {event.type}
            </span>
            {event.recurrence && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Repeat className="w-3 h-3" /> Serie Recurrente
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {canEditGeneral && (
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
          {/* BANNER DE AUTORIZACIÓN EXCEPCIONAL URGENTE (<27 DÍAS) */}
          {event.exceptionalApproval?.status === 'pendiente' && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-extrabold uppercase text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white">
                    Excepción Pendiente
                  </span>
                  <h4 className="text-sm font-bold text-rose-900 mt-1">
                    Evento Presencial Urgente Solicitado con Menos de 27 Días
                  </h4>
                  <p className="text-xs text-rose-800 mt-1">
                    Solicitante: <strong>{event.exceptionalApproval.requestedBy?.name || 'Usuario'}</strong> ({event.exceptionalApproval.requestedBy?.email})
                  </p>
                  <div className="mt-2 p-2.5 rounded-xl bg-white border border-rose-200 text-xs text-slate-700 italic">
                    "{event.exceptionalApproval.reason}"
                  </div>
                </div>
              </div>

              {/* Botones de Aprobación Exclusiva para Superadministrador */}
              {isSuperAdmin ? (
                <div className="pt-2 border-t border-rose-200 space-y-2">
                  <span className="text-[11px] font-bold text-rose-900 block">
                    Facultad Exclusiva del Superadministrador Institucional:
                  </span>
                  <input
                    type="text"
                    placeholder="Observaciones de la decisión (opcional)..."
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    className="w-full rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isProcessingApproval}
                      onClick={() => handleApprovalAction('aprobado')}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      ✓ Aprobar Excepción
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingApproval}
                      onClick={() => handleApprovalAction('rechazado')}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      ✕ Rechazar Excepción
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-rose-700 italic font-medium pt-1">
                  En espera de revisión y resolución por el Superadministrador Institucional autorizado.
                </p>
              )}
            </div>
          )}

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
                {space?.location || 'Ubicación'} • Capacidad: {space?.capacity || 'N/A'} {event.isVirtual ? '• Virtual' : '• Presencial'}
              </p>
            </div>
          </div>

          {/* Responsable Principal */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Responsable Principal</span>
              <p className="text-xs font-bold text-slate-900">
                {event.responsibleName || 'No especificado'}
              </p>
              <p className="text-[11px] text-slate-500">{responsible?.roleTitle || 'Organizador'}</p>
            </div>
          </div>

          {/* SECCIÓN DE TAREAS ORGANIZADAS POR LAS 3 ETAPAS (SECCIÓN 3 Y 4) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" />
              Responsabilidades y Tareas por Etapa ({event.tasks?.length || 0})
            </h3>

            {(['previa', 'durante', 'posterior'] as EventTaskStage[]).map((stage) => {
              const stageLabels = {
                previa: 'Etapa Previa (Preparación)',
                durante: 'Etapa Durante el Evento',
                posterior: 'Etapa Posterior (Cierre y Memorias)',
              };
              const stageTasks = (event.tasks || []).filter((t) => t.stage === stage);

              return (
                <div key={stage} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{stageLabels[stage]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {stageTasks.length} tareas
                      </span>
                      {onSaveEventTask && newTaskStage !== stage && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewTaskStage(stage);
                            setNewTaskName('');
                            setNewTaskDesc('');
                            setNewTaskResponsibleId('');
                            setNewTaskPriority('media');
                            setNewTaskDueTime('');
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tarea</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Formulario Inline para Crear Tarea en esta Etapa */}
                  {newTaskStage === stage && (
                    <div className="p-3 rounded-xl border border-indigo-200 bg-white shadow-xs space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-900 text-[11px]">Nueva Tarea en {stageLabels[stage]}</span>
                        <button
                          type="button"
                          onClick={() => setNewTaskStage(null)}
                          className="text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Nombre de la tarea (ej: Confirmar micrófonos y pantalla)"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                        autoFocus
                      />
                      <input
                        type="text"
                        placeholder="Descripción u observaciones opcionales"
                        value={newTaskDesc}
                        onChange={(e) => setNewTaskDesc(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Responsable</label>
                          <select
                            value={newTaskResponsibleId}
                            onChange={(e) => setNewTaskResponsibleId(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
                          >
                            <option value="">Seleccionar responsable...</option>
                            {people.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.firstName} {p.lastName} ({p.roleTitle})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Prioridad</label>
                          <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value as EventTaskPriority)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
                          >
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Hora límite (opcional)</label>
                          <input
                            type="time"
                            value={newTaskDueTime}
                            onChange={(e) => setNewTaskDueTime(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono text-slate-700"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setNewTaskStage(null)}
                          className="px-3 py-1 rounded-lg text-slate-500 hover:bg-slate-100 text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          disabled={isSavingTask}
                          onClick={() => handleCreateEventTask(stage)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          {isSavingTask ? 'Guardando...' : 'Guardar y Asignar'}
                        </button>
                      </div>
                    </div>
                  )}

                  {stageTasks.length === 0 && newTaskStage !== stage ? (
                    <p className="text-[11px] text-slate-400 italic">No hay tareas asignadas en esta etapa.</p>
                  ) : (
                    stageTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white space-y-2 text-xs shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="font-bold text-slate-900 text-xs">{task.name}</span>
                            {task.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Selector de Estado */}
                            <select
                              value={task.status}
                              onChange={(e) => {
                                if (onUpdateTaskStatus) {
                                  onUpdateTaskStatus(event.id, task.id, e.target.value as EventTaskStatus);
                                }
                              }}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 focus:outline-none"
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="en_curso">En Curso</option>
                              <option value="completada">Completada</option>
                              <option value="bloqueada">Bloqueada</option>
                              <option value="cancelada">Cancelada</option>
                            </select>

                            {/* Botón eliminar tarea */}
                            {onDeleteEventTask && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Eliminar la tarea "${task.name}"?`)) {
                                    onDeleteEventTask(event.id, task.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                                title="Eliminar tarea"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Metadatos de la tarea */}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            Prioridad: {task.priority}
                          </span>
                          {task.exclusiveAttention && (
                            <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">
                              Exclusiva
                            </span>
                          )}
                          <span>
                            Responsables: {task.responsibleIds.map((id) => {
                              const p = people.find((x) => x.id === id);
                              return p ? `${p.firstName} ${p.lastName}` : id;
                            }).join(', ') || 'Sin asignar'}
                          </span>
                        </div>

                        {/* Historial de Novedades (Inmutable) */}
                        {task.updates && task.updates.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                              Historial de Novedades y Avances:
                            </span>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                              {task.updates.map((upd) => (
                                <div key={upd.id} className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                                    <span className="font-semibold text-slate-700">{upd.authorName}</span>
                                    <span>{new Date(upd.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="text-slate-600 mt-0.5">{upd.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Formulario para Registrar Novedad */}
                        {activeTaskUpdatingId === task.id ? (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Escribe el avance, dificultad o comentario..."
                              value={updateText}
                              onChange={(e) => setUpdateText(e.target.value)}
                              className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendTaskUpdate(task.id)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTaskUpdatingId(null)}
                              className="text-slate-400 hover:text-slate-600 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTaskUpdatingId(task.id);
                              setUpdateText('');
                            }}
                            className="mt-1 flex items-center gap-1 text-[11px] text-indigo-600 font-semibold hover:text-indigo-800"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Registrar Novedad / Avance</span>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>

          {/* Recordatorios Programados */}
          {event.reminder?.enabled && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-900">
              <Bell className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Recordatorio Automático Programado</span>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  Se enviará automáticamente {event.reminder.daysBefore} día(s) antes del evento a las personas asignadas.
                </p>
              </div>
            </div>
          )}

          {/* Personas Involucradas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Personas Convocadas ({event.peopleIds?.length || 0})
              </h3>
            </div>

            {/* Selector rápido para convocar persona */}
            {onSaveEvent && (
              <div className="mb-3">
                <select
                  onChange={async (e) => {
                    const pid = e.target.value;
                    if (!pid) return;
                    const updatedPeople = Array.from(new Set([...(event.peopleIds || []), pid]));
                    await onSaveEvent({
                      ...event,
                      peopleIds: updatedPeople,
                    });
                    e.target.value = '';
                  }}
                  className="w-full rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-800 focus:outline-none transition-colors"
                  defaultValue=""
                >
                  <option value="" disabled>+ Convocar a otra persona del directorio al evento...</option>
                  {people
                    .filter((p) => !(event.peopleIds || []).includes(p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} — {p.roleTitle} ({p.department || 'Facultad de Medicina'})
                      </option>
                    ))}
                </select>
              </div>
            )}

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
