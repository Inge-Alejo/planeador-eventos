// Almacenamiento Reactivo con Sincronización en Tiempo Real (Local & Firebase Adapter)
import { EventEntity, Space, Person, ParticipationRequest, AppNotification, AuditLog, UserProfile } from '../types';
import { getBogotaToday } from '../lib/timezone';
import { db, isFirebaseConfigured } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

const STORAGE_KEYS = {
  EVENTS: 'eventflow_events',
  SPACES: 'eventflow_spaces',
  PEOPLE: 'eventflow_people',
  REQUESTS: 'eventflow_requests',
  NOTIFICATIONS: 'eventflow_notifications',
  AUDIT: 'eventflow_audit',
  USER: 'eventflow_user',
};

// Semilla inicial de espacios empresariales
const initialSpaces: Space[] = [
  {
    id: 'space-1',
    name: 'Auditorio Mayor',
    type: 'auditorio',
    location: 'Edificio Central - Piso 1',
    capacity: 150,
    equipment: ['Pantalla LED 4K', 'Sistema de Microfonía Shure', 'Streaming HD', 'Climatización'],
    status: 'activo',
    color: '#4F46E5', // Indigo
    createdAt: new Date().toISOString(),
  },
  {
    id: 'space-2',
    name: 'Estudio Audiovisual 1',
    type: 'estudio',
    location: 'Bloque Medios - Sótano 1',
    capacity: 15,
    equipment: ['3 Cámaras 4K PTZ', 'Set de Luces Fresnel', 'Consola Digital', 'Chroma Key'],
    status: 'activo',
    color: '#06B6D4', // Cyan
    createdAt: new Date().toISOString(),
  },
  {
    id: 'space-3',
    name: 'Sala de Juntas de Innovación',
    type: 'sala_reuniones',
    location: 'Bloque A - Piso 4',
    capacity: 25,
    equipment: ['Pantalla Táctil Interactivas', 'Cámara Barco ClickShare', 'Videoconferencia Zoom Rooms'],
    status: 'activo',
    color: '#10B981', // Emerald
    createdAt: new Date().toISOString(),
  },
  {
    id: 'space-4',
    name: 'Laboratorio de Simulación',
    type: 'laboratorio',
    location: 'Bloque Ciencias - Piso 2',
    capacity: 35,
    equipment: ['Estaciones de Cómputo Especializado', 'Proyector Láser', 'Audio Multicanal'],
    status: 'activo',
    color: '#F59E0B', // Amber
    createdAt: new Date().toISOString(),
  },
  {
    id: 'space-5',
    name: 'Aula Magna 301',
    type: 'aula',
    location: 'Bloque Docencia - Piso 3',
    capacity: 80,
    equipment: ['Doble Proyector', 'Microfonía inalámbrica', 'Grabación de Clases'],
    status: 'activo',
    color: '#8B5CF6', // Purple
    createdAt: new Date().toISOString(),
  },
];

// Semilla inicial de personas del equipo
const initialPeople: Person[] = [
  {
    id: 'person-1',
    firstName: 'Alejandro',
    lastName: 'Gómez',
    email: 'alejandro.gomez@empresa.com',
    roleTitle: 'Ingeniero de Grabación',
    department: 'Producción Audiovisual',
    status: 'activo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'person-2',
    firstName: 'Dra. Sofía',
    lastName: 'Restrepo',
    email: 'sofia.restrepo@empresa.com',
    roleTitle: 'Directora Académica',
    department: 'Dirección de Educación',
    status: 'activo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'person-3',
    firstName: 'Carlos',
    lastName: 'Mendoza',
    email: 'carlos.mendoza@empresa.com',
    roleTitle: 'Coordinador de Eventos',
    department: 'Operaciones y Logística',
    status: 'activo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'person-4',
    firstName: 'Laura',
    lastName: 'Valencia',
    email: 'laura.valencia@empresa.com',
    roleTitle: 'Especialista en Streaming',
    department: 'Tecnología',
    status: 'activo',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'person-5',
    firstName: 'Dr. Roberto',
    lastName: 'Jaramillo',
    email: 'roberto.jaramillo@empresa.com',
    roleTitle: 'Profesor Principal',
    department: 'Ciencias de la Salud',
    status: 'activo',
    createdAt: new Date().toISOString(),
  },
];

