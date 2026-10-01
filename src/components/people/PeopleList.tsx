import React, { useState } from 'react';
import { Person, EventEntity } from '../../types';
import { Users, Plus, Mail, Briefcase, Building, Edit, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PeopleListProps {
  people: Person[];
  events: EventEntity[];
  onOpenCreatePerson: () => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (personId: string) => Promise<void>;
  onSelectEvent: (eventId: string) => void;
}

export const PeopleList: React.FC<PeopleListProps> = ({
  people,
  events,
  onOpenCreatePerson,
  onEditPerson,
  onDeletePerson,
  onSelectEvent,
}) => {
  const { isAdmin } = useAuth();
  const [query, setQuery] = useState('');

  const filtered = people.filter((p) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Directorio de Personas y Colaboradores
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de integrantes disponibles para asignación y convocatoria a eventos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre, área..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />

          {isAdmin && (
            <button
              onClick={onOpenCreatePerson}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Persona</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid de Personas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((person) => {
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
    </div>
  );
};
