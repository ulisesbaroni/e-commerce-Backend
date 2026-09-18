import nodemailer from "nodemailer";

let transporterPromise;

async function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST) {
    const port = Number(SMTP_PORT) || 587;

    return {
      isTest: false,
      transporter: nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure: port === 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      }),
    };
  }

  // Sin SMTP configurado se usa una cuenta de prueba de Ethereal: no entrega mails reales
  const account = await nodemailer.createTestAccount();

  return {
    isTest: true,
    transporter: nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    }),
  };
}

async function getTransporter() {
  transporterPromise ??= createTransporter().catch((error) => {
    transporterPromise = undefined;
    throw error;
  });

  return await transporterPromise;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

export async function sendPasswordResetEmail(user, resetUrl) {
  const { transporter, isTest } = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || '"Tienda" <no-reply@tienda.com>',
    to: user.email,
    subject: "Restablecé tu contraseña",
    text: `Hola ${user.first_name}, para restablecer tu contraseña ingresá a este enlace (vence en 1 hora): ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <h2>Hola ${escapeHtml(user.first_name)}</h2>
        <p>Recibimos un pedido para restablecer la contraseña de tu cuenta.</p>
        <p style="margin: 28px 0;">
          <a href="${resetUrl}" style="background: #1a1a1a; color: #ffffff; padding: 12px 22px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Restablecer contraseña
          </a>
        </p>
        <p>El enlace vence en 1 hora y solo puede usarse una vez.</p>
        <p style="color: #666; font-size: 13px;">Si no fuiste vos, ignorá este mensaje: tu contraseña no va a cambiar.</p>
      </div>
    `,
  });

  if (isTest) console.log("Vista previa del mail (Ethereal):", nodemailer.getTestMessageUrl(info));
}
