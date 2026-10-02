// Almacenamiento Reactivo con Sincronización en Tiempo Real (Local & Firebase Adapter)
import {
  EventEntity,
  Space,
  Person,
  PeopleGroup,
  PersonalTask,
  ParticipationRequest,
  AppNotification,
  AuditLog,
  UserProfile,
  UserRole,
  UserAccountStatus,
} from '../types';
import { getBogotaToday } from '../lib/timezone';
import { db, isFirebaseConfigured, auth } from '../lib/firebase';
import { sendParticipationEmail } from './emailService';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

const STORAGE_KEYS = {
  EVENTS: 'eventflow_events',
  SPACES: 'eventflow_spaces',
  PEOPLE: 'eventflow_people',
  GROUPS: 'eventflow_groups',
  PERSONAL_TASKS: 'eventflow_personal_tasks',
  REQUESTS: 'eventflow_requests',
  NOTIFICATIONS: 'eventflow_notifications',
  AUDIT: 'eventflow_audit',
  USER: 'eventflow_user',
  USERS_LIST: 'eventflow_users_list',
};

// Semilla inicial de espacios empresariales
const initialSpaces: Space[] = [
  {
    id: 'space-virtual',
    name: 'Espacio Virtual / Teams / Meet / Zoom',
    type: 'otro',
    location: 'En Línea / Plataforma Virtual',
    capacity: 1000,
    equipment: ['Microsoft Teams', 'Google Meet', 'Zoom Rooms', 'OBS Streaming'],
    status: 'activo',
    color: '#06B6D4', // Cyan
    isVirtual: true,
    createdAt: new Date().toISOString(),
  },
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

// Helper para convertir un UserProfile en una Person del Directorio
export function userProfileToPerson(user: UserProfile): Person {
  const cleanDisplayName = (user.displayName || '').trim();
  const emailName = user.email.split('@')[0];
  const fullName = cleanDisplayName || emailName;
  const nameParts = fullName.split(' ').filter(Boolean);

  const firstName = nameParts[0] || 'Usuario';
  const lastName = nameParts.slice(1).join(' ') || (cleanDisplayName ? '' : 'UdeA');

  let roleTitle = 'Usuario Institucional';
  if (user.role === 'administrador') {
    roleTitle = user.email.toLowerCase() === 'proyectostic.med@udea.edu.co'
      ? 'Líder Proyectos TIC & Superadministrador'
      : 'Administrador del Sistema';
  } else if (user.role === 'gestor') {
    roleTitle = 'Gestor de Eventos & Espacios';
  } else if (user.role === 'usuario') {
    roleTitle = 'Docente / Investigador';
  } else if (user.role === 'lector') {
    roleTitle = 'Lector Institucional';
  }

  return {
    id: user.uid,
    firstName,
    lastName,
    email: user.email.toLowerCase().trim(),
    roleTitle,
    department: user.email.toLowerCase().includes('udea.edu.co')
      ? 'Facultad de Medicina - UdeA'
      : 'Comunidad Académica',
    status: user.status === 'bloqueado' ? 'inactivo' : 'activo',
    notes: user.status === 'pendiente' ? 'Usuario con registro pendiente de aprobación' : undefined,
    createdAt: user.createdAt || new Date().toISOString(),
  };
}

// Semilla inicial limpia: Solo superadministrador institucional oficial
const initialPeople: Person[] = [
  {
    id: 'person-proyectostic',
    firstName: 'Alejandro',
    lastName: 'Proyectos TIC',
    email: 'proyectostic.med@udea.edu.co',
    roleTitle: 'Líder Proyectos TIC & Superadministrador',
    department: 'Facultad de Medicina - UdeA',
    status: 'activo',
    createdAt: new Date().toISOString(),
  },
];

// Generar eventos de ejemplo alrededor de la fecha de hoy
const today = getBogotaToday();

const initialEvents: EventEntity[] = [
  {
    id: 'evt-1',
    title: 'Reunión de Coordinación y Planificación TIC',
    description: 'Sesión estratégica del equipo de Proyectos TIC y Facultad de Medicina.',
    type: 'academico',
    date: today,
    startTime: '09:00',
    endTime: '11:00',
    durationMinutes: 120,
    status: 'confirmado',
    spaceId: 'space-1',
    spaceName: 'Auditorio Mayor',
    responsibleId: 'person-proyectostic',
    responsibleName: 'Alejandro Proyectos TIC',
    attendeesCount: 15,
    peopleIds: ['person-proyectostic'],
    createdBy: {
      uid: 'person-proyectostic',
      name: 'Alejandro Proyectos TIC',
      email: 'proyectostic.med@udea.edu.co',
    },
    createdAt: new Date().toISOString(),
  },
];

const initialRequests: ParticipationRequest[] = [];

const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'ALL_ADMINS',
    type: 'confirmacion',
    title: 'Sistema Sincronizado',
    message: 'Directorio de personas unificado en tiempo real con los usuarios registrados.',
    read: false,
    createdAt: new Date().toISOString(),
  },
];

const initialAudit: AuditLog[] = [
  {
    id: 'aud-1',
    action: 'ESPACIO_RESERVADO',
    entityId: 'space-1',
    entityType: 'espacio',
    details: { space: 'Auditorio Mayor', event: 'Reunión de Coordinación y Planificación TIC' },
    user: { uid: 'person-proyectostic', name: 'Alejandro Proyectos TIC', email: 'proyectostic.med@udea.edu.co' },
    timestamp: new Date().toISOString(),
  },
];

const initialUsers: UserProfile[] = [
  {
    uid: 'person-proyectostic',
    displayName: 'Alejandro Proyectos TIC',
    email: 'proyectostic.med@udea.edu.co',
    photoURL: undefined,
    role: 'administrador',
    status: 'aprobado',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date().toISOString(),
  },
];

const initialGroups: PeopleGroup[] = [
  {
    id: 'grp-1',
    name: 'Comité de Proyectos e Innovación TIC',
    description: 'Equipo encargado de la gestión académica y tecnológica de la Facultad',
    color: '#4F46E5', // Indigo
    memberIds: ['person-proyectostic'],
    createdAt: new Date().toISOString(),
  },
];

