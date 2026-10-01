import React, { useState } from 'react';
import { Person, EventEntity, PeopleGroup } from '../../types';
import { Users, Plus, Mail, Building, Edit, Trash2, Layers, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PeopleListProps {
  people: Person[];
  groups?: PeopleGroup[];
  events: EventEntity[];
  onOpenCreatePerson: () => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (personId: string) => Promise<void>;
  onOpenCreateGroup?: () => void;
  onEditGroup?: (group: PeopleGroup) => void;
  onDeleteGroup?: (groupId: string) => Promise<void>;
  onSelectEvent: (eventId: string) => void;
}

export const PeopleList: React.FC<PeopleListProps> = ({
  people,
  groups = [],
  events,
  onOpenCreatePerson,
  onEditPerson,
  onDeletePerson,
  onOpenCreateGroup,
  onEditGroup,
  onDeleteGroup,
  onSelectEvent,
}) => {
  const { isAdmin } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'people' | 'groups'>('people');
  const [query, setQuery] = useState('');

  const filteredPeople = people.filter((p) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q)
    );
  });

  const filteredGroups = groups.filter((g) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      (g.description && g.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Cabecera con pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveSubTab('people')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'people'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Colaboradores ({people.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('groups')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'groups'
                  ? 'bg-white text-emerald-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Grupos y Equipos ({groups.length})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder={
              activeSubTab === 'people'
                ? 'Buscar por nombre, área...'
                : 'Buscar grupo o equipo...'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />

          {isAdmin && activeSubTab === 'people' && (
            <button
              onClick={onOpenCreatePerson}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Persona</span>
            </button>
          )}

          {isAdmin && activeSubTab === 'groups' && onOpenCreateGroup && (
            <button
              onClick={onOpenCreateGroup}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Grupo</span>
            </button>
          )}
        </div>
      </div>

      {/* Renderizado condicional según pestaña */}
      {activeSubTab === 'people' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map((person) => {
            // Eventos asignados a esta persona
            const assignedEvents = events.filter(
              (e) =>
                e.status !== 'cancelado' &&
                ((Array.isArray(e.peopleIds) && e.peopleIds.includes(person.id)) ||
                  e.responsibleId === person.id)
            );

            return (
              <div
                key={person.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 font-bold text-sm">
                        {person.firstName.charAt(0)}
                        {person.lastName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {person.firstName} {person.lastName}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{person.roleTitle}</p>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditPerson(person)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar información (Solo Superadmin)"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Estás seguro de eliminar a ${person.firstName} ${person.lastName} (${person.email})?\n\nEsta acción no se puede deshacer.`)) {
                              onDeletePerson(person.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Eliminar persona (Solo Superadmin)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px] truncate">{person.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{person.department || 'Sin área asignada'}</span>
                    </div>
                  </div>

                  {/* Eventos asignados */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Eventos Vinculados ({assignedEvents.length})
                    </span>

                    {assignedEvents.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">
                        Actualmente sin eventos asignados.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-28 overflow-y-auto">
                        {assignedEvents.slice(0, 3).map((evt) => (
                          <div
                            key={evt.id}
                            onClick={() => onSelectEvent(evt.id)}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/50 cursor-pointer text-xs transition-colors"
                          >
                            <span className="font-semibold text-slate-800 truncate pr-2">
                              {evt.title}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                              {evt.date}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid de Grupos y Equipos */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">No hay grupos registrados</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Crea comités o grupos de trabajo para convocar a todos sus miembros con un solo clic.
              </p>
              {isAdmin && onOpenCreateGroup && (
                <button
                  onClick={onOpenCreateGroup}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  + Crear Primer Grupo
                </button>
              )}
            </div>
          ) : (
            filteredGroups.map((group) => {
              // Obtener integrantes del grupo
              const members = people.filter((p) => group.memberIds.includes(p.id));

              return (
                <div
                  key={group.id}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden"
                >
                  {/* Top accent bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: group.color || '#059669' }}
                  />

                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-2xl text-white font-bold text-sm shadow-xs"
                          style={{ backgroundColor: group.color || '#059669' }}
                        >
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-tight">
                            {group.name}
                          </h3>
                          <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {group.memberIds.length} integrantes
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          {onEditGroup && (
                            <button
                              onClick={() => onEditGroup(group)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Editar grupo"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {onDeleteGroup && (
                            <button
                              onClick={() => {
                                if (window.confirm(`¿Estás seguro de eliminar el grupo "${group.name}"?`)) {
                                  onDeleteGroup(group.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Eliminar grupo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {group.description && (
                      <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                        {group.description}
                      </p>
                    )}

                    {/* Miembros del grupo */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Integrantes del Grupo ({members.length})
                      </span>

                      {members.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic">
                          Sin integrantes asignados actualmente.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs"
                            >
                              <div className="truncate">
                                <span className="font-semibold text-slate-800">
                                  {member.firstName} {member.lastName}
                                </span>
                                <span className="text-[11px] text-slate-500 block truncate">
                                  {member.roleTitle}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono shrink-0 pl-2">
                                {member.email}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
