import type { APIRoute } from 'astro';

/** Ontvangt het taxatieformulier en zet het door naar n8n.
 *
 *  De webhook-URL staat in een env-variabele, niet in de code: hij is geen
 *  geheim maar wel omgevingsafhankelijk (test- vs productie-URL van n8n).
 *
 *  Waarom er een tussenstap zit en het formulier niet rechtstreeks naar n8n
 *  post: dan zou de webhook-URL in de client-bundle staan en had je CORS op
 *  n8n nodig. Nu blijft hij server-side.
 */
export const prerender = false;

const WEBHOOK = import.meta.env.N8N_TAXATIE_WEBHOOK;

/** Wat n8n verwacht. Alles wat hier niet in staat gaat niet mee. */
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

  // Honeypot: onzichtbaar voor mensen, ingevuld door bots. Stilletjes 200
  // teruggeven — een bot die een foutmelding krijgt, probeert het opnieuw.
  if (veld('website')) return json({ ok: true }, 200);

  const payload: Record<string, string> = {};
  for (const naam of VELDEN) payload[naam] = veld(naam);

  // Het gehalte-veld heet per metaal anders (gehalte-goud, gehalte-zilver, …)
  // en alleen het actieve veld wordt meegestuurd — zie GehalteSelect.
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
