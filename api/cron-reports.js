// Endpoint Serverless para Generación y Envío Automático de Reportes Programados
// Exclusivo para la cuenta de Superadministrador (proyectostic.med@udea.edu.co)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPERADMIN_EMAIL = 'proyectostic.med@udea.edu.co';
  const apiKey = process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.VITE_BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Planeador de Eventos - Facultad de Medicina UdeA';

  if (!apiKey || !senderEmail) {
    return res.status(500).json({
      error: 'Brevo no está configurado para el despacho de reportes automáticos.',
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }

    const {
      reportTitle = 'Informe Mensual Consolidado de Gestión',
      periodCovered = 'Mes Calendario Anterior',
      summaryMetrics = {
        totalEvents: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        complianceRate: 100,
      },
      executiveSummary = 'Reporte automático consolidado generado para el seguimiento institucional de la Facultad de Medicina.',
    } = body || {};

    // Envío estrictamente a la cuenta de superadministrador
    const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: SUPERADMIN_EMAIL, name: 'Superadministrador UdeA' }],
        subject: `📊 ${reportTitle} - ${periodCovered} | Facultad de Medicina UdeA`,
        htmlContent: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 14px; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 20px; border-radius: 10px; text-align: center; color: white;">
              <span style="font-size: 11px; text-transform: uppercase; color: #c7d2fe;">Facultad de Medicina • Universidad de Antioquia</span>
              <h2 style="margin: 8px 0 0 0; font-size: 18px;">📊 ${reportTitle}</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #e0e7ff;">Periodo: ${periodCovered}</p>
            </div>

            <p style="font-size: 14px; color: #334155; margin-top: 20px;">Estimado Superadministrador,</p>
            <p style="font-size: 13px; color: #475569;">Compartimos el resumen de indicadores clave del periodo:</p>

            <table width="100%" style="border-collapse: collapse; margin: 15px 0; background-color: #f8fafc; border-radius: 8px; font-size: 13px;">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: 600;">Total de Eventos:</td>
                <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #1e1b4b;">${summaryMetrics.totalEvents}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: 600;">Tareas Completadas:</td>
                <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #059669;">${summaryMetrics.completedTasks}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: 600;">Tareas Pendientes / En Curso:</td>
                <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #d97706;">${summaryMetrics.pendingTasks}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: 600;">Tareas Vencidas:</td>
                <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #dc2626;">${summaryMetrics.overdueTasks}</td>
              </tr>
              <tr>
                <td style="padding: 10px 14px; font-weight: 600;">Cumplimiento Operativo:</td>
                <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #2563eb;">${summaryMetrics.complianceRate}%</td>
              </tr>
            </table>

            <div style="background-color: #f1f5f9; padding: 14px; border-radius: 8px; margin: 15px 0; font-size: 13px; color: #475569;">
              <strong>Resumen Ejecutivo:</strong>
              <p style="margin: 6px 0 0 0;">${executiveSummary}</p>
            </div>

            <div style="text-align: center; margin-top: 20px;">
              <a href="https://planeador-eventos-medicina-udea.vercel.app/?tab=reportes" target="_blank" style="display: inline-block; background-color: #312e81; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 700;">
                📥 Abrir Centro de Reportes
              </a>
            </div>
          </div>
        `,
      }),
    });

    const data = await emailRes.json();
    return res.status(200).json({
      success: emailRes.ok,
      messageId: data.messageId,
      recipient: SUPERADMIN_EMAIL,
    });
  } catch (error) {
    console.error('Error en cron-reports:', error);
    return res.status(500).json({ error: error.message || 'Error ejecutando cron-reports.' });
  }
}
