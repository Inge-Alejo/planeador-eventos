// Servicio de Envío de Correos Automáticos vía Brevo (API Serverless)
import { ParticipationRequest, EventEntity } from '../types';

interface SendEmailParams {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export async function sendEmail({ toEmail, toName, subject, htmlContent }: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toEmail,
        toName,
        subject,
        htmlContent,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al enviar correo.');
    }

    return { success: true, messageId: data.messageId };
  } catch (err: any) {
    console.error('Error en sendEmail:', err);
    return { success: false, error: err.message || 'No se pudo conectar con el servicio de correo.' };
  }
}

// Generadores de Enlaces Directos de Calendario (Google Calendar y Outlook Web)
export function generateGoogleCalendarUrl(params: {
  title: string;
  description?: string;
  location?: string;
  date: string;
  startTime: string;
  endTime: string;
}): string {
  const startClean = `${params.date.replace(/-/g, '')}T${params.startTime.replace(':', '')}00`;
  const endClean = `${params.date.replace(/-/g, '')}T${params.endTime.replace(':', '')}00`;
  const text = encodeURIComponent(params.title);
  const details = encodeURIComponent(
    `${params.description || 'Actividad institucional programada.'}\n\nFacultad de Medicina • Universidad de Antioquia`
  );
  const location = encodeURIComponent(params.location || 'Facultad de Medicina UdeA, Medellín');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startClean}/${endClean}&details=${details}&location=${location}&ctz=America/Bogota`;
}

export function generateOutlookCalendarUrl(params: {
  title: string;
  description?: string;
  location?: string;
  date: string;
  startTime: string;
  endTime: string;
}): string {
  const startClean = `${params.date}T${params.startTime}:00`;
  const endClean = `${params.date}T${params.endTime}:00`;
  const subject = encodeURIComponent(params.title);
  const body = encodeURIComponent(
    `${params.description || 'Actividad institucional programada.'}\n\nFacultad de Medicina • Universidad de Antioquia`
  );
  const location = encodeURIComponent(params.location || 'Facultad de Medicina UdeA, Medellín');
  return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${subject}&startdt=${startClean}&enddt=${endClean}&body=${body}&location=${location}`;
}

