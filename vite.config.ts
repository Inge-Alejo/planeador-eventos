import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'brevo-api-dev-server',
        configureServer(server) {
          server.middlewares.use('/api/send-email', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const apiKey = env.BREVO_API_KEY || env.VITE_BREVO_API_KEY || process.env.BREVO_API_KEY;
                const senderEmail = env.BREVO_SENDER_EMAIL || env.VITE_BREVO_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL;
                const senderName = env.BREVO_SENDER_NAME || 'Planeador de Eventos - Facultad de Medicina UdeA';

                if (!apiKey || !senderEmail) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    error: 'Configura BREVO_API_KEY y BREVO_SENDER_EMAIL en .env.local o Vercel para probar el envío en vivo.',
                  }));
                  return;
                }

                const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                  method: 'POST',
                  headers: {
                    'accept': 'application/json',
                    'api-key': apiKey,
                    'content-type': 'application/json',
                  },
                  body: JSON.stringify({
                    sender: { name: senderName, email: senderEmail },
                    to: [{ email: parsed.toEmail, name: parsed.toName || parsed.toEmail }],
                    subject: parsed.subject,
                    htmlContent: parsed.htmlContent,
                  }),
                });

                const result = await response.json();
                res.statusCode = response.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message }));
              }
            });
          });
        },
      },
    ],
    server: {
      port: 5173,
      host: true,
    },
  };
});