const initialPersonalTasks: PersonalTask[] = [
  {
    id: 'task-1',
    userId: 'person-proyectostic',
    title: 'Revisión y bienvenida a nuevos usuarios registrados',
    description: 'Gestionar roles y permisos desde el módulo de Usuarios.',
    dueDate: today,
    dueTime: '10:00',
    priority: 'alta',
    status: 'pendiente',
    category: 'recordatorio',
    createdAt: new Date().toISOString(),
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
const groupListeners = new Set<Listener<PeopleGroup[]>>();
const personalTaskListeners = new Set<Listener<PersonalTask[]>>();
const requestListeners = new Set<Listener<ParticipationRequest[]>>();
const notifListeners = new Set<Listener<AppNotification[]>>();
const auditListeners = new Set<Listener<AuditLog[]>>();
const userListeners = new Set<Listener<UserProfile[]>>();

// Función para cargar usuarios limpios (sin datos de prueba de @empresa.com)
export function loadCleanUsers(): UserProfile[] {
  const users = load<UserProfile[]>(STORAGE_KEYS.USERS_LIST, initialUsers).filter(
    (u) =>
      u.email &&
      !u.email.toLowerCase().includes('@empresa.com') &&
      !['admin-1', 'user-2', 'user-3'].includes(u.uid)
  );
  if (!users.some((u) => u.email.toLowerCase() === 'proyectostic.med@udea.edu.co')) {
    users.unshift(initialUsers[0]);
  }
  return users;
}

// Sincronizar personas locales directamente desde la lista de usuarios registrados
export function syncLocalPeopleFromUsers(callback?: (people: Person[]) => void): Person[] {
  const users = loadCleanUsers();
  const existingPeople = load<Person[]>(STORAGE_KEYS.PEOPLE, []).filter(
    (p) =>
      p.email &&
      !p.email.toLowerCase().includes('@empresa.com') &&
      !['person-1', 'person-2', 'person-3', 'person-4', 'person-5'].includes(p.id)
  );

  const syncedPeople: Person[] = users.map((u) => {
    const existing = existingPeople.find(
      (p) => p.id === u.uid || p.email.toLowerCase() === u.email.toLowerCase()
    );
    const mapped = userProfileToPerson(u);
    return {
      ...mapped,
      ...(existing
        ? {
            roleTitle: existing.roleTitle || mapped.roleTitle,
            department: existing.department || mapped.department,
            notes: existing.notes || mapped.notes,
          }
        : {}),
      id: u.uid,
      email: u.email.toLowerCase().trim(),
      status: u.status === 'bloqueado' ? 'inactivo' : 'activo',
    };
  });

  if (!syncedPeople.some((p) => p.email.toLowerCase() === 'proyectostic.med@udea.edu.co')) {
    syncedPeople.unshift(initialPeople[0]);
  }

  save(STORAGE_KEYS.PEOPLE, syncedPeople);
  if (callback) callback(syncedPeople);
  return syncedPeople;
}

// Inicializar datos si no existen y purgar datos de prueba obsoletos
export function initializeSeedData(): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Limpiar usuarios locales de datos de prueba
    const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
    let cleanedUsers = initialUsers;
    if (rawUsers) {
      try {
        const parsed = JSON.parse(rawUsers) as UserProfile[];
        cleanedUsers = parsed.filter(
          (u) =>
            u.email &&
            !u.email.toLowerCase().includes('@empresa.com') &&
            !['admin-1', 'user-2', 'user-3'].includes(u.uid)
        );
      } catch {
        cleanedUsers = initialUsers;
      }
    }
    if (!cleanedUsers.some((u) => u.email.toLowerCase() === 'proyectostic.med@udea.edu.co')) {
      cleanedUsers.unshift(initialUsers[0]);
    }
    save(STORAGE_KEYS.USERS_LIST, cleanedUsers);

    // 2. Sincronizar personas locales a partir de los usuarios registrados
    const rawPeople = localStorage.getItem(STORAGE_KEYS.PEOPLE);
    let existingPeople: Person[] = [];
    if (rawPeople) {
      try {
        existingPeople = (JSON.parse(rawPeople) as Person[]).filter(
          (p) =>
            p.email &&
            !p.email.toLowerCase().includes('@empresa.com') &&
            !['person-1', 'person-2', 'person-3', 'person-4', 'person-5'].includes(p.id)
        );
      } catch {
        existingPeople = [];
      }
    }

    const syncedPeople: Person[] = cleanedUsers.map((u) => {
      const existing = existingPeople.find(
        (p) => p.id === u.uid || p.email.toLowerCase() === u.email.toLowerCase()
      );
      const mapped = userProfileToPerson(u);
      return {
        ...mapped,
        ...(existing
          ? {
              roleTitle: existing.roleTitle || mapped.roleTitle,
              department: existing.department || mapped.department,
              notes: existing.notes || mapped.notes,
            }
          : {}),
        id: u.uid,
        email: u.email.toLowerCase().trim(),
        status: u.status === 'bloqueado' ? 'inactivo' : 'activo',
      };
    });

    if (!syncedPeople.some((p) => p.email.toLowerCase() === 'proyectostic.med@udea.edu.co')) {
      syncedPeople.unshift(initialPeople[0]);
    }
    save(STORAGE_KEYS.PEOPLE, syncedPeople);

    // 3. Limpiar eventos de prueba
    const rawEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (rawEvents) {
      try {
        const parsed = JSON.parse(rawEvents) as EventEntity[];
        const cleaned = parsed.filter(
          (e) =>
            !(e.createdBy?.email || '').toLowerCase().includes('@empresa.com') &&
            !['person-1', 'person-2', 'person-3', 'person-4', 'person-5'].includes(e.responsibleId)
        );
        save(STORAGE_KEYS.EVENTS, cleaned.length > 0 ? cleaned : initialEvents);
      } catch {
        save(STORAGE_KEYS.EVENTS, initialEvents);
      }
    } else {
      save(STORAGE_KEYS.EVENTS, initialEvents);
    }

    // 4. Limpiar solicitudes de prueba
    const rawReqs = localStorage.getItem(STORAGE_KEYS.REQUESTS);
    if (rawReqs) {
      try {
        const parsed = JSON.parse(rawReqs) as ParticipationRequest[];
        const cleaned = parsed.filter((r) => !r.personEmail.toLowerCase().includes('@empresa.com'));
        save(STORAGE_KEYS.REQUESTS, cleaned);
      } catch {
        save(STORAGE_KEYS.REQUESTS, initialRequests);
      }
    } else {
      save(STORAGE_KEYS.REQUESTS, initialRequests);
    }

    // 5. Limpiar auditoría de prueba
    const rawAudit = localStorage.getItem(STORAGE_KEYS.AUDIT);
    if (rawAudit) {
      try {
        const parsed = JSON.parse(rawAudit) as AuditLog[];
        const cleaned = parsed.filter((a) => !(a.user?.email || '').toLowerCase().includes('@empresa.com'));
        save(STORAGE_KEYS.AUDIT, cleaned.length > 0 ? cleaned : initialAudit);
      } catch {
        save(STORAGE_KEYS.AUDIT, initialAudit);
      }
    } else {
      save(STORAGE_KEYS.AUDIT, initialAudit);
    }

    // 6. Limpiar grupos con IDs de prueba
    const rawGroups = localStorage.getItem(STORAGE_KEYS.GROUPS);
    if (rawGroups) {
      try {
        const parsed = JSON.parse(rawGroups) as PeopleGroup[];
        const cleaned = parsed.map((g) => ({
          ...g,
          memberIds: (g.memberIds || []).filter(
            (id) => !['person-1', 'person-2', 'person-3', 'person-4', 'person-5'].includes(id)
          ),
        }));
        save(STORAGE_KEYS.GROUPS, cleaned.length > 0 ? cleaned : initialGroups);
      } catch {
        save(STORAGE_KEYS.GROUPS, initialGroups);
      }
    } else {
      save(STORAGE_KEYS.GROUPS, initialGroups);
    }
  } catch (err) {
    console.warn('Error inicializando / depurando datos locales:', err);
  }

  if (!localStorage.getItem(STORAGE_KEYS.SPACES)) save(STORAGE_KEYS.SPACES, initialSpaces);
  if (!localStorage.getItem(STORAGE_KEYS.PERSONAL_TASKS)) save(STORAGE_KEYS.PERSONAL_TASKS, initialPersonalTasks);
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) save(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
}

