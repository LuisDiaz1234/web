import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as sb } from '@/lib/supabase';

type Row = {
  customer_name: string;
  whatsapp: string | null;
  email: string | null;
  number: string;
  amount: number;
  due_date: string;
  status: string;
  pay_link: string | null;
};

export async function POST(req: NextRequest) {
  const text = await req.text();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return NextResponse.json({ ok: false, error: 'CSV vacío' }, { status: 400 });

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const need = ['customer_name','whatsapp','email','number','amount','due_date','status','pay_link'];
  if (need.some(n => !header.includes(n))) {
    return NextResponse.json({ ok: false, error: `Faltan columnas. Debe incluir: ${need.join(', ')}` }, { status: 400 });
  }
  const idx = Object.fromEntries(header.map((h,i) => [h,i]));

  const results: { inserted: number; customers_new: number; errors: string[] } = { inserted: 0, customers_new: 0, errors: [] };

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (!cols.length || cols.join('') === '') continue;

    try {
      const row: Row = {
        customer_name: cols[idx.customer_name]?.trim(),
        whatsapp: cols[idx.whatsapp]?.trim() || null,
        email: cols[idx.email]?.trim() || null,
        number: cols[idx.number]?.trim(),
        amount: Number(cols[idx.amount]),
        due_date: cols[idx.due_date]?.trim(),
        status: (cols[idx.status]?.trim() || 'pending').toLowerCase(),
        pay_link: cols[idx.pay_link]?.trim() || null,
      };

      let customerId: string | null = null;
      if (row.whatsapp) {
        const { data } = await sb.from('customers').select('id').eq('whatsapp', row.whatsapp).maybeSingle();
        customerId = data?.id ?? null;
      }
      if (!customerId && row.email) {
        const { data } = await sb.from('customers').select('id').eq('email', row.email).maybeSingle();
        customerId = data?.id ?? null;
      }
      if (!customerId) {
        const { data } = await sb.from('customers').insert({
          name: row.customer_name, whatsapp: row.whatsapp, email: row.email,
        }).select('id').single();
        customerId = data.id;
        results.customers_new++;
      }

      await sb.from('invoices').insert({
        customer_id: customerId,
        number: row.number,
        amount: row.amount,
        due_date: row.due_date,
        status: row.status === 'paid' ? 'paid' : 'pending',
        pay_link: row.pay_link,
      });
      results.inserted++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.errors.push(`Línea ${i+1}: ${msg}`);
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
