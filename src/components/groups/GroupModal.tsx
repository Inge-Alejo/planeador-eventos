import React, { useState, useEffect } from 'react';
import { PeopleGroup, Person } from '../../types';
import { X, Users, Check, Search, ShieldCheck } from 'lucide-react';
import { useDismissable } from '../../hooks/useDismissable';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (group: Omit<PeopleGroup, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  groupToEdit: PeopleGroup | null;
  people: Person[];
  isAdmin: boolean;
}

const PRESET_COLORS = [
  '#059669', // Emerald
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#4f46e5', // Indigo
  '#ca8a04', // Amber
];

export const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
  groupToEdit,
  people,
  isAdmin,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#059669');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (groupToEdit) {
      setName(groupToEdit.name);
      setDescription(groupToEdit.description || '');
      setColor(groupToEdit.color || '#059669');
      setSelectedMemberIds(groupToEdit.memberIds || []);
    } else {
      setName('');
      setDescription('');
      setColor('#059669');
      setSelectedMemberIds([]);
    }
    setSearchTerm('');
    setError(null);
  }, [groupToEdit, isOpen]);

  const { contentRef, handleBackdropClick } = useDismissable({
    onDismiss: onClose,
    isOpen,
  });

  if (!isOpen) return null;

  const filteredPeople = people.filter((p) => {
    if (p.status !== 'activo') return false;
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const q = searchTerm.toLowerCase();
    return (
      fullName.includes(q) ||
      p.roleTitle.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q)
    );
  });

  const toggleMember = (personId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(personId) ? prev.filter((id) => id !== personId) : [...prev, personId]
    );
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredPeople.map((p) => p.id);
    const areAllSelected = allFilteredIds.every((id) => selectedMemberIds.includes(id));
    if (areAllSelected) {
      setSelectedMemberIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedMemberIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setError('Solo el Superadministrador puede gestionar grupos.');
      return;
    }
    if (!name.trim()) {
      setError('El nombre del grupo es obligatorio.');
      return;
    }
    if (selectedMemberIds.length === 0) {
      setError('Debes seleccionar al menos un miembro para el grupo.');
      return;
    }

    await onSave({
      ...(groupToEdit ? { id: groupToEdit.id } : {}),
      name: name.trim(),
      description: description.trim(),
      color,
      memberIds: selectedMemberIds,
    });
    onClose();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-group-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: color }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-group-title" className="text-lg font-bold text-slate-800">
                {groupToEdit ? 'Editar Grupo de Personas' : 'Crear Nuevo Grupo'}
              </h2>
              <p className="text-xs text-slate-500">
                Organiza equipos de trabajo para agendamiento masivo instantáneo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nombre del Grupo o Equipo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Comité Curricular de Medicina, Equipo TIC, Jurados"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Descripción o Propósito
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve detalle sobre las funciones o miembros habituales..."
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700 resize-none"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Color Distintivo
            </label>
            <div className="flex items-center gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Members Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Integrantes del Grupo ({selectedMemberIds.length} seleccionados) *
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                {filteredPeople.every((p) => selectedMemberIds.includes(p.id))
                  ? 'Deseleccionar todos'
                  : 'Seleccionar todos'}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar colaboradores por nombre, cargo o departamento..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
            </div>

            {/* List */}
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto bg-slate-50/50">
              {filteredPeople.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No se encontraron colaboradores que coincidan con la búsqueda.
                </div>
              ) : (
                filteredPeople.map((person) => {
                  const isSelected = selectedMemberIds.includes(person.id);
                  return (
                    <div
                      key={person.id}
                      onClick={() => toggleMember(person.id)}
                      className={`flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-emerald-50/60' : 'hover:bg-slate-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {person.firstName} {person.lastName}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {person.roleTitle} • {person.department}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono pl-2 shrink-0">
                        {person.email}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {!isAdmin && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-700">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Modo lectura: Solo el Superadministrador puede guardar cambios.</span>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isAdmin}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm shadow-emerald-600/30 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {groupToEdit ? 'Guardar Cambios' : 'Crear Grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
