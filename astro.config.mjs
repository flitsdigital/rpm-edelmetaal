import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

/** Styleguide, componenten- en sectie-overzicht: gereedschap om het design
 *  system te bekijken, geen content. Ze staan daarom buiten `src/pages/` en
 *  worden alleen in dev als route ingehangen — in de productiebuild bestaan ze
 *  simpelweg niet.
 *
 *  Niet weggooien: bij een volgende wijziging aan het design system wil je ze
 *  weer, en `npm run dev` geeft ze meteen terug. */
const reviewRoutes = {
  name: 'review-routes-alleen-in-dev',
  hooks: {
    'astro:config:setup': ({ command, injectRoute }) => {
      if (command === 'build') return;
      for (const naam of ['styleguide', 'components', 'sections']) {
        injectRoute({ pattern: `/${naam}`, entrypoint: `./src/dev-pages/${naam}.astro` });
      }
    },
  },
};

// Geverifieerd tegen de live site op 31-07-2026:
//   rpmedelmetaal.nl        → 301 naar https://www.rpmedelmetaal.nl/  (www is canoniek)
//   /over-ons               → 200
//   /over-ons/              → 301 naar /over-ons                      (trailingSlash: never)
//
// Hosting: Vercel Pro. Node-runtime, de voorspelbaarste route voor Astro +
// Supabase. Hobby mag niet commercieel gebruikt worden.
//
// `output: 'static'` met per-route opt-out: alle contentpagina's blijven
// prerendered (snel, cachebaar). /api/taxatie, /inkoopprijzen-b2b en de
// auth-routes draaien op de server — die hebben het request of de sessie nodig.
export default defineConfig({
  // De dev-toolbar staat in beeld bij de visual diff en telt daar als verschil.
  devToolbar: { enabled: false },
  site: 'https://www.rpmedelmetaal.nl',
  trailingSlash: 'never',
  output: 'static',
  adapter: vercel(),

  // Zonder deze lijst vertrouwt Astro de `Host`/`X-Forwarded-Host` van de proxy
  // niet en valt `Astro.url` terug op `https://localhost`. De CSRF-check
  // vergelijkt de `Origin`-header daarmee, dus élke POST achter Vercel wordt
  // "Cross-site POST form submissions are forbidden" — inloggen dus ook.
  //
  // Niet de check uitzetten: dan staat het inlogformulier open voor cross-site
  // POSTs. Wel zeggen wélke hosts we zijn.
  security: {
    allowedDomains: [
      { hostname: 'rpmedelmetaal.nl', protocol: 'https' },
      { hostname: '**.rpmedelmetaal.nl', protocol: 'https' },
      // Vercel-previews en de standaard *.vercel.app-URL.
      { hostname: '**.vercel.app', protocol: 'https' },
    ],
  },
  integrations: [
    reviewRoutes,
    sitemap({
      // De afgeschermde B2B-pagina en de loginpagina horen niet in de index. De
      // review-routes worden in productie al niet gebouwd. De vijf
      // /dev/*-pagina's uit de oude sitemap vervallen — zie PROGRESS.md.
      filter: (page) =>
        !['/inkoopprijzen-b2b', '/auth/login', '/auth/wachtwoord'].some((p) =>
          page.replace(/\/$/, '').endsWith(p)
        ),
    }),
  ],
});
