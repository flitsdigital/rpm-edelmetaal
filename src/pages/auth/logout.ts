import type { APIRoute } from 'astro';
import { maakServerClient } from '../../lib/supabase-server';

export const prerender = false;

/** POST omdat uitloggen een actie is: een GET zou door een link-preview of een
 *  prefetch van de browser uitgevoerd kunnen worden. */
export const POST: APIRoute = async (context) => {
  await maakServerClient(context).auth.signOut();
  return context.redirect('/', 302);
};

export const GET: APIRoute = ({ redirect }) => redirect('/', 302);