// Generar eventos de ejemplo alrededor de la fecha de hoy
const today = getBogotaToday();

const initialEvents: EventEntity[] = [
  {
    id: 'evt-1',
    title: 'Grabación Videoclase Magistral',
    description: 'Sesión de grabación del módulo de Neuroanatomía con croma y diapositivas interactivas.',
    type: 'grabacion',
    date: today,
    startTime: '08:00',
    endTime: '10:30',
    durationMinutes: 150,
    status: 'confirmado',
    spaceId: 'space-2',
    spaceName: 'Estudio Audiovisual 1',
    responsibleId: 'person-1',
    responsibleName: 'Alejandro Gómez',
    attendeesCount: 4,
    peopleIds: ['person-1', 'person-5'],
    createdBy: {
      uid: 'admin-1',
      name: 'Administrador General',
      email: 'admin@empresa.com',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-2',
    title: 'Simposio Internacional de Medicina',
    description: 'Conferencia inaugural con transmisión satelital e invitados internacionales.',
    type: 'conferencia',
    date: today,
    startTime: '14:00',
    endTime: '17:00',
    durationMinutes: 180,
    status: 'programado',
    spaceId: 'space-1',
    spaceName: 'Auditorio Mayor',
    responsibleId: 'person-3',
    responsibleName: 'Carlos Mendoza',
    attendeesCount: 130,
    peopleIds: ['person-2', 'person-3', 'person-4'],
    createdBy: {
      uid: 'admin-1',
      name: 'Administrador General',
      email: 'admin@empresa.com',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-3',
    title: 'Comité de Planeación Curricular',
    description: 'Revisión y ajuste del calendario de eventos para el próximo trimestre académico.',
    type: 'reunion',
    date: today,
    startTime: '10:00',
    endTime: '12:00',
    durationMinutes: 120,
    status: 'pendiente_confirmacion',
    spaceId: 'space-3',
    spaceName: 'Sala de Juntas de Innovación',
    responsibleId: 'person-2',
    responsibleName: 'Dra. Sofía Restrepo',
    attendeesCount: 12,
    peopleIds: ['person-2'],
    createdBy: {
      uid: 'admin-1',
      name: 'Administrador General',
      email: 'admin@empresa.com',
    },
    createdAt: new Date().toISOString(),
  },
];

const initialRequests: ParticipationRequest[] = [
  {
    id: 'req-1',
    eventId: 'evt-3',
    eventTitle: 'Comité de Planeación Curricular',
    eventDate: today,
    eventStartTime: '10:00',
    eventEndTime: '12:00',
    spaceName: 'Sala de Juntas de Innovación',
    personId: 'person-2',
    personName: 'Dra. Sofía Restrepo',
    personEmail: 'sofia.restrepo@empresa.com',
    status: 'pendiente',
    token: 'tk_sofia_curriculo_2026',
    createdAt: new Date().toISOString(),
  },
];

const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'ALL_ADMINS',
    type: 'solicitud',
    title: 'Nueva solicitud enviada',
    message: 'Se ha solicitado la participación de Dra. Sofía Restrepo en "Comité de Planeación Curricular".',
    eventId: 'evt-3',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'ALL_ADMINS',
    type: 'confirmacion',
    title: 'Evento Confirmado',
    message: 'El evento "Grabación Videoclase Magistral" ha sido confirmado para hoy a las 08:00 AM.',
    eventId: 'evt-1',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

const initialAudit: AuditLog[] = [
  {
    id: 'aud-1',
    action: 'EVENTO_CREADO',
    entityId: 'evt-1',
    entityType: 'evento',
    details: { title: 'Grabación Videoclase Magistral', space: 'Estudio Audiovisual 1' },
    user: { uid: 'admin-1', name: 'Administrador General', email: 'admin@empresa.com' },
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'aud-2',
    action: 'ESPACIO_RESERVADO',
    entityId: 'space-1',
    entityType: 'espacio',
    details: { space: 'Auditorio Mayor', event: 'Simposio Internacional de Medicina' },
    user: { uid: 'admin-1', name: 'Administrador General', email: 'admin@empresa.com' },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

// BroadcastChannel para sincronizar pestañas en tiempo real local
const channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('eventflow_realtime_sync')
  : null;

// Helpers de persistencia
function load<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    channel?.postMessage({ type: 'SYNC_UPDATE', key });
  } catch (err) {
    console.error('Error guardando en localStorage:', err);
  }
}

// Suscriptores en memoria
type Listener<T> = (data: T) => void;
const eventListeners = new Set<Listener<EventEntity[]>>();
const spaceListeners = new Set<Listener<Space[]>>();
const peopleListeners = new Set<Listener<Person[]>>();
const requestListeners = new Set<Listener<ParticipationRequest[]>>();
const notifListeners = new Set<Listener<AppNotification[]>>();
const auditListeners = new Set<Listener<AuditLog[]>>();

// Inicializar datos si no existen
export function initializeSeedData(): void {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.SPACES)) save(STORAGE_KEYS.SPACES, initialSpaces);
  if (!localStorage.getItem(STORAGE_KEYS.PEOPLE)) save(STORAGE_KEYS.PEOPLE, initialPeople);
  if (!localStorage.getItem(STORAGE_KEYS.EVENTS)) save(STORAGE_KEYS.EVENTS, initialEvents);
  if (!localStorage.getItem(STORAGE_KEYS.REQUESTS)) save(STORAGE_KEYS.REQUESTS, initialRequests);
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) save(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT)) save(STORAGE_KEYS.AUDIT, initialAudit);
}

