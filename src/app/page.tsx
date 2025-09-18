import { redirect } from 'next/navigation';
import { supabaseService as sb } from '@/lib/supabase';
import { sendEmail } from '@/lib/mail';
import type { CSSProperties } from 'react';

/** Acción del formulario (server action) */
async function captureLead(formData: FormData) {
  'use server';
  const name = String(formData.get('name') || '').trim();
  const business = String(formData.get('business') || '').trim();
  const whatsapp = String(formData.get('whatsapp') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const message = String(formData.get('message') || '').trim();
  const source = 'landing';

  await sb.from('leads').insert({ name, business, whatsapp, email, message, source });

  // Aviso al owner (si configuraste OWNER_EMAIL)
  const owner = process.env.OWNER_EMAIL || '';
  if (owner) {
    const body =
      `Nuevo lead:\n` +
      `Nombre: ${name}\nNegocio: ${business}\nWhatsApp: ${whatsapp}\nEmail: ${email}\n` +
      `Mensaje: ${message || '(sin mensaje)'}\n`;
    try {
      await sendEmail(owner, 'Nuevo lead de Cobrador Pro', body);
    } catch {
      // silencio: si falla el correo no bloquea el lead
    }
  }

  redirect('/gracias');
}

export default function LandingPage() {
  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div style={styles.brand}>
          Cobrador <span style={{ color: '#2563eb' }}>Pro</span>
        </div>
        <nav>
          <a href="/dashboard" style={styles.link}>
            Dashboard
          </a>
        </nav>
      </header>

      <section style={styles.hero}>
        <h1 style={styles.h1}>Cobros automáticos por WhatsApp + Email</h1>
        <p style={styles.sub}>
          Recordatorios en –3, 0, +3 y +7 días. Menos morosidad, cero persecución.
          Lo activamos por ti en 1 día.
        </p>
        <ul style={styles.bullets}>
          <li>✅ Mensajes con tu logo, tono cordial y link de pago / datos de transferencia</li>
          <li>✅ Registro de envíos y mini-reporte semanal</li>
          <li>✅ Funciona con tus facturas actuales (excel, fotos o lo que tengas)</li>
        </ul>
      </section>

      <section style={styles.card}>
        <h2 style={styles.h2}>Pide una demo gratuita</h2>
        <form action={captureLead} style={styles.form}>
          <div style={styles.twoCol}>
            <div style={styles.field}>
              <label style={styles.label}>Tu nombre</label>
              <input name="name" required placeholder="Luis Díaz" style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Negocio</label>
              <input name="business" required placeholder="Taller Alfa" style={styles.input} />
            </div>
          </div>

          <div style={styles.twoCol}>
            <div style={styles.field}>
              <label style={styles.label}>WhatsApp (con +507)</label>
              <input name="whatsapp" required placeholder="+5076XXXXXXX" style={styles.input} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input name="email" type="email" placeholder="correo@dominio.com" style={styles.input} />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>¿Qué problema quieres resolver?</label>
            <textarea
              name="message"
              rows={4}
              placeholder="Ej: muchos clientes pagan tarde…"
              style={styles.textarea}
            />
          </div>

          <button type="submit" style={styles.cta}>
            Quiero la demo
          </button>
          <p style={styles.small}>Sin costo de instalación para los primeros 10 clientes.</p>
        </form>
      </section>

      <footer style={styles.footer}>
        <div>© {new Date().getFullYear()} Cobrador Pro · Hecho para PYMES en Panamá</div>
        <div>
          <a href="/dashboard" style={styles.link}>
            Ir al dashboard
          </a>
        </div>
      </footer>
    </main>
  );
}

/** Estilos inline con tipado seguro (sin `any`) */
const styles: Record<string, CSSProperties> = {
  page: {
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    background: '#f8fafc',
    color: '#0f172a',
    minHeight: '100vh',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' },
  brand: { fontWeight: 700, fontSize: 20 },
  link: { color: '#2563eb', textDecoration: 'none' },
  hero: { maxWidth: 900, margin: '24px auto', padding: '0 24px' },
  h1: { fontSize: 36, margin: '8px 0' },
  sub: { fontSize: 18, opacity: 0.9, margin: '8px 0 16px' },
  bullets: { lineHeight: 1.6, paddingLeft: 16 },
  card: {
    maxWidth: 900,
    margin: '24px auto 48px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 1px 2px rgba(0,0,0,.04)',
  },
  h2: { fontSize: 22, marginBottom: 12 },
  form: { display: 'grid', gap: 12 },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'grid', gap: 6 },
  label: { fontSize: 13, color: '#334155' },
  input: { padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none' },
  textarea: { padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10, outline: 'none', resize: 'vertical' },
  cta: { background: '#2563eb', color: '#fff', border: 0, padding: '12px 16px', borderRadius: 12, fontWeight: 600, cursor: 'pointer' },
  small: { fontSize: 12, color: '#64748b', marginTop: 6 },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    fontSize: 13,
    color: '#475569',
  },
};
