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
  | 'confirmado' 
  | 'en_ejecucion' 
  | 'finalizado' 
  | 'cancelado';

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
  | 'TAREA_ELIMINADA';

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityId: string;
  entityType: 'evento' | 'espacio' | 'persona' | 'solicitud' | 'grupo' | 'tarea';
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
