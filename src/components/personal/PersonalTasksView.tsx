import React, { useState, useMemo } from 'react';
import {
  EventEntity,
  Space,
  Person,
  ParticipationRequest,
  PersonalTask,
  PersonalTaskPriority,
  UserProfile,
} from '../../types';
import {
  CheckSquare,
  Square,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  CalendarPlus,
  Bell,
  ChevronRight,
  Filter,
  Flame,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  formatFriendlyDate,
  format12Hour,
  getBogotaToday,
  getBogotaCurrentTime,
} from '../../lib/timezone';
import { generateGoogleCalendarUrl, generateOutlookCalendarUrl } from '../../services/emailService';
import confetti from 'canvas-confetti';
import { useDismissable } from '../../hooks/useDismissable';

interface PersonalTasksViewProps {
  user: { uid: string; email: string; displayName?: string } | null;
  events: EventEntity[];
  spaces: Space[];
  people: Person[];
  requests: ParticipationRequest[];
  personalTasks: PersonalTask[];
  onToggleTask: (taskId: string, currentStatus: 'pendiente' | 'completada') => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onSaveTask: (task: Omit<PersonalTask, 'id' | 'createdAt'> & { id?: string }) => Promise<any>;
  onRespondRequest: (requestId: string, response: 'confirmada' | 'rechazada') => Promise<void>;
  onSelectEvent: (eventId: string) => void;
}

