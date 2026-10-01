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
  const confirmUrl = `${origin}?token=${params.token}&action=confirmada`;
  const rejectUrl = `${origin}?token=${params.token}&action=rechazada`;

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
                Estimado(a) <strong>${params.personName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569;">
                Ha sido convocado(a) formalmente para participar en la siguiente actividad académica / institucional:
              </p>

              <!-- Tarjeta de Detalles del Evento -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; margin: 24px 0; padding: 20px;">
                <tr>
                  <td style="padding-bottom: 14px;">
                    <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Actividad:</span>
                    <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px;">${params.eventTitle}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 14px;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%">
                          <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">📅 Fecha:</span>
                          <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 2px;">${params.eventDate}</div>
                        </td>
                        <td width="50%">
                          <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">⏰ Horario:</span>
                          <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 2px;">${params.eventStartTime} - ${params.eventEndTime}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: ${params.description ? '14px' : '0'};">
                    <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">📍 Espacio / Ubicación:</span>
                    <div style="font-size: 13px; font-weight: 600; color: #4338ca; margin-top: 2px;">${params.spaceName}</div>
                  </td>
                </tr>
                ${params.description ? `
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase;">📝 Descripción:</span>
                    <div style="font-size: 12px; color: #475569; margin-top: 2px; line-height: 1.5;">${params.description}</div>
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

              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 25px;">
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