// Escuchar cambios de otras pestañas
if (channel) {
  channel.onmessage = (event) => {
    if (event.data?.type === 'SYNC_UPDATE') {
      const { key } = event.data;
      if (key === STORAGE_KEYS.EVENTS) eventListeners.forEach((fn) => fn(load(STORAGE_KEYS.EVENTS, [])));
      if (key === STORAGE_KEYS.SPACES) spaceListeners.forEach((fn) => fn(load(STORAGE_KEYS.SPACES, [])));
      if (key === STORAGE_KEYS.PEOPLE) peopleListeners.forEach((fn) => fn(load(STORAGE_KEYS.PEOPLE, [])));
      if (key === STORAGE_KEYS.REQUESTS) requestListeners.forEach((fn) => fn(load(STORAGE_KEYS.REQUESTS, [])));
      if (key === STORAGE_KEYS.NOTIFICATIONS) notifListeners.forEach((fn) => fn(load(STORAGE_KEYS.NOTIFICATIONS, [])));
      if (key === STORAGE_KEYS.AUDIT) auditListeners.forEach((fn) => fn(load(STORAGE_KEYS.AUDIT, [])));
    }
  };
}

// Subscripciones públicas (Compatible con API onSnapshot de Firestore)
export function subscribeToEvents(callback: (events: EventEntity[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const unsub = onSnapshot(collection(db, 'events'), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as EventEntity));
      callback(data);
    });
    return unsub;
  }
  callback(load(STORAGE_KEYS.EVENTS, initialEvents));
  eventListeners.add(callback);
  return () => eventListeners.delete(callback);
}

export function subscribeToSpaces(callback: (spaces: Space[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const unsub = onSnapshot(collection(db, 'spaces'), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Space));
      callback(data);
    });
    return unsub;
  }
  callback(load(STORAGE_KEYS.SPACES, initialSpaces));
  spaceListeners.add(callback);
  return () => spaceListeners.delete(callback);
}

export function subscribeToPeople(callback: (people: Person[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const unsub = onSnapshot(collection(db, 'people'), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Person));
      callback(data);
    });
    return unsub;
  }
  callback(load(STORAGE_KEYS.PEOPLE, initialPeople));
  peopleListeners.add(callback);
  return () => peopleListeners.delete(callback);
}

export function subscribeToRequests(callback: (reqs: ParticipationRequest[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const unsub = onSnapshot(collection(db, 'participation_requests'), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ParticipationRequest));
      callback(data);
    });
    return unsub;
  }
  callback(load(STORAGE_KEYS.REQUESTS, initialRequests));
  requestListeners.add(callback);
  return () => requestListeners.delete(callback);
}

export function subscribeToNotifications(callback: (notifs: AppNotification[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const unsub = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
      callback(data);
    });
    return unsub;
  }
  callback(load(STORAGE_KEYS.NOTIFICATIONS, initialNotifications));
  notifListeners.add(callback);
  return () => notifListeners.delete(callback);
}

