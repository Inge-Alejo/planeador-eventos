import React, { useState, useMemo } from 'react';
import { useEventFlow } from './hooks/useEventFlow';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { DashboardMain } from './components/dashboard/DashboardMain';
import { CalendarView } from './components/calendar/CalendarView';
import { EventPlanningList } from './components/events/EventPlanningList';
import { SpaceList } from './components/spaces/SpaceList';
import { PeopleList } from './components/people/PeopleList';
import { RequestsList } from './components/requests/RequestsList';
import { ReportsView } from './components/reports/ReportsView';
import { AuditView } from './components/audit/AuditView';
import { EventModal } from './components/events/EventModal';
import { EventDetailDrawer } from './components/events/EventDetailDrawer';
import { SpaceModal } from './components/spaces/SpaceModal';
import { PersonModal } from './components/people/PersonModal';
import { SimulatedEmailModal } from './components/requests/SimulatedEmailModal';
import { UserManagementView } from './components/users/UserManagementView';
import { EventEntity, Space, Person, ParticipationRequest } from './types';
import confetti from 'canvas-confetti';

const MainApp: React.FC = () => {
  const { user, canEdit, isAdmin } = useAuth();
  const {
    events,
    spaces,
    people,
    requests,
    notifications,
    auditLogs,
    users,
    pendingUsersCount,
    metrics,
    allActiveConflicts,
    saveEvent,
    deleteEvent,
    saveSpace,
    savePerson,
    createParticipationRequest,
    respondToParticipationRequest,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    updateUserRoleAndStatus,
  } = useEventFlow();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeTabFilter, setActiveTabFilter] = useState<any>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Estados de Modales y Drawers
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventEntity | null>(null);
  const [eventPreset, setEventPreset] = useState<{ date?: string; time?: string; spaceId?: string } | undefined>(undefined);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const [isSpaceModalOpen, setIsSpaceModalOpen] = useState(false);
  const [spaceToEdit, setSpaceToEdit] = useState<Space | null>(null);

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);

  const [simulatedEmailRequest, setSimulatedEmailRequest] = useState<ParticipationRequest | null>(null);

  // Evento actualmente seleccionado para el drawer
  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Manejador para abrir modal de creación de evento
  const handleOpenCreateEvent = (preset?: { date?: string; time?: string; spaceId?: string }) => {
    if (!canEdit) {
      if (!user) {
        alert('Modo Consulta Pública:\n\nCualquier persona puede ver la programación del calendario. Para crear o editar eventos, inicia sesión con Google y solicita autorización al Administrador.');
      } else {
        alert('Cuenta en Modo Solo Lectura:\n\nTu solicitud de acceso está pendiente de aprobación por el Administrador. Solo usuarios aprobados como Gestores o Administradores pueden registrar eventos.');
      }
      return;
    }
    setEventToEdit(null);
    setEventPreset(preset);
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (event: EventEntity) => {
    if (!canEdit) {
      alert('No tienes permisos para modificar eventos existentes.');
      return;
    }
    setEventToEdit(event);
    setEventPreset(undefined);
    setIsEventModalOpen(true);
  };

  // Guardar evento y generar solicitudes por correo si corresponde
  const handleSaveEvent = async (
    eventPayload: Omit<EventEntity, 'id'> & { id?: string },
    peopleToInvite: string[] = []
  ) => {
    const savedId = await saveEvent(eventPayload);

    // Enviar solicitudes de participación
    if (peopleToInvite.length > 0) {
      for (const pid of peopleToInvite) {
        const person = people.find((p) => p.id === pid);
        if (person) {
          // Verificar si ya existe solicitud
          const alreadyRequested = requests.some(
            (r) => r.eventId === savedId && r.personId === pid
          );
          if (!alreadyRequested) {
            await createParticipationRequest({
              eventId: savedId,
              eventTitle: eventPayload.title,
              eventDate: eventPayload.date,
              eventStartTime: eventPayload.startTime,
              eventEndTime: eventPayload.endTime,
              spaceName: eventPayload.spaceName,
              personId: person.id,
              personName: `${person.firstName} ${person.lastName}`,
              personEmail: person.email,
              status: 'pendiente',
            });
          }
        }
      }
    }

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const handleNavigateToTab = (tab: ActiveTab, filter?: any) => {
    setActiveTab(tab);
    setActiveTabFilter(filter);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar de navegación */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setActiveTabFilter(undefined);
        }}
        pendingRequestsCount={metrics.pendingRequestsCount}
        activeConflictsCount={metrics.activeConflictsCount}
        pendingUsersCount={pendingUsersCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Contenedor Principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Barra Superior Header */}
        <Header
          onOpenNewEvent={() => handleOpenCreateEvent()}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          notifications={notifications}
          onMarkNotificationRead={markNotificationAsRead}
          onMarkAllNotificationsRead={markAllNotificationsAsRead}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onSelectEventFromNotification={(evtId) => setSelectedEventId(evtId)}
        />

        {/* Área de Trabajo con Scroll */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'dashboard' && (
            <DashboardMain
              metrics={metrics}
              conflicts={allActiveConflicts}
              spaces={spaces}
              events={events}
              people={people}
              auditLogs={auditLogs}
              onNavigateToTab={handleNavigateToTab}
              onSelectEvent={(evtId) => setSelectedEventId(evtId)}
              onOpenCreateEvent={handleOpenCreateEvent}
            />
          )}

          {activeTab === 'calendario' && (
            <CalendarView
              events={events}
              spaces={spaces}
              people={people}
              onSelectEvent={(evtId) => setSelectedEventId(evtId)}
              onOpenCreateEvent={handleOpenCreateEvent}
            />
          )}

          {activeTab === 'eventos' && (
            <EventPlanningList
              events={events}
              spaces={spaces}
              people={people}
              onOpenCreateEvent={() => handleOpenCreateEvent()}
              onSelectEvent={(evtId) => setSelectedEventId(evtId)}
              onEditEvent={handleEditEvent}
              onDeleteEvent={deleteEvent}
              initialFilter={activeTabFilter?.status}
            />
          )}

          {activeTab === 'espacios' && (
            <SpaceList
              spaces={spaces}
              events={events}
              onOpenCreateSpace={() => {
                setSpaceToEdit(null);
                setIsSpaceModalOpen(true);
              }}
              onEditSpace={(sp) => {
                setSpaceToEdit(sp);
                setIsSpaceModalOpen(true);
              }}
              onSelectEvent={(evtId) => setSelectedEventId(evtId)}
              onReserveSpace={(spaceId) => handleOpenCreateEvent({ spaceId })}
            />
          )}

          {activeTab === 'personas' && (
            <PeopleList
              people={people}
              events={events}
              onOpenCreatePerson={() => {
                setPersonToEdit(null);
                setIsPersonModalOpen(true);
              }}
              onEditPerson={(p) => {
                setPersonToEdit(p);
                setIsPersonModalOpen(true);
              }}
              onSelectEvent={(evtId) => setSelectedEventId(evtId)}
            />
          )}

          {activeTab === 'solicitudes' && (
            <RequestsList
              requests={requests}
              onOpenEmailModal={(req) => setSimulatedEmailRequest(req)}
              onSelectEvent={(evtId) => setSelectedEventId(evtId)}
            />
          )}

          {activeTab === 'reportes' && (
            <ReportsView
              events={events}
              spaces={spaces}
              people={people}
              auditLogs={auditLogs}
            />
          )}

          {activeTab === 'auditoria' && <AuditView auditLogs={auditLogs} />}

          {activeTab === 'usuarios' && (
            <UserManagementView
              users={users}
              onUpdateUser={updateUserRoleAndStatus}
              currentUserUid={user?.uid}
            />
          )}
        </main>
      </div>

      {/* Modal Crear / Editar Evento */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
        eventToEdit={eventToEdit}
        spaces={spaces}
        people={people}
        existingEvents={events}
        initialPreset={eventPreset}
      />

      {/* Drawer Detalle de Evento */}
      <EventDetailDrawer
        event={selectedEvent}
        onClose={() => setSelectedEventId(null)}
        onEdit={(evt) => {
          setSelectedEventId(null);
          handleEditEvent(evt);
        }}
        onDelete={deleteEvent}
        spaces={spaces}
        people={people}
        requests={requests}
        auditLogs={auditLogs}
        onOpenSimulatedEmail={(req) => setSimulatedEmailRequest(req)}
      />

      {/* Modal Crear / Editar Espacio */}
      <SpaceModal
        isOpen={isSpaceModalOpen}
        onClose={() => setIsSpaceModalOpen(false)}
        onSave={async (sp) => {
          await saveSpace(sp);
        }}
        spaceToEdit={spaceToEdit}
      />

      {/* Modal Crear / Editar Persona */}
      <PersonModal
        isOpen={isPersonModalOpen}
        onClose={() => setIsPersonModalOpen(false)}
        onSave={async (p) => {
          await savePerson(p);
        }}
        personToEdit={personToEdit}
      />

      {/* Modal de Correo Simulado y Enlace de Confirmación */}
      <SimulatedEmailModal
        request={simulatedEmailRequest}
        onClose={() => setSimulatedEmailRequest(null)}
        onRespond={async (tok, st, n) => {
          await respondToParticipationRequest(tok, st, n);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
