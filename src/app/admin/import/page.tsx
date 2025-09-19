'use client';

import { useState } from 'react';

export default function ImportPage() {
  const [csv, setCsv] = useState('');
  const [res, setRes] = useState<string>('');

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setRes('Procesando…');
    const r = await fetch('/api/import', { method: 'POST', body: csv });
    const j = await r.json();
    setRes(JSON.stringify(j, null, 2));
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Importar facturas (CSV)</h1>
      <p className="text-sm text-slate-600">Cabeceras requeridas: <code className="rounded bg-slate-100 px-1 py-0.5">customer_name,whatsapp,email,number,amount,due_date,status,pay_link</code></p>
      <form onSubmit={handleImport} className="space-y-3">
        <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={12} placeholder="pega aquí el CSV" className="w-full rounded-xl border border-slate-200 p-3 font-mono text-xs" />
        <button className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white">Importar</button>
      </form>
      {res && <pre className="rounded-xl border border-slate-200 bg-white p-4 text-xs">{res}</pre>}
    </main>
  );
}
