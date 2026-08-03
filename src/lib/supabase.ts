import { createClient } from '@supabase/supabase-js';

/** Supabase-client met de publieke (anon) sleutel.
 *
 *  Die sleutel mág in de frontend — hij geeft precies de rechten die de RLS-
 *  policies en grants toestaan, niet meer. De service_role-sleutel hoort hier
 *  nooit: die omzeilt RLS volledig en zou de zakelijke prijzen openleggen.
 *
 *  Op dit moment draait alles op build-time (`output: 'static'`), dus deze
 *  client wordt alleen tijdens `astro build` aangeroepen. Vanaf fase 4 gebruikt
 *  de B2B-route dezelfde client mét de sessie van de bezoeker.
 */
const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'PUBLIC_SUPABASE_URL of PUBLIC_SUPABASE_ANON_KEY ontbreekt. ' +
      'Zie .env.example — zonder deze twee kan de site geen prijzen ophalen.'
  );
}

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false },
});