// Escuchar cambios de otras pestañas
if (channel) {
  channel.onmessage = (event) => {
    if (event.data?.type === 'SYNC_UPDATE') {
      const { key } = event.data;
      if (key === STORAGE_KEYS.EVENTS) eventListeners.forEach((fn) => fn(load(STORAGE_KEYS.EVENTS, [])));
      if (key === STORAGE_KEYS.SPACES) spaceListeners.forEach((fn) => fn(load(STORAGE_KEYS.SPACES, [])));
      if (key === STORAGE_KEYS.PEOPLE) peopleListeners.forEach((fn) => fn(load(STORAGE_KEYS.PEOPLE, [])));
      if (key === STORAGE_KEYS.GROUPS) groupListeners.forEach((fn) => fn(load(STORAGE_KEYS.GROUPS, [])));
      if (key === STORAGE_KEYS.PERSONAL_TASKS) personalTaskListeners.forEach((fn) => fn(load(STORAGE_KEYS.PERSONAL_TASKS, [])));
      if (key === STORAGE_KEYS.REQUESTS) requestListeners.forEach((fn) => fn(load(STORAGE_KEYS.REQUESTS, [])));
      if (key === STORAGE_KEYS.NOTIFICATIONS) notifListeners.forEach((fn) => fn(load(STORAGE_KEYS.NOTIFICATIONS, [])));
      if (key === STORAGE_KEYS.AUDIT) auditListeners.forEach((fn) => fn(load(STORAGE_KEYS.AUDIT, [])));
      if (key === STORAGE_KEYS.USERS_LIST) userListeners.forEach((fn) => fn(load(STORAGE_KEYS.USERS_LIST, [])));
    }
  };
}

// Helper para normalizar eventos desde Firestore (evitar Timestamp vs ISO string issues)
function normalizeEvent(id: string, data: any): EventEntity {
  let createdAt = data.createdAt;
  if (createdAt && typeof createdAt.toDate === 'function') {
    createdAt = createdAt.toDate().toISOString();
  } else if (!createdAt) {
    createdAt = new Date().toISOString();
  }
  let updatedAt = data.updatedAt;
  if (updatedAt && typeof updatedAt.toDate === 'function') {
    updatedAt = updatedAt.toDate().toISOString();
  }
  return {
    ...data,
    id,
    createdAt,
    updatedAt,
  };
}

// Subscripciones públicas con Sincronización en Tiempo Real Multi-Navegador
export function subscribeToEvents(callback: (events: EventEntity[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const firestore = db;
    let hasSeeded = false;
    const unsub = onSnapshot(
      collection(firestore, 'events'),
      async (snapshot) => {
        if (snapshot.empty && !hasSeeded) {
          hasSeeded = true;
          if (auth?.currentUser) {
            for (const ev of initialEvents) {
              try {
                await setDoc(doc(firestore, 'events', ev.id), ev, { merge: true });
              } catch (e) {
                console.warn('Error sembrando evento en Firestore:', e);
              }
            }
          }
          callback(initialEvents);
          return;
        }
        const data = snapshot.docs.map((d) => normalizeEvent(d.id, d.data()));
        callback(data);
      },
      (error) => {
        console.warn('Firestore events subscription error, fallback local:', error);
        callback(load(STORAGE_KEYS.EVENTS, initialEvents));
      }
    );
    return unsub;
  }
  callback(load(STORAGE_KEYS.EVENTS, initialEvents));
  eventListeners.add(callback);
  return () => eventListeners.delete(callback);
}

export function subscribeToSpaces(callback: (spaces: Space[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const firestore = db;
    let hasSeeded = false;
    const unsub = onSnapshot(
      collection(firestore, 'spaces'),
      async (snapshot) => {
        if (snapshot.empty && !hasSeeded) {
          hasSeeded = true;
          if (auth?.currentUser) {
            for (const sp of initialSpaces) {
              try {
                await setDoc(doc(firestore, 'spaces', sp.id), sp, { merge: true });
              } catch (e) {
                console.warn('Error sembrando espacio en Firestore:', e);
              }
            }
          }
          callback(initialSpaces);
          return;
        }
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Space));
        callback(data);
      },
      (error) => {
        console.warn('Firestore spaces subscription error, fallback local:', error);
        callback(load(STORAGE_KEYS.SPACES, initialSpaces));
      }
    );
    return unsub;
  }
  callback(load(STORAGE_KEYS.SPACES, initialSpaces));
  spaceListeners.add(callback);
  return () => spaceListeners.delete(callback);
}

