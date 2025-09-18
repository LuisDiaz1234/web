import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as sb } from '@/lib/supabase';
import { sendEmail } from '@/lib/mail';

const TZ = process.env.TIMEZONE || 'America/Panama';

function withinHours() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
  const h = now.getHours();
  const a = Number(process.env.WORK_HOUR_START || '8');
  const b = Number(process.env.WORK_HOUR_END || '18');
  return h >= a && h <= b;
}

export async function GET(req: NextRequest) {
  // 1) Vercel Cron añade este header -> confiamos
  const fromVercel = req.headers.get('x-vercel-cron') !== null;

  // 2) Si NO viene de Vercel, exigimos ?key=CRON_SECRET para pruebas manuales
  const key = req.nextUrl.searchParams.get('key');
  if (!fromVercel && key !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  if (!withinHours()) {
    return NextResponse.json({ ok: true, skipped: 'out_of_hours' });
  }

  const { data: invoices, error } = await sb.rpc('invoices_due_for_reminder');
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const { data: st } = await sb.from('settings').select('*').limit(1).maybeSingle();
  const business = st?.business_name || 'Tu Negocio';
  const channel = (st?.channel || 'EMAIL').toUpperCase(); // EMAIL | WHATSAPP | BOTH

  let sent = 0;
  for (const inv of invoices || []) {
    const kind =
      inv.delta === -3 ? 'PREVIO' :
      inv.delta === 0  ? 'HOY'    :
      inv.delta === 3  ? 'POST3'  : 'POST7';

    const line = (suffix: string) =>
      `Factura ${inv.number} (B/. ${inv.amount}) ${suffix}\nCliente: ${inv.customers?.name}\n` +
      `${inv.pay_link ? `Link de pago: ${inv.pay_link}\n` : ''}— ${business}`;

    if (channel === 'EMAIL' || channel === 'BOTH') {
      const to = inv.customers?.email;
      if (to) {
        const subject = kind === 'HOY'
          ? `Hoy vence tu factura ${inv.number}`
          : `Recordatorio factura ${inv.number}`;
        const text = line(
          kind === 'PREVIO' ? `vence el ${inv.due_date}` :
          kind === 'HOY'    ? `vence HOY` :
          kind === 'POST3'  ? `vencida hace 3 días` :
                              `vencida hace 7 días`
        );
        try {
          await sendEmail(to, subject, text);
          await sb.from('messages_log').insert({ invoice_id: inv.id, channel: 'EMAIL', kind, result: 'OK' });
          sent++;
        } catch (e: any) {
          await sb.from('messages_log').insert({ invoice_id: inv.id, channel: 'EMAIL', kind, result: 'ERROR', detail: e.message });
        }
      }
    }

    await sb.from('invoices')
      .update({ send_count: (inv.send_count || 0) + 1, last_sent_at: new Date().toISOString() })
      .eq('id', inv.id);
  }

  return NextResponse.json({ ok: true, processed: (invoices || []).length, emails_sent: sent });
}
