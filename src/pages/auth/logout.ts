import type { APIRoute } from 'astro';
import { maakServerClient } from '../../lib/supabase-server';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  await maakServerClient(context).auth.signOut();
  return context.redirect('/', 302);
};

export const GET: APIRoute = ({ redirect }) => redirect('/', 302);
