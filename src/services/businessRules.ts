// Motor de Reglas de Negocio, Validación Institucional y Restricciones de Dominio
// Facultad de Medicina • Universidad de Antioquia

import {
  EventEntity,
  UserProfile,
  RecurrenceConfig,
  ExceptionalApproval,
  EventTask,
} from '../types';
import { getBogotaToday } from '../lib/timezone';

export const SUPERADMIN_INSTITUTIONAL_EMAIL = 'proyectostic.med@udea.edu.co';
export const MIN_CALENDAR_DAYS_IN_PERSON = 27;

/**
 * Valida si un usuario es el Superadministrador Institucional autorizado.
 * REGLA ESTRICTA: Solo proyectostic.med@udea.edu.co tiene autorización exclusiva
 * para métricas, reportes y aprobación de eventos excepcionales.
 * Un rol genérico de administrador NO otorga estos permisos.
 */
export function isInstitutionalSuperAdmin(user?: { email?: string } | null): boolean {
  if (!user || !user.email) return false;
  return user.email.trim().toLowerCase() === SUPERADMIN_INSTITUTIONAL_EMAIL.toLowerCase();
}

/**
 * Calcula la diferencia en días calendario completos entre dos fechas en formato YYYY-MM-DD.
 */
export function calculateCalendarDaysDiff(targetDateStr: string, fromDateStr?: string): number {
  const base = fromDateStr || getBogotaToday();
  const [y1, m1, d1] = base.split('-').map(Number);
  const [y2, m2, d2] = targetDateStr.split('-').map(Number);

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / msPerDay);
}

export interface AnticipationCheckResult {
  isRestricted: boolean;
  daysAnticipation: number;
  message: string;
  canBypassWithApproval: boolean;
  isApprovalValid: boolean;
}

/**
 * Valida la regla institucional de 27 días de anticipación para eventos presenciales.
 * - Los eventos presenciales con menos de 27 días quedan bloqueados en el flujo ordinario.
 * - Los eventos presenciales con 27 días o más continúan normalmente.
 * - Los eventos virtuales están exentos de esta restricción.
 * - Si cuenta con autorización excepcional aprobada para esta misma fecha y modalidad, es válido.
 */
export function evaluate27DaysRule(
  eventDate: string,
  isVirtual: boolean = false,
  exceptionalApproval?: ExceptionalApproval,
  requestDate: string = getBogotaToday()
): AnticipationCheckResult {
  // Los eventos virtuales están exentos
  if (isVirtual) {
    return {
      isRestricted: false,
      daysAnticipation: calculateCalendarDaysDiff(eventDate, requestDate),
      message: 'Los eventos en modalidad virtual no están sujetos a la restricción de 27 días.',
      canBypassWithApproval: false,
      isApprovalValid: true,
    };
  }

  const daysDiff = calculateCalendarDaysDiff(eventDate, requestDate);

  // Si tiene 27 días o más de anticipación, flujo ordinario aprobado
  if (daysDiff >= MIN_CALENDAR_DAYS_IN_PERSON) {
    return {
      isRestricted: false,
      daysAnticipation: daysDiff,
      message: `Cumple con la anticipación mínima requerida (${daysDiff} días de anticipación; mínimo: ${MIN_CALENDAR_DAYS_IN_PERSON} días).`,
      canBypassWithApproval: false,
      isApprovalValid: true,
    };
  }

  // Tiene menos de 27 días: comprobar autorización excepcional
  let isApprovalValid = false;

  if (exceptionalApproval && exceptionalApproval.status === 'aprobado') {
    // Si cambiaron datos críticos como la fecha o modalidad, la aprobación previa queda invalidada
    if (exceptionalApproval.originalSnapshot) {
      const dateMatch = exceptionalApproval.originalSnapshot.date === eventDate;
      const modalityMatch = exceptionalApproval.originalSnapshot.isVirtual === isVirtual;
      isApprovalValid = dateMatch && modalityMatch;
    } else {
      isApprovalValid = true;
    }
  }

  return {
    isRestricted: !isApprovalValid,
    daysAnticipation: daysDiff,
    message: isApprovalValid
      ? `Evento presencial urgente con ${daysDiff} días de anticipación, pero AUTORIZADO EXCEPCIONALMENTE por el Superadministrador.`
      : `Restricción institucional: Los eventos presenciales requieren al menos ${MIN_CALENDAR_DAYS_IN_PERSON} días de anticipación (programado con ${daysDiff} días). Se requiere Solicitud de Autorización Excepcional.`,
    canBypassWithApproval: true,
    isApprovalValid,
  };
}

