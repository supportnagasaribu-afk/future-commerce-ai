import type { FormEvent } from 'react';

export type AiShoppingInterpretation = {
  category: string;
  keywords: string[];
  max_budget_myr: number | null;
  intent: string;
};

export type AiShoppingResponse<TProduct> = {
  ok: boolean;
  interpretation: AiShoppingInterpretation;
  recommendations: TProduct[];
  count: number;
  source: 'supabase_catalogue';
};

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://bzrhhuupcnfgxejndxjo.supabase.co';
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_MzM7ufbE0ajl9uk4eowbtw_eJNpjofH';

export async function requestAiShopping<TProduct>(
  prompt: string,
): Promise<AiShoppingResponse<TProduct>> {
  const response = await fetch(
    SUPABASE_URL + '/functions/v1/ai-shopping-assistant',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
      },
      body: JSON.stringify({ prompt }),
    },
  );

  const payload = await response.json();
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'AI Shopping request failed');
  }
  return payload as AiShoppingResponse<TProduct>;
}