export function subscribeToAudit(callback: (logs: AuditLog[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const unsub = onSnapshot(collection(db, 'audit_logs'), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
      callback(data);
    });
    return unsub;
  }
  callback(load(STORAGE_KEYS.AUDIT, initialAudit));
  auditListeners.add(callback);
  return () => auditListeners.delete(callback);
}

// Operaciones de Mutación (Eventos)
export async function saveEvent(event: Omit<EventEntity, 'id'> & { id?: string }): Promise<string> {
  const user = load<UserProfile>(STORAGE_KEYS.USER, {
    uid: 'admin-1',
    displayName: 'Administrador General',
    email: 'admin@empresa.com',
    role: 'administrador',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  });

  if (isFirebaseConfigured && db) {
    if (event.id) {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, {
        ...event,
        updatedAt: serverTimestamp(),
      });
      return event.id;
    } else {
      const docRef = await addDoc(collection(db, 'events'), {
        ...event,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    }
  }

  // Local Storage Mutation
  const current = load<EventEntity[]>(STORAGE_KEYS.EVENTS, initialEvents);
  const now = new Date().toISOString();
  let id = event.id;

  if (id) {
    const index = current.findIndex((e) => e.id === id);
    if (index >= 0) {
      current[index] = {
        ...current[index],
        ...event,
        id,
        updatedAt: now,
        updatedBy: { uid: user.uid, name: user.displayName, email: user.email },
      };
    }
    addAuditLog({
      action: 'EVENTO_MODIFICADO',
      entityId: id,
      entityType: 'evento',
      details: { title: event.title, date: event.date, time: `${event.startTime}-${event.endTime}` },
      user: { uid: user.uid, name: user.displayName, email: user.email },
    });
  } else {
    id = `evt-${Date.now()}`;
    const newEvent: EventEntity = {
      ...event,
      id,
      createdAt: now,
      createdBy: { uid: user.uid, name: user.displayName, email: user.email },
    };
    current.unshift(newEvent);
    addAuditLog({
      action: 'EVENTO_CREADO',
      entityId: id,
      entityType: 'evento',
      details: { title: event.title, space: event.spaceName, date: event.date },
      user: { uid: user.uid, name: user.displayName, email: user.email },
    });
  }

  save(STORAGE_KEYS.EVENTS, current);
  eventListeners.forEach((fn) => fn(current));
  return id;
}

export async function deleteEvent(eventId: string): Promise<void> {
  const user = load<UserProfile>(STORAGE_KEYS.USER, {
    uid: 'admin-1',
    displayName: 'Administrador General',
    email: 'admin@empresa.com',
    role: 'administrador',
    createdAt: '',
    lastLogin: '',
  });

  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, 'events', eventId));
    return;
  }

  const current = load<EventEntity[]>(STORAGE_KEYS.EVENTS, initialEvents);
  const target = current.find((e) => e.id === eventId);
  const filtered = current.filter((e) => e.id !== eventId);
  save(STORAGE_KEYS.EVENTS, filtered);
  eventListeners.forEach((fn) => fn(filtered));

  if (target) {
    addAuditLog({
      action: 'EVENTO_CANCELADO',
      entityId: eventId,
      entityType: 'evento',
      details: { title: target.title, date: target.date },
      user: { uid: user.uid, name: user.displayName, email: user.email },
    });
  }
}

// Operaciones de Mutación (Espacios)
export async function saveSpace(space: Omit<Space, 'id'> & { id?: string }): Promise<string> {
  const current = load<Space[]>(STORAGE_KEYS.SPACES, initialSpaces);
  let id = space.id;
  const now = new Date().toISOString();

  if (id) {
    const idx = current.findIndex((s) => s.id === id);
    if (idx >= 0) current[idx] = { ...current[idx], ...space, id };
  } else {
    id = `space-${Date.now()}`;
    current.push({ ...space, id, createdAt: now });
  }

  save(STORAGE_KEYS.SPACES, current);
  spaceListeners.forEach((fn) => fn(current));
  return id;
}