export function subscribeToPeople(callback: (people: Person[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const firestore = db;
    // Escuchar la colección 'users' para garantizar que las personas sean EXACTAMENTE los usuarios registrados
    const unsubUsers = onSnapshot(
      collection(firestore, 'users'),
      async (usersSnapshot) => {
        const registeredUsers = usersSnapshot.docs
          .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
          .filter(
            (u) =>
              u.email &&
              !u.email.toLowerCase().includes('@empresa.com') &&
              !['admin-1', 'user-2', 'user-3'].includes(u.uid)
          );

        // Asegurar que el superadmin esté presente
        if (!registeredUsers.some((u) => u.email.toLowerCase() === 'proyectostic.med@udea.edu.co')) {
          registeredUsers.unshift(initialUsers[0]);
        }

        // Obtener personas actuales en Firestore para mantener metadatos adicionales y depurar datos de prueba
        let existingPeople: Person[] = [];
        try {
          const snapPeople = await getDocs(collection(firestore, 'people'));
          existingPeople = snapPeople.docs.map((d) => ({ id: d.id, ...d.data() } as Person));

          // Purgar de Firestore cualquier persona de prueba antigua
          for (const docItem of snapPeople.docs) {
            const data = docItem.data();
            const email = (data.email || '').toLowerCase();
            if (
              email.includes('@empresa.com') ||
              ['person-1', 'person-2', 'person-3', 'person-4', 'person-5'].includes(docItem.id)
            ) {
              deleteDoc(doc(firestore, 'people', docItem.id)).catch(console.warn);
            }
          }
        } catch (e) {
          console.warn('Error leyendo colección people en Firestore:', e);
        }

        // Construir la lista de personas estrictamente a partir de los usuarios registrados
        const syncedPeople: Person[] = [];
        for (const user of registeredUsers) {
          const existing = existingPeople.find(
            (p) => p.id === user.uid || p.email.toLowerCase() === user.email.toLowerCase()
          );
          const mapped = userProfileToPerson(user);
          const finalPerson: Person = {
            ...mapped,
            ...(existing
              ? {
                  roleTitle: existing.roleTitle || mapped.roleTitle,
                  department: existing.department || mapped.department,
                  notes: existing.notes || mapped.notes,
                }
              : {}),
            id: user.uid,
            email: user.email.toLowerCase().trim(),
            status: user.status === 'bloqueado' ? 'inactivo' : 'activo',
          };

          syncedPeople.push(finalPerson);

          // Si no existía en Firestore o cambió de ID, persistir en Firestore
          if (!existing || existing.id !== user.uid) {
            if (auth?.currentUser) {
              setDoc(doc(firestore, 'people', user.uid), finalPerson, { merge: true }).catch(console.warn);
            }
          }
        }

        if (!syncedPeople.some((p) => p.email.toLowerCase() === 'proyectostic.med@udea.edu.co')) {
          syncedPeople.unshift(initialPeople[0]);
        }

        callback(syncedPeople);
      },
      (error) => {
        console.warn('Firestore people subscription error, fallback local:', error);
        syncLocalPeopleFromUsers(callback);
      }
    );
    return unsubUsers;
  }

  // Local storage fallback
  syncLocalPeopleFromUsers(callback);
  peopleListeners.add(callback);
  return () => peopleListeners.delete(callback);
}

export function subscribeToGroups(callback: (groups: PeopleGroup[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const firestore = db;
    let hasSeeded = false;
    const unsub = onSnapshot(
      collection(firestore, 'groups'),
      async (snapshot) => {
        if (snapshot.empty && !hasSeeded) {
          hasSeeded = true;
          if (auth?.currentUser) {
            for (const grp of initialGroups) {
              try {
                await setDoc(doc(firestore, 'groups', grp.id), grp, { merge: true });
              } catch (e) {
                console.warn('Error sembrando grupo en Firestore:', e);
              }
            }
          }
          callback(initialGroups);
          return;
        }
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PeopleGroup));
        callback(data);
      },
      (error) => {
        console.warn('Firestore groups subscription error, fallback local:', error);
        callback(load(STORAGE_KEYS.GROUPS, initialGroups));
      }
    );
    return unsub;
  }
  callback(load(STORAGE_KEYS.GROUPS, initialGroups));
  groupListeners.add(callback);
  return () => groupListeners.delete(callback);
}

export function subscribeToPersonalTasks(userId: string, callback: (tasks: PersonalTask[]) => void): () => void {
  // Mantener listener local siempre activo para que cualquier mutación se refleje en vivo instantáneamente
  const localListener: Listener<PersonalTask[]> = (tasks) => {
    callback(tasks.filter((t) => t.userId === userId));
  };
  personalTaskListeners.add(localListener);

  if (isFirebaseConfigured && db) {
    const firestore = db;
    const q = query(collection(firestore, 'personal_tasks'), where('userId', '==', userId));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as PersonalTask));
        callback(data);
        save(STORAGE_KEYS.PERSONAL_TASKS, data);
      },
      (error) => {
        console.warn('Firestore personal_tasks subscription error, fallback local:', error);
        const allTasks = load<PersonalTask[]>(STORAGE_KEYS.PERSONAL_TASKS, initialPersonalTasks);
        callback(allTasks.filter((t) => t.userId === userId));
      }
    );
    return () => {
      personalTaskListeners.delete(localListener);
      unsub();
    };
  }

  const allTasks = load<PersonalTask[]>(STORAGE_KEYS.PERSONAL_TASKS, initialPersonalTasks);
  callback(allTasks.filter((t) => t.userId === userId));
  return () => personalTaskListeners.delete(localListener);
}

export function subscribeToRequests(callback: (reqs: ParticipationRequest[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const unsub = onSnapshot(
      collection(db, 'participation_requests'),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ParticipationRequest));
        callback(data);
      },
      (error) => {
        console.warn('Firestore requests subscription error, fallback local:', error);
        callback(load(STORAGE_KEYS.REQUESTS, initialRequests));
      }
    );
    return unsub;
  }
  callback(load(STORAGE_KEYS.REQUESTS, initialRequests));
  requestListeners.add(callback);
  return () => requestListeners.delete(callback);
}

export function subscribeToNotifications(callback: (notifs: AppNotification[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const unsub = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
        callback(data);
      },
      (error) => {
        console.warn('Firestore notifs subscription error, fallback local:', error);
        callback(load(STORAGE_KEYS.NOTIFICATIONS, initialNotifications));
      }
    );
    return unsub;
  }
  callback(load(STORAGE_KEYS.NOTIFICATIONS, initialNotifications));
  notifListeners.add(callback);
  return () => notifListeners.delete(callback);
}

export function subscribeToAudit(callback: (logs: AuditLog[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const unsub = onSnapshot(
      collection(db, 'audit_logs'),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
        callback(data);
      },
      (error) => {
        console.warn('Firestore audit subscription error, fallback local:', error);
        callback(load(STORAGE_KEYS.AUDIT, initialAudit));
      }
    );
    return unsub;
  }
  callback(load(STORAGE_KEYS.AUDIT, initialAudit));
  auditListeners.add(callback);
  return () => auditListeners.delete(callback);
}

export function subscribeToUsers(callback: (users: UserProfile[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const data = snapshot.docs
          .map((d) => ({ uid: d.id, ...d.data() } as UserProfile))
          .filter(
            (u) =>
              u.email &&
              !u.email.toLowerCase().includes('@empresa.com') &&
              !['admin-1', 'user-2', 'user-3'].includes(u.uid)
          );

        // Purgar de Firestore usuarios ficticios si existen
        for (const docItem of snapshot.docs) {
          const uData = docItem.data();
          const email = (uData.email || '').toLowerCase();
          if (email.includes('@empresa.com') || ['admin-1', 'user-2', 'user-3'].includes(docItem.id)) {
            deleteDoc(doc(db!, 'users', docItem.id)).catch(console.warn);
          }
        }

        if (!data.some((u) => u.email.toLowerCase() === 'proyectostic.med@udea.edu.co')) {
          data.unshift(initialUsers[0]);
        }
        callback(data);
      },
      (error) => {
        console.warn('Firestore users subscription error, fallback local:', error);
        callback(loadCleanUsers());
      }
    );
    return unsub;
  }
  callback(loadCleanUsers());
  userListeners.add(callback);
  return () => userListeners.delete(callback);
}

