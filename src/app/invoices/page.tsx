import { supabaseService as sb } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

/** CARGA DE DATOS (server) */
async function getInvoices() {
  const { data, error } = await sb
    .from('invoices')
    .select('id, number, amount, due_date, status, send_count, last_sent_at, customers:customer_id(name)')
    .order('due_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

/** ACCIÓN: marcar como pagado (server action) */
export async function markPaidAction(formData: FormData) {
  'use server';
  const id = String(formData.get('id') || '');
  if (!id) return;
  await sb.from('invoices').update({ status: 'paid' }).eq('id', id);
  revalidatePath('/invoices');
  revalidatePath('/');
}

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Facturas</h1>

      <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #eee', borderRadius: 12 }}>
        <table style={{ width: '100%', fontSize: 14 }}>
          <thead style={{ background: '#f9fafb', textAlign: 'left' }}>
            <tr>
              <th style={{ padding: 12 }}>Factura</th>
              <th style={{ padding: 12 }}>Cliente</th>
              <th style={{ padding: 12 }}>Vence</th>
              <th style={{ padding: 12 }}>Monto</th>
              <th style={{ padding: 12 }}>Estado</th>
              <th style={{ padding: 12 }}>Envíos</th>
              <th style={{ padding: 12 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((r: any) => (
              <tr key={r.id} style={{ borderTop: '1px solid #eee' }}>
                <td style={{ padding: 12 }}>{r.number}</td>
                <td style={{ padding: 12 }}>{r.customers?.name}</td>
                <td style={{ padding: 12 }}>{new Date(r.due_date).toLocaleDateString('es-PA')}</td>
                <td style={{ padding: 12 }}>B/. {Number(r.amount).toFixed(2)}</td>
                <td style={{ padding: 12 }}>
                  <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 999, fontSize: 12 }}>
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: 12 }}>{r.send_count || 0}</td>
                <td style={{ padding: 12 }}>
                  {r.status !== 'paid' ? (
                    <form action={markPaidAction} style={{ display: 'inline' }}>
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" style={{ color: '#065f46', textDecoration: 'underline', background: 'none', border: 0, cursor: 'pointer' }}>
                        Marcar pagado
                      </button>
                    </form>
                  ) : (
                    <span style={{ color: '#10b981' }}>Pagada ✔</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ marginTop: 16 }}>
        <a href="/" style={{ color: '#2563eb', textDecoration: 'underline' }}>← Volver al Dashboard</a>
      </p>
    </main>
  );
}
