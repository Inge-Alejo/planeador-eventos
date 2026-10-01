import React, { useState, useEffect } from 'react';
import { X, UserPlus, Mail, Briefcase, Building } from 'lucide-react';
import { Person } from '../../types';

interface PersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (person: Omit<Person, 'id'> & { id?: string }) => Promise<void>;
  personToEdit?: Person | null;
}

export const PersonModal: React.FC<PersonModalProps> = ({
  isOpen,
  onClose,
  onSave,
  personToEdit,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<'activo' | 'inactivo'>('activo');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (personToEdit) {
      setFirstName(personToEdit.firstName);
      setLastName(personToEdit.lastName);
      setEmail(personToEdit.email);
      setRoleTitle(personToEdit.roleTitle);
      setDepartment(personToEdit.department);
      setStatus(personToEdit.status);
      setNotes(personToEdit.notes || '');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setRoleTitle('');
      setDepartment('');
      setStatus('activo');
      setNotes('');
    }
  }, [personToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      return alert('Por favor ingresa nombre, apellido y correo electrónico.');
    }

    setIsSubmitting(true);
    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        roleTitle: roleTitle.trim(),
        department: department.trim(),
        status,
        notes: notes.trim(),
        createdAt: personToEdit?.createdAt || new Date().toISOString(),
        ...(personToEdit ? { id: personToEdit.id } : {}),
      });
      onClose();
    } catch (err: any) {
      alert('Error guardando persona: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {personToEdit ? 'Editar Información de la Persona' : 'Registrar Nueva Persona'}
              </h2>
              <p className="text-xs text-slate-500">Agrega integrantes para convocatorias y eventos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre *</label>
              <input
                type="text"
                required
                placeholder="ej: Alejandro"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Apellido *</label>
              <input
                type="text"
                required
                placeholder="ej: Gómez"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico *</label>
            <input
              type="email"
              required
              placeholder="ej: nombre@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Rol</label>
              <input
                type="text"
                placeholder="ej: Ingeniero de Grabación"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Área / Dependencia</label>
              <input
                type="text"
                placeholder="ej: Comunicaciones"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98]"
            >
              {isSubmitting ? 'Guardando...' : personToEdit ? 'Actualizar' : 'Guardar Persona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
