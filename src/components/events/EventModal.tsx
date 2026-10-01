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
} from 'lucide-react';
import { EventEntity, Space, Person, EventType, EventStatus, PeopleGroup } from '../../types';
import { detectConflicts } from '../../services/conflictEngine';
import { calculateDuration, format12Hour, getBogotaToday } from '../../lib/timezone';
import { useDismissable } from '../../hooks/useDismissable';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<EventEntity, 'id'> & { id?: string }, sendRequestsTo?: string[]) => Promise<void>;
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
  const [sendParticipationEmails, setSendParticipationEmails] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleGroup = (group: PeopleGroup) => {
    const isFullySelected =
      group.memberIds.length > 0 &&
      group.memberIds.every((id) => selectedPeopleIds.includes(id));

    if (isFullySelected) {
      // Remover a los miembros de este grupo
      setSelectedPeopleIds((prev) => prev.filter((id) => !group.memberIds.includes(id)));
    } else {
      // Agregar a todos los miembros de este grupo sin duplicar
      setSelectedPeopleIds((prev) => Array.from(new Set([...prev, ...group.memberIds])));
    }
  };

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
    } else {
      // Valores por defecto o preset
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
    }
  }, [eventToEdit, initialPreset, isOpen, spaces, people]);

  // Duración en minutos calculada en tiempo real
  const duration = useMemo(() => calculateDuration(startTime, endTime), [startTime, endTime]);

  // Evaluación REACTIVA de conflictos en tiempo real (Client-side feedback instantáneo)
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
      spaces,
      people,
      existingEvents,
    });
  }, [
    eventToEdit,
    date,
    startTime,
    endTime,
    spaceId,
    selectedPeopleIds,
    attendeesCount,
    isVirtual,
    spaces,
    people,
    existingEvents,
  ]);

  const { contentRef, handleBackdropClick } = useDismissable({
    onDismiss: onClose,
    isOpen,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('Por favor ingresa un título para el evento.');
    if (!spaceId) return alert('Por favor selecciona un espacio físico.');
    if (duration <= 0) return alert('La hora final debe ser posterior a la hora inicial.');

    // Bloqueo estricto si hay conflicto de espacio
    if (conflictResult.hasBlockingConflicts) {
      alert(
        'No es posible guardar el evento debido a un conflicto de bloqueo (el espacio seleccionado está ocupado en ese horario).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const targetSpace = spaces.find((s) => s.id === spaceId);
      const targetResp = people.find((p) => p.id === responsibleId);

      const eventPayload = {
        title: title.trim(),
        description: description.trim(),
        type,
        date,
        startTime,
        endTime,
        durationMinutes: duration,
        status,
        spaceId,
        spaceName: targetSpace?.name || 'Espacio Sin Asignar',
        responsibleId,
        responsibleName: targetResp ? `${targetResp.firstName} ${targetResp.lastName}` : 'Sin Asignar',
        attendeesCount: Number(attendeesCount) || 0,
        isVirtual: Boolean(isVirtual),
        notes: notes.trim(),
        peopleIds: selectedPeopleIds,
        createdBy: { uid: 'user', name: 'Usuario', email: 'user@empresa.com' },
        createdAt: new Date().toISOString(),
      };

      await onSave(
        eventToEdit ? { ...eventPayload, id: eventToEdit.id } : eventPayload,
        sendParticipationEmails ? selectedPeopleIds : []
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Error guardando evento: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePerson = (pid: string) => {
    setSelectedPeopleIds((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
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
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden cursor-default"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-event-title" className="text-base font-bold text-slate-900">
                {eventToEdit ? 'Editar Evento Proyectado' : 'Programar Nuevo Evento'}
              </h2>
              <p className="text-xs text-slate-500">
                {eventToEdit ? 'Modifica los parámetros y verifica conflictos' : 'Completa la información para reservar recursos'}
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
          {/* Alertas de Conflicto en Vivo */}
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
                placeholder="ej: Grabación Videoclase Magistral"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 capitalize"
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
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Hora Inicio</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Hora Fin</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-col justify-end">
              <span className="text-[10px] font-bold uppercase text-slate-400">Duración</span>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-white p-1.5 rounded-xl border border-indigo-100 text-center">
                {duration} minutos
              </span>
            </div>
          </div>

          {/* Espacio Físico y Capacidad */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Espacio Requerido *
              </label>
              <select
                value={spaceId}
                onChange={(e) => {
                  const newSpaceId = e.target.value;
                  setSpaceId(newSpaceId);
                  const target = spaces.find((s) => s.id === newSpaceId);
                  if (target?.isVirtual || (target?.name || '').toLowerCase().includes('virtual')) {
                    setIsVirtual(true);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Selecciona un espacio...</option>
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isVirtual ? '(Plataforma Virtual)' : `(Capacidad: ${s.capacity} personas)`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Asistentes Proy.</label>
              <input
                type="number"
                min="1"
                value={attendeesCount}
                onChange={(e) => setAttendeesCount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Modalidad: Virtual vs Presencial */}
            <div className="sm:col-span-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isVirtualCheckbox"
                  checked={isVirtual}
                  onChange={(e) => setIsVirtual(e.target.checked)}
                  className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                />
                <label htmlFor="isVirtualCheckbox" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Modalidad Virtual / En Línea (Teams, Meet, Zoom)
                </label>
              </div>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                  isVirtual
                    ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isVirtual
                  ? '✓ Permite eventos simultáneos a la misma hora'
                  : '🔒 Requiere presencialidad exclusiva (Bloquea cruces)'}
              </span>
            </div>
          </div>

          {/* Responsable Principal y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Responsable del Evento
              </label>
              <select
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Selecciona una persona responsable...</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — {p.roleTitle}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EventStatus)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none capitalize"
              >
                <option value="programado">Programado</option>
                <option value="confirmado">Confirmado</option>
                <option value="pendiente_confirmacion">Pendiente de Confirmación</option>
                <option value="borrador">Borrador</option>
                <option value="en_ejecucion">En Ejecución</option>
                <option value="finalizado">Finalizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Personas Involucradas / Convocatoria */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                Personas Convocadas ({selectedPeopleIds.length} seleccionadas)
              </label>
              <span className="text-[11px] text-slate-400">
                Se validará simultaneidad en tiempo real
              </span>
            </div>
            {/* Convocatoria por Grupos */}
            {groups.length > 0 && (
              <div className="mb-2.5 p-2 rounded-xl bg-slate-100/70 border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Convocatoria Rápida por Grupos:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {groups.map((g) => {
                    const isFullySelected =
                      g.memberIds.length > 0 &&
                      g.memberIds.every((id) => selectedPeopleIds.includes(id));
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => handleToggleGroup(g)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          isFullySelected
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                        title={
                          isFullySelected
                            ? 'Desmarcar integrantes de este grupo'
                            : 'Convocar a todos los integrantes de este grupo'
                        }
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: g.color || '#059669' }}
                        />
                        <span>{g.name}</span>
                        <span className="text-[10px] text-slate-400">({g.memberIds.length})</span>
                        {isFullySelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-0.5 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 rounded-2xl border border-slate-200 bg-slate-50/50">
              {people.map((p) => {
                const isSelected = selectedPeopleIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePerson(p.id)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="truncate">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{p.roleTitle}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </div>
                );
              })}
            </div>

            {selectedPeopleIds.length > 0 && (
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendParticipationEmails}
                  onChange={(e) => setSendParticipationEmails(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Enviar automáticamente solicitud y enlace de confirmación por correo</span>
              </label>
            )}
          </div>

          {/* Descripción y Observaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descripción u Observaciones
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre equipamiento especial, requerimientos técnicos o agenda..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
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