export async function updateUserRoleAndStatus(
  uid: string,
  newRole: UserRole,
  newStatus: UserAccountStatus,
  approvedBy?: string
): Promise<void> {
  const now = new Date().toISOString();
  if (isFirebaseConfigured && db) {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      role: newRole,
      status: newStatus,
      updatedAt: now,
      ...(approvedBy ? { approvedBy, approvedAt: now } : {}),
    });

    // Actualizar también la persona correspondiente en people
    try {
      const personRef = doc(db, 'people', uid);
      const personSnap = await getDoc(personRef);
      let roleTitle = 'Usuario Institucional';
      if (newRole === 'administrador') roleTitle = 'Administrador del Sistema';
      else if (newRole === 'gestor') roleTitle = 'Gestor de Eventos & Espacios';
      else if (newRole === 'usuario') roleTitle = 'Docente / Investigador';
      else if (newRole === 'lector') roleTitle = 'Lector Institucional';

      if (personSnap.exists()) {
        await updateDoc(personRef, {
          status: newStatus === 'bloqueado' ? 'inactivo' : 'activo',
          roleTitle,
          updatedAt: now,
        });
      }
    } catch (e) {
      console.warn('Error sincronizando persona tras actualizar rol/estado:', e);
    }
    return;
  }

  // Local storage fallback
  const current = loadCleanUsers();
  const idx = current.findIndex((u) => u.uid === uid);
  if (idx >= 0) {
    current[idx] = {
      ...current[idx],
      role: newRole,
      status: newStatus,
      updatedAt: now,
      ...(approvedBy ? { approvedBy, approvedAt: now } : {}),
    };
    save(STORAGE_KEYS.USERS_LIST, current);
    userListeners.forEach((fn) => fn(current));

    // Sincronizar personas locales inmediatamente
    const people = syncLocalPeopleFromUsers();
    peopleListeners.forEach((fn) => fn(people));
  }
}

// Operaciones de Mutación (Eventos) en la Nube y Local
export async function saveEvent(event: Omit<EventEntity, 'id'> & { id?: string }): Promise<string> {
  const user = load<UserProfile>(STORAGE_KEYS.USER, {
    uid: auth?.currentUser?.uid || 'person-proyectostic',
    displayName: auth?.currentUser?.displayName || 'Alejandro Proyectos TIC',
    email: auth?.currentUser?.email || 'proyectostic.med@udea.edu.co',
    role: 'administrador',
    status: 'aprobado',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  });

  const now = new Date().toISOString();
  let id = event.id;

  if (isFirebaseConfigured && db) {
    try {
      if (id) {
        const eventRef = doc(db, 'events', id);
        const dataToSave = {
          ...event,
          id,
          updatedAt: now,
          updatedBy: { uid: user.uid, name: user.displayName, email: user.email },
        };
        await setDoc(eventRef, dataToSave, { merge: true });
      } else {
        const newDocRef = doc(collection(db, 'events'));
        id = newDocRef.id;
        const newEventData = {
          ...event,
          id,
          createdAt: now,
          createdBy: { uid: user.uid, name: user.displayName, email: user.email },
        };
        await setDoc(newDocRef, newEventData);
      }

      // Guardar log en Firestore
      try {
        await addDoc(collection(db, 'audit_logs'), {
          action: event.id ? 'EVENTO_MODIFICADO' : 'EVENTO_CREADO',
          entityId: id,
          entityType: 'evento',
          details: { title: event.title, space: event.spaceName, date: event.date },
          user: { uid: user.uid, name: user.displayName, email: user.email },
          timestamp: now,
        });
      } catch (err) {
        console.warn('Error guardando audit log en Firestore:', err);
      }

      return id;
    } catch (err) {
      console.error('Error guardando evento en Firestore, aplicando fallback local:', err);
    }
  }

  // Local Storage Mutation Fallback
  const current = load<EventEntity[]>(STORAGE_KEYS.EVENTS, initialEvents);
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
    } else {
      current.unshift({
        ...event,
        id,
        createdAt: now,
        createdBy: { uid: user.uid, name: user.displayName, email: user.email },
      });
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
    uid: auth?.currentUser?.uid || 'person-proyectostic',
    displayName: auth?.currentUser?.displayName || 'Alejandro Proyectos TIC',
    email: auth?.currentUser?.email || 'proyectostic.med@udea.edu.co',
    role: 'administrador',
    status: 'aprobado',
    createdAt: '',
    lastLogin: '',
  });

  const now = new Date().toISOString();

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'events', eventId));
      try {
        await addDoc(collection(db, 'audit_logs'), {
          action: 'EVENTO_CANCELADO',
          entityId: eventId,
          entityType: 'evento',
          details: { id: eventId },
          user: { uid: user.uid, name: user.displayName, email: user.email },
          timestamp: now,
        });
      } catch (e) {
        console.warn('Error guardando audit en Firestore:', e);
      }
    } catch (err) {
      console.error('Error eliminando evento en Firestore:', err);
    }
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

// Operaciones de Mutación (Espacios) en la Nube y Local
export async function saveSpace(space: Omit<Space, 'id'> & { id?: string }): Promise<string> {
  const now = new Date().toISOString();
  let id = space.id;

  if (isFirebaseConfigured && db) {
    try {
      if (!id) {
        id = `space-${Date.now()}`;
      }
      const spaceData: Space = {
        ...space,
        id,
        createdAt: space.createdAt || now,
      };
      await setDoc(doc(db, 'spaces', id), spaceData, { merge: true });
      return id;
    } catch (err) {
      console.error('Error guardando espacio en Firestore:', err);
    }
  }

  const current = load<Space[]>(STORAGE_KEYS.SPACES, initialSpaces);
  if (id) {
    const idx = current.findIndex((s) => s.id === id);
    if (idx >= 0) current[idx] = { ...current[idx], ...space, id };
    else current.push({ ...space, id, createdAt: now });
  } else {
    id = `space-${Date.now()}`;
    current.push({ ...space, id, createdAt: now });
  }

  save(STORAGE_KEYS.SPACES, current);
  spaceListeners.forEach((fn) => fn(current));
  return id;
}