// Operaciones de Mutación (Personas)
export async function savePerson(person: Omit<Person, 'id'> & { id?: string }): Promise<string> {
  const current = load<Person[]>(STORAGE_KEYS.PEOPLE, initialPeople);
  let id = person.id;
  const now = new Date().toISOString();

  if (id) {
    const idx = current.findIndex((p) => p.id === id);
    if (idx >= 0) current[idx] = { ...current[idx], ...person, id };
  } else {
    id = `person-${Date.now()}`;
    current.push({ ...person, id, createdAt: now });
  }

  save(STORAGE_KEYS.PEOPLE, current);
  peopleListeners.forEach((fn) => fn(current));
  return id;
}

// Operaciones de Solicitud de Participación y Confirmación por Token
export async function createParticipationRequest(req: Omit<ParticipationRequest, 'id' | 'token' | 'createdAt'>): Promise<ParticipationRequest> {
  const current = load<ParticipationRequest[]>(STORAGE_KEYS.REQUESTS, initialRequests);
  const id = `req-${Date.now()}`;
  const token = `tk_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
  const newReq: ParticipationRequest = {
    ...req,
    id,
    token,
    createdAt: new Date().toISOString(),
  };

  current.unshift(newReq);
  save(STORAGE_KEYS.REQUESTS, current);
  requestListeners.forEach((fn) => fn(current));

  // Generar notificación en el sistema
  addNotification({
    userId: 'ALL_ADMINS',
    type: 'solicitud',
    title: 'Solicitud de Participación Enviada',
    message: `Se ha invitado a ${req.personName} para el evento "${req.eventTitle}".`,
    eventId: req.eventId,
  });

  return newReq;
}

export async function respondToParticipationRequest(
  token: string,
  newStatus: 'confirmada' | 'rechazada',
  notes?: string
): Promise<ParticipationRequest | null> {
  const current = load<ParticipationRequest[]>(STORAGE_KEYS.REQUESTS, initialRequests);
  const target = current.find((r) => r.token === token);
  if (!target) return null;

  target.status = newStatus;
  target.respondedAt = new Date().toISOString();
  if (notes) target.responseNotes = notes;

  save(STORAGE_KEYS.REQUESTS, current);
  requestListeners.forEach((fn) => fn(current));

  // Notificar en el centro de alertas
  addNotification({
    userId: 'ALL_ADMINS',
    type: newStatus === 'confirmada' ? 'confirmacion' : 'rechazo',
    title: newStatus === 'confirmada' ? 'Participación Confirmada' : 'Participación Rechazada',
    message: `${target.personName} ha ${newStatus === 'confirmada' ? 'CONFIRMADO' : 'RECHAZADO'} su participación en el evento "${target.eventTitle}".`,
    eventId: target.eventId,
  });

  // Si confirmó, revisar si actualizamos el estado del evento
  if (newStatus === 'confirmada') {
    const events = load<EventEntity[]>(STORAGE_KEYS.EVENTS, initialEvents);
    const evt = events.find((e) => e.id === target.eventId);
    if (evt && evt.status === 'pendiente_confirmacion') {
      evt.status = 'confirmado';
      save(STORAGE_KEYS.EVENTS, events);
      eventListeners.forEach((fn) => fn(events));
    }
  }

  return target;
}

// Notificaciones
export function addNotification(notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): void {
  const current = load<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  const newNotif: AppNotification = {
    ...notif,
    id: `notif-${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  current.unshift(newNotif);
  save(STORAGE_KEYS.NOTIFICATIONS, current);
  notifListeners.forEach((fn) => fn(current));
}

export function markNotificationAsRead(notifId: string): void {
  const current = load<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  const item = current.find((n) => n.id === notifId);
  if (item) {
    item.read = true;
    save(STORAGE_KEYS.NOTIFICATIONS, current);
    notifListeners.forEach((fn) => fn(current));
  }
}

export function markAllNotificationsAsRead(): void {
  const current = load<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  current.forEach((n) => (n.read = true));
  save(STORAGE_KEYS.NOTIFICATIONS, current);
  notifListeners.forEach((fn) => fn(current));
}

// Auditoría
export function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
  const current = load<AuditLog[]>(STORAGE_KEYS.AUDIT, initialAudit);
  const newLog: AuditLog = {
    ...log,
    id: `aud-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  current.unshift(newLog);
  // Mantener últimos 200 logs
  if (current.length > 200) current.length = 200;
  save(STORAGE_KEYS.AUDIT, current);
  auditListeners.forEach((fn) => fn(current));
}
