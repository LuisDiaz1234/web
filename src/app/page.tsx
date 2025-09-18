import { supabaseService as sb } from '@/lib/supabase';

export default async function Page() {
  const { data: kpi, error } = await sb.from('kpi').select('*').single();

  return (
    <main style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Conexión OK</h1>
      {error ? (
        <pre style={{ background: '#fee', padding: 12, border: '1px solid #fbb' }}>
          Error: {error.message}
        </pre>
      ) : (
        <div style={{ lineHeight: 1.8 }}>
          <div>Pendiente: B/. {Number(kpi?.total_pending || 0).toFixed(2)}</div>
          <div>Pagado: B/. {Number(kpi?.total_paid || 0).toFixed(2)}</div>
          <div>% Pagado: {kpi?.pct_paid ?? 0}%</div>
          <div>Mensajes (7d): {kpi?.messages_7d ?? 0}</div>
        </div>
      )}
      <p style={{ marginTop: 16, color: '#555' }}>
        (Estos datos vienen de Supabase → vista <code>kpi</code>)
      </p>
    </main>
  );
}
