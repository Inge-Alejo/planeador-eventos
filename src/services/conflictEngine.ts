// Motor de Detección de Simultaneidad y Conflictos
import { EventEntity, Space, Person, ConflictValidationResult, ConflictItem } from '../types';
import { doIntervalsOverlap, format12Hour } from '../lib/timezone';

export interface ConflictCheckParams {
  eventId?: string; // ID del evento a excluir si estamos editando
  date: string;
  startTime: string;
  endTime: string;
  spaceId: string;
  peopleIds: string[];
  attendeesCount?: number;
  spaces: Space[];
  people: Person[];
  existingEvents: EventEntity[];
}

export function detectConflicts({
  eventId,
  date,
  startTime,
  endTime,
  spaceId,
  peopleIds,
  attendeesCount = 0,
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

  // 1. Validar Conflicto de Espacio (Nivel: Bloqueo)
  if (spaceId && targetSpace) {
    const overlappingSpaceEvent = dayEvents.find(
      (e) => e.spaceId === spaceId && doIntervalsOverlap(startTime, endTime, e.startTime, e.endTime)
    );

    if (overlappingSpaceEvent) {
      conflicts.push({
        id: `space-${overlappingSpaceEvent.id}`,
        severity: 'bloqueo',
        type: 'espacio',
        title: 'Espacio no disponible (Cruce de horario)',
        message: `No es posible reservar el espacio "${targetSpace.name}" entre las ${format12Hour(startTime)} y ${format12Hour(endTime)} porque ya está ocupado por el evento "${overlappingSpaceEvent.title}" (${format12Hour(overlappingSpaceEvent.startTime)} – ${format12Hour(overlappingSpaceEvent.endTime)}).`,
        conflictingEventId: overlappingSpaceEvent.id,
        conflictingEventTitle: overlappingSpaceEvent.title,
        timeRange: `${overlappingSpaceEvent.startTime} – ${overlappingSpaceEvent.endTime}`,
      });
    }

    // 1.1 Validar capacidad del espacio (Nivel: Advertencia)
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

  // 2. Validar Conflictos de Personas Asignadas (Nivel: Conflicto)
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

  return {
    hasBlockingConflicts: conflicts.some((c) => c.severity === 'bloqueo'),
    hasWarnings: conflicts.some((c) => c.severity === 'advertencia' || c.severity === 'conflicto'),
    conflicts,
  };
}