export async function deleteSpace(spaceId: string): Promise<void> {
  const user = load<UserProfile>(STORAGE_KEYS.USER, {
    uid: auth?.currentUser?.uid || 'person-proyectostic',
    displayName: auth?.currentUser?.displayName || 'Alejandro Proyectos TIC',
    email: auth?.currentUser?.email || 'proyectostic.med@udea.edu.co',
    role: 'administrador',
    status: 'aprobado',
    createdAt: '',
    lastLogin: '',
  });
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'spaces', spaceId));
      try {
        await addDoc(collection(db, 'audit_logs'), {
          action: 'ESPACIO_ELIMINADO',
          entityId: spaceId,
          entityType: 'espacio',
          details: { id: spaceId },
          user: { uid: user.uid, name: user.displayName, email: user.email },
          timestamp: now,
        });
      } catch (e) {
        console.warn('Error guardando audit en Firestore:', e);
      }
    } catch (err) {
      console.error('Error eliminando espacio en Firestore:', err);
    }
  }
  const current = load<Space[]>(STORAGE_KEYS.SPACES, initialSpaces);
  const target = current.find((s) => s.id === spaceId);
  const filtered = current.filter((s) => s.id !== spaceId);
  save(STORAGE_KEYS.SPACES, filtered);
  spaceListeners.forEach((fn) => fn(filtered));

  if (target) {
    addAuditLog({
      action: 'ESPACIO_ELIMINADO',
      entityId: spaceId,
      entityType: 'espacio',
      details: { name: target.name, location: target.location },
      user: { uid: user.uid, name: user.displayName, email: user.email },
    });
  }
}

// Operaciones de Mutación (Personas) en la Nube y Local
export async function savePerson(person: Omit<Person, 'id'> & { id?: string }): Promise<string> {
  const cleanEmail = person.email.trim().toLowerCase();

  if (cleanEmail.includes('@empresa.com')) {
    throw new Error('No se permiten correos de prueba ficticios con dominio @empresa.com.');
  }

  // Validar que no exista otra persona con el mismo correo electrónico
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'people'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      const isDuplicate = snap.docs.some((d) => d.id !== person.id);
      if (isDuplicate) {
        throw new Error(`Ya existe una persona registrada en el directorio con el correo "${cleanEmail}".`);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Ya existe una persona registrada')) {
        throw err;
      }
      console.warn('Error validando unicidad de correo en Firestore:', err);
    }
  }

  const current = load<Person[]>(STORAGE_KEYS.PEOPLE, initialPeople);
  const localDuplicate = current.some((p) => p.email.toLowerCase() === cleanEmail && p.id !== person.id);
  if (localDuplicate) {
    throw new Error(`Ya existe una persona registrada en el directorio con el correo "${cleanEmail}".`);
  }

  const now = new Date().toISOString();
  let id = person.id;

  if (isFirebaseConfigured && db) {
    try {
      if (!id) {
        id = `user-${Date.now()}`;
      }
      const personData: Person = {
        ...person,
        id,
        email: cleanEmail,
        createdAt: person.createdAt || now,
      };
      await setDoc(doc(db, 'people', id), personData, { merge: true });

      // Sincronizar automáticamente en la colección de usuarios registrados
      const userRef = doc(db, 'users', id);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          displayName: `${person.firstName} ${person.lastName}`.trim(),
          status: person.status === 'inactivo' ? 'bloqueado' : 'aprobado',
          updatedAt: now,
        });
      } else {
        const newUser: UserProfile = {
          uid: id,
          displayName: `${person.firstName} ${person.lastName}`.trim(),
          email: cleanEmail,
          role: person.roleTitle.toLowerCase().includes('admin') ? 'administrador' : 'usuario',
          status: person.status === 'inactivo' ? 'bloqueado' : 'aprobado',
          createdAt: person.createdAt || now,
          lastLogin: now,
        };
        await setDoc(userRef, newUser, { merge: true });
      }

      return id;
    } catch (err) {
      console.error('Error guardando persona en Firestore:', err);
    }
  }

  if (id) {
    const idx = current.findIndex((p) => p.id === id);
    if (idx >= 0) current[idx] = { ...current[idx], ...person, id, email: cleanEmail };
    else current.push({ ...person, id, email: cleanEmail, createdAt: now });
  } else {
    id = `user-${Date.now()}`;
    current.push({ ...person, id, email: cleanEmail, createdAt: now });
  }

  save(STORAGE_KEYS.PEOPLE, current);
  peopleListeners.forEach((fn) => fn(current));

  // Mantener lista local de usuarios sincronizada 1:1
  const users = loadCleanUsers();
  const userIdx = users.findIndex((u) => u.uid === id || u.email.toLowerCase() === cleanEmail);
  if (userIdx >= 0) {
    users[userIdx] = {
      ...users[userIdx],
      displayName: `${person.firstName} ${person.lastName}`.trim(),
      status: person.status === 'inactivo' ? 'bloqueado' : 'aprobado',
      updatedAt: now,
    };
  } else {
    users.push({
      uid: id,
      displayName: `${person.firstName} ${person.lastName}`.trim(),
      email: cleanEmail,
      role: person.roleTitle.toLowerCase().includes('admin') ? 'administrador' : 'usuario',
      status: person.status === 'inactivo' ? 'bloqueado' : 'aprobado',
      createdAt: person.createdAt || now,
      lastLogin: now,
    });
  }
  save(STORAGE_KEYS.USERS_LIST, users);
  userListeners.forEach((fn) => fn(users));

  return id;
}

export async function deletePerson(personId: string): Promise<void> {
  const user = load<UserProfile>(STORAGE_KEYS.USER, {
    uid: auth?.currentUser?.uid || 'person-proyectostic',
    displayName: auth?.currentUser?.displayName || 'Alejandro Proyectos TIC',
    email: auth?.currentUser?.email || 'proyectostic.med@udea.edu.co',
    role: 'administrador',
    status: 'aprobado',
    createdAt: '',
    lastLogin: '',
  });
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'people', personId));
      try {
        await addDoc(collection(db, 'audit_logs'), {
          action: 'PERSONA_ELIMINADA',
          entityId: personId,
          entityType: 'persona',
          details: { id: personId },
          user: { uid: user.uid, name: user.displayName, email: user.email },
          timestamp: now,
        });
      } catch (e) {
        console.warn('Error guardando audit en Firestore:', e);
      }
    } catch (err) {
      console.error('Error eliminando persona en Firestore:', err);
    }
  }
  const current = load<Person[]>(STORAGE_KEYS.PEOPLE, initialPeople);
  const target = current.find((p) => p.id === personId);
  const filtered = current.filter((p) => p.id !== personId);
  save(STORAGE_KEYS.PEOPLE, filtered);
  peopleListeners.forEach((fn) => fn(filtered));

  if (target) {
    addAuditLog({
      action: 'PERSONA_ELIMINADA',
      entityId: personId,
      entityType: 'persona',
      details: { name: `${target.firstName} ${target.lastName}`.trim(), email: target.email, roleTitle: target.roleTitle },
      user: { uid: user.uid, name: user.displayName, email: user.email },
    });
  }
}

