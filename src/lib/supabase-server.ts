import { createServerClient, parseCookieHeader, type CookieOptionsWithName } from '@supabase/ssr';
import type { APIContext } from 'astro';

/** Supabase-client die de sessie uit cookies leest.
 *
 *  Verschil met `lib/supabase.ts`: die is anoniem en draait op build-time voor
 *  de publieke prijzen. Deze draait per request en weet wie er ingelogd is —
 *  nodig voor `v_prijzen_b2b`, want die view is voor `anon` ingetrokken.
 *
 *  Cookies en niet localStorage: de gating gebeurt server-side, dus de sessie
 *  moet meekomen met het request. Een token in localStorage bereikt de server
 *  nooit, en dan zou je alsnog client-side moeten afschermen — precies wat er
 *  met Memberstack misging.
 */
const opties: CookieOptionsWithName = {
  name: 'rpm-auth',
  httpOnly: true,
  sameSite: 'lax',
  secure: import.meta.env.PROD,
  path: '/',
};

/** Neemt `Astro` in een pagina, of de context in een API-route of middleware —
 *  beide hebben `cookies` en `request`. */
export function maakServerClient({ cookies, request }: Pick<APIContext, 'cookies' | 'request'>) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: opties,
      cookies: {
        // Lezen uit de request-header, niet uit `cookies`: AstroCookies kent
        // geen getAll(), en Supabase splitst grote sessies over meerdere cookies.
        getAll: () =>
          parseCookieHeader(request.headers.get('cookie') ?? '').map(({ name, value }) => ({
            name,
            value: value ?? '',
          })),
        setAll: (nieuw) => {
          for (const { name, value, options } of nieuw) {
            cookies.set(name, value, options);
          }
        },
      },
    }
  );
}
