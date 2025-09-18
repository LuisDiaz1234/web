'use server';

import { supabaseService as sb } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function markPaidAction(formData: FormData) {
  const id = String(formData.get('id') || '');
  if (!id) return;
  await sb.from('invoices').update({ status: 'paid' }).eq('id', id);
  revalidatePath('/invoices');
  revalidatePath('/');
}
