import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

/** Envía un email de texto plano */
export async function sendEmail(to: string, subject: string, text: string) {
  if (!to) throw new Error('Email vacío');
  const from = process.env.EMAIL_FROM || 'Cobrador Pro <onboarding@resend.dev>';
  const res = await resend.emails.send({ from, to, subject, text });
  if (!res?.id) throw new Error('No se pudo enviar el email (Resend)');
  return 'OK';
}
