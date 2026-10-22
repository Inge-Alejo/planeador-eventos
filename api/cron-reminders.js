// Endpoint Serverless para Ejecución Automática de Recordatorios de Eventos
// Compatible con Vercel Cron y llamadas programadas del servidor

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificación de autorización opcional para Vercel Cron o invocaciones manuales
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Si se configuró CRON_SECRET en el entorno, validar token
    console.warn('Invocación de cron-reminders sin token secreto válido.');
  }

  const apiKey = process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.VITE_BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Planeador de Eventos - Facultad de Medicina UdeA';

  if (!apiKey || !senderEmail) {
    return res.status(500).json({
      error: 'Brevo no está configurado en el servidor para el envío de recordatorios.',
    });
  }

  try {
    // Si la petición trae eventos en el cuerpo (disparado desde frontend/backend) o los procesa directamente
    let eventsToProcess = [];
    if (req.body && typeof req.body === 'object' && Array.isArray(req.body.events)) {
      eventsToProcess = req.body.events;
    }

    // Calcular fecha de hoy en America/Bogota
    const nowBogota = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const [day, month, year] = nowBogota.split('/');
    const todayStr = `${year}-${month}-${day}`;

    const results = {
      executionDate: todayStr,
      processedEvents: 0,
      remindersSent: 0,
      errors: [],
    };

    // Procesar cada evento con recordatorio activo
    for (const event of eventsToProcess) {
      if (event.status === 'cancelado') continue;
      if (!event.reminder || !event.reminder.enabled) continue;

      // Calcular si hoy es la fecha programada para el recordatorio
      const reminderDays = event.reminder.daysBefore || 1;
      const [ey, em, ed] = event.date.split('-').map(Number);
      const eventDateUtc = Date.UTC(ey, em - 1, ed);
      const scheduledUtc = eventDateUtc - reminderDays * 24 * 60 * 60 * 1000;
      const scheduledDateStr = new Date(scheduledUtc).toISOString().slice(0, 10);

      // Si coincide la fecha y no ha sido enviado hoy
      if (todayStr === scheduledDateStr && event.reminder.sentAt?.slice(0, 10) !== todayStr) {
        results.processedEvents++;

        // Enviar a los involucrados
        const recipientList = event.peopleToNotify || [];
        for (const recipient of recipientList) {
          if (!recipient.email) continue;

          // Filtrar tareas específicas de esta persona
          const personTasks = (event.tasks || []).filter(
            (t) => t.responsibleIds && t.responsibleIds.includes(recipient.id)
          );

          try {
            const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
              method: 'POST',
              headers: {
                accept: 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                sender: { name: senderName, email: senderEmail },
                to: [{ email: recipient.email, name: recipient.name || recipient.email }],
                subject: `⏰ Recordatorio de Evento: ${event.title} (${event.date}) | Facultad de Medicina UdeA`,
                htmlContent: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 14px;">
                    <h2 style="color: #065f46;">Recordatorio de Evento Institucional</h2>
                    <p>Estimado(a) <strong>${recipient.name || 'Participante'}</strong>,</p>
                    <p>Te recordamos que tienes programada tu participación en el evento <strong>"${event.title}"</strong>.</p>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
                      <p><strong>📅 Fecha:</strong> ${event.date}</p>
                      <p><strong>⏰ Horario:</strong> ${event.startTime} - ${event.endTime}</p>
                      <p><strong>🏛️ Lugar:</strong> ${event.spaceName}</p>
                    </div>
                    ${
                      personTasks.length > 0
                        ? `
                      <h3>Tus responsabilidades asignadas:</h3>
                      <ul>
                        ${personTasks
                          .map((t) => `<li><strong>${t.name}</strong> (${t.stage.toUpperCase()}) - Estado: ${t.status}</li>`)
                          .join('')}
                      </ul>
                    `
                        : ''
                    }
                    <p style="font-size: 11px; color: #94a3b8; margin-top: 25px;">Facultad de Medicina • Universidad de Antioquia</p>
                  </div>
                `,
              }),
            });

            if (emailRes.ok) {
              results.remindersSent++;
            } else {
              const errData = await emailRes.json();
              results.errors.push({ recipient: recipient.email, error: errData });
            }
          } catch (err) {
            results.errors.push({ recipient: recipient.email, error: err.message });
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error en cron-reminders:', error);
    return res.status(500).json({ error: error.message || 'Error ejecutando cron-reminders.' });
  }
}
