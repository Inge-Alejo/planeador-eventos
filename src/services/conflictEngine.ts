// Motor de Detección de Simultaneidad y Conflictos
import { EventEntity, Space, Person, ConflictValidationResult, ConflictItem, EventTask } from '../types';
import { doIntervalsOverlap, format12Hour } from '../lib/timezone';

export interface ConflictCheckParams {
  eventId?: string; // ID del evento a excluir si estamos editando
  date: string;
  startTime: string;
  endTime: string;
  spaceId: string;
  peopleIds: string[];
  attendeesCount?: number;
  isVirtual?: boolean;
  tasks?: EventTask[];
  spaces: Space[];
  people: Person[];
  existingEvents: EventEntity[];
}

export function isVirtualSpace(space?: Space): boolean {
  if (!space) return false;
  if (space.isVirtual) return true;
  const name = (space.name || '').toLowerCase();
  const loc = (space.location || '').toLowerCase();
  return (
    name.includes('virtual') ||
    name.includes('teams') ||
    name.includes('meet') ||
    name.includes('zoom') ||
    name.includes('en línea') ||
    name.includes('online') ||
    loc.includes('virtual') ||
    loc.includes('teams') ||
    loc.includes('meet') ||
    loc.includes('zoom') ||
    loc.includes('en línea')
  );
}

/**
 * Valida conflictos entre tareas dentro de un mismo evento y contra eventos externos.
 * Regla: Múltiples tareas dentro de un mismo evento son COMPATIBLES a menos que ambas
 * requieran atención exclusiva y sus intervalos horarios específicos se superpongan.
 */
export function validateTasksAvailability(
  tasks: EventTask[] = [],
  people: Person[] = [],
  existingEvents: EventEntity[] = [],
  currentEventId?: string
): ConflictItem[] {
  const conflicts: ConflictItem[] = [];

  // 1. Conflictos Intra-Evento con Atención Exclusiva
  for (let i = 0; i < tasks.length; i++) {
    const tA = tasks[i];
    if (tA.status === 'cancelada') continue;

    for (let j = i + 1; j < tasks.length; j++) {
      const tB = tasks[j];
      if (tB.status === 'cancelada') continue;

      // Buscar personas en común asignadas
      const commonPersonIds = (tA.responsibleIds || []).filter((id) =>
        (tB.responsibleIds || []).includes(id)
      );

      if (commonPersonIds.length > 0) {
        // Ambas requieren atención exclusiva?
        if (tA.exclusiveAttention && tB.exclusiveAttention) {
          const dateA = tA.startDate || tA.dueDate;
          const dateB = tB.startDate || tB.dueDate;

          if (dateA && dateB && dateA === dateB) {
            const startA = tA.startTime || '00:00';
            const endA = tA.dueTime || '23:59';
            const startB = tB.startTime || '00:00';
            const endB = tB.dueTime || '23:59';

            if (tA.startTime && tB.startTime && doIntervalsOverlap(startA, endA, startB, endB)) {
              commonPersonIds.forEach((pid) => {
                const person = people.find((p) => p.id === pid);
                conflicts.push({
                  id: `task-exclusive-${tA.id}-${tB.id}-${pid}`,
                  severity: 'conflicto',
                  type: 'persona',
                  title: 'Conflicto de Atención Exclusiva en Tareas',
                  message: `La persona "${person ? `${person.firstName} ${person.lastName}` : pid}" tiene asignadas dos tareas que requieren atención exclusiva simultánea en el mismo evento: "${tA.name}" (${format12Hour(startA)} - ${format12Hour(endA)}) y "${tB.name}" (${format12Hour(startB)} - ${format12Hour(endB)}).`,
                  timeRange: `${startA} - ${endA}`,
                });
              });
            }
          }
        }
      }
    }
  }

  // 2. Conflictos de tareas contra otros eventos distintos
  const otherEvents = existingEvents.filter(
    (e) => e.id !== currentEventId && e.status !== 'cancelado'
  );

  tasks.forEach((task) => {
    if (task.status === 'cancelada') return;
    const taskDate = task.startDate || task.dueDate;
    if (!taskDate) return;

    (task.responsibleIds || []).forEach((pid) => {
      const person = people.find((p) => p.id === pid);
      if (!person) return;

      otherEvents
        .filter((e) => e.date === taskDate && Array.isArray(e.peopleIds) && e.peopleIds.includes(pid))
        .forEach((otherEvt) => {
          if (task.startTime && task.dueTime) {
            if (doIntervalsOverlap(task.startTime, task.dueTime, otherEvt.startTime, otherEvt.endTime)) {
              conflicts.push({
                id: `task-ext-${task.id}-${otherEvt.id}-${pid}`,
                severity: 'conflicto',
                type: 'persona',
                title: 'Conflicto de Horario entre Tarea y Evento Externo',
                message: `La persona "${person.firstName} ${person.lastName}" tiene la tarea "${task.name}" (${format12Hour(task.startTime)} - ${format12Hour(task.dueTime)}) que se superpone con el evento externo "${otherEvt.title}" (${format12Hour(otherEvt.startTime)} - ${format12Hour(otherEvt.endTime)}).`,
                conflictingEventId: otherEvt.id,
                conflictingEventTitle: otherEvt.title,
                timeRange: `${otherEvt.startTime} - ${otherEvt.endTime}`,
              });
            }
          }
        });
    });
  });

  return conflicts;
}

