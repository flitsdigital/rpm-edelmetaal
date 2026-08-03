import { defineMiddleware } from 'astro:middleware';
import { maakServerClient } from './lib/supabase-server';

/** Routes die een sessie vereisen. */
const AFGESCHERMD = ['/inkoopprijzen-b2b'];

/** De redirect, niet het slot.
 *
 *  Dit stuurt een bezoeker zonder sessie naar de loginpagina — vriendelijker dan
 *  een permission error. Maar het is nadrukkelijk NIET waar de afscherming op
 *  rust. Dat is de grant in Supabase: `v_prijzen_b2b` is ingetrokken voor `anon`,
 *  dus zelfs als deze middleware er niet zou zijn, of iemand vindt een route
 *  eromheen, komt er geen zakelijke prijs uit de database.
 *
 *  Twee sloten dus, en het buitenste mag falen.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const pad = context.url.pathname.replace(/\/$/, '');
  if (!AFGESCHERMD.includes(pad)) return next();

  const supabase = maakServerClient(context);

  // getUser() valideert het token bij Supabase. getSession() leest alleen de
  // cookie en is dus te vertrouwen voor weergave, niet voor toegang.
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    const terug = encodeURIComponent(context.url.pathname);
    return context.redirect(`/auth/login?terug=${terug}`, 302);
  }

  context.locals.supabase = supabase;
  context.locals.gebruiker = data.user;
  return next();
});
