import React, { useState } from 'react';
import { X, Mail, CheckCircle2, XCircle, Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';
import { ParticipationRequest } from '../../types';
import { formatFriendlyDate, format12Hour } from '../../lib/timezone';
import confetti from 'canvas-confetti';

interface SimulatedEmailModalProps {
  request: ParticipationRequest | null;
  onClose: () => void;
  onRespond: (token: string, newStatus: 'confirmada' | 'rechazada', notes?: string) => Promise<void>;
}

export const SimulatedEmailModal: React.FC<SimulatedEmailModalProps> = ({
  request,
  onClose,
  onRespond,
}) => {
  const [responseNotes, setResponseNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!request) return null;

  const handleAction = async (status: 'confirmada' | 'rechazada') => {
    setIsProcessing(true);
    try {
      await onRespond(request.token, status, responseNotes);
      if (status === 'confirmada') {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      onClose();
    } catch (err: any) {
      alert('Error al responder: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera del Cliente de Correo Simulado */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-100/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">
                Notificación por Correo Electrónico
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Para: {request.personEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Correo (Plantilla HTML Empresarial) */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-indigo-600 tracking-tight">
                EventFlow Notifications
              </span>
              <span className="text-[10px] text-slate-400">Hace unos momentos</span>
            </div>

            <div className="mt-4">
              <h2 className="text-base font-bold text-slate-900">
                Hola, {request.personName}
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Has sido convocado(a) para participar en el siguiente evento institucional. Por favor confirma o rechaza tu disponibilidad para actualizar la planeación:
              </p>

              {/* Tarjeta de Detalles del Evento dentro del Correo */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{request.eventTitle}</span>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {formatFriendlyDate(request.eventDate)} ({format12Hour(request.eventStartTime)} – {format12Hour(request.eventEndTime)})
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Espacio: {request.spaceName}</span>
                </div>
              </div>

              {/* Estado actual de la solicitud */}
              <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs">
                <span className="font-semibold text-slate-700">Estado actual:</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full capitalize text-[11px] ${
                    request.status === 'confirmada'
                      ? 'bg-emerald-100 text-emerald-800'
                      : request.status === 'rechazada'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {request.status}
                </span>
              </div>

              {/* Caja de notas opcionales */}
              {request.status === 'pendiente' && (
                <div className="mt-4">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nota o motivo de respuesta (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="ej: Confirmo asistencia / Tengo reunión previa a las 11..."
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Botones de Acción Seguros de 1 Clic */}
              {request.status === 'pendiente' ? (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAction('confirmada')}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm active:scale-[0.98] transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Asistencia</span>
                  </button>
                  <button
                    onClick={() => handleAction('rechazada')}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm active:scale-[0.98] transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rechazar Participación</span>
                  </button>
                </div>
              ) : (
                <div className="mt-4 p-3 rounded-xl bg-slate-100 text-center text-xs text-slate-500">
                  Esta solicitud ya fue respondida el{' '}
                  {request.respondedAt ? new Date(request.respondedAt).toLocaleString() : 'recientemente'}.
                </div>
              )}

              {/* Token de seguridad OIDC / HMAC */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Enlace seguro: ?token={request.token}</span>
                <span>Zone: America/Bogota</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
