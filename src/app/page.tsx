import { redirect } from 'next/navigation';
import { supabaseService as sb } from '@/lib/supabase';
import { sendEmail } from '@/lib/mail';

async function captureLead(formData: FormData) {
  'use server';
  const name = String(formData.get('name') ?? '').trim();
  const business = String(formData.get('business') ?? '').trim();
  const whatsapp = String(formData.get('whatsapp') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  await sb.from('leads').insert({ name, business, whatsapp, email, message, source: 'landing' });

  const owner = process.env.OWNER_EMAIL || '';
  if (owner) {
    const body = `Nuevo lead:\nNombre: ${name}\nNegocio: ${business}\nWhatsApp: ${whatsapp}\nEmail: ${email}\nMensaje: ${message || '(sin mensaje)'}\n`;
    try { await sendEmail(owner, 'Nuevo lead de Cobrador Pro', body); } catch {}
  }
  redirect('/gracias');
}

export default function Landing() {
  return (
    <main>
      <header className="mx-auto flex max-w-6xl items-center justify-between p-6">
        <div className="text-xl font-bold">Cobrador <span className="text-blue-600">Pro</span></div>
        <nav className="text-sm">
          <a href="/dashboard" className="text-blue-600 hover:underline">Dashboard</a>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 pb-12 pt-6 md:grid-cols-2">
        <div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Hecho para PYMES en Panamá</span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Cobros automáticos por <span className="text-blue-600">WhatsApp + Email</span></h1>
          <p className="mt-4 text-lg text-slate-600">Recordatorios en –3, 0, +3 y +7 días. Menos morosidad, cero persecución. Lo activamos por ti en 1 día.</p>
          <ul className="mt-6 space-y-2 text-slate-700">
            <li>✅ Mensajes con tu marca y link de pago/datos de transferencia</li>
            <li>✅ Registro de envíos y mini-reporte semanal</li>
            <li>✅ Funciona con tus facturas actuales (Excel o lo que tengas)</li>
          </ul>
          <div className="mt-6 text-sm text-slate-500">Lanzamiento: <span className="font-semibold text-slate-700">B/. 39/mes</span> hasta 50 facturas. Sin costo de instalación (primeros 10).</div>
        </div>

        <form action={captureLead} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Pide una demo gratuita</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs text-slate-500">Tu nombre</label>
              <input name="name" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none" placeholder="Luis Díaz" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Negocio</label>
              <input name="business" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none" placeholder="Taller Alfa" />
            </div>
            <div>
              <label className="text-xs text-slate-500">WhatsApp (con +507)</label>
              <input name="whatsapp" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none" placeholder="+5076XXXXXXX" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Email</label>
              <input type="email" name="email" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none" placeholder="correo@dominio.com" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-500">¿Qué problema quieres resolver?</label>
              <textarea name="message" rows={4} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none" placeholder="Ej: muchos clientes pagan tarde…" />
            </div>
          </div>
          <button className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Quiero la demo</button>
          <p className="mt-2 text-center text-xs text-slate-500">Sin costo de instalación para los primeros 10 clientes.</p>
        </form>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-6 text-sm text-slate-500">
          <div>© {new Date().getFullYear()} Cobrador Pro</div>
          <a href="/dashboard" className="text-blue-600 hover:underline">Ir al dashboard</a>
        </div>
      </footer>
    </main>
  );
}
