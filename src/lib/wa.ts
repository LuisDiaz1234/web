import 'server-only';

/** Enviar WhatsApp según proveedor (.env) */
export async function sendWA(to: string, message: string): Promise<'OK'> {
  const provider = (process.env.WHATSAPP_PROVIDER || 'meta').toLowerCase();
  if (provider === 'twilio') return sendTwilio(to, message);
  return sendMeta(to, message);
}

/** --- Helpers --- */
function normalizeE164(n: string): string {
  const s = n.trim().replace(/[^\d+]/g, '');
  return s.startsWith('+') ? s : '+' + s.replace(/^(\+)?/, '');
}

/** --- Meta (WhatsApp Cloud API) --- */
async function sendMeta(to: string, body: string): Promise<'OK'> {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_TOKEN;
  if (!id || !token) throw new Error('Meta WA sin credenciales');

  const toNum = normalizeE164(to).replace(/^\+/, '');

  const res = await fetch(`https://graph.facebook.com/v20.0/${id}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: toNum,
      type: 'text',
      text: { preview_url: true, body },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Meta ${res.status} ${txt}`);
  }
  return 'OK';
}

/** --- Twilio (Sandbox o número aprobado) --- */
async function sendTwilio(to: string, body: string): Promise<'OK'> {
  const sid = process.env.TWILIO_SID;
  const auth = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // 'whatsapp:+14155238886'
  if (!sid || !auth || !from) throw new Error('Twilio WA sin credenciales');

  const toAddr = 'whatsapp:' + normalizeE164(to);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const params = new URLSearchParams({ To: toAddr, From: from, Body: body });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${sid}:${auth}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Twilio ${res.status} ${txt}`);
  }
  return 'OK';
}
