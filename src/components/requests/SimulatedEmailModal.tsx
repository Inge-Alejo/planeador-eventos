import React, { useState } from 'react';
import {
  X,
  Mail,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  Send,
  Download,
  Check,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { ParticipationRequest } from '../../types';
import { formatFriendlyDate, format12Hour } from '../../lib/timezone';
import { sendParticipationEmail } from '../../services/emailService';
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
  const [copied, setCopied] = useState(false);
  const [isSendingAuto, setIsSendingAuto] = useState(false);
  const [autoSendResult, setAutoSendResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!request) return null;

  const handleSendAutomatic = async () => {
    setIsSendingAuto(true);
    setAutoSendResult(null);
    try {
      const res = await sendParticipationEmail(request);
      if (res.success) {
        setAutoSendResult({
          success: true,
          message: `Invitación oficial enviada exitosamente a ${request.personEmail} a través de Brevo.`,
        });
      } else {
        setAutoSendResult({
          success: false,
          message: res.error || 'No se pudo conectar con Brevo. Verifica tus variables en Vercel o usa el botón de Outlook.',
        });
      }
    } catch (err: any) {
      setAutoSendResult({
        success: false,
        message: err.message || 'Error inesperado al enviar correo.',
      });
    } finally {
      setIsSendingAuto(false);
    }
  };

  const reminderText = `Cordial saludo, ${request.personName}.

Te recordamos tu participación programada en el evento institucional:
📌 Evento: ${request.eventTitle}
📅 Fecha: ${formatFriendlyDate(request.eventDate)}
⏰ Horario: ${format12Hour(request.eventStartTime)} - ${format12Hour(request.eventEndTime)}
📍 Espacio: ${request.spaceName}

Facultad de Medicina - Universidad de Antioquia
Planeador de Eventos Académicos`;

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

  // Abrir cliente de correo predeterminado (Outlook / Gmail / Apple Mail)
  const handleOpenEmailClient = () => {
    const subject = encodeURIComponent(`Recordatorio: ${request.eventTitle} | Facultad de Medicina UdeA`);
    const body = encodeURIComponent(reminderText);
    window.open(`mailto:${request.personEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  // Copiar al portapapeles
  const handleCopyReminder = () => {
    navigator.clipboard.writeText(reminderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Descargar archivo .ics para agregar a Google Calendar / Outlook
  const handleDownloadICS = () => {
    const cleanDate = request.eventDate.replace(/-/g, '');
    const cleanStart = request.eventStartTime.replace(':', '') + '00';
    const cleanEnd = request.eventEndTime.replace(':', '') + '00';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UdeA Medicina//Planeador de Eventos//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${request.eventId}-${Date.now()}@udea.edu.co`,
      `SUMMARY:${request.eventTitle}`,
      `DESCRIPTION:Evento institucional organizado por la Facultad de Medicina UdeA. Espacio: ${request.spaceName}`,
      `LOCATION:${request.spaceName}`,
      `DTSTART;TZID=America/Bogota:${cleanDate}T${cleanStart}`,
      `DTEND;TZID=America/Bogota:${cleanDate}T${cleanEnd}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `evento-${request.eventTitle.toLowerCase().replace(/\s+/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera del Cliente de Correo Simulado */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-100/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">
                Notificación & Recordatorio por Correo
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Para: {request.personEmail}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Acciones Rápidas de Envío Real */}
        <div className="bg-indigo-50/70 border-b border-indigo-100/80 px-6 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="font-semibold text-indigo-950 text-[11px]">Acciones de envío:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleSendAutomatic}
              disabled={isSendingAuto}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              title="Envía el correo directamente al buzón del destinatario mediante Brevo"
            >
              {isSendingAuto ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Enviando con Brevo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Enviar Automático (Brevo)</span>
                </>
              )}
            </button>

            <button
              onClick={handleOpenEmailClient}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-2xs transition-all cursor-pointer"
              title="Abre tu cliente de correo (Outlook / Gmail) con el mensaje redactado"
            >
              <Send className="w-3 h-3" />
              <span>Enviar con Outlook/Gmail</span>
            </button>

            <button
              onClick={handleCopyReminder}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition-all cursor-pointer"
              title="Copiar texto para WhatsApp o Teams"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
              <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={handleDownloadICS}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-[11px] transition-all cursor-pointer"
              title="Descargar archivo de calendario (.ics) para Outlook o Google Calendar"
            >
              <Download className="w-3 h-3 text-slate-500" />
              <span>.ICS</span>
            </button>
          </div>
        </div>

        {/* Mensaje de Resultado de Envío Automático */}
        {autoSendResult && (
          <div
            className={`mx-6 mt-3 p-3 rounded-xl border flex items-center gap-2 text-xs ${
              autoSendResult.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {autoSendResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="flex-1">{autoSendResult.message}</span>
            <button
              onClick={() => setAutoSendResult(null)}
              className="text-slate-400 hover:text-slate-600 text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Cuerpo del Correo (Plantilla HTML Empresarial) */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-emerald-700 tracking-tight flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Facultad de Medicina • Universidad de Antioquia
              </span>
              <span className="text-[10px] text-slate-400">Recordatorio de Agenda</span>
            </div>

            <div className="mt-4">
              <h2 className="text-base font-bold text-slate-900">
                Hola, {request.personName}
              </h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Te enviamos la confirmación y recordatorio de tu participación en el siguiente evento institucional:
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
                <span className="font-semibold text-slate-700">Estado de confirmación:</span>
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
                  Esta solicitud fue respondida el{' '}
                  {request.respondedAt ? new Date(request.respondedAt).toLocaleString() : 'recientemente'}.
                </div>
              )}

              {/* Token de seguridad */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Ref: tk_{request.token.slice(0, 10)}...</span>
                <span>UdeA Medicina</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