export function detectConflicts({
  eventId,
  date,
  startTime,
  endTime,
  spaceId,
  peopleIds,
  attendeesCount = 0,
  isVirtual = false,
  tasks = [],
  spaces,
  people,
  existingEvents,
}: ConflictCheckParams): ConflictValidationResult {
  const conflicts: ConflictItem[] = [];

  // Filtrar eventos del mismo día, omitiendo el evento actual si se está editando y los cancelados
  const dayEvents = existingEvents.filter(
    (e) => e.date === date && e.id !== eventId && e.status !== 'cancelado'
  );

  const targetSpace = spaces.find((s) => s.id === spaceId);
  const isTargetVirtual = isVirtual || isVirtualSpace(targetSpace);

  // 1. Validar Conflicto de Espacio (Nivel: Bloqueo para presencialidad, simultaneidad permitida en virtualidad)
  if (spaceId && targetSpace && !isTargetVirtual) {
    const overlappingSpaceEvent = dayEvents.find(
      (e) =>
        e.spaceId === spaceId &&
        !e.isVirtual &&
        !isVirtualSpace(spaces.find((s) => s.id === e.spaceId)) &&
        doIntervalsOverlap(startTime, endTime, e.startTime, e.endTime)
    );

    if (overlappingSpaceEvent) {
      conflicts.push({
        id: `space-${overlappingSpaceEvent.id}`,
        severity: 'bloqueo',
        type: 'espacio',
        title: 'Espacio físico no disponible (Cruce presencial)',
        message: `No es posible reservar el espacio presencial "${targetSpace.name}" entre las ${format12Hour(startTime)} y ${format12Hour(endTime)} porque ya está ocupado por el evento "${overlappingSpaceEvent.title}" (${format12Hour(overlappingSpaceEvent.startTime)} – ${format12Hour(overlappingSpaceEvent.endTime)}).`,
        conflictingEventId: overlappingSpaceEvent.id,
        conflictingEventTitle: overlappingSpaceEvent.title,
        timeRange: `${overlappingSpaceEvent.startTime} – ${overlappingSpaceEvent.endTime}`,
      });
    }

    // 1.1 Validar capacidad del espacio presencial (Nivel: Advertencia)
    if (attendeesCount > 0 && targetSpace.capacity > 0 && attendeesCount > targetSpace.capacity) {
      conflicts.push({
        id: `capacity-${targetSpace.id}`,
        severity: 'advertencia',
        type: 'capacidad',
        title: 'Aforo superado',
        message: `El número de asistentes proyectado (${attendeesCount}) supera la capacidad máxima recomendada de "${targetSpace.name}" (${targetSpace.capacity} personas).`,
      });
    }
  }

  // 2. Validar Conflictos de Personas Asignadas entre Eventos Distintos (Nivel: Conflicto)
  if (peopleIds && peopleIds.length > 0) {
    peopleIds.forEach((personId) => {
      const person = people.find((p) => p.id === personId);
      if (!person) return;

      const overlappingPersonEvent = dayEvents.find(
        (e) =>
          Array.isArray(e.peopleIds) &&
          e.peopleIds.includes(personId) &&
          doIntervalsOverlap(startTime, endTime, e.startTime, e.endTime)
      );

      if (overlappingPersonEvent) {
        conflicts.push({
          id: `person-${personId}-${overlappingPersonEvent.id}`,
          severity: 'conflicto',
          type: 'persona',
          title: 'Persona no disponible',
          message: `La persona "${person.firstName} ${person.lastName}" (${person.roleTitle || 'Participante'}) ya tiene programado el evento "${overlappingPersonEvent.title}" en el horario ${format12Hour(overlappingPersonEvent.startTime)} – ${format12Hour(overlappingPersonEvent.endTime)}.`,
          conflictingEventId: overlappingPersonEvent.id,
          conflictingEventTitle: overlappingPersonEvent.title,
          timeRange: `${overlappingPersonEvent.startTime} – ${overlappingPersonEvent.endTime}`,
        });
      }
    });
  }

  // 3. Validar Disponibilidad y Atención Exclusiva de Tareas
  if (tasks && tasks.length > 0) {
    const taskConflicts = validateTasksAvailability(tasks, people, existingEvents, eventId);
    conflicts.push(...taskConflicts);
  }

  return {
    hasBlockingConflicts: conflicts.some((c) => c.severity === 'bloqueo'),
    hasWarnings: conflicts.some((c) => c.severity === 'advertencia' || c.severity === 'conflicto'),
    conflicts,
  };
}
