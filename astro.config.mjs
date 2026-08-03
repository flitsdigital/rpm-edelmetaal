import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Geverifieerd tegen de live site op 31-07-2026:
//   rpmedelmetaal.nl        → 301 naar https://www.rpmedelmetaal.nl/  (www is canoniek)
//   /over-ons               → 200
//   /over-ons/              → 301 naar /over-ons                      (trailingSlash: never)
//
// Hosting: Vercel Pro. Node-runtime, de voorspelbaarste route voor Astro +
// Supabase. Hobby mag niet commercieel gebruikt worden.
//
// `output: 'static'` met per-route opt-out: alle contentpagina's blijven
// prerendered (snel, cachebaar), alleen /api/taxatie draait op de server. In
// fase 4 van het migratieplan komen /inkoopprijzen-b2b en de auth-routes daar
// bij — die hebben de sessie nodig.
export default defineConfig({
  // De dev-toolbar staat in beeld bij de visual diff en telt daar als verschil.
  devToolbar: { enabled: false },
  site: 'https://www.rpmedelmetaal.nl',
  trailingSlash: 'never',
  output: 'static',
  adapter: vercel(),
  integrations: [
    sitemap({
      // De review-routes, de afgeschermde B2B-pagina en de auth-pagina's horen
      // niet in de index. De vijf /dev/*-pagina's uit de oude sitemap vervallen
      // — zie de openstaande vraag in PROGRESS.md.
      filter: (page) =>
        !['/styleguide', '/components', '/sections', '/inkoopprijzen-b2b', '/auth/login'].some(
          (p) => page.replace(/\/$/, '').endsWith(p)
        ),
    }),
  ],
});
