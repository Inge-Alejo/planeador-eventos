// Endpoint Serverless Seguro para Envíos de Correo Transaccional con Brevo
// Auditoría de Seguridad: Validación estricta de entradas, sanitización y prevención de abusos

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const MAX_SUBJECT_LENGTH = 200;
const MAX_NAME_LENGTH = 120;
const MAX_HTML_SIZE_BYTES = 200 * 1024; // 200 KB

export default async function handler(req, res) {
  // Configuración de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Utilice POST.' });
  }

  const apiKey = process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.VITE_BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Planeador de Eventos - Facultad de Medicina UdeA';

  if (!apiKey || !senderEmail) {
    return res.status(500).json({
      error: 'Brevo no está configurado en el entorno del servidor. Requiere BREVO_API_KEY y BREVO_SENDER_EMAIL.',
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido.' });
      }
    }

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Cuerpo de la petición inválido.' });
    }

    let { toEmail, toName, subject, htmlContent } = body;

    // Validación de tipo y presencia
    if (!toEmail || typeof toEmail !== 'string') {
      return res.status(400).json({ error: 'El campo toEmail es obligatorio y debe ser una cadena de texto.' });
    }

    toEmail = toEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(toEmail)) {
      return res.status(400).json({ error: `El correo "${toEmail}" no tiene un formato válido.` });
    }

    if (!subject || typeof subject !== 'string') {
      return res.status(400).json({ error: 'El asunto (subject) es obligatorio y debe ser una cadena de texto.' });
    }

    subject = subject.trim();
    if (subject.length > MAX_SUBJECT_LENGTH) {
      return res.status(400).json({ error: `El asunto supera el límite máximo de ${MAX_SUBJECT_LENGTH} caracteres.` });
    }

    if (toName && typeof toName === 'string') {
      toName = toName.trim().substring(0, MAX_NAME_LENGTH);
    } else {
      toName = toEmail;
    }

    if (!htmlContent || typeof htmlContent !== 'string') {
      return res.status(400).json({ error: 'El contenido HTML es obligatorio.' });
    }

    if (Buffer.byteLength(htmlContent, 'utf8') > MAX_HTML_SIZE_BYTES) {
      return res.status(400).json({ error: 'El tamaño del contenido del correo excede el límite permitido de 200 KB.' });
    }

    // Llamada autenticada a la API de Brevo
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
            name: toName,
          },
        ],
        subject,
        htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error devuelto por Brevo:', data?.message || data);
      return res.status(response.status).json({
        error: data?.message || 'Error al enviar el correo mediante Brevo.',
      });
    }

    return res.status(200).json({
      success: true,
      messageId: data.messageId,
    });
  } catch (err) {
    console.error('Error procesando envío de correo:', err);
    return res.status(500).json({
      error: 'Error interno del servidor al procesar el correo.',
    });
  }
}
