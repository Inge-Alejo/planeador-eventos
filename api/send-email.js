export default async function handler(req, res) {
  // Configuración de CORS para llamadas desde cualquier cliente web
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  const apiKey = process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.VITE_BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Planeador de Eventos - Facultad de Medicina UdeA';

  if (!apiKey || !senderEmail) {
    return res.status(500).json({
      error: 'Brevo no está configurado en las variables de entorno de Vercel. Asegúrate de configurar BREVO_API_KEY y BREVO_SENDER_EMAIL.',
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // mantener como estaba
      }
    }

    const { toEmail, toName, subject, htmlContent } = body || {};

    if (!toEmail || !subject || !htmlContent) {
      return res.status(400).json({
        error: 'Faltan campos requeridos en la petición: toEmail, subject o htmlContent.',
      });
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: [
          {
            email: toEmail,
            name: toName || toEmail,
          },
        ],
        subject,
        htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error devuelto por Brevo:', data);
      return res.status(response.status).json({
        error: data.message || 'Error al enviar el correo mediante Brevo.',
        details: data,
      });
    }

    return res.status(200).json({
      success: true,
      messageId: data.messageId,
    });
  } catch (err) {
    console.error('Error procesando envío de correo:', err);
    return res.status(500).json({
      error: err.message || 'Error interno del servidor al procesar el correo.',
    });
  }
}