export const PersonalTasksView: React.FC<PersonalTasksViewProps> = ({
  user,
  events,
  spaces,
  people,
  requests,
  personalTasks,
  onToggleTask,
  onDeleteTask,
  onSaveTask,
  onRespondRequest,
  onSelectEvent,
}) => {
  const today = getBogotaToday();

  // Encontrar el perfil de Person asociado al usuario actual (por email)
  const currentPerson = useMemo(() => {
    if (!user?.email) return null;
    return people.find((p) => p.email.toLowerCase() === user.email.toLowerCase()) || null;
  }, [user, people]);

  // Solicitudes de participación pendientes para este usuario
  const myPendingRequests = useMemo(() => {
    if (!currentPerson) return [];
    return requests.filter(
      (r) => r.personId === currentPerson.id && r.status === 'pendiente'
    );
  }, [currentPerson, requests]);

  // Mis próximos eventos (donde soy responsable o invitado)
  const myUpcomingEvents = useMemo(() => {
    const personId = currentPerson?.id;
    return events
      .filter((e) => {
        if (e.status === 'cancelado') return false;
        if (e.date < today) return false;
        if (personId) {
          const isInvited = Array.isArray(e.peopleIds) && e.peopleIds.includes(personId);
          const isResp = e.responsibleId === personId;
          return isInvited || isResp;
        }
        return false;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });
  }, [currentPerson, events, today]);

  // Filtros de tareas
  const [taskFilter, setTaskFilter] = useState<'todas' | 'pendientes' | 'completadas'>('pendientes');
  const [priorityFilter, setPriorityFilter] = useState<string>('todas');

  // Modal para crear nueva tarea
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState(getBogotaToday());
  const [newDueTime, setNewDueTime] = useState('12:00');
  const [newPriority, setNewPriority] = useState<PersonalTaskPriority>('media');
  const [newCategory, setNewCategory] = useState<'recordatorio' | 'tarea' | 'seguimiento' | 'evento'>('recordatorio');

  const { contentRef: taskModalRef, handleBackdropClick: handleTaskModalBackdropClick } = useDismissable({
    onDismiss: () => setIsNewTaskModalOpen(false),
    isOpen: isNewTaskModalOpen,
  });

  // Filtrado de tareas
  const filteredTasks = useMemo(() => {
    return personalTasks
      .filter((t) => {
        if (taskFilter === 'pendientes' && t.status !== 'pendiente') return false;
        if (taskFilter === 'completadas' && t.status !== 'completada') return false;
        if (priorityFilter !== 'todas' && t.priority !== priorityFilter) return false;
        return true;
      })
      .sort((a, b) => {
        // Pendientes primero
        if (a.status !== b.status) return a.status === 'pendiente' ? -1 : 1;
        // Prioridad alta primero
        const pOrder: Record<PersonalTaskPriority, number> = { alta: 0, media: 1, baja: 2 };
        if (pOrder[a.priority] !== pOrder[b.priority]) {
          return pOrder[a.priority] - pOrder[b.priority];
        }
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        return 0;
      });
  }, [personalTasks, taskFilter, priorityFilter]);

  const completedCount = useMemo(
    () => personalTasks.filter((t) => t.status === 'completada').length,
    [personalTasks]
  );
  const pendingCount = useMemo(
    () => personalTasks.filter((t) => t.status === 'pendiente').length,
    [personalTasks]
  );

  const handleToggle = async (task: PersonalTask) => {
    const nextStatus = task.status === 'pendiente' ? 'completada' : 'pendiente';
    if (nextStatus === 'completada') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
    await onToggleTask(task.id, nextStatus);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTitle.trim()) return;

    await onSaveTask({
      userId: user.uid,
      title: newTitle.trim(),
      description: newDescription.trim(),
      dueDate: newDueDate,
      dueTime: newDueTime,
      priority: newPriority,
      status: 'pendiente',
      category: newCategory,
    });

    setNewTitle('');
    setNewDescription('');
    setIsNewTaskModalOpen(false);
  };

  const getSpaceName = (spaceId: string) => {
    return spaces.find((s) => s.id === spaceId)?.name || 'Espacio no especificado';
  };

  return (
    <div className="space-y-6">
      {/* Banner Superior Personalizado */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold tracking-wider uppercase mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Espacio Personal de Trabajo • Universidad de Antioquia</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Mis Pendientes y Recordatorios
            </h1>
            <p className="mt-1.5 text-sm text-emerald-100 max-w-xl">
              {currentPerson ? (
                <>
                  Hola, <strong className="text-white">{currentPerson.firstName}</strong> ({currentPerson.roleTitle}). Aquí tienes tus convocatorias, agenda personal y compromisos organizados en tiempo real.
                </>
              ) : (
                <>
                  Sesión iniciada como <strong className="text-white">{user?.email}</strong>. Gestiona tus recordatorios y fechas clave del semestre.
                </>
              )}
            </p>
          </div>

          {user && (
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="self-start md:self-auto flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 active:scale-95 font-bold text-sm shadow-md transition-all shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Nuevo Recordatorio</span>
            </button>
          )}
        </div>

        {/* Indicadores Clave en Vivo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider block">
              Convocatorias Pendientes
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white">{myPendingRequests.length}</span>
              {myPendingRequests.length > 0 && (
                <span className="text-xs text-amber-300 font-bold animate-pulse">¡Por responder!</span>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider block">
              Próximos Eventos
            </span>
            <span className="text-2xl font-black text-white mt-1 block">
              {myUpcomingEvents.length}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider block">
              Recordatorios Activos
            </span>
            <span className="text-2xl font-black text-white mt-1 block">{pendingCount}</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider block">
              Completadas
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-white">{completedCount}</span>
              <Award className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Solicitudes Pendientes de Respuesta */}
      {myPendingRequests.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-5 shadow-sm">
          <div className="flex items-center gap-2.5 text-amber-800 font-bold text-sm mb-3">
            <Bell className="w-5 h-5 text-amber-600 animate-bounce" />
            <span>Tienes {myPendingRequests.length} convocatoria(s) a eventos esperando tu confirmación:</span>
          </div>
          <div className="space-y-3">
            {myPendingRequests.map((req) => {
              const event = events.find((e) => e.id === req.eventId);
              return (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-amber-200 shadow-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{req.eventTitle}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        {req.eventDate} ({format12Hour(req.eventStartTime)} - {format12Hour(req.eventEndTime)})
                      </span>
                      {event && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {getSpaceName(event.spaceId)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onRespondRequest(req.id, 'confirmada')}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Asistencia</span>
                    </button>
                    <button
                      onClick={() => onRespondRequest(req.id, 'rechazada')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
                    >
                      Declinar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid de Dos Columnas: Agenda Personal vs Lista de Recordatorios */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Mi Agenda de Eventos (5 columnas) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              <span>Mi Agenda Académica</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {myUpcomingEvents.length} compromisos
            </span>
          </div>

          <div className="space-y-3">
            {myUpcomingEvents.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
                <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No tienes eventos próximos agendados</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Cuando te convoquen o asignen como responsable a una actividad, aparecerá aquí.
                </p>
              </div>
            ) : (
              myUpcomingEvents.slice(0, 5).map((evt) => {
                const spaceName = getSpaceName(evt.spaceId);
                const gCalUrl = generateGoogleCalendarUrl({
                  title: evt.title,
                  description: evt.description,
                  location: spaceName,
                  date: evt.date,
                  startTime: evt.startTime,
                  endTime: evt.endTime,
                });
                const outlookUrl = generateOutlookCalendarUrl({
                  title: evt.title,
                  description: evt.description,
                  location: spaceName,
                  date: evt.date,
                  startTime: evt.startTime,
                  endTime: evt.endTime,
                });

                return (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-md transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        onClick={() => onSelectEvent(evt.id)}
                        className="cursor-pointer group flex-1"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 inline-block mb-1">
                          {evt.type}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {evt.title}
                        </h3>
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg shrink-0">
                        {evt.date === today ? 'Hoy' : evt.date}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {format12Hour(evt.startTime)} - {format12Hour(evt.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{spaceName}</span>
                      </div>
                    </div>

                    {/* Botones de Agregar a Calendario Personal */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        Sincronizar:
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={gCalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Agregar a mi Google Calendar"
                        >
                          <CalendarPlus className="w-3 h-3" />
                          <span>Google</span>
                        </a>
                        <a
                          href={outlookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
                          title="Agregar a mi Outlook Calendar"
                        >
                          <CalendarPlus className="w-3 h-3" />
                          <span>Outlook</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Tablero de Tareas y Recordatorios Personales (7 columnas) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
              <span>Mis Recordatorios y Tareas</span>
            </h2>

            {/* Filtros */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setTaskFilter('pendientes')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    taskFilter === 'pendientes'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pendientes ({pendingCount})
                </button>
                <button
                  onClick={() => setTaskFilter('completadas')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    taskFilter === 'completadas'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Hechas ({completedCount})
                </button>
                <button
                  onClick={() => setTaskFilter('todas')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    taskFilter === 'todas'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Todas
                </button>
              </div>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-100 border-none rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="todas">Prioridad: Todas</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
          </div>

          {/* Lista de Tareas */}
          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">¡Al día! No tienes recordatorios en esta vista</p>
                <p className="text-xs text-slate-400 mt-1">
                  Agrega notas personales sobre materiales a llevar, preparar presentaciones o llamadas.
                </p>
                <button
                  onClick={() => setIsNewTaskModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  + Agregar Tarea
                </button>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isCompleted = task.status === 'completada';
                const isOverdue = !isCompleted && task.dueDate && task.dueDate < today;

                const priorityColors: Record<PersonalTaskPriority, string> = {
                  alta: 'bg-rose-50 text-rose-700 border-rose-200',
                  media: 'bg-amber-50 text-amber-700 border-amber-200',
                  baja: 'bg-slate-50 text-slate-600 border-slate-200',
                };

                return (
                  <div
                    key={task.id}
                    className={`group p-4 rounded-2xl border transition-all flex items-start gap-3 bg-white ${
                      isCompleted
                        ? 'border-slate-100 bg-slate-50/60 opacity-70'
                        : isOverdue
                        ? 'border-rose-200 bg-rose-50/20'
                        : 'border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                    }`}
                  >
                    <button
                      onClick={() => handleToggle(task)}
                      className={`mt-0.5 rounded-lg p-1 transition-all ${
                        isCompleted
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                      }`}
                      title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <Square className="w-5 h-5 stroke-[2]" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {task.title}
                        </span>

                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            priorityColors[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>

                        {task.category && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {task.category}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p
                          className={`text-xs mt-1 leading-relaxed ${
                            isCompleted ? 'text-slate-400 line-through' : 'text-slate-600'
                          }`}
                        >
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2 font-medium">
                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-1 ${
                              isOverdue ? 'text-rose-600 font-bold' : ''
                            }`}
                          >
                            <CalendarIcon className="w-3 h-3" />
                            {task.dueDate === today
                              ? 'Hoy'
                              : isOverdue
                              ? `Venció el ${task.dueDate}`
                              : `Vence el ${task.dueDate}`}
                            {task.dueTime && ` a las ${format12Hour(task.dueTime)}`}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Eliminar recordatorio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal para Crear Nueva Tarea Personal */}
      {isNewTaskModalOpen && (
        <div
          onClick={handleTaskModalBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        >
          <div
            ref={taskModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-personal-task-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-up cursor-default"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 id="modal-personal-task-title" className="font-bold text-slate-800 text-base flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <span>Nuevo Recordatorio Personal</span>
              </h3>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Título de la Tarea o Recordatorio *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Llevar guías impresas, preparar proyector..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Detalles u Observaciones
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Información adicional relevante..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hora Límite
                  </label>
                  <input
                    type="time"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Prioridad
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PersonalTaskPriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none font-medium"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Categoría
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as 'recordatorio' | 'tarea' | 'seguimiento' | 'evento')
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none capitalize"
                  >
                    <option value="recordatorio">Recordatorio</option>
                    <option value="tarea">Tarea</option>
                    <option value="seguimiento">Seguimiento</option>
                    <option value="evento">Evento</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Crear Recordatorio</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
