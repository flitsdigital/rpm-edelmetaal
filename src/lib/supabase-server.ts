import { createServerClient, parseCookieHeader, type CookieOptionsWithName } from '@supabase/ssr';
import type { APIContext } from 'astro';

const opties: CookieOptionsWithName = {
  name: 'rpm-auth',
  httpOnly: true,
  sameSite: 'lax',
  secure: import.meta.env.PROD,
  path: '/',
};

export function maakServerClient({ cookies, request }: Pick<APIContext, 'cookies' | 'request'>) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: opties,
      cookies: {

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
