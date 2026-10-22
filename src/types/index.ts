// Tipos y Modelos de Dominio de EventFlow Planner

export type UserRole = 'administrador' | 'gestor' | 'usuario' | 'lector';
export type UserAccountStatus = 'aprobado' | 'pendiente' | 'bloqueado';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserAccountStatus;
  createdAt: string;
  lastLogin: string;
  approvedBy?: string;
  approvedAt?: string;
  updatedAt?: string;
}

export type SpaceType = 'auditorio' | 'estudio' | 'sala_reuniones' | 'laboratorio' | 'aula' | 'otro';
export type SpaceStatus = 'activo' | 'mantenimiento' | 'inactivo';

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  location: string;
  capacity: number;
  equipment: string[];
  status: SpaceStatus;
  notes?: string;
  color: string; // Hex color for calendar representation
  createdAt: string;
  isVirtual?: boolean;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleTitle: string;
  department: string;
  status: 'activo' | 'inactivo';
  notes?: string;
  createdAt: string;
}

export interface PeopleGroup {
  id: string;
  name: string;
  description?: string;
  color: string;
  memberIds: string[]; // IDs de Person pertenecientes al grupo
  createdBy?: {
    uid: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export type PersonalTaskPriority = 'alta' | 'media' | 'baja';
export type PersonalTaskStatus = 'pendiente' | 'completada';

export interface PersonalTask {
  id: string;
  userId: string; // UID del usuario dueño de la tarea
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: PersonalTaskPriority;
  status: PersonalTaskStatus;
  category?: 'evento' | 'recordatorio' | 'tarea' | 'seguimiento';
  eventId?: string;
  eventTitle?: string;
  completedAt?: string;
  createdAt: string;
}

export type EventType = 
  | 'academico' 
  | 'simposio'
  | 'curso'
  | 'transmision'
  | 'catedra'
  | 'congreso'
  | 'conferencia' 
  | 'taller' 
  | 'reunion' 
  | 'grabacion' 
  | 'institucional' 
  | 'otro';

export type EventStatus = 
  | 'borrador' 
  | 'programado' 
  | 'pendiente_confirmacion' 
  | 'pendiente_autorizacion'
  | 'confirmado' 
  | 'en_ejecucion' 
  | 'finalizado' 
  | 'cancelado';

// Tareas asociadas a Eventos organizadas por Etapas
export type EventTaskStage = 'previa' | 'durante' | 'posterior';
export type EventTaskStatus = 'pendiente' | 'en_curso' | 'completada' | 'bloqueada' | 'cancelada';
export type EventTaskPriority = 'alta' | 'media' | 'baja';

export interface EventTaskUpdate {
  id: string;
  authorUid: string;
  authorName: string;
  authorEmail?: string;
  text: string;
  statusChange?: EventTaskStatus;
  createdAt: string; // ISO
}

export interface EventTask {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  stage: EventTaskStage;
  status: EventTaskStatus;
  priority: EventTaskPriority;
  responsibleIds: string[]; // IDs de Person
  startDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  exclusiveAttention?: boolean; // Requiere atención exclusiva (alerta de cruce de horario)
  updates: EventTaskUpdate[];
  createdAt: string;
  updatedAt?: string;
}

// Configuración de Recordatorios Automáticos por Correo
export type ReminderStatus = 'programado' | 'enviado' | 'error' | 'reprogramado' | 'cancelado';

export interface ReminderLog {
  id: string;
  sentAt: string;
  scheduledFor: string;
  recipientsCount: number;
  recipientEmails: string[];
  status: 'exitoso' | 'error';
  errorMessage?: string;
}

export interface EventReminderConfig {
  enabled: boolean;
  daysBefore: number; // Mínimo 1 día antes, configurable
  status: ReminderStatus;
  scheduledDate: string; // Fecha en la que debe dispararse (YYYY-MM-DD)
  sentAt?: string;
  error?: string;
  history?: ReminderLog[];
}

// Configuración de Recurrencia de Eventos
export type RecurrenceFrequency = 'ninguna' | 'diaria' | 'semanal' | 'mensual' | 'personalizada';

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval?: number; // Cada X días/semanas/meses
  weekDays?: number[]; // [0..6] (0 = Domingo, 1 = Lunes, etc.)
  endDate?: string; // YYYY-MM-DD
  occurrencesCount?: number; // Número específico de ocurrencias
  seriesId?: string; // ID compartido de la serie
  occurrenceIndex?: number; // 1, 2, 3...
  totalOccurrences?: number;
}

// Regla de 27 días y Autorización Excepcional
export type ExceptionalApprovalStatus = 'ninguna' | 'pendiente' | 'aprobado' | 'rechazado';

export interface ExceptionalApproval {
  required: boolean;
  status: ExceptionalApprovalStatus;
  requestedAt?: string;
  requestedBy?: {
    uid: string;
    name: string;
    email: string;
  };
  reason?: string; // Justificación obligatoria de la urgencia
  daysAnticipation?: number;
  resolvedAt?: string;
  resolvedBy?: {
    uid: string;
    name: string;
    email: string;
  };
  notes?: string;
  originalSnapshot?: {
    date: string;
    isVirtual: boolean;
  };
}

export interface EventEntity {
  id: string;
  title: string;
  description: string;
  type: EventType;
  date: string; // YYYY-MM-DD (America/Bogota)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  status: EventStatus;
  spaceId: string;
  spaceName: string;
  responsibleId: string;
  responsibleName: string;
  attendeesCount: number;
  notes?: string;
  peopleIds: string[];
  isVirtual?: boolean;
  createdBy: {
    uid: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedBy?: {
    uid: string;
    name: string;
    email: string;
  };
  updatedAt?: string;
  // Campos ampliados
  tasks?: EventTask[];
  reminder?: EventReminderConfig;
  recurrence?: RecurrenceConfig;
  exceptionalApproval?: ExceptionalApproval;
}

// Reportes Programados y Automatizados (Exclusivo Superadministrador)
export type ReportType =
  | 'informe_general'
  | 'informe_equipo'
  | 'informe_persona'
  | 'informe_eventos'
  | 'informe_tareas_pendientes'
  | 'informe_mensual_gestion'
  | 'informe_eventos_urgentes';

export type ReportFrequency = 'diaria' | 'semanal' | 'mensual';
export type ReportExportFormat = 'pdf' | 'xlsx' | 'csv';

export interface AutomatedReportSchedule {
  id: string;
  name: string;
  reportType: ReportType;
  frequency: ReportFrequency;
  dataPeriod: 'ayer' | 'semana_anterior' | 'mes_anterior' | 'ultimos_30_dias' | 'ultimos_90_dias';
  format: ReportExportFormat;
  recipientEmail: string; // Exclusivo proyectostic.med@udea.edu.co
  active: boolean;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  filters?: Record<string, any>;
  lastRunAt?: string;
  lastRunStatus?: 'exitoso' | 'error';
  lastRunError?: string;
  createdAt: string;
}

export interface ReportExecutionLog {
  id: string;
  scheduleId?: string;
  scheduleName?: string;
  reportType: ReportType;
  periodCovered: string;
  executedAt: string;
  status: 'exitoso' | 'error';
  recipientEmail: string;
  format: ReportExportFormat;
  recordCount: number;
  downloadUrl?: string;
  summaryText?: string;
  error?: string;
}

export type RequestStatus = 'pendiente' | 'confirmada' | 'rechazada' | 'cancelada';

export interface ParticipationRequest {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  spaceName: string;
  personId: string;
  personName: string;
  personEmail: string;
  status: RequestStatus;
  token: string;
  respondedAt?: string;
  responseNotes?: string;
  createdAt: string;
}

export type NotificationType = 
  | 'solicitud' 
  | 'confirmacion' 
  | 'rechazo' 
  | 'conflicto' 
  | 'modificacion' 
  | 'cancelacion';

export interface AppNotification {
  id: string;
  userId: string; // uid or 'ALL_ADMINS'
  recipientEmail?: string;
  type: NotificationType;
  title: string;
  message: string;
  eventId?: string;
  read: boolean;
  createdAt: string;
}

export type AuditAction = 
  | 'EVENTO_CREADO' 
  | 'EVENTO_MODIFICADO' 
  | 'EVENTO_CANCELADO' 
  | 'ESPACIO_RESERVADO' 
  | 'PERSONA_SOLICITADA' 
  | 'SOLICITUD_CONFIRMADA' 
  | 'SOLICITUD_RECHAZADA'
  | 'APROBACION_USUARIO'
  | 'CAMBIO_ESTADO_USUARIO'
  | 'ESPACIO_CREADO'
  | 'ESPACIO_MODIFICADO'
  | 'ESPACIO_ELIMINADO'
  | 'PERSONA_CREADA'
  | 'PERSONA_MODIFICADA'
  | 'PERSONA_ELIMINADA'
  | 'GRUPO_CREADO'
  | 'GRUPO_MODIFICADO'
  | 'GRUPO_ELIMINADO'
  | 'TAREA_CREADA'
  | 'TAREA_COMPLETADA'
  | 'TAREA_ELIMINADA'
  | 'USUARIO_ELIMINADO';

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityId: string;
  entityType: 'evento' | 'espacio' | 'persona' | 'solicitud' | 'grupo' | 'tarea' | 'usuario';
  details: Record<string, any>;
  user: {
    uid: string;
    name: string;
    email: string;
  };
  timestamp: string;
}

export type ConflictSeverity = 'bloqueo' | 'conflicto' | 'advertencia';

export interface ConflictItem {
  id: string;
  severity: ConflictSeverity;
  type: 'espacio' | 'persona' | 'capacidad';
  title: string;
  message: string;
  conflictingEventId?: string;
  conflictingEventTitle?: string;
  timeRange?: string;
}

export interface ConflictValidationResult {
  hasBlockingConflicts: boolean;
  hasWarnings: boolean;
  conflicts: ConflictItem[];
}

export interface DashboardMetrics {
  totalEventsScheduled: number;
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  eventsPendingConfirmation: number;
  eventsConfirmed: number;
  eventsCancelled: number;
  activeConflictsCount: number;
  occupiedSpacesNow: number;
  availableSpacesNow: number;
  pendingRequestsCount: number;
  peoplePendingConfirmation: number;
}
