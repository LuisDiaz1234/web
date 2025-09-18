import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as sb } from '@/lib/supabase';
import { sendEmail } from '@/lib/mail';
import { sendWA } from '@/lib/wa';

export const runtime = 'nodejs'; // asegura Node (necesario para fetch/buffer)

const TZ = process.env.TIMEZONE || 'America/Panama';

type Settings = {
  business_name: string | null;
  channel: 'EMAIL' | 'WHATSAPP' | 'BOTH' | null;
};

type CustomerInfo = {
  name: string | null;
  email?: string | null;
  whatsapp?: string | null;
};

type InvoiceRPC = {
  id: string;
  number: string;
  amount: number | string;
  due_date: string; // ISO
  status: string;
  pay_link: string | null;
  send_count: number | null;
  last_sent_at: string | null;
  delta: number; // -3 | 0 | 3 | 7
  customers: CustomerInfo;
};

function withinHours() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
  const h = now.getHours();
  const a = Number(process.env.WORK_HOUR_START || '8');
  const b = Number(process.env.WORK_HOUR_END || '18');
  return h >= a && h <= b;
}

export async function GET(req: NextRequest) {
  // Permite Vercel Cron o acceso manual con ?key=CRON_SECRET
  const fromVercel = req.headers.get('x-vercel-cron') !== null;
  const key = req.nextUrl.searchParams.get('key');
  if (!fromVercel && key !== process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  if (!withinHours()) {
    return NextResponse.json({ ok: true, skipped: 'out_of_hours' });
  }

  // Facturas a recordar (–3, 0, +3, +7)
  const { data: raw, error } = await sb.rpc('invoices_due_for_reminder');
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  const invoices = (raw ?? []) as InvoiceRPC[];

  const { data: st } = await sb.from('settings').select('*').limit(1).maybeSingle();
  const settings = (st ?? {}) as Partial<Settings>;
  const business = settings.business_name || 'Tu Negocio';
  const channel = (settings.channel || 'EMAIL').toUpperCase() as 'EMAIL' | 'WHATSAPP' | 'BOTH';

  let emailsSent = 0;
  let waSent = 0;

  for (const inv of invoices) {
    const kind =
      inv.delta === -3 ? 'PREVIO' :
      inv.delta === 0  ? 'HOY'    :
      inv.delta === 3  ? 'POST3'  : 'POST7';

    const suffix =
      kind === 'PREVIO' ? `vence el ${inv.due_date}` :
      kind === 'HOY'    ? `vence HOY` :
      kind === 'POST3'  ? `vencida hace 3 días` :
                          `vencida hace 7 días`;

    const body = `Factura ${inv.number} (B/. ${inv.amount}) ${suffix}
Cliente: ${inv.customers?.name ?? ''}
${inv.pay_link ? `Link de pago: ${inv.pay_link}\n` : ''}— ${business}`;

    // EMAIL
    if (channel === 'EMAIL' || channel === 'BOTH') {
      const to = inv.customers?.email || null;
      if (to) {
        const subject = kind === 'HOY'
          ? `Hoy vence tu factura ${inv.number}`
          : `Recordatorio factura ${inv.number}`;
        try {
          await sendEmail(to, subject, body);
          await sb.from('messages_log').insert({ invoice_id: inv.id, channel: 'EMAIL', kind, result: 'OK' });
          emailsSent++;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          await sb.from('messages_log').insert({ invoice_id: inv.id, channel: 'EMAIL', kind, result: 'ERROR', detail: msg });
        }
      }
    }

    // WHATSAPP
    if (channel === 'WHATSAPP' || channel === 'BOTH') {
      const wa = inv.customers?.whatsapp || null;
      if (wa) {
        try {
          await sendWA(wa, body);
          await sb.from('messages_log').insert({ invoice_id: inv.id, channel: 'WHATSAPP', kind, result: 'OK' });
          waSent++;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          await sb.from('messages_log').insert({ invoice_id: inv.id, channel: 'WHATSAPP', kind, result: 'ERROR', detail: msg });
        }
      }
    }

    // contadores
    await sb.from('invoices')
      .update({ send_count: (inv.send_count ?? 0) + 1, last_sent_at: new Date().toISOString() })
      .eq('id', inv.id);
  }

  // agrega "version" para que confirmes que esta es la versión nueva
  return NextResponse.json({
    ok: true,
    version: 'wa-1',
    processed: invoices.length,
    emails_sent: emailsSent,
    wa_sent: waSent
  });
}
