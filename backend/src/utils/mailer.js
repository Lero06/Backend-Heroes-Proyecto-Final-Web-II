/*
//////////////////////////////////////////////////////////
CABEZA DE ARCHIVO
//////////////////////////////////////////////////////////
Archivo: mailer.js
Autor: Leandro Sanchez Rojas
Fecha: 24/08/2026
Modulo: Utils - Correo
Descripcion:
Utilidad para el envio de correos electronicos mediante Nodemailer
configurado con Mailtrap (sandbox de pruebas). Expone la funcion
enviarCorreoRecuperacion que se usa en el flujo de recuperacion de
contrasena del modulo auth.
Requiere las variables de entorno:
  MAILTRAP_HOST, MAILTRAP_PORT, MAILTRAP_USER, MAILTRAP_PASS,
  MAIL_FROM, FRONTEND_URL
//////////////////////////////////////////////////////////
*/

import nodemailer from 'nodemailer';

/*
//////////////////////////////////////////////////////////
TRANSPORTER
//////////////////////////////////////////////////////////
*/

/**
 * Transportador de Nodemailer configurado con las credenciales SMTP
 * de Mailtrap definidas en las variables de entorno del backend.
 */
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: Number(process.env.MAILTRAP_PORT),
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

/*
//////////////////////////////////////////////////////////
FUNCIONES DE ENVIO
//////////////////////////////////////////////////////////
*/

/**
 * Envia un correo de recuperacion de contrasena al usuario indicado.
 * El correo incluye un enlace de un solo uso valido por el tiempo
 * configurado en RECUPERACION_TOKEN_MIN.
 *
 * @param {string} destinatario - Correo electronico del usuario.
 * @param {string} nombre      - Nombre completo o usuario del destinatario.
 * @param {string} enlace      - URL completa con el token de recuperacion.
 * @returns {Promise<void>}
 */
export async function enviarCorreoRecuperacion(destinatario, nombre, enlace) {
  const remitente = process.env.MAIL_FROM || 'SIGMA <no-reply@sigma.local>';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Recuperacion de contrasena - SIGMA</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:10px;overflow:hidden;
                      box-shadow:0 4px 16px rgba(0,0,0,0.08);">

          <!-- Cabecera -->
          <tr>
            <td style="background:#1a56db;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;
                         letter-spacing:2px;">SIGMA</h1>
              <p style="margin:6px 0 0;color:#c7d9f8;font-size:13px;">
                Sistema de Gestion de Marcas y Equipos
              </p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 12px;color:#111827;font-size:16px;font-weight:600;">
                Hola, ${nombre}
              </p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:14px;line-height:1.7;">
                Recibimos una solicitud para restablecer la contrasena de tu cuenta en
                <strong>SIGMA</strong>. Haz clic en el boton para continuar.
                Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.
              </p>

              <!-- Boton -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 28px;">
                    <a href="${enlace}"
                       style="display:inline-block;background:#1a56db;color:#ffffff;
                              text-decoration:none;font-size:15px;font-weight:600;
                              padding:13px 36px;border-radius:6px;
                              letter-spacing:0.3px;">
                      Restablecer contrasena
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Enlace alternativo -->
              <p style="margin:0 0 8px;color:#6b7280;font-size:12px;">
                Si el boton no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0 0 28px;word-break:break-all;">
                <a href="${enlace}" style="color:#1a56db;font-size:12px;">${enlace}</a>
              </p>

              <!-- Aviso de expiracion -->
              <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;
                          padding:12px 16px;margin-bottom:0;">
                <p style="margin:0;color:#92400e;font-size:13px;">
                  Este enlace es de <strong>un solo uso</strong> y expirara en
                  <strong>${process.env.RECUPERACION_TOKEN_MIN || 30} minutos</strong>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Pie -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;
                       border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Este correo fue enviado automaticamente por SIGMA. Por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: remitente,
    to: destinatario,
    subject: 'Recuperacion de contrasena - SIGMA',
    html,
  });
}
