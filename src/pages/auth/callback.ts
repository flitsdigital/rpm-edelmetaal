import type { APIRoute } from 'astro';
import { maakServerClient } from '../../lib/supabase-server';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const { url, redirect } = context;
  const code = url.searchParams.get('code');
  const terug = url.searchParams.get('terug') ?? '/inkoopprijzen-b2b';

  if (!code) return redirect('/auth/login?fout=geen-code', 302);

  const supabase = maakServerClient(context);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) return redirect('/auth/login?fout=link-verlopen', 302);

  const bestemming = terug.startsWith('/') && !terug.startsWith('//') ? terug : '/inkoopprijzen-b2b';
  return redirect(bestemming, 302);
};
