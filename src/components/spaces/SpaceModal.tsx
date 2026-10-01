import React, { useState, useEffect } from 'react';
import { X, Building2, Layers, MapPin, Users, Sparkles } from 'lucide-react';
import { Space, SpaceType, SpaceStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useDismissable } from '../../hooks/useDismissable';

interface SpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (space: Omit<Space, 'id'> & { id?: string }) => Promise<void>;
  spaceToEdit?: Space | null;
}

export const SpaceModal: React.FC<SpaceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  spaceToEdit,
}) => {
  const { isAdmin } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState<SpaceType>('auditorio');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [equipmentInput, setEquipmentInput] = useState('');
  const [status, setStatus] = useState<SpaceStatus>('activo');
  const [color, setColor] = useState('#4F46E5');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (spaceToEdit) {
      setName(spaceToEdit.name);
      setType(spaceToEdit.type);
      setLocation(spaceToEdit.location);
      setCapacity(spaceToEdit.capacity);
      setEquipmentInput(spaceToEdit.equipment?.join(', ') || '');
      setStatus(spaceToEdit.status);
      setColor(spaceToEdit.color || '#4F46E5');
      setNotes(spaceToEdit.notes || '');
    } else {
      setName('');
      setType('auditorio');
      setLocation('');
      setCapacity(50);
      setEquipmentInput('');
      setStatus('activo');
      setColor('#4F46E5');
      setNotes('');
    }
  }, [spaceToEdit, isOpen]);

  const { contentRef, handleBackdropClick } = useDismissable({
    onDismiss: onClose,
    isOpen,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      return alert('Acceso restringido:\n\nSolo el perfil Superadministrador puede crear o editar espacios físicos.');
    }
    if (!name.trim()) return alert('Por favor ingresa el nombre del espacio.');

    setIsSubmitting(true);
    try {
      const equipment = equipmentInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await onSave({
        name: name.trim(),
        type,
        location: location.trim(),
        capacity: Number(capacity) || 0,
        equipment,
        status,
        color,
        notes: notes.trim(),
        createdAt: spaceToEdit?.createdAt || new Date().toISOString(),
        ...(spaceToEdit ? { id: spaceToEdit.id } : {}),
      });
      onClose();
    } catch (err: any) {
      alert('Error guardando espacio: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-space-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl cursor-default"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-space-title" className="text-base font-bold text-slate-900">
                {spaceToEdit ? 'Editar Espacio Físico' : 'Nuevo Espacio Físico'}
              </h2>
              <p className="text-xs text-slate-500">Configura capacidad y especificaciones técnicas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nombre del Espacio *</label>
            <input
              type="text"
              required
              placeholder="ej: Auditorio Mayor, Estudio Audiovisual 1..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Espacio</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SpaceType)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 capitalize"
              >
                <option value="auditorio">Auditorio</option>
                <option value="estudio">Estudio Audiovisual</option>
                <option value="sala_reuniones">Sala de Reuniones</option>
                <option value="laboratorio">Laboratorio</option>
                <option value="aula">Aula</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Capacidad Máxima</label>
              <input
                type="number"
                min="1"
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ubicación</label>
              <input
                type="text"
                placeholder="ej: Bloque 2 - Piso 3"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Color Distintivo</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-12 rounded-xl border border-slate-200 p-1 cursor-pointer bg-white"
                />
                <span className="text-xs font-mono text-slate-600">{color}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Equipamiento (Separado por comas)
            </label>
            <input
              type="text"
              placeholder="Pantalla LED 4K, Microfonía, Streaming HD..."
              value={equipmentInput}
              onChange={(e) => setEquipmentInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
            />
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
              {isSubmitting ? 'Guardando...' : spaceToEdit ? 'Actualizar' : 'Guardar Espacio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
