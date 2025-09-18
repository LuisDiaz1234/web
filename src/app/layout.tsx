import './globals.css';

export const metadata = {
  title: 'Cobrador Pro',
  description: 'Recordatorios automáticos de cobro por WhatsApp + Email',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