// Operaciones de Mutación (Grupos de Personas) en la Nube y Local
export async function saveGroup(
  group: Omit<PeopleGroup, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<string> {
  const now = new Date().toISOString();
  let id = group.id;

  if (isFirebaseConfigured && db) {
    try {
      if (!id) {
        id = `grp-${Date.now()}`;
      }
      const groupData: PeopleGroup = {
        ...group,
        id,
        createdAt: group.createdAt || now,
      };
      await setDoc(doc(db, 'groups', id), groupData, { merge: true });
      return id;
    } catch (err) {
      console.error('Error guardando grupo en Firestore:', err);
    }
  }

  const current = load<PeopleGroup[]>(STORAGE_KEYS.GROUPS, initialGroups);
  if (id) {
    const idx = current.findIndex((g) => g.id === id);
    if (idx >= 0) current[idx] = { ...current[idx], ...group, id };
    else current.push({ ...group, id, createdAt: now });
  } else {
    id = `grp-${Date.now()}`;
    current.push({ ...group, id, createdAt: now });
  }

  save(STORAGE_KEYS.GROUPS, current);
  groupListeners.forEach((fn) => fn(current));
  return id;
}

export async function deleteGroup(groupId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'groups', groupId));
    } catch (err) {
      console.error('Error eliminando grupo en Firestore:', err);
    }
  }
  const current = load<PeopleGroup[]>(STORAGE_KEYS.GROUPS, initialGroups);
  const filtered = current.filter((g) => g.id !== groupId);
  save(STORAGE_KEYS.GROUPS, filtered);
  groupListeners.forEach((fn) => fn(filtered));
}

// Operaciones de Mutación (Mis Pendientes y Recordatorios Personales)
export async function savePersonalTask(
  task: Omit<PersonalTask, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<string> {
  const now = new Date().toISOString();
  let id = task.id;

  if (isFirebaseConfigured && db) {
    try {
      if (!id) {
        id = `task-${Date.now()}`;
      }
      const taskData: PersonalTask = {
        ...task,
        id,
        createdAt: task.createdAt || now,
      };
      await setDoc(doc(db, 'personal_tasks', id), taskData, { merge: true });
      return id;
    } catch (err) {
      console.error('Error guardando tarea personal en Firestore:', err);
    }
  }

  const current = load<PersonalTask[]>(STORAGE_KEYS.PERSONAL_TASKS, initialPersonalTasks);
  if (id) {
    const idx = current.findIndex((t) => t.id === id);
    if (idx >= 0) current[idx] = { ...current[idx], ...task, id, createdAt: current[idx].createdAt || now };
    else current.push({ ...task, id, createdAt: now });
  } else {
    id = `task-${Date.now()}`;
    current.push({ ...task, id, createdAt: now });
  }

  save(STORAGE_KEYS.PERSONAL_TASKS, current);
  personalTaskListeners.forEach((fn) => fn(current));
  return id;
}

export async function togglePersonalTask(
  taskId: string,
  targetStatus?: 'pendiente' | 'completada'
): Promise<void> {
  const now = new Date().toISOString();
  const current = load<PersonalTask[]>(STORAGE_KEYS.PERSONAL_TASKS, initialPersonalTasks);
  const target = current.find((t) => t.id === taskId);

  let nextStatus: 'pendiente' | 'completada';
  if (targetStatus) {
    nextStatus = targetStatus;
  } else if (target) {
    nextStatus = target.status === 'completada' ? 'pendiente' : 'completada';
  } else {
    nextStatus = 'completada';
  }

  if (target) {
    target.status = nextStatus;
    target.completedAt = nextStatus === 'completada' ? now : undefined;
    save(STORAGE_KEYS.PERSONAL_TASKS, current);
  }
  // Notificar a todos los listeners inmediatamente
  personalTaskListeners.forEach((fn) => fn(current));

  if (isFirebaseConfigured && db) {
    try {
      const taskRef = doc(db, 'personal_tasks', taskId);
      await updateDoc(taskRef, {
        status: nextStatus,
        completedAt: nextStatus === 'completada' ? now : null,
      });
    } catch (err) {
      console.error('Error alternando tarea en Firestore:', err);
    }
  }
}

export async function deletePersonalTask(taskId: string): Promise<void> {
  const current = load<PersonalTask[]>(STORAGE_KEYS.PERSONAL_TASKS, initialPersonalTasks);
  const filtered = current.filter((t) => t.id !== taskId);
  save(STORAGE_KEYS.PERSONAL_TASKS, filtered);
  // Notificar a todos los listeners inmediatamente
  personalTaskListeners.forEach((fn) => fn(filtered));

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'personal_tasks', taskId));
    } catch (err) {
      console.error('Error eliminando tarea en Firestore:', err);
    }
  }
}