function escapeHtml(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Plantilla HTML Institucional UdeA
export function generateInvitationHtml(params: {
  personName: string;
  eventTitle: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  spaceName: string;
  description?: string;
  token: string;
  baseUrl?: string;
}): string {
  const origin = params.baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://planeador-eventos.vercel.app');
  const confirmUrl = `${origin}?token=${encodeURIComponent(params.token)}&action=confirmada`;
  const rejectUrl = `${origin}?token=${encodeURIComponent(params.token)}&action=rechazada`;

  const safePersonName = escapeHtml(params.personName);
  const safeEventTitle = escapeHtml(params.eventTitle);
  const safeSpaceName = escapeHtml(params.spaceName);
  const safeDescription = escapeHtml(params.description);
  const safeDate = escapeHtml(params.eventDate);
  const safeStartTime = escapeHtml(params.eventStartTime);
  const safeEndTime = escapeHtml(params.eventEndTime);

  const googleCalUrl = generateGoogleCalendarUrl({
    title: params.eventTitle,
    description: params.description,
    location: params.spaceName,
    date: params.eventDate,
    startTime: params.eventStartTime,
    endTime: params.eventEndTime,
  });

  const outlookCalUrl = generateOutlookCalendarUrl({
    title: params.eventTitle,
    description: params.description,
    location: params.spaceName,
    date: params.eventDate,
    startTime: params.eventStartTime,
    endTime: params.eventEndTime,
  });

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a Evento - Facultad de Medicina UdeA</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Encabezado Institucional UdeA -->
          <tr>
            <td style="background: linear-gradient(135deg, #065f46 0%, #047857 50%, #312e81 100%); padding: 32px 30px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border-radius: 9999px; padding: 4px 14px; margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.25);">
                <span style="color: #a7f3d0; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">
                  Universidad de Antioquia • Facultad de Medicina
                </span>
              </div>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; line-height: 1.3;">
                Planeador de Eventos & Agendas
              </h1>
              <p style="color: #d1fae5; font-size: 13px; margin: 6px 0 0 0; font-weight: 500;">
                Convocatoria y Solicitud de Participación
              </p>
            </td>
          </tr>

          <!-- Cuerpo Principal -->
          <tr>
            <td style="padding: 35px 30px;">
              <p style="font-size: 15px; line-height: 1.6; margin-top: 0; color: #334155;">
                Estimado(a) <strong>${safePersonName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Ha sido convocado(a) formalmente para participar en la siguiente actividad académica / institucional:
              </p>

              <!-- Tarjeta de Detalles del Evento -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 24px 0; padding: 20px;">
                <tr>
                  <td style="padding-bottom: 14px;">
                    <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Actividad:</span>
                    <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px;">${safeEventTitle}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 14px;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                       <tr>
                        <td width="50%">
                          <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">📅 Fecha:</span>
                          <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 2px;">${safeDate}</div>
                        </td>
                        <td width="50%">
                          <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">⏰ Horario:</span>
                          <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 2px;">${safeStartTime} - ${safeEndTime}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: ${safeDescription ? '14px' : '0'};">
                    <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">📍 Espacio / Ubicación:</span>
                    <div style="font-size: 13px; font-weight: 600; color: #4338ca; margin-top: 2px;">${safeSpaceName}</div>
                  </td>
                </tr>
                ${safeDescription ? `
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">📝 Descripción:</span>
                    <div style="font-size: 12px; color: #475569; margin-top: 2px; line-height: 1.5;">${safeDescription}</div>
                  </td>
                </tr>
                ` : ''}
              </table>

              <!-- Llamado a la Acción (Botones de 1 Clic) -->
              <p style="font-size: 13px; color: #475569; text-align: center; margin-bottom: 18px; font-weight: 500;">
                Por favor confirme o decline su asistencia haciendo clic en uno de los siguientes botones:
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                <tr>
                  <td align="center" style="padding-right: 10px;" width="50%">
                    <a href="${confirmUrl}" target="_blank" style="display: block; background-color: #059669; color: #ffffff; text-decoration: none; padding: 13px 20px; border-radius: 12px; font-size: 13px; font-weight: 700; text-align: center; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.25);">
                      ✓ Confirmar Asistencia
                    </a>
                  </td>
                  <td align="center" style="padding-left: 10px;" width="50%">
                    <a href="${rejectUrl}" target="_blank" style="display: block; background-color: #f1f5f9; color: #e11d48; text-decoration: none; padding: 13px 20px; border-radius: 12px; font-size: 13px; font-weight: 700; text-align: center; border: 1px solid #fecdd3;">
                      ✕ No Podré Asistir
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Botones de 1 Clic para Agregar a Calendario Personal (Google Calendar & Outlook) -->
              <div style="margin-top: 25px; padding-top: 20px; border-top: 1px dashed #cbd5e1; text-align: center;">
                <p style="font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 10px 0;">
                  📅 Agendar en mi calendario personal:
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="center" style="padding-right: 6px;" width="50%">
                      <a href="${googleCalUrl}" target="_blank" style="display: block; background-color: #ffffff; color: #1e293b; text-decoration: none; padding: 10px 14px; border-radius: 10px; font-size: 12px; font-weight: 600; text-align: center; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                        📅 Google Calendar
                      </a>
                    </td>
                    <td align="center" style="padding-left: 6px;" width="50%">
                      <a href="${outlookCalUrl}" target="_blank" style="display: block; background-color: #ffffff; color: #1e293b; text-decoration: none; padding: 10px 14px; border-radius: 10px; font-size: 12px; font-weight: 600; text-align: center; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                        📅 Outlook Calendar
                      </a>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 20px;">
                No es necesario iniciar sesión. Su respuesta se sincronizará automáticamente en tiempo real con el calendario de la Facultad.
              </p>
            </td>
          </tr>

          <!-- Pie de Página Institucional -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 30px; text-align: center;">
              <p style="font-size: 11px; color: #64748b; margin: 0; font-weight: 500;">
                Facultad de Medicina • Universidad de Antioquia
              </p>
              <p style="font-size: 10px; color: #94a3b8; margin: 4px 0 0 0;">
                Medellín, Colombia • Sistema Automatizado de Gestión de Espacios y Eventos
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Envío simplificado de solicitud de participación
export async function sendParticipationEmail(
  request: ParticipationRequest,
  event?: EventEntity
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const htmlContent = generateInvitationHtml({
    personName: request.personName,
    eventTitle: request.eventTitle,
    eventDate: request.eventDate,
    eventStartTime: request.eventStartTime,
    eventEndTime: request.eventEndTime,
    spaceName: request.spaceName,
    description: event?.description,
    token: request.token,
  });

  return await sendEmail({
    toEmail: request.personEmail,
    toName: request.personName,
    subject: `Invitación: ${request.eventTitle} (${request.eventDate})`,
    htmlContent,
  });
}

// Plantilla HTML de Notificación para el Super Administrador cuando un usuario se registra
export function generateNewUserRegistrationAdminNotificationHtml(params: {
  userName: string;
  userEmail: string;
  registrationDate: string;
  baseUrl?: string;
}): string {
  const origin =
    params.baseUrl ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'https://planeador-eventos.vercel.app');
  const adminPanelUrl = `${origin}?tab=usuarios`;

  const safeUserName = escapeHtml(params.userName);
  const safeUserEmail = escapeHtml(params.userEmail);
  const safeDate = escapeHtml(params.registrationDate);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva Solicitud de Registro de Usuario</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Encabezado Institucional UdeA -->
          <tr>
            <td style="background: linear-gradient(135deg, #065f46 0%, #047857 50%, #1e1b4b 100%); padding: 32px 30px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); border-radius: 9999px; padding: 4px 14px; margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.25);">
                <span style="color: #a7f3d0; font-size: 11px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">
                  Universidad de Antioquia • Facultad de Medicina
                </span>
              </div>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; line-height: 1.3;">
                🔔 Nueva Solicitud de Registro
              </h1>
              <p style="color: #d1fae5; font-size: 13px; margin: 6px 0 0 0; font-weight: 500;">
                Notificación Oficial para el Super Administrador
              </p>
            </td>
          </tr>

          <!-- Cuerpo Principal -->
          <tr>
            <td style="padding: 35px 30px;">
              <p style="font-size: 15px; line-height: 1.6; margin-top: 0; color: #334155;">
                Hola, <strong>Superadministrador</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Un nuevo usuario acaba de registrarse en la plataforma del <strong>Planeador de Eventos & Agendas</strong> de la Facultad de Medicina y su cuenta se encuentra actualmente en estado <strong style="color: #b45309; background-color: #fef3c7; padding: 2px 8px; border-radius: 6px;">Pendiente de Aprobación</strong>.
              </p>

              <!-- Tarjeta de Detalles del Solicitante -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 24px 0; padding: 20px;">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">👤 Nombre del Solicitante:</span>
                    <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px;">${safeUserName}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px;">
                    <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">✉️ Correo Electrónico:</span>
                    <div style="font-size: 14px; font-weight: 600; color: #4338ca; margin-top: 2px; font-family: monospace;">${safeUserEmail}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px;">
                    <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">📅 Fecha y Hora de Registro:</span>
                    <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 2px;">${safeDate}</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">🛡️ Estado Asignado:</span>
                    <div style="font-size: 13px; font-weight: 600; color: #64748b; margin-top: 2px;">Lector (Solo Lectura - Requiere tu autorización para crear/editar)</div>
                  </td>
                </tr>
              </table>

              <!-- Llamado a la Acción -->
              <div style="text-align: center; margin: 28px 0 16px 0;">
                <p style="font-size: 13px; color: #475569; margin-bottom: 16px; font-weight: 500;">
                  Para autorizar a este usuario como <strong>Gestor</strong> o <strong>Administrador</strong>, accede a tu panel de administración:
                </p>
                <a href="${adminPanelUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: 700; text-align: center; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
                  👉 Revisar y Aprobar Usuario en el Panel
                </a>
              </div>

              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; line-height: 1.5;">
                Recuerda que solo tú como Superadministrador desde tu sesión iniciada tienes los permisos necesarios para aprobar usuarios y conceder roles operativos.
              </p>
            </td>
          </tr>

          <!-- Pie de Página Institucional -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 30px; text-align: center;">
              <p style="font-size: 11px; color: #64748b; margin: 0; font-weight: 500;">
                Facultad de Medicina • Universidad de Antioquia
              </p>
              <p style="font-size: 10px; color: #94a3b8; margin: 4px 0 0 0;">
                Medellín, Colombia • Sistema Automatizado de Gestión de Espacios y Eventos
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// Envío automático al Superadministrador cuando se registra un nuevo usuario
export async function sendNewUserRegistrationNotificationToSuperAdmin(user: {
  email: string;
  displayName?: string;
  uid?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const superAdminEmail =
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPERADMIN_EMAIL) ||
    'proyectostic.med@udea.edu.co';

  const now = new Date();
  const dateFormatted = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'America/Bogota',
  }).format(now);

  const htmlContent = generateNewUserRegistrationAdminNotificationHtml({
    userName: user.displayName || user.email.split('@')[0],
    userEmail: user.email,
    registrationDate: dateFormatted,
  });

  return await sendEmail({
    toEmail: superAdminEmail,
    toName: 'Superadministrador UdeA',
    subject: `🔔 Nueva Solicitud de Registro: ${user.displayName || user.email} | Planeador UdeA`,
    htmlContent,
  });
}
