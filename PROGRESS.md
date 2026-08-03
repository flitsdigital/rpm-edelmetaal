# PROGRESS — Webflow → Astro conversie

> Statusbestand voor deze conversie. Een nieuwe sessie leest dit **eerst** en
> hervat bij de huidige fase in plaats van beslissingen opnieuw af te leiden of,
> erger, goedgekeurd werk over te doen. Bijwerken bij elke checkpoint, vóór het
> vragen om akkoord.

**Project:** RPM Edelmetaal (`veenstra-edelmetaal.webflow`)
**Export:** `_webflow_source/` (19 HTML, waarvan **7 echte pagina's** — zie `ANALYSE.md` §1)
**Gestart:** 31 juli 2026 · **Laatst bijgewerkt:** 3 augustus 2026

**Context:** deze conversie is fase 3–5 van het grotere migratieplan
(Webflow + Memberstack → Astro + Supabase). Zie het handoff-document.

## Status

| Fase | Status | Goedgekeurd op | Notities |
|---|---|---|---|
| 0 · Ingest & audit | ✅ goedgekeurd | 31-07-2026 | scope 7 pagina's, formulier → n8n, goldbroker blijft |
| 1 · Foundation + design system | ✅ goedgekeurd | 31-07-2026 | tokens 1-op-1 geverifieerd op 1280px en 479px |
| 2 · Atoms | ✅ goedgekeurd | 31-07-2026 | 12 atoms, computed styles 1-op-1 geverifieerd |
| 3 · Molecules + sections | ✅ goedgekeurd | 31-07-2026 | 11 molecules + 13 secties |
| 4 · Pagina's | ✅ | 31-07-2026 | 7 routes + API-route + n8n-workflow |
| 5 · Interacties + fidelity QA | 🟡 bezig | | visual diff **19,2%** (was 31,2%) |

### Hoofdplan (Webflow + Memberstack → Astro + Supabase)

| Fase | Status | Notities |
|---|---|---|
| 1 · Supabase datamodel | ✅ | Tabellen, views, RLS, grants, 29 gehaltes geseed. Project `fxcxavfmiptvntwuwoqa`. |
| 2 · Prijzen automatisch ophalen | ✅ | **In Supabase, niet n8n**: `pg_cron` + `pg_net`, 8/14/22u. Getest, draait. |
| 3 · Astro publiek | ✅ | Site leest `v_prijzen_publiek` op build-time. |
| 4 · Auth + gating | ✅ | Magic link via `@supabase/ssr`, httpOnly-cookies, middleware op `/inkoopprijzen-b2b`. Nog niet getest met een echte gebruiker — er is er nog geen. |
| 5 · Users + livegang | ⬜ | |

**Fase 4:** alle 7 routes in één keer gebouwd — `/` · `/over-ons` · `/testwijze` ·
`/inkoopprijzen` · `/inkoopprijzen-b2b` · `/contact` · `/404`

## Beslissingen

| # | Beslissing | Reden | Datum |
|---|---|---|---|
| 1 | **dev/-pagina's niet converteren** (5 stuks, 10.738 regels) | Mast-template dev-pagina's, niet van RPM, nergens gelinkt. Onze `/styleguide` + `/components` + `/sections` vervangen ze en zijn live gekoppeld aan de echte tokens. | 31-07-2026 |
| 2 | **`detail_*.html` niet converteren** (4 stuks) | `<body>` is leeg — nooit ontworpen in Webflow. Niets over te nemen. | 31-07-2026 |
| 3 | **Geen `data-theme`-mechanisme** | Staat nergens in de markup; alleen dode `data-theme-toggle`-CSS uit het Mast-template. Site is dark-only. `.u-mode-dark/light` (via `light-dark()`) blijft wél. | 31-07-2026 |
| 4 | CMS: **geen Sanity** | Handoff §5: blogs als Astro Content Collections, prijsdata uit Supabase. | 31-07-2026 |
| 5 | Hosting/rendering: **SSR** | Auth-gating van B2B-prijzen moet server-side. Adapter (Vercel Pro vs Cloudflare Pages) = handoff §9, nog open. | 31-07-2026 |
| 6 | i18n: **n.v.t.** | Eén taal. Alle 19 pagina's `lang="en"` — zie openstaande vraag 2. | 31-07-2026 |
| 7 | Formulier-backend: **Astro API-route → n8n webhook** | n8n draait al, site is toch SSR, geen extra partij of kosten. Honeypot + validatie in de API-route. | 31-07-2026 |
| 8 | **`site: 'https://www.rpmedelmetaal.nl'`, `trailingSlash: 'never'`** | Geverifieerd tegen de live site: apex → 301 naar `www`, en `/over-ons/` → 301 naar `/over-ons`. | 31-07-2026 |
| 18 | **Alleen de 16 gebruikte afbeeldingen gekopieerd** (2,4 MB i.p.v. 13 MB) | De andere 81 bestanden horen bij de dev-pagina's van het Mast-template. Paden en srcsets staan in `src/data/images.ts`, zodat pagina's een sleutel noemen en geen pad. | 31-07-2026 |
| 19 | **B2B-route blijft `/inkoopprijzen-b2b`, login blijft `/auth/login`** | Uit de live sitemap. Mijn eerdere `/b2b/inkoopprijzen` en `/login` zouden onnodige redirects hebben opgeleverd; slugs blijven identiek. | 31-07-2026 |
| 9 | Images: **Astro `<Image>`**, terugvallen op `<img>` waar de visual diff het straft | 13 MB aan afbeeldingen, veel dubbele resoluties. | 31-07-2026 |
| 10 | **Scope: 7 pagina's** (`/`, `/over-ons`, `/testwijze`, `/inkoopprijzen`, `/b2b/inkoopprijzen`, `/contact`, `/404`) | Bevestigd door gebruiker. dev/-, detail_- en 401-pagina's vervallen. | 31-07-2026 |
| 11 | **Goldbroker-widget 1-op-1 behouden** | Bevestigd door gebruiker. Iframe blijft staan op beide pagina's; zekerste route qua fidelity. | 31-07-2026 |
| 12 | **Goudmarge: particulier 8800 / zakelijk 6500 per kilo** | Bevestigd door gebruiker (gecorrigeerd van 8000 → 8800). Particuliere prijzen blijven dus gelijk; alleen zakelijk gaat omhoog — precies zoals de handoff voorspelde. De 8000 in de n8n-code was een bug. | 31-07-2026 |
| 13 | **Astro 5.x, niet 7.x** | Kort op 7.1.6 gedraaid; `@astrojs/check` staat nog op 0.9.10 en herkende `interface Props` daar niet meer, waardoor propvalidatie stil uitviel. Typed props zijn een architectuurregel, dus terug naar 5.18.2. Heroverwegen zodra de checker meekomt. | 31-07-2026 |
| 15 | **Iconen als data-module** (`src/data/icons.ts`) i.p.v. sprite of losse bestanden | 17 unieke SVG's, 76× herhaald in de export (45 kB, waarvan 24 kB logo's). Eén TS-bestand, geen build-stap, geen dependency. De no-op Figma-`<mask>`-blokken zijn eruit; resterende ids per icoon genamespaced. | 31-07-2026 |
| 16 | **`Field` is één component voor input/select/textarea, en staat in molecules/** | Die drie deelden in de export exact dezelfde 25 regels styling. Label + control = twee dingen, dus een molecule, niet een atom. | 31-07-2026 |
| 17 | **Typografische schaal als `.h1`…`.h6` / `.p-xl`…`.p-sm` in base.css** | Element en uiterlijk worden los gebruikt (een `<h3>` met de h6-schaal), en `RichText` krijgt CMS-HTML zonder component eromheen. De export deed dit ook zo. Heading en Text zijn nu dunne wrappers. | 31-07-2026 |
| 20 | **Hosting: Vercel Pro**, `@astrojs/vercel` v8 met `output: 'static'` en per-route opt-out | Bevestigd door gebruiker. Contentpagina's blijven prerendered; alleen `/api/taxatie` draait server-side. `astro add vercel` faalde (wilde v11, dat is voor Astro 7) — handmatig v8 geïnstalleerd. | 31-07-2026 |
| 21 | **n8n-workflow `7ok70BWJ7aHF1FNU`** — webhook → normaliseren → honeypot/volledigheidscheck → data table → Gmail → 200 | Gebouwd via de n8n MCP op verzoek. De aanvraag wordt éérst opgeslagen (data table `WkEqFiX9I8noEaB2`) en pas daarna gemaild, met `onError: continueRegularOutput` op Gmail — een maildstoring mag geen lead kosten. | 31-07-2026 |
| 22 | **Wachtwoord-login, zoals het origineel** | `/auth/login` is 1-op-1 nagebouwd van de live pagina: zelfde kaart, kop, tekst, velden en knop. Het herstelscherm was daar een Memberstack-demotooltip die nooit is afgemaakt, dus `/auth/wachtwoord` is nieuw — die doet zowel het instellen na een invite als het herstellen daarna. | 03-08-2026 |
| 23 | **Sessie in httpOnly-cookies, niet in localStorage** | De afscherming gebeurt server-side; een token in localStorage bereikt de server nooit. Dan zou je alsnog client-side moeten afschermen — precies wat er met Memberstack misging. | 03-08-2026 |
| 24 | **B2B-link staat voor iedereen in de nav** | De overige zes routes zijn statisch en weten niet wie er kijkt. Alleen daarvoor JS toevoegen geeft een flits van de verkeerde staat. De URL is geen geheim: zonder sessie volgt een redirect, en de prijzen zitten achter een grant. | 03-08-2026 |
| 14 | **`--nav-bg-height` en `--color-dark` niet in tokens.css** | `--color-dark` staat er wel (kleurprimitive), `--nav-bg-height` is nav-specifiek en hoort in `Navbar.astro` (fase 3). Ook de slider-vars (`--xs/--sm/--md/--lg/--gap`) gaan naar het slidercomponent. | 31-07-2026 |

## Bewuste afwijkingen van het origineel

| Wat | Waarom | Akkoord gebruiker |
|---|---|---|
| `prefers-reduced-motion`-fallback toegevoegd | Toegankelijkheid; origineel negeert de OS-instelling | ⬜ |
| `lang="en"` → `lang="nl"` | Aantoonbaar fout, raakt screenreaders en hyphenation | ⬜ |
| Google Fonts WebFont-loader geschrapt | Dubbel met self-hosted `.woff2`, render-blocking, geen visueel verschil | ⬜ |
| `rel=canonical` toegevoegd | Ontbreekt overal; technisch noodzakelijk bij domeinmigratie | ⬜ |
| Honeypot op formulieren | Origineel heeft geen spambescherming | ⬜ |
| `mast@latest`-CDN vervangen door eigen code | `@latest` is niet gepind — productie hangt aan een derde partij | ⬜ |
| Accordeon-trigger is een echte `<button>` met `aria-expanded` | In de export een `<div data-accordion-toggle>` — niet bedienbaar met het toetsenbord | ⬜ |
| Prijstabel-tabs volgen de WAI-ARIA tabs-pattern | In de export was elke tab een `<div>` met een onzichtbare `<button tabindex="-1">` eroverheen; pijltjestoetsen deden niets | ⬜ |
| Nav-dropdownsysteem niet overgenomen (~150 regels JS) | Geen enkele pagina bevat een `[data-dropdown-toggle]` — ongebruikte Mast-template-code | ⬜ |
| `lang="en"` → `lang="nl"` | Aantoonbaar fout, raakt screenreaders en hyphenation | ⬜ |
| `Button` is een echte `<a>`/`<button>` | Webflow rendeerde een `<div class="button">` met een `aria-hidden` label plus een onzichtbare overlay-link met sr-only tekst — vier elementen en een dubbele toegankelijke naam. Visueel identiek, computed styles identiek. | ⬜ |

## Wat er nog moet gebeuren

### ⛔ Blokkeert livegang

| # | Wat | Wie |
|---|---|---|
| 1 | ~~**Auth bouwen**~~ ✅ gebouwd. `/auth/login` (magic link), `/auth/callback`, `/auth/logout`, middleware op `/inkoopprijzen-b2b`. Geverifieerd zonder sessie en met een vervalste cookie. **Nog niet getest met een echte gebruiker** — die bestaat nog niet; zie #5. | ✅ |
| 2 | **Vercel deploy-hook** aanmaken, als `vercel_deploy_hook` in de Vault, dan `08-deploy-hook.sql` draaien. Zonder deze stap update de database wel maar de site niet. | Jordi |
| 3 | **n8n-workflow `7ok70BWJ7aHF1FNU` publiceren** na controle welke mailbox mag versturen. Nu staat hij uit en geeft `/api/taxatie` een 502. | Jordi |
| 4 | **Redirect-lijst uit Webflow** (Site settings → Publishing). Uit de conversie zelf komt geen enkele redirect — alle slugs blijven gelijk — maar bestaande redirects moeten mee. | Jordi |
| 5 | **3 gebruikers uitnodigen** (Supabase → Authentication → Users → Invite). Zet de redirect-URL van de invitemail op `/auth/callback?terug=%2Fauth%2Fwachtwoord`, anders komen ze binnen zonder ooit een wachtwoord te kiezen en zijn ze na het verlopen van de sessie buitengesloten. Wachtwoord-hashes komen niet uit Memberstack, dus vooraf mailen — anders lijkt de invite op phishing. Daarna één keer echt inloggen en controleren dat de zakelijke prijzen laden: dat pad is nog niet gedraaid. | Jordi |
| 5b | **SMTP instellen** in Supabase (Authentication → Emails). De ingebouwde mailer doet ~3 mails per uur en stuurt vanaf een supabase.io-adres — dat komt bij een zakelijke klant niet aan of in spam. | Jordi |
| 5c | **Site URL + redirect-URL** zetten op `https://www.rpmedelmetaal.nl` (Authentication → URL Configuration), anders wijst de magic link naar localhost. | Jordi |

### ⚠️ Los van de migratie, maar urgent

| # | Wat |
|---|---|
| 6 | **metals.dev API-key roteren.** Staat als querystring in de n8n-node "Get Metals" van workflow `vIyEjjgHUhiJc8Or`, en dus in elke executie-log. In Supabase zit hij wél in de Vault. |
| 7 | **Tab-bug staat live.** Op rpmedelmetaal.nl toont tab "Platina" de palladiumprijzen en andersom — €15,07 in plaats van €33,01 voor 850. In de nieuwe site gecorrigeerd. |

### Beslissingen die nog van jou moeten komen

| # | Vraag | Voorstel |
|---|---|---|
| 8 | **Zes typefouten uit de live teksten corrigeren?** ("inkoop van**goud**", "met**jarenlange**", "jaren lange", "nauwkeurig- middel", "**op** benadering", "de **oud** en vertrouwde"). Nu letterlijk overgenomen. Lijst staat in AUDIT.md. | corrigeren |
| 9 | **Decimaalteken**: nu een punt (`€ 34.70`), zoals live. Een komma is voor een Nederlandse site gebruikelijker. Eén formatter in `src/data/prijzen.ts`. | komma |
| 10 | ~~**Publieke signup?**~~ Niet gebouwd. `signInWithOtp` staat op `shouldCreateUser: false`, dus zelfregistratie kan ook niet per ongeluk. | ✅ invite-only |
| 11 | **De vijf `/dev/*`-pagina's** staan in de live sitemap en zijn mogelijk geïndexeerd. Ze vervallen. | laten 404'en |
| 12 | **`og:image` ontbreekt overal** — ook live. Delen op social media levert geen afbeelding op. | aanleveren |
| 13 | **JSON-LD** (`LocalBusiness`, `FAQPage`) ontbreekt. | ná livegang, zodat de migratie attribueerbaar blijft |

### Afmaken

| # | Wat |
|---|---|
| 14 | **Cron-tests 2 en 3** uit `06-testen.sql`: vuurt pg_cron zelf, en weigert de sanity check echt? Test 1 is gedaan. |
| 15 | **Fidelity van 19,2% omlaag.** Hoogtes kloppen binnen ~100px; wat resteert is horizontale drift. `/over-ons` en `/testwijze` staan het hoogst. |
| 16 | **Hover-, focus- en actieve staten** handmatig nalopen op de echte routes. |
| 17 | **Lighthouse ≥ 90** en het JS-budget verantwoorden (nu 0 `client:`-directives, ~2,7 kB inline). |
| 18 | **Openingstijden, telefoon en adres** in `src/data/site.ts` niet geverifieerd tegen de live footer. |

## Bekende issues / TODO

- [x] ~~Goudmarge~~ → **particulier 8800 / zakelijk 6500** (beslissing 12).
  Bij marktprijs 113,485 €/g blijft particulier ongewijzigd en gaat alleen
  zakelijk omhoog:

  | Gehalte | Particulier (8800) | Zakelijk nu (8000) | Zakelijk nieuw (6500) |
  |---|---|---|---|
  | Goud 24k (999) | 104,58 (gelijk) | 105,38 | **106,88** |
  | Goud 21k (875) | 91,60 (gelijk) | 92,30 | **93,61** |
  | Goud 20k (833) | 87,20 (gelijk) | 87,87 | **89,12** |

- [ ] SEO-gaten in het origineel: geen `og:image`, geen canonical, geen JSON-LD op alle 19 pagina's.
- [ ] Geen cookie-/consentbanner terwijl GA4 draait (`G-687K5LD8PT`) — juridische vraag voor de klant, niet technisch.
- [ ] 63 `\<deleted|variable-uuid\>`-tokens in de CSS opschonen bij token-extractie; een handvol is nog in gebruik en moet hernoemd, niet geschrapt.
- [ ] Prijstabellen krijgen in fase 3 dummy-props; echte data zodra Supabase (handoff fase 1) staat.

## Supabase — wat er staat

Project `fxcxavfmiptvntwuwoqa` (org `rpmedelmetaal@flitsdigital.nl`, free tier).
SQL-bestanden in `supabase/`, op nummer uitvoeren.

| Bestand | Wat |
|---|---|
| `01-datamodel.sql` | tabellen, views, RLS, grants, seed |
| `02-cron.sql` | pg_cron + pg_net, ophalen om 8/14/22u |
| `03-verificatie.sql` | 29 rijen naast de live-waarden |
| `04-fix-views.sql` | **correctie** — view-op-view brak de publieke view |
| `05-monitoring.sql` | cron en log bekijken |
| `06-testen.sql` | drie tests: logica, cron, sanity check |
| `07-fix-ophalen.sql` | **correctie** — key als querystring, niet als header |
| `08-deploy-hook.sql` | Vercel-rebuild na een geslaagde ronde |

**Twee fouten die tijdens het bouwen boven kwamen**, beide gerepareerd:

1. `v_prijzen_publiek` las uit `v_gehalte_prijzen`, die ik voor `anon` had
   ingetrokken. Met `security_invoker = on` heeft de bezoeker óók recht op de
   onderliggende view nodig — de publieke prijstabel zou voor iedereen leeg zijn.
   Nu geen view-op-view meer; de formule zit in `bereken_prijs()`.
2. metals.dev accepteert de key alleen als querystring, niet als `x-api-key`.
   Gaf een 401 met een nietszeggende logregel. De foutmelding bevat nu de
   statuscode en het begin van het antwoord.

**Geverifieerd op 3 augustus 2026:**

- Prijzen op de site komen uit Supabase (marktprijs 113.0001, 29 rijen)
- Geen zakelijk bedrag in de statische output — alleen de CSS-klassenaam
- `anon` op `v_prijzen_b2b` → `permission denied for view v_prijzen_b2b`
- `/inkoopprijzen-b2b` is een serverfunctie, geen HTML-bestand

## Guard-status

`node scripts/guard.mjs` — 31-07-2026 (fase 2): **0 errors, 0 warnings** over 25 bestanden.
`npx astro check` — 0 errors, 0 warnings, 0 hints. `astro build` slaagt.

Staande `guard-ignore`s:

- `src/styles/base.css` (4×) — `important` — de `prefers-reduced-motion`-override moet
  álles verslaan, inclusief inline `animation`-shorthands. Dat kan niet met layers.
- `src/pages/styleguide.astro` — `size-budget` — living documentatie, geen productieroute.
  De herhaalde markup is al uitgesplitst naar `TokenSwatch` / `TokenScale` / `TypeSpecimen`;
  wat overblijft zijn de zeven voorgeschreven secties plus paginascopede layout-CSS.
- `src/pages/components.astro` — `size-budget` — showcase, één blok per atom; het herhaalde
  kader zit in `Specimen`. En `global-css` — één `:global(.heading)`, omdat de kop uit
  `Heading` komt en dus diens scope-hash draagt (astro-gotchas §2).
- `src/components/atoms/Button.astro` — `size-budget` (90 regels, budget 60) — twee varianten
  × vier toestanden. Geen herhaald patroon dat een lager component verbergt.

**Twee eerdere overschrijdingen bleken wél iets te verbergen** en zijn opgelost in plaats van
genegeerd: `Heading` (86) en `Text` (72) herhaalden de typografische schaal die nu één keer in
`base.css` staat, en `Media` (84) perste twee verschillende dingen samen — zie hieronder.

**Wijziging in `scripts/guard.mjs`:** de `size-budget`-regel riep `add()` rechtstreeks aan
en omzeilde daarmee als enige regel de `guard-ignore`-escape die SKILL.md wél documenteert
("keep the file and add a `guard-ignore: <reason>` comment"). Nu honoreert hij een
`guard-ignore: size-budget — <reden>` ergens in het bestand, en rapporteert die reden in de
ignore-lijst zodat de uitzondering zichtbaar blijft.

## Token-verificatie fase 1

Berekende waarden vergeleken tussen `_webflow_source/index.html` (via `npx serve`) en
`/styleguide`, op 1280px en 479px. **Alle 10 getoetste tokens identiek tot op de subpixel**,
inclusief de `@media (max-width: 768px)`-override op `--_layout---spacing--margin-xxl`.

| Token | 1280px | 479px |
|---|---|---|
| body font-size | 15,8769px | 14,6446px |
| h1 | 54,1538px | 35,6692px |
| h2 | 46,7692px | — |
| h3 | 35,8154px | 25,9569px |
| paragraph-lg | 19,8154px | — |
| eyebrow | 12,6769px | 11,4446px |
| section--padding | 77,5312px | 52,8906px |
| card--padding | 23,375px | — |
| container--max-width | 1360px | — |
| grid--gap-main | 24px | — |
| spacing--margin-xxl | 127px | 73,2188px (override actief) |

## Component-verificatie fase 3

Computed styles vergeleken tussen `_webflow_source/inkoopprijzen.html` en `/sections`, 1280px.
**Alle 17 gemeten eigenschappen identiek**, inclusief de valkuil hieronder:

| Onderdeel | Gemeten | Resultaat |
|---|---|---|
| Nav-balk | hoogte 48px, randkleur | identiek |
| Nav | padding 24px, z-index, `position: fixed` + `blur(5px)` | identiek |
| Nav-logo / -link | 192px goud · opacity .6 · padding 8/16px | identiek |
| **CTA-sectie** | padding 115,692px | **identiek** |
| Sectie | padding 77,5385px | identiek |
| Footer | 77,5385px boven, 40px onder | identiek |
| Tabs | padding 19,85/39,69px, achtergrond `#141414` | identiek |
| InkoopCard | padding 48px, rand, gap 32px | identiek |
| PriceRow | hoogte 32px, padding, kleur, gewicht 700 | identiek |

⚠️ **De CTA-padding was bijna fout gegaan.** In de export gebruiken de CTA-secties een eigen
`clamp()` waarin alleen de rem-delen en de grenzen verdubbeld zijn — de vw-component blijft
gelijk. `padding × 2` geeft 155px in plaats van 116px, een verschil van 39px per sectie ×
2 secties × 6 voorkomens. De formule staat nu letterlijk in
`--_components---section--padding-double` / `-half`.

**Interactie getest** (klik + toetsenbord, op `/sections`): tabs wisselen op klik én pijltjes
met correcte `aria-selected`/`hidden`, accordeon opent en sluit siblings met `aria-expanded`,
het gehalte-veld volgt de metaalkeuze (verborgen selects worden ook `disabled`, dus ze komen
niet in de inzending), burgermenu toggelt `data-menu-status` + `aria-expanded`.

**Geshipte JS: 2,7 kB inline, 0 framework-bundles, 0 `client:`-directives.**
De export laadde jQuery + `webflow.js` (55 kB) + GSAP + vier Mast-bundles van een CDN.

## Component-verificatie fase 2

Computed styles vergeleken tussen `_webflow_source/contact.html` en `/components`, op 1280px.
Identiek op alle gemeten eigenschappen:

| Component | Gemeten | Resultaat |
|---|---|---|
| Button | background, color, padding, radius, font-size, line-height, font-family, letter-spacing, border | 10/10 identiek |
| Field (input) | min-height, padding, margin-bottom, border, radius, font-size, line-height, color, background, font-family | 11/11 identiek |
| Field (label) | font-size, line-height, margin-bottom, color, font-family | 5/5 identiek |
| Eyebrow | display, background, color, padding, margin-bottom + hoogte 27px | identiek |
| Row / Col | row-gap 64px, marges −12px, kolompadding 12px, 4/12- en 5/12-verhoudingen | identiek |

**Twee fouten die dit opleverde**, beide gevonden vóór ze fase 3 in konden lekken:

1. `Eyebrow` had ik tot één element samengevouwen. De padding staat in `em` en rekent in de
   export tegen de fontsize van de *ouder* (≈15,9px), niet tegen de eyebrow-schaal (≈12,7px) —
   het label werd 2,4px te smal en te laag. Nu weer twee elementen.
2. `Media` had een `bg`-prop die twee verschillende componenten samenperste. In de export is
   `.bg-img_component` een eigen ding met een **gradient**-overlay (`linear-gradient(0deg, #000,
   transparent)`), niet de vlakke 70%-overlay van `.img-component_bg-overlay` — en die laatste
   variant wordt op geen enkele pagina gebruikt. Nu `Media` + `BgImage` apart.

## Visual-diff status

Nog niet gedraaid — fase 4.
