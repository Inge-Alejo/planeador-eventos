import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  Building2,
  Users,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileText,
  UserCheck,
  Mail,
  Bell,
  Repeat,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckSquare,
} from 'lucide-react';
import {
  EventEntity,
  Space,
  Person,
  EventType,
  EventStatus,
  PeopleGroup,
  EventTask,
  EventTaskStage,
  EventTaskPriority,
  RecurrenceFrequency,
  EventReminderConfig,
} from '../../types';
import { detectConflicts } from '../../services/conflictEngine';
import {
  evaluate27DaysRule,
  canEditEventGeneralInfo,
  isInstitutionalSuperAdmin,
  generateRecurrenceInstances,
} from '../../services/businessRules';
import { calculateDuration, format12Hour, getBogotaToday } from '../../lib/timezone';
import { useDismissable } from '../../hooks/useDismissable';
import { useAuth } from '../../context/AuthContext';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    event: Omit<EventEntity, 'id'> & { id?: string },
    peopleToInvite?: string[],
    sendEmail?: boolean
  ) => Promise<void>;
  eventToEdit?: EventEntity | null;
  spaces: Space[];
  people: Person[];
  groups?: PeopleGroup[];
  existingEvents: EventEntity[];
  initialPreset?: { date?: string; time?: string; spaceId?: string };
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  eventToEdit,
  spaces,
  people,
  groups = [],
  existingEvents,
  initialPreset,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('academico');
  const [date, setDate] = useState(getBogotaToday());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [spaceId, setSpaceId] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [attendeesCount, setAttendeesCount] = useState<number>(10);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
  const [status, setStatus] = useState<EventStatus>('programado');
  const [isVirtual, setIsVirtual] = useState<boolean>(false);
  const [notes, setNotes] = useState('');
  const [sendParticipationEmails, setSendParticipationEmails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Regla de 27 días y Autorización Excepcional
  const [urgencyReason, setUrgencyReason] = useState('');
  const [showUrgencyForm, setShowUrgencyForm] = useState(false);

  // Recurrencia
  const [recurrenceFreq, setRecurrenceFreq] = useState<RecurrenceFrequency>('ninguna');
  const [recurrenceCount, setRecurrenceCount] = useState<number>(4);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');

  // Recordatorios
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number>(1);

  // Tareas por Etapas
  const [tasks, setTasks] = useState<EventTask[]>([]);
  const [openStages, setOpenStages] = useState<{ previa: boolean; durante: boolean; posterior: boolean }>({
    previa: true,
    durante: true,
    posterior: true,
  });

  // Estado para nueva tarea rápida
  const [newTaskStage, setNewTaskStage] = useState<EventTaskStage | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<EventTaskPriority>('media');
  const [newTaskResponsibles, setNewTaskResponsibles] = useState<string[]>([]);
  const [newTaskExclusive, setNewTaskExclusive] = useState(false);
  const [newTaskDueTime, setNewTaskDueTime] = useState('');

  // Permiso de edición de información general
  const canEditGeneral = useMemo(() => {
    return canEditEventGeneralInfo(eventToEdit, user);
  }, [eventToEdit, user]);

  // Cargar datos al abrir modal
  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setType(eventToEdit.type);
      setDate(eventToEdit.date);
      setStartTime(eventToEdit.startTime);
      setEndTime(eventToEdit.endTime);
      setSpaceId(eventToEdit.spaceId);
      setResponsibleId(eventToEdit.responsibleId);
      setAttendeesCount(eventToEdit.attendeesCount || 0);
      setSelectedPeopleIds(eventToEdit.peopleIds || []);
      setStatus(eventToEdit.status);
      setIsVirtual(Boolean(eventToEdit.isVirtual));
      setNotes(eventToEdit.notes || '');
      setSendParticipationEmails(false);
      setTasks(eventToEdit.tasks || []);

      if (eventToEdit.reminder) {
        setReminderEnabled(eventToEdit.reminder.enabled);
        setReminderDaysBefore(eventToEdit.reminder.daysBefore || 1);
      } else {
        setReminderEnabled(true);
        setReminderDaysBefore(1);
      }

      if (eventToEdit.recurrence) {
        setRecurrenceFreq(eventToEdit.recurrence.frequency || 'ninguna');
        setRecurrenceCount(eventToEdit.recurrence.occurrencesCount || 4);
        setRecurrenceEndDate(eventToEdit.recurrence.endDate || '');
      } else {
        setRecurrenceFreq('ninguna');
      }

      if (eventToEdit.exceptionalApproval) {
        setUrgencyReason(eventToEdit.exceptionalApproval.reason || '');
      } else {
        setUrgencyReason('');
      }
    } else {
      // Valores por defecto
      setTitle('');
      setDescription('');
      setType('academico');
      setDate(initialPreset?.date || getBogotaToday());
      setStartTime(initialPreset?.time || '08:00');
      const [h, m] = (initialPreset?.time || '08:00').split(':').map(Number);
      const endH = String(Math.min(23, h + 2)).padStart(2, '0');
      setEndTime(`${endH}:${String(m).padStart(2, '0')}`);
      const defaultSpaceId = initialPreset?.spaceId || (spaces[0]?.id || '');
      setSpaceId(defaultSpaceId);
      const sp = spaces.find((s) => s.id === defaultSpaceId);
      setIsVirtual(Boolean(sp?.isVirtual || (sp?.name || '').toLowerCase().includes('virtual')));
      setResponsibleId(people[0]?.id || '');
      setAttendeesCount(15);
      setSelectedPeopleIds([]);
      setStatus('programado');
      setNotes('');
      setSendParticipationEmails(false);
      setTasks([]);
      setReminderEnabled(true);
      setReminderDaysBefore(1);
      setRecurrenceFreq('ninguna');
      setUrgencyReason('');
      setShowUrgencyForm(false);
    }
  }, [eventToEdit, initialPreset, isOpen, spaces, people]);

  // Duración en minutos calculada en tiempo real
  const duration = useMemo(() => calculateDuration(startTime, endTime), [startTime, endTime]);

  // Evaluación de la Regla Institucional de 27 Días
  const anticipationRule = useMemo(() => {
    return evaluate27DaysRule(date, isVirtual, eventToEdit?.exceptionalApproval);
  }, [date, isVirtual, eventToEdit?.exceptionalApproval]);

  // Evaluación de conflictos en tiempo real (espacio, personas y tareas exclusivas)
  const conflictResult = useMemo(() => {
    if (!date || !startTime || !endTime || !spaceId) {
      return { hasBlockingConflicts: false, hasWarnings: false, conflicts: [] };
    }

    return detectConflicts({
      eventId: eventToEdit?.id,
      date,
      startTime,
      endTime,
      spaceId,
      peopleIds: selectedPeopleIds,
      attendeesCount,
      isVirtual,
      tasks,
      spaces,
      people,
      existingEvents,
    });
  }, [
    eventToEdit?.id,
    date,
    startTime,
    endTime,
    spaceId,
    selectedPeopleIds,
    attendeesCount,
    isVirtual,
    tasks,
    spaces,
    people,
    existingEvents,
  ]);

  const { contentRef, handleBackdropClick } = useDismissable({
    onDismiss: onClose,
    isOpen,
  });

  if (!isOpen) return null;

  // Toggle de grupos
  const handleToggleGroup = (group: PeopleGroup) => {
    const isFullySelected =
      group.memberIds.length > 0 &&
      group.memberIds.every((id) => selectedPeopleIds.includes(id));

    if (isFullySelected) {
      setSelectedPeopleIds((prev) => prev.filter((id) => !group.memberIds.includes(id)));
    } else {
      setSelectedPeopleIds((prev) => Array.from(new Set([...prev, ...group.memberIds])));
    }
  };

  const togglePerson = (pid: string) => {
    setSelectedPeopleIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  // Agregar Tarea
  const handleAddTask = (stage: EventTaskStage) => {
    if (!newTaskName.trim()) {
      alert('Por favor indica el nombre de la tarea.');
      return;
    }

    const newTask: EventTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      eventId: eventToEdit?.id || 'pending',
      name: newTaskName.trim(),
      description: newTaskDesc.trim() || undefined,
      stage,
      status: 'pendiente',
      priority: newTaskPriority,
      responsibleIds: newTaskResponsibles.length > 0 ? newTaskResponsibles : (responsibleId ? [responsibleId] : []),
      dueDate: date,
      dueTime: newTaskDueTime || undefined,
      exclusiveAttention: newTaskExclusive,
      updates: [
        {
          id: `upd-${Date.now()}`,
          authorUid: user?.uid || 'user-creator',
          authorName: user?.displayName || 'Creador de la Tarea',
          text: 'Tarea creada e incorporada a la agenda del evento.',
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTaskName('');
    setNewTaskDesc('');
    setNewTaskPriority('media');
    setNewTaskResponsibles([]);
    setNewTaskExclusive(false);
    setNewTaskDueTime('');
    setNewTaskStage(null);
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('Por favor ingresa un título para el evento.');
    if (!spaceId) return alert('Por favor selecciona un espacio.');
    if (duration <= 0) return alert('La hora final debe ser posterior a la hora inicial.');

    // Conflicto de espacio presencial
    if (conflictResult.hasBlockingConflicts) {
      alert(
        'No es posible guardar el evento debido a un conflicto de bloqueo: el espacio presencial seleccionado ya está ocupado en ese horario.'
      );
      return;
    }

    // Regla de 27 días: si es presencial y tiene menos de 27 días sin aprobación
    let finalStatus: EventStatus = status;
    let exceptionalData = eventToEdit?.exceptionalApproval;

    if (anticipationRule.isRestricted) {
      if (!urgencyReason.trim()) {
        alert(
          '⚠️ Restricción de 27 Días:\n\nEste evento presencial está programado con menos de 27 días de anticipación. Para poder radicarlo, es obligatorio ingresar la justificación de urgencia para la solicitud de autorización excepcional.'
        );
        setShowUrgencyForm(true);
        return;
      }

      finalStatus = 'pendiente_autorizacion';
      exceptionalData = {
        required: true,
        status: 'pendiente',
        requestedAt: new Date().toISOString(),
        requestedBy: {
          uid: user?.uid || 'user-requester',
          name: user?.displayName || 'Solicitante UdeA',
          email: user?.email || 'proyectostic.med@udea.edu.co',
        },
        reason: urgencyReason.trim(),
        daysAnticipation: anticipationRule.daysAnticipation,
        originalSnapshot: {
          date,
          isVirtual,
        },
      };
    }

    setIsSubmitting(true);
    try {
      const targetSpace = spaces.find((s) => s.id === spaceId);
      const targetResp = people.find((p) => p.id === responsibleId);

      // Configuración de recordatorios
      const reminderConfig: EventReminderConfig | undefined = reminderEnabled
        ? {
            enabled: true,
            daysBefore: reminderDaysBefore,
            status: 'programado',
            scheduledDate: date,
          }
        : undefined;

      // Base payload
      const eventPayload: Omit<EventEntity, 'id'> & { id?: string } = {
        title: title.trim(),
        description: description.trim(),
        type,
        date,
        startTime,
        endTime,
        durationMinutes: duration,
        status: finalStatus,
        spaceId,
        spaceName: targetSpace?.name || 'Espacio Sin Asignar',
        responsibleId,
        responsibleName: targetResp ? `${targetResp.firstName} ${targetResp.lastName}` : 'Sin Asignar',
        attendeesCount: Number(attendeesCount) || 0,
        isVirtual: Boolean(isVirtual),
        notes: notes.trim(),
        peopleIds: selectedPeopleIds,
        tasks,
        reminder: reminderConfig,
        exceptionalApproval: exceptionalData,
        recurrence:
          recurrenceFreq !== 'ninguna'
            ? {
                frequency: recurrenceFreq,
                occurrencesCount: recurrenceCount,
                endDate: recurrenceEndDate || undefined,
              }
            : undefined,
        createdBy: eventToEdit?.createdBy || {
          uid: user?.uid || 'person-proyectostic',
          name: user?.displayName || 'Alejandro Proyectos TIC',
          email: user?.email || 'proyectostic.med@udea.edu.co',
        },
        createdAt: eventToEdit?.createdAt || new Date().toISOString(),
      };

      if (eventToEdit) {
        eventPayload.id = eventToEdit.id;
        await onSave(eventPayload, selectedPeopleIds, sendParticipationEmails);
      } else {
        // Generar serie recurrente si aplica
        if (recurrenceFreq !== 'ninguna') {
          const dummyBase: EventEntity = {
            ...(eventPayload as any),
            id: `evt-${Date.now()}`,
          };
          const series = generateRecurrenceInstances(dummyBase, {
            frequency: recurrenceFreq,
            occurrencesCount: recurrenceCount,
            endDate: recurrenceEndDate || undefined,
          });

          for (const instance of series) {
            await onSave(instance, selectedPeopleIds, sendParticipationEmails);
          }
        } else {
          await onSave(eventPayload, selectedPeopleIds, sendParticipationEmails);
        }
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Error guardando evento: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-event-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden cursor-default"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-event-title" className="text-base font-bold text-slate-900 flex items-center gap-2">
                {eventToEdit ? 'Editar Evento' : 'Programar Nuevo Evento'}
                {recurrenceFreq !== 'ninguna' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1">
                    <Repeat className="w-3 h-3" /> Recurrente
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                {eventToEdit
                  ? 'Gestiona la agenda, tareas asociadas y parámetros'
                  : 'Completa la información institucional y asigna responsabilidades'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Advertencia si el usuario no es creador ni superadmin */}
          {!canEditGeneral && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Modo Colaborador de Responsabilidades</span>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Únicamente el usuario creador original (<strong>{eventToEdit?.createdBy?.name || 'Administrador'}</strong>) puede modificar la información general del evento. Puedes añadir y gestionar tus tareas asociadas en las secciones inferiores.
                </p>
              </div>
            </div>
          )}

          {/* ALERTA DE REGLA DE 27 DÍAS PARA EVENTOS PRESENCIALES */}
          {anticipationRule.isRestricted && (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 flex flex-col gap-2.5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold uppercase text-[10px] px-2 py-0.5 rounded bg-rose-600 text-white">
                      Restricción 27 Días
                    </span>
                    <span className="text-xs font-bold text-rose-900">
                      Evento Presencial Requiere Autorización Excepcional
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                    {anticipationRule.message} El evento no podrá quedar programado definitivamente en el calendario institucional hasta que el Superadministrador apruebe la excepción.
                  </p>
                </div>
              </div>

              {/* Justificación obligatoria */}
              <div className="mt-1 pt-2 border-t border-rose-200">
                <label className="block text-[11px] font-bold text-rose-900 mb-1">
                  Justificación obligatoria de la urgencia: *
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explica la urgencia y el motivo por el cual no fue posible radicar con 27 días de antelación..."
                  value={urgencyReason}
                  onChange={(e) => setUrgencyReason(e.target.value)}
                  className="w-full rounded-xl border border-rose-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          {/* Alertas de Conflictos en Vivo */}
          {conflictResult.conflicts.length > 0 && (
            <div className="space-y-2">
              {conflictResult.conflicts.map((c) => (
                <div
                  key={c.id}
                  className={`p-3 rounded-2xl flex items-start gap-3 text-xs ${
                    c.severity === 'bloqueo'
                      ? 'bg-rose-50 border border-rose-200 text-rose-900'
                      : 'bg-amber-50 border border-amber-200 text-amber-900'
                  }`}
                >
                  {c.severity === 'bloqueo' ? (
                    <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold uppercase tracking-wider text-[10px] px-1.5 py-0.2 rounded bg-white/70">
                        {c.severity}
                      </span>
                      <span className="font-bold">{c.title}</span>
                    </div>
                    <p className="mt-1 leading-relaxed opacity-90">{c.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Título y Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre del Evento *
              </label>
              <input
                type="text"
                required
                disabled={!canEditGeneral}
                placeholder="ej: Videoclase o Simposio Médico"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo</label>
              <select
                value={type}
                disabled={!canEditGeneral}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 capitalize disabled:bg-slate-100"
              >
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
            </div>
          </div>

          {/* Fecha, Horarios y Duración */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Fecha (Bogotá)
              </label>
              <input
                type="date"
                required
                disabled={!canEditGeneral}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Hora Inicio</label>
              <input
                type="time"
                required
                disabled={!canEditGeneral}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Hora Fin</label>
              <input
                type="time"
                required
                disabled={!canEditGeneral}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Duración</label>
              <div className="flex h-[34px] items-center rounded-xl bg-slate-200/60 px-3 text-xs font-semibold text-slate-700">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                {duration > 0 ? `${duration} min` : 'Error hora'}
              </div>
            </div>
          </div>

          {/* Espacio y Modalidad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Espacio Físico o Virtual *
              </label>
              <select
                value={spaceId}
                disabled={!canEditGeneral}
                onChange={(e) => {
                  const spId = e.target.value;
                  setSpaceId(spId);
                  const sp = spaces.find((s) => s.id === spId);
                  setIsVirtual(Boolean(sp?.isVirtual || (sp?.name || '').toLowerCase().includes('virtual')));
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100"
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.location} - Cap: {s.capacity}) {s.isVirtual ? '• Virtual' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Modalidad</label>
              <div className="flex items-center gap-2 mt-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canEditGeneral}
                    checked={isVirtual}
                    onChange={(e) => setIsVirtual(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Modalidad Virtual</span>
                </label>
              </div>
            </div>
          </div>

          {/* Responsable Principal y Asistentes Proyectados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Responsable Principal del Evento
              </label>
              <select
                value={responsibleId}
                disabled={!canEditGeneral}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
              >
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — {p.roleTitle || p.department}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Aforo / Asistentes Proyectados
              </label>
              <input
                type="number"
                min="1"
                disabled={!canEditGeneral}
                value={attendeesCount}
                onChange={(e) => setAttendeesCount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* SECCIÓN DE RECURRENCIA (SECCIÓN 6) */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Repeat className="w-4 h-4 text-indigo-600" />
                Programación Periódica / Recurrencia
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Frecuencia</label>
                <select
                  value={recurrenceFreq}
                  disabled={!canEditGeneral || Boolean(eventToEdit)}
                  onChange={(e) => setRecurrenceFreq(e.target.value as RecurrenceFrequency)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-indigo-500 disabled:bg-slate-100"
                >
                  <option value="ninguna">Evento Único (Sin repetición)</option>
                  <option value="diaria">Diariamente</option>
                  <option value="semanal">Semanalmente</option>
                  <option value="mensual">Mensualmente</option>
                  <option value="personalizada">Personalizada</option>
                </select>
              </div>
              {recurrenceFreq !== 'ninguna' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Repeticiones (Ocurrencias)</label>
                    <input
                      type="number"
                      min="2"
                      max="52"
                      value={recurrenceCount}
                      onChange={(e) => setRecurrenceCount(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hasta Fecha (Opcional)</label>
                    <input
                      type="date"
                      value={recurrenceEndDate}
                      onChange={(e) => setRecurrenceEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* SECCIÓN DE RECORDATORIOS AUTOMÁTICOS (SECCIÓN 2) */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                Recordatorios Automáticos por Correo Electrónico
              </span>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Habilitar Recordatorio</span>
              </label>
            </div>
            {reminderEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Anticipación del Recordatorio
                  </label>
                  <select
                    value={reminderDaysBefore}
                    onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-500"
                  >
                    <option value={1}>1 día antes (Mínimo recomendado)</option>
                    <option value={2}>2 días antes</option>
                    <option value={3}>3 días antes</option>
                    <option value={7}>1 semana antes (7 días)</option>
                    <option value={15}>15 días antes</option>
                  </select>
                </div>
                <div className="flex items-center text-xs text-slate-500 pt-4">
                  El correo incluirá las responsabilidades específicas de cada persona y enlace directo al planeador.
                </div>
              </div>
            )}
          </div>

          {/* ORGANIZACIÓN DE TAREAS POR ETAPAS (SECCIÓN 3 Y 4) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  Gestión y Distribución de Tareas por Etapas ({tasks.length} tareas)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Una persona puede tener múltiples tareas compatibles en diferentes etapas sin generar conflicto.
                </p>
              </div>
            </div>

            {/* ACORDEONES DE LAS 3 ETAPAS */}
            {(['previa', 'durante', 'posterior'] as EventTaskStage[]).map((stage) => {
              const stageLabels = {
                previa: { title: '1. Tareas Previas al Evento', desc: 'Preparación, insumos, logística y coordinación' },
                durante: { title: '2. Tareas Durante el Evento', desc: 'Acompañamiento, moderación, soporte audiovisual y registro' },
                posterior: { title: '3. Tareas Posteriores al Evento', desc: 'Actas, memorias, certificados, evaluación y cierre' },
              };
              const stageTasks = tasks.filter((t) => t.stage === stage);
              const isOpen = openStages[stage];

              return (
                <div key={stage} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setOpenStages((prev) => ({ ...prev, [stage]: !prev[stage] }))}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/70 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{stageLabels[stage].title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {stageTasks.length}
                      </span>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="p-3.5 space-y-3">
                      {stageTasks.length === 0 && newTaskStage !== stage && (
                        <p className="text-xs text-slate-400 italic">No hay tareas registradas para esta etapa.</p>
                      )}

                      {/* Lista de tareas registradas en esta etapa */}
                      {stageTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start justify-between gap-3 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800">{task.name}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  task.priority === 'alta'
                                    ? 'bg-rose-100 text-rose-700'
                                    : task.priority === 'media'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {task.priority}
                              </span>
                              {task.exclusiveAttention && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                                  Atención Exclusiva
                                </span>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                              <span>Responsables: {task.responsibleIds.map((id) => {
                                const p = people.find((x) => x.id === id);
                                return p ? `${p.firstName} ${p.lastName}` : id;
                              }).join(', ') || 'Sin asignar'}</span>
                              {task.dueTime && <span>Hora: {task.dueTime}</span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(task.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Formulario Inline para Nueva Tarea */}
                      {newTaskStage === stage ? (
                        <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                          <input
                            type="text"
                            placeholder="Nombre de la tarea (ej: Revisión de micrófonos y proyector)"
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Descripción u observaciones opcionales"
                            value={newTaskDesc}
                            onChange={(e) => setNewTaskDesc(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Prioridad</label>
                              <select
                                value={newTaskPriority}
                                onChange={(e) => setNewTaskPriority(e.target.value as EventTaskPriority)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                              >
                                <option value="baja">Baja</option>
                                <option value="media">Media</option>
                                <option value="alta">Alta</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Hora Límite</label>
                              <input
                                type="time"
                                value={newTaskDueTime}
                                onChange={(e) => setNewTaskDueTime(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Responsables</label>
                              <select
                                onChange={(e) => {
                                  const pid = e.target.value;
                                  if (pid && !newTaskResponsibles.includes(pid)) {
                                    setNewTaskResponsibles((prev) => [...prev, pid]);
                                  }
                                }}
                                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                              >
                                <option value="">+ Asignar persona</option>
                                {people.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.firstName} {p.lastName}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Chips de personas asignadas */}
                          {newTaskResponsibles.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {newTaskResponsibles.map((pid) => {
                                const p = people.find((x) => x.id === pid);
                                return (
                                  <span key={pid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-[10px] text-indigo-700 font-semibold">
                                    {p ? `${p.firstName} ${p.lastName}` : pid}
                                    <button type="button" onClick={() => setNewTaskResponsibles((prev) => prev.filter((id) => id !== pid))}>
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Toggle de Atención Exclusiva */}
                          <div className="pt-1">
                            <label className="flex items-center gap-2 text-xs font-medium text-purple-900 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newTaskExclusive}
                                onChange={(e) => setNewTaskExclusive(e.target.checked)}
                                className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                              />
                              <span>⚠️ Requiere atención exclusiva (alerta de cruce simultáneo en el mismo horario)</span>
                            </label>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setNewTaskStage(null)}
                              className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddTask(stage)}
                              className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                            >
                              Guardar Tarea
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setNewTaskStage(stage)}
                          className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar Tarea a esta Etapa</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Personas y Grupos Convocados */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Personas y Grupos Convocados ({selectedPeopleIds.length} seleccionados)
              </label>
            </div>

            {/* Selector Rápido de Grupos */}
            {groups.length > 0 && (
              <div className="mb-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Seleccionar por Grupo Institucional:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {groups.map((group) => {
                    const isFullySelected =
                      group.memberIds.length > 0 &&
                      group.memberIds.every((id) => selectedPeopleIds.includes(id));
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => handleToggleGroup(group)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          isFullySelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {group.name} ({group.memberIds.length})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista Scrollable de Personas */}
            <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
              {people.map((p) => {
                const isSelected = selectedPeopleIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePerson(p.id)}
                    className={`flex items-center justify-between p-2.5 cursor-pointer text-xs transition-colors ${
                      isSelected ? 'bg-indigo-50/60 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="text-slate-800">{p.firstName} {p.lastName}</span>
                      <p className="text-[10px] text-slate-400 truncate">{p.roleTitle || p.department}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || conflictResult.hasBlockingConflicts}
              className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all ${
                conflictResult.hasBlockingConflicts
                  ? 'bg-slate-300 cursor-not-allowed opacity-60'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {isSubmitting
                ? 'Guardando...'
                : anticipationRule.isRestricted
                ? 'Radicar con Solicitud Excepcional'
                : eventToEdit
                ? 'Actualizar Evento'
                : 'Guardar y Programar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
