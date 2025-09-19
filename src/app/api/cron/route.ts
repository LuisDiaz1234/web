import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as sb } from '@/lib/supabase';
import { sendEmail } from '@/lib/mail';
import { sendWA } from '@/lib/wa';

export const runtime = 'nodejs';
const TZ = process.env.TIMEZONE || 'America/Panama';

type Settings = {
  business_name: string | null;
  channel: 'EMAIL' | 'WHATSAPP' | 'BOTH' | null;
  pay_instructions: string | null;
  email_template_html: string | null;
  wa_template_text: string | null;
};

type Customer = { name: string | null; email?: string | null; whatsapp?: string | null; };
type InvoiceRPC = {
  id: string; number: string; amount: number | string; due_date: string; status: string;
  pay_link: string | null; send_count: number | null; last_sent_at: string | null; delta: number; customers: Customer;
};

function withinHours() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
  const h = now.getHours(); const a = Number(process.env.WORK_HOUR_START || '8'); const b = Number(process.env.WORK_HOUR_END || '18');
  return h >= a && h <= b;
}

function render(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export async function GET(req: NextRequest) {
  const fromVercel = req.headers.get('x-vercel-cron') !== null;
  const key = req.nextUrl.searchParams.get('key');
  if (!fromVercel && key !== process.env.CRON_SECRET) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  if (!withinHours()) return NextResponse.json({ ok: true, skipped: 'out_of_hours' });

  const { data: raw } = await sb.rpc('invoices_due_for_reminder');
  const invoices = (raw ?? []) as InvoiceRPC[];

  const { data: st } = await sb.from('settings').select('*').limit(1).maybeSingle();
  const s = (st ?? {}) as Partial<Settings>;
  const business = s.business_name || 'Tu Negocio';
  const channel = (s.channel || 'EMAIL').toUpperCase() as 'EMAIL'|'WHATSAPP'|'BOTH';

  let emailsSent = 0; let waSent = 0;

  for (const inv of invoices) {
    const kind = inv.delta === -3 ? 'PREVIO' : inv.delta === 0 ? 'HOY' : inv.delta === 3 ? 'POST3' : 'POST7';
    const suffix =
      kind === 'PREVIO' ? `vence el ${inv.due_date}` :
      kind === 'HOY'    ? `vence HOY` :
      kind === 'POST3'  ? `vencida hace 3 días` :
                          `vencida hace 7 días`;

    const pay = inv.pay_link || s.pay_instructions || '';
    const vars = {
      number: inv.number,
      amount: String(inv.amount),
      due_date: inv.due_date,
      customer_name: inv.customers?.name ?? '',
      pay_link: pay,
      business,
      suffix,
    };

    const defaultText =
`Factura {number} (B/. {amount}) {suffix}
Cliente: {customer_name}
${pay ? `Pago: {pay_link}\n` : ''}— {business}`;

    const waText = s.wa_template_text ? render(s.wa_template_text, vars) : render(defaultText, vars);

    if (channel === 'EMAIL' || channel === 'BOTH') {
      const to = inv.customers?.email || null;
      if (to) {
        const subject = kind === 'HOY' ? `Hoy vence tu factura ${inv.number}` : `Recordatorio factura ${inv.number}`;
        const emailText = render(defaultText, vars);
        const emailHtml = s.email_template_html ? render(s.email_template_html, vars) : undefined;
        try { await sendEmail(to, subject, emailText, emailHtml); await sb.from('messages_log').insert({ invoice_id: inv.id, channel: 'EMAIL', kind, result: 'OK' }); emailsSent++; }
        catch (e: unknown) { const msg = e instanceof Error ? e.message : String(e); await sb.from('messages_log').insert({ invoice_id: inv.id, channel: 'EMAIL', kind, result: 'ERROR', detail: msg }); }
      }
    }

    if (channel === 'WHATSAPP' || channel === 'BOTH') {
      const wa = inv.customers?.whatsapp || null;
      if (wa) {
        try { await sendWA(wa, waText); await sb.from('messages_log').insert({ invoice_id: inv.id, channel: 'WHATSAPP', kind, result: 'OK' }); waSent++; }
        catch (e: unknown) { const msg = e instanceof Error ? e.message : String(e); await sb.from('messages_log').insert({ invoice_id: inv.id, channel: 'WHATSAPP', kind, result: 'ERROR', detail: msg }); }
      }
    }

    await sb.from('invoices').update({ send_count: (inv.send_count ?? 0) + 1, last_sent_at: new Date().toISOString() }).eq('id', inv.id);
  }

  return NextResponse.json({ ok: true, version: 'pro-templates', processed: invoices.length, emails_sent: emailsSent, wa_sent: waSent });
}
