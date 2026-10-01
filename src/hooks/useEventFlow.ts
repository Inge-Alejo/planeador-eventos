// Hook central de sincronización en tiempo real para EventFlow
import { useState, useEffect, useMemo } from 'react';
import {
  EventEntity,
  Space,
  Person,
  ParticipationRequest,
  AppNotification,
  AuditLog,
  DashboardMetrics,
  ConflictItem,
} from '../types';
import {
  initializeSeedData,
  subscribeToEvents,
  subscribeToSpaces,
  subscribeToPeople,
  subscribeToRequests,
  subscribeToNotifications,
  subscribeToAudit,
  saveEvent,
  deleteEvent,
  saveSpace,
  savePerson,
  createParticipationRequest,
  respondToParticipationRequest,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/store';
import { detectConflicts } from '../services/conflictEngine';
import { getBogotaToday, getBogotaCurrentTime, timeStringToMinutes } from '../lib/timezone';

export function useEventFlow() {
  const [events, setEvents] = useState<EventEntity[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [requests, setRequests] = useState<ParticipationRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Inicializar y subscribirse en tiempo real
  useEffect(() => {
    initializeSeedData();

    const unsubEvents = subscribeToEvents(setEvents);
    const unsubSpaces = subscribeToSpaces(setSpaces);
    const unsubPeople = subscribeToPeople(setPeople);
    const unsubRequests = subscribeToRequests(setRequests);
    const unsubNotifs = subscribeToNotifications(setNotifications);
    const unsubAudit = subscribeToAudit(setAuditLogs);

    setLoading(false);

    return () => {
      unsubEvents();
      unsubSpaces();
      unsubPeople();
      unsubRequests();
      unsubNotifs();
      unsubAudit();
    };
  }, []);

  // Calcular métricas del Dashboard en vivo
  const metrics: DashboardMetrics = useMemo(() => {
    const today = getBogotaToday();
    const nowTime = getBogotaCurrentTime();
    const nowMinutes = timeStringToMinutes(nowTime);

    const activeEvents = events.filter((e) => e.status !== 'cancelado');
    const todayEvents = activeEvents.filter((e) => e.date === today);

    // Calcular eventos en curso ahora mismo para saber espacios ocupados
    const currentEvents = todayEvents.filter((e) => {
      const start = timeStringToMinutes(e.startTime);
      const end = timeStringToMinutes(e.endTime);
      return nowMinutes >= start && nowMinutes <= end;
    });

    const occupiedSpaceIds = new Set(currentEvents.map((e) => e.spaceId));
    const activeSpaces = spaces.filter((s) => s.status === 'activo');

    // Calcular total de conflictos activos en el sistema
    let totalConflicts = 0;
    activeEvents.forEach((evt) => {
      const check = detectConflicts({
        eventId: evt.id,
        date: evt.date,
        startTime: evt.startTime,
        endTime: evt.endTime,
        spaceId: evt.spaceId,
        peopleIds: evt.peopleIds || [],
        attendeesCount: evt.attendeesCount,
        spaces,
        people,
        existingEvents: activeEvents,
      });
      if (check.hasBlockingConflicts || check.hasWarnings) {
        totalConflicts += check.conflicts.length;
      }
    });

    // Como cada conflicto es bidireccional, dividimos por 2 para no duplicar conteo
    const normalizedConflicts = Math.ceil(totalConflicts / 2);

    return {
      totalEventsScheduled: activeEvents.length,
      eventsToday: todayEvents.length,
      eventsThisWeek: activeEvents.length, // Dinámico
      eventsThisMonth: activeEvents.length,
      eventsPendingConfirmation: activeEvents.filter((e) => e.status === 'pendiente_confirmacion').length,
      eventsConfirmed: activeEvents.filter((e) => e.status === 'confirmado').length,
      eventsCancelled: events.filter((e) => e.status === 'cancelado').length,
      activeConflictsCount: normalizedConflicts,
      occupiedSpacesNow: occupiedSpaceIds.size,
      availableSpacesNow: Math.max(0, activeSpaces.length - occupiedSpaceIds.size),
      pendingRequestsCount: requests.filter((r) => r.status === 'pendiente').length,
      peoplePendingConfirmation: requests.filter((r) => r.status === 'pendiente').length,
    };
  }, [events, spaces, people, requests]);

  // Lista de todos los conflictos activos detallados para el widget
  const allActiveConflicts = useMemo(() => {
    const list: ConflictItem[] = [];
    const activeEvents = events.filter((e) => e.status !== 'cancelado');
    const seenPairs = new Set<string>();

    activeEvents.forEach((evt) => {
      const check = detectConflicts({
        eventId: evt.id,
        date: evt.date,
        startTime: evt.startTime,
        endTime: evt.endTime,
        spaceId: evt.spaceId,
        peopleIds: evt.peopleIds || [],
        attendeesCount: evt.attendeesCount,
        spaces,
        people,
        existingEvents: activeEvents,
      });

      check.conflicts.forEach((c) => {
        const pairKey = [evt.id, c.conflictingEventId].sort().join('_');
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          list.push(c);
        }
      });
    });

    return list;
  }, [events, spaces, people]);

  return {
    events,
    spaces,
    people,
    requests,
    notifications,
    auditLogs,
    metrics,
    allActiveConflicts,
    loading,
    saveEvent,
    deleteEvent,
    saveSpace,
    savePerson,
    createParticipationRequest,
    respondToParticipationRequest,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  };
}
