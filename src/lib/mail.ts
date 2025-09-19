import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendEmail(to: string, subject: string, text: string, htmlOverride?: string) {
  if (!to) throw new Error('Email vacío');
  const from = process.env.EMAIL_FROM || 'Cobrador Pro <onboarding@resend.dev>';

  const html = htmlOverride || `<div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.6; color:#0f172a">
    ${process.env.LOGO_URL ? `<img src="${process.env.LOGO_URL}" alt="Logo" style="height:40px; margin-bottom:12px" />` : ''}
    <p>${text.replace(/\n/g,'<br/>')}</p>
    <hr style="border:none; border-top:1px solid #e5e7eb; margin:16px 0"/>
    <p style="font-size:12px; color:#64748b">Enviado por Cobrador Pro</p>
  </div>`;

  const { data, error } = await resend.emails.send({ from, to, subject, text, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
  if (!data?.id) throw new Error('No se pudo enviar el email (Resend sin id)');
  return 'OK';
}