/**
 * Control de permisos de edición de eventos generales.
 * Únicamente el usuario creador original o el Superadministrador institucional pueden
 * editar la información general del evento.
 */
export function canEditEventGeneralInfo(
  event?: EventEntity | null,
  user?: UserProfile | null
): boolean {
  if (!user) return false;
  if (isInstitutionalSuperAdmin(user)) return true;
  if (!event || !event.createdBy) return true; // Creación de nuevo evento

  const isCreatorUid = event.createdBy.uid && event.createdBy.uid === user.uid;
  const isCreatorEmail =
    event.createdBy.email &&
    event.createdBy.email.trim().toLowerCase() === user.email.trim().toLowerCase();

  return Boolean(isCreatorUid || isCreatorEmail);
}

/**
 * Control de permisos para actualizar tareas del evento.
 * Los responsables asignados pueden actualizar el estado y registrar novedades de sus tareas
 * sin tener permiso de editar el evento general.
 */
export function canUpdateTask(
  task: EventTask,
  event: EventEntity,
  user: UserProfile | null,
  personId?: string
): boolean {
  if (!user) return false;
  if (canEditEventGeneralInfo(event, user)) return true;

  if (personId && (task.responsibleIds || []).includes(personId)) {
    return true;
  }

  // Si coincide por email del usuario con el responsable
  return false;
}

/**
 * Calcula la fecha sumando N días a una fecha YYYY-MM-DD.
 */
export function addDaysToDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Calcula la fecha sumando N semanas a una fecha YYYY-MM-DD.
 */
export function addWeeksToDate(dateStr: string, weeks: number): string {
  return addDaysToDate(dateStr, weeks * 7);
}

/**
 * Calcula la fecha sumando N meses a una fecha YYYY-MM-DD.
 */
export function addMonthsToDate(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

/**
 * Generador de ocurrencias para eventos recurrentes sin duplicaciones.
 */
export function generateRecurrenceInstances(
  baseEvent: EventEntity,
  config: RecurrenceConfig
): EventEntity[] {
  if (!config || config.frequency === 'ninguna') {
    return [baseEvent];
  }

  const seriesId = config.seriesId || `series-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const occurrences: EventEntity[] = [];
  const maxOccurrences = Math.min(config.occurrencesCount || 52, 100); // Límite de seguridad
  const endDate = config.endDate;

  let currentDate = baseEvent.date;
  let count = 0;

  while (count < maxOccurrences) {
    if (endDate && currentDate > endDate) {
      break;
    }

    const occurrenceIndex = count + 1;
    const occurrenceId = count === 0 ? baseEvent.id : `${baseEvent.id}-rec-${occurrenceIndex}`;

    // Clonar tareas asignadas manteniendo responsables y ajustando fecha si aplica
    const clonedTasks: EventTask[] = (baseEvent.tasks || []).map((t, idx) => ({
      ...t,
      id: `${occurrenceId}-t${idx + 1}`,
      eventId: occurrenceId,
      dueDate: currentDate,
      startDate: t.startDate ? currentDate : undefined,
      updates: [...(t.updates || [])],
    }));

    const instance: EventEntity = {
      ...baseEvent,
      id: occurrenceId,
      date: currentDate,
      tasks: clonedTasks,
      recurrence: {
        ...config,
        seriesId,
        occurrenceIndex,
        totalOccurrences: maxOccurrences,
      },
    };

    occurrences.push(instance);
    count++;

    // Calcular siguiente fecha según frecuencia
    if (config.frequency === 'diaria') {
      currentDate = addDaysToDate(currentDate, config.interval || 1);
    } else if (config.frequency === 'semanal') {
      currentDate = addWeeksToDate(currentDate, config.interval || 1);
    } else if (config.frequency === 'mensual') {
      currentDate = addMonthsToDate(currentDate, config.interval || 1);
    } else if (config.frequency === 'personalizada') {
      currentDate = addDaysToDate(currentDate, config.interval || 1);
    } else {
      break;
    }
  }

  return occurrences;
}
