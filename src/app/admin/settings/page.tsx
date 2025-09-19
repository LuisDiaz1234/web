import { supabaseService as sb } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

type Settings = {
  business_name: string | null;
  channel: 'EMAIL' | 'WHATSAPP' | 'BOTH' | null;
  pay_instructions: string | null;
  logo_url: string | null;
  email_template_html: string | null;
  wa_template_text: string | null;
};

async function save(formData: FormData) {
  'use server';
  const payload = {
    business_name: String(formData.get('business_name') ?? ''),
    channel: String(formData.get('channel') ?? 'EMAIL') as Settings['channel'],
    pay_instructions: String(formData.get('pay_instructions') ?? ''),
    logo_url: String(formData.get('logo_url') ?? ''),
    email_template_html: String(formData.get('email_template_html') ?? ''),
    wa_template_text: String(formData.get('wa_template_text') ?? ''),
  };
  await sb.from('settings').update(payload); // hay una sola fila
  revalidatePath('/admin/settings');
}

export default async function Page() {
  const { data } = await sb.from('settings').select('*').limit(1).maybeSingle();
  const s = (data ?? {}) as Settings;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Ajustes del negocio</h1>
      <form action={save} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-500">Nombre del negocio</label>
            <input name="business_name" defaultValue={s.business_name ?? ''} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Canal</label>
            <select name="channel" defaultValue={s.channel ?? 'EMAIL'} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2">
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="BOTH">Ambos</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Logo URL (opcional)</label>
            <input name="logo_url" defaultValue={s.logo_url ?? ''} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-500">Instrucciones de pago (si no hay link en la factura)</label>
            <textarea name="pay_instructions" rows={3} defaultValue={s.pay_instructions ?? ''} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" />
          </div>
        </div>

        <details>
          <summary className="cursor-pointer text-sm font-semibold">Plantillas avanzadas (opcional)</summary>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500">Email HTML (usa {'{placeholders}'})</label>
              <textarea name="email_template_html" rows={10} defaultValue={s.email_template_html ?? ''} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs" />
              <p className="mt-1 text-xs text-slate-500">Placeholders: {'{number} {amount} {due_date} {customer_name} {pay_link} {business} {suffix}'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500">WhatsApp texto</label>
              <textarea name="wa_template_text" rows={10} defaultValue={s.wa_template_text ?? ''} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-xs" />
              <p className="mt-1 text-xs text-slate-500">Usa los mismos placeholders.</p>
            </div>
          </div>
        </details>

        <button className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white">Guardar</button>
      </form>
    </main>
  );
}
