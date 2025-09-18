import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

/** Envía un email de texto plano con Resend */
export async function sendEmail(to: string, subject: string, text: string) {
  if (!to) throw new Error('Email vacío');
  const from = process.env.EMAIL_FROM || 'Cobrador Pro <onboarding@resend.dev>';

  const { data, error } = await resend.emails.send({ from, to, subject, text });

  if (error) {
    // La SDK v4 devuelve { data, error }; el id viene en data.id
    throw new Error(`Resend error: ${error.message}`);
  }
  if (!data?.id) {
    throw new Error('No se pudo enviar el email (Resend sin id)');
  }

  return 'OK';
}
