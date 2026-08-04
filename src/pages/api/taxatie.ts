import type { APIRoute } from 'astro';

export const prerender = false;

const WEBHOOK = import.meta.env.N8N_TAXATIE_WEBHOOK;

const VELDEN = ['naam', 'email', 'adres', 'metaal', 'bericht', 'bron'] as const;

const json = (data: unknown, status: number) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  if (!WEBHOOK) {
    console.error('N8N_TAXATIE_WEBHOOK ontbreekt — inzending niet doorgezet.');
    return json({ ok: false, reden: 'niet-geconfigureerd' }, 500);
  }

  const form = await request.formData();
  const veld = (naam: string) => String(form.get(naam) ?? '').trim();

  if (veld('website')) return json({ ok: true }, 200);

  const payload: Record<string, string> = {};
  for (const naam of VELDEN) payload[naam] = veld(naam);

  payload.gehalte =
    [...form.entries()]
      .find(([k]) => k.startsWith('gehalte-'))?.[1]
      ?.toString()
      .trim() ?? '';

  if (!payload.naam || !payload.email.includes('@')) {
    return json({ ok: false, reden: 'ongeldig' }, 400);
  }

  const res = await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch((error) => {
    console.error('n8n onbereikbaar:', error);
    return null;
  });

  if (!res?.ok) return json({ ok: false, reden: 'verzenden-mislukt' }, 502);
  return json({ ok: true }, 200);
};