// Operaciones de Solicitud de Participación y Confirmación por Token
export async function createParticipationRequest(
  req: Omit<ParticipationRequest, 'id' | 'token' | 'createdAt'>,
  sendEmail: boolean = false
): Promise<ParticipationRequest> {
  const now = new Date().toISOString();
  const id = `req-${Date.now()}`;
  const token = `tk_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
  const newReq: ParticipationRequest = {
    ...req,
    id,
    token,
    createdAt: now,
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'participation_requests', id), newReq);
      try {
        // Notificación para Administradores
        await addDoc(collection(db, 'notifications'), {
          userId: 'ALL_ADMINS',
          recipientEmail: 'ALL_ADMINS',
          type: 'solicitud',
          title: 'Solicitud de Participación Enviada',
          message: `Se ha convocado a ${req.personName} para el evento "${req.eventTitle}".`,
          eventId: req.eventId,
          read: false,
          createdAt: now,
        });

        // Notificación exclusiva para la persona invitada (aparece en su panel al iniciar sesión)
        if (req.personEmail) {
          const cleanEmail = req.personEmail.toLowerCase().trim();
          await addDoc(collection(db, 'notifications'), {
            userId: cleanEmail,
            recipientEmail: cleanEmail,
            type: 'solicitud',
            title: 'Convocatoria a Evento Institucional',
            message: `Has sido invitado/a a participar en el evento "${req.eventTitle}" (${req.eventDate} a las ${req.eventStartTime}).`,
            eventId: req.eventId,
            read: false,
            createdAt: now,
          });
        }
      } catch (e) {
        console.warn('Error guardando notif en Firestore:', e);
      }

      // Enviar correo automático mediante Brevo en segundo plano SOLO SI sendEmail es true
      if (sendEmail) {
        sendParticipationEmail(newReq).catch((err) => {
          console.warn('Envío de correo automático Brevo en segundo plano:', err);
        });
      }

      return newReq;
    } catch (err) {
      console.error('Error guardando solicitud en Firestore:', err);
    }
  }

  const current = load<ParticipationRequest[]>(STORAGE_KEYS.REQUESTS, initialRequests);
  current.unshift(newReq);
  save(STORAGE_KEYS.REQUESTS, current);
  requestListeners.forEach((fn) => fn(current));

  addNotification({
    userId: 'ALL_ADMINS',
    recipientEmail: 'ALL_ADMINS',
    type: 'solicitud',
    title: 'Solicitud de Participación Enviada',
    message: `Se ha convocado a ${req.personName} para el evento "${req.eventTitle}".`,
    eventId: req.eventId,
  });

  if (req.personEmail) {
    const cleanEmail = req.personEmail.toLowerCase().trim();
    addNotification({
      userId: cleanEmail,
      recipientEmail: cleanEmail,
      type: 'solicitud',
      title: 'Convocatoria a Evento Institucional',
      message: `Has sido invitado/a a participar en el evento "${req.eventTitle}" (${req.eventDate} a las ${req.eventStartTime}).`,
      eventId: req.eventId,
    });
  }

  // Enviar correo automático mediante Brevo en segundo plano SOLO SI sendEmail es true
  if (sendEmail) {
    sendParticipationEmail(newReq).catch((err) => {
      console.warn('Envío de correo automático Brevo en segundo plano:', err);
    });
  }

  return newReq;
}

export async function respondToParticipationRequest(
  token: string,
  newStatus: 'confirmada' | 'rechazada',
  notes?: string
): Promise<ParticipationRequest | null> {
  const now = new Date().toISOString();

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'participation_requests'), where('token', '==', token));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const reqDoc = snapshot.docs[0];
        const reqData = reqDoc.data() as ParticipationRequest;
        await updateDoc(doc(db, 'participation_requests', reqDoc.id), {
          status: newStatus,
          respondedAt: now,
          ...(notes ? { responseNotes: notes } : {}),
        });

        // Notificación en Firestore
        try {
          await addDoc(collection(db, 'notifications'), {
            userId: 'ALL_ADMINS',
            type: newStatus === 'confirmada' ? 'confirmacion' : 'rechazo',
            title: newStatus === 'confirmada' ? 'Participación Confirmada' : 'Participación Rechazada',
            message: `${reqData.personName} ha ${newStatus === 'confirmada' ? 'CONFIRMADO' : 'RECHAZADO'} su participación en el evento "${reqData.eventTitle}".`,
            eventId: reqData.eventId,
            read: false,
            createdAt: now,
          });

          if (reqData.personEmail) {
            await addDoc(collection(db, 'notifications'), {
              userId: reqData.personEmail.toLowerCase().trim(),
              type: newStatus === 'confirmada' ? 'confirmacion' : 'rechazo',
              title: newStatus === 'confirmada' ? 'Asistencia Confirmada' : 'Invitación Declinada',
              message: `Tu respuesta (${newStatus === 'confirmada' ? 'Confirmada' : 'Rechazada'}) para el evento "${reqData.eventTitle}" fue registrada con éxito.`,
              eventId: reqData.eventId,
              read: false,
              createdAt: now,
            });
          }
        } catch (e) {
          console.warn('Error guardando notificación en Firestore:', e);
        }

        // Si confirmó, actualizar estado del evento en Firestore
        if (newStatus === 'confirmada') {
          try {
            await updateDoc(doc(db, 'events', reqData.eventId), {
              status: 'confirmado',
              updatedAt: now,
            });
          } catch (e) {
            console.warn('Error confirmando evento en Firestore:', e);
          }
        }

        return {
          ...reqData,
          id: reqDoc.id,
          status: newStatus,
          respondedAt: now,
          ...(notes ? { responseNotes: notes } : {}),
        };
      }
    } catch (err) {
      console.error('Error respondiendo solicitud en Firestore:', err);
    }
  }

  // Fallback Local Storage
  const current = load<ParticipationRequest[]>(STORAGE_KEYS.REQUESTS, initialRequests);
  const target = current.find((r) => r.token === token);
  if (!target) return null;

  target.status = newStatus;
  target.respondedAt = now;
  if (notes) target.responseNotes = notes;

  save(STORAGE_KEYS.REQUESTS, current);
  requestListeners.forEach((fn) => fn(current));

  addNotification({
    userId: 'ALL_ADMINS',
    type: newStatus === 'confirmada' ? 'confirmacion' : 'rechazo',
    title: newStatus === 'confirmada' ? 'Participación Confirmada' : 'Participación Rechazada',
    message: `${target.personName} ha ${newStatus === 'confirmada' ? 'CONFIRMADO' : 'RECHAZADO'} su participación en el evento "${target.eventTitle}".`,
    eventId: target.eventId,
  });

  if (target.personEmail) {
    addNotification({
      userId: target.personEmail.toLowerCase().trim(),
      type: newStatus === 'confirmada' ? 'confirmacion' : 'rechazo',
      title: newStatus === 'confirmada' ? 'Asistencia Confirmada' : 'Invitación Declinada',
      message: `Tu respuesta (${newStatus === 'confirmada' ? 'Confirmada' : 'Rechazada'}) para el evento "${target.eventTitle}" fue registrada con éxito.`,
      eventId: target.eventId,
    });
  }

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

// Notificaciones con persistencia Firestore y Local
export async function addNotification(notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): Promise<void> {
  const id = `notif-${Date.now()}`;
  const now = new Date().toISOString();
  const newNotif: AppNotification = {
    ...notif,
    id,
    read: false,
    createdAt: now,
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'notifications', id), newNotif);
    } catch (e) {
      console.warn('Error guardando notificación en Firestore:', e);
    }
  }

  const current = load<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  current.unshift(newNotif);
  save(STORAGE_KEYS.NOTIFICATIONS, current);
  notifListeners.forEach((fn) => fn(current));
}

export async function markNotificationAsRead(notifId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (e) {
      console.warn('Error marcando notif como leída en Firestore:', e);
    }
  }
  const current = load<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  const item = current.find((n) => n.id === notifId);
  if (item) {
    item.read = true;
    save(STORAGE_KEYS.NOTIFICATIONS, current);
    notifListeners.forEach((fn) => fn(current));
  }
}

export async function markAllNotificationsAsRead(targetIds?: string[]): Promise<void> {
  if (isFirebaseConfigured && db) {
    const firestore = db;
    try {
      if (targetIds && targetIds.length > 0) {
        await Promise.all(
          targetIds.map((id) =>
            updateDoc(doc(firestore, 'notifications', id), { read: true }).catch(() => {})
          )
        );
      } else {
        const snap = await getDocs(collection(firestore, 'notifications'));
        await Promise.all(
          snap.docs.map((d) => updateDoc(doc(firestore, 'notifications', d.id), { read: true }).catch(() => {}))
        );
      }
    } catch (e) {
      console.warn('Error marcando todas las notificaciones como leídas en Firestore:', e);
    }
  }
  const current = load<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, initialNotifications);
  current.forEach((n) => {
    if (!targetIds || targetIds.includes(n.id)) {
      n.read = true;
    }
  });
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

