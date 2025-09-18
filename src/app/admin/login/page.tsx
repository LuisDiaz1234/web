import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

async function doLogin(formData: FormData) {
  'use server';
  const pass = String(formData.get('password') ?? '');
  if (pass === process.env.ADMIN_PASSWORD) {
    cookies().set('admin', pass, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 30 });
    redirect('/dashboard');
  }
  redirect('/admin/login?e=1');
}

export default function Login() {
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="mb-4 text-2xl font-bold">Acceso administrador</h1>
      <form action={doLogin} className="space-y-3">
        <input name="password" type="password" placeholder="Contraseña" className="w-full rounded-xl border border-slate-200 px-3 py-2" />
        <button className="w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white">Entrar</button>
      </form>
      <p className="mt-2 text-xs text-slate-500">Pide la contraseña al dueño.</p>
    </main>
  );
}
