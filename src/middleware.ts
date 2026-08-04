import { defineMiddleware } from 'astro:middleware';
import { maakServerClient } from './lib/supabase-server';

const AFGESCHERMD = ['/inkoopprijzen-b2b'];

export const onRequest = defineMiddleware(async (context, next) => {
  const pad = context.url.pathname.replace(/\/$/, '');
  if (!AFGESCHERMD.includes(pad)) return next();

  const supabase = maakServerClient(context);

  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    const terug = encodeURIComponent(context.url.pathname);
    return context.redirect(`/auth/login?terug=${terug}`, 302);
  }

  context.locals.supabase = supabase;
  context.locals.gebruiker = data.user;
  return next();
});
