# ANALYSE — RPM Edelmetaal (veenstra-edelmetaal.webflow)

Fase 0 van de Webflow → Astro conversie. Dit is de audit *geïnterpreteerd* —
`audit/AUDIT_RAW.md` is de machine-output.

Export: 19 HTML · 3 CSS (6.674 regels) · 1 JS (webflow.js, 55 kB) · 97 images (13 MB) · 3 fonts.
Laatst gepubliceerd: 31 juli 2026.

---

## 1. Welke pagina's tellen mee

Van de 19 geëxporteerde HTML-bestanden zijn er **7 echte site-pagina's**:

| Bestand | Titel | Sections | Route straks |
|---|---|---|---|
| `index.html` | Goud & Zilver Verkopen Sneek \| RPM Edelmetaal Friesland | 11 | `/` |
| `over-ons.html` | Over ons \| RPM Edelmetaal | 5 | `/over-ons` |
| `testwijze.html` | Testwijze \| RPM Edelmetaal | 7 | `/testwijze` |
| `inkoopprijzen.html` | Inkoopprijzen \| RPM Edelmetaal | 4 | `/inkoopprijzen` |
| `inkoopprijzen-b2b.html` | 🔒 Inkoopprijzen B2B | 2 | `/b2b/inkoopprijzen` (gated) |
| `contact.html` | Gratis taxatie aanvragen \| RPM Edelmetaal | 3 | `/contact` |
| `404.html` | Not Found | — | `/404` |

**Uit scope — voorstel:**

| Bestand | Wat het is | Voorstel |
|---|---|---|
| `dev/styles.html`, `dev/components.html`, `dev/basic-layouts.html`, `dev/inspired-layouts.html`, `dev/test.html` | Dev-pagina's van het **Mast**-template (nocodesupplyco). Niet van RPM, niet gelinkt vanuit de nav. Samen 10.738 regels. | Niet converteren. Onze eigen `/styleguide`, `/components` en `/sections` vervangen ze — en die zijn *live* gekoppeld aan de echte tokens. |
| `401.html` | Webflow's "Protected page" met wachtwoordformulier | Vervalt. Supabase Auth + middleware neemt dit over (`/login`). |
| `auth/login.html`, `auth/signup.html` | Memberstack login/signup | Herbouwen op Supabase Auth in fase 4 van het hoofdplan. Signup: zie open vraag 3. |
| `detail_blog.html`, `detail_gehaltes.html`, `detail_reviews.html`, `detail_inkoopprijzen-base.html` | **Lege** CMS-templates — `<body>` bevat alleen een comment. Nooit ontworpen in Webflow. | Niets over te nemen. Blogs komen als Astro Content Collections (handoff §5). |

→ **Effectief te converteren: 7 pagina's**, niet 19.

---

## 2. Tokens — het systeem is schoon en goed overdraagbaar

Geen Lumos/client-first, maar **Webflow Variables** met collection-prefixes. Drie lagen, precies zoals we willen:

**Laag 1 — primitives** (`:root`, 155 vars)

| Collection | Inhoud |
|---|---|
| `--_color---neutral--*` | `neutral-100: white` · `neutral-200: #999` · `neutral-300: #666` · `neutral-400: #141414` · `neutral-500: black` |
| `--_color---primary--*` | `gold-100: #faf7f0` · `gold-500: #947848` · `gold-600: #816636` |
| `--_typography---*` | Per element (h1…h6, paragraph-xl/lg/body/sm, eyebrow): `font`, `font-size`, `line-height`, `font-weight`, `letter-spacing`, `bottom-margin` + `*-min-rem`/`*-max-rem` |
| `--_layout---*` | `fluid--min: 20` / `fluid--max: 85` · `grid--gap-main/md/sm/button` · `spacing--margin-xs…xxl` |
| `--_components---*` | `button--*`, `card--*`, `input--*`, `input-label--*`, `container--max-width`, `section--padding`, `nav--banner-size: 3rem` |

**Laag 2 — semantisch** (7 vars): `--primary--background`, `--primary--background-secondary`, `--primary--text`, `--primary--text-secondary`, `--primary--accent`, `--primary--accent-light`, `--primary--accent-dark`.

**Laag 3 — componenten** consumeren alleen laag 2. Dat is nu al zo in de Webflow-CSS. Prima uitgangspunt.

**Fluid typography.** Elke `font-size` is een uitgerekende `clamp()` op basis van `*-min-rem`, `*-max-rem` en `--_layout---fluid--min/max` (20rem → 85rem). Die formule nemen we **letterlijk** over — hem "vereenvoudigen" naar een eigen clamp levert direct meetbare afwijkingen op in de visual diff.

**Op te ruimen:** 63 variabelen heten `--_x---y\<deleted|variable-uuid\>` — restanten van in Webflow verwijderde variabelen. Enkele worden nog echt gebruikt (`--_size---0-5rem…`, `--_color---secondary--yellow…`). Bij token-extractie hernoemen naar hun bedoelde naam (`--_size---0-5rem`, `--_color---secondary--yellow`) en de rest schrappen.

### Twee "conflicten" — geen echte conflicten

`wf-audit` markeert `--primary--background` en `--primary--background-secondary`. Het zijn Webflow **component-varianten** (`.w-variant-<uuid>`) die een light/dark-omdraaiing doen via `light-dark()`, door lightningcss gecompileerd naar:

```css
--primary--background: var(--lightningcss-light, var(--_color---neutral--neutral-200))
                       var(--lightningcss-dark,  var(--_color---neutral--neutral-500));
```

met `.u-mode-dark { --lightningcss-light: ; --lightningcss-dark: initial; color-scheme: dark }` en omgekeerd voor `.u-mode-light`.

→ In `themes.css` wordt dat gewoon weer `light-dark()`, of twee expliciete klassen. Geen conflict, wel bewust over te zetten.

### Theming in de praktijk

De site is **dark-only**. `data-theme` staat nergens in de markup; de enige treffers zijn `data-theme-toggle` — en die staan **uitsluitend in een `<style>`-block**, nergens in de body. Dood template-CSS van Mast.

→ **Geen `data-theme`-mechanisme overnemen.** Wel de light/dark-variantcapaciteit in `themes.css` behouden, want de `.u-mode-*`-utilities worden op secties gebruikt. Op de styleguide tonen we beide modes naast elkaar.

---

## 3. Typografie & fonts

- **Cinzel 400** (headings) en **Open Sans 400/700** (body), self-hosted als `.woff2`. Direct te kopiëren naar `public/fonts/`.
- ⚠️ Er staat óók een **Google Fonts WebFont-loader** in de head die Open Sans 300/400/600/700/800 + italics laadt — bovenop de self-hosted versies. Dubbel, render-blocking, en 300/600/800 worden nergens gebruikt. **Voorstel: schrappen**, self-hosted `@font-face` + `preload` behouden. Dit is een performance-winst, geen visuele wijziging (weight 400/700 zijn identiek gedekt).
- `webflow-icons` `@font-face` heeft een lege `src` — Webflow-cruft, weg.

---

## 4. Interacties — wat er echt draait

Alle 6 externe JS-bundles komen van een CDN. Per stuk:

| Bron | Waarvoor | Vervangen door |
|---|---|---|
| `jquery-3.5.1` (Webflow) | Alleen door `webflow.js` gebruikt | Vervalt |
| `webflow.js` (55 kB) | IX2 + nav/slider-runtime. De site gebruikt **geen** IX2-interacties (alle animatie is eigen code) | Vervalt |
| `gsap 3.15` | Gebruikt door Mast's slider/tabs | Als npm-dependency, alleen op de pagina's die het nodig hebben |
| `swiper@11` (CSS + JS) | 167 treffers — marquee's en sliders | npm `swiper`, per-component geladen |
| `mast@latest/slider.min.js`, `tabs.min.js`, `modal.min.js`, `inline-video.min.js`, `theme-toggle.min.js` | Mast-helpers, `@latest` = **niet gepind** | Zie hieronder |
| `goldbroker.com/widget/live/XAU` | Live goudkoers-iframe (2 pagina's) | Zie open vraag 4 |

⚠️ **`mast@latest` is een reëel risico**: het huidige productie-gedrag hangt aan een niet-gepinde jsDelivr-URL van een derde partij. Bij de conversie wordt dit eigen code in de repo — dat is een verbetering, geen regressie.

`theme-toggle.min.js` en `modal.min.js` sturen markup aan die niet in de export voorkomt → niet overnemen.

**Eigen inline JS (wél overnemen, is prima leesbaar):**

| Script | Regels | Wat |
|---|---|---|
| Navigatie | ~11.100 tekens | Multilevel nav: mobile menu (`< 768px`) vs desktop dropdowns, `data-menu-status`, scroll-richting (`data-scrolling-started` / `data-scrolling-direction` op `<body>` → nav krimpt), `showGehalteDropdown()` |
| Accordion | ~1.180 tekens | `data-accordion-status`, optioneel `data-accordion-close-siblings` |
| Utilities | ~1.060 tekens | `font-size-increased`-detectie (a11y, ResizeObserver) + footer-jaartal |

**Breakpoints:** `767` (272×) · `991` (89×) · `479` (77×) · `min-width: 768/992/480`. Plus `< 768px` als JS-breakpoint voor de nav. Exact overnemen.

---

## 5. Content vs. structuur — hier zit het snijvlak met Supabase

8 pagina's bevatten `w-dyn-list` (Webflow CMS-collecties). In de export zijn die **leeg** (`w-dyn-bind-empty`) — Webflow exporteert geen CMS-content. Dat betekent:

| Collectie | Waar zichtbaar | Bron straks |
|---|---|---|
| Gehaltes (29) | `/inkoopprijzen` (3 lijsten), `/b2b` (idem), nav-banner | Supabase `v_prijzen_publiek` / `v_prijzen_b2b` |
| Inkoopprijzen Bases (4) | Nav-banner (`data-navbanner-inkoop="Goud"`), prijstabellen | Supabase `metals` + `v_actuele_marktprijzen` |
| Reviews (1) | Homepage, over-ons | Supabase `reviews` |
| Blogs (5) | Nergens in de export gelinkt | Astro Content Collections (markdown) |

→ **De prijstabellen kunnen we in fase 3 alleen met dummy-data bouwen.** Structuur en styling komen uit de export; de echte cijfers komen uit de view zodra fase 1 van het hoofdplan is goedgekeurd. Dat is geen blocker: het component krijgt gewoon typed props.

De nav-banner toont per metaal `<naam>: € <prijs> p/gram` — die staat op **elke** pagina en is dus een globale prijsfetch in `BaseLayout`.

---

## 6. Gating — de kern van het probleem

In de export staat Memberstack-gating **alleen op nav-links**:

```html
<li data-ms-content="inkoopprijzen-b2b">        <!-- alleen ingelogd -->
<li data-ms-content="!inkoopprijzen-b2b">       <!-- alleen uitgelogd -->
<li data-ms-content="inkoopprijzen-b2b" data-ms-action="logout">
```

De pagina `inkoopprijzen-b2b.html` zelf bevat **geen enkele gating-marker**. De afscherming zat in Webflow/Memberstack page-protection (waarvan `401.html` het formulier is), niet in de markup. In een statische export staat de hele B2B-structuur dus gewoon open.

→ Bevestigt de aanpak uit de handoff: de gating moet in fase 4 **server-side** (grants + middleware), en de zakelijke prijzen mogen nooit in de HTML terechtkomen. Client-side `data-ms-content` verdwijnt volledig.

---

## 7. Formulieren

Eén formulier, driemaal ingezet (identiek) op `/`, `/inkoopprijzen`, `/contact`:

**Velden:** `Name`, `E-mail`, `Adres-postcode-woonplaats`, 4× select (`Select-Goud`, `Select-Zilver`, `Select-Palladium`, `Select-Platina`) + `Select`, `textarea:Bericht`. Success- en error-state aanwezig.

Plus `auth/login` (Email, Password) en `auth/signup` (Email, Email, Password) — die worden Supabase Auth, geen formulier-backend.

⚠️ Webflow's endpoint is dood na export. **Backend-keuze nodig — zie open vraag 1.** Geen honeypot in het origineel; die voegen we toe (spam arriveert binnen dagen).

---

## 8. SEO — hier ontbreekt structureel het een en ander

| Wat | Status in de export |
|---|---|
| `<title>` + `meta description` | ✅ Aanwezig en goed per pagina — letterlijk overnemen |
| `og:title` / `og:description` / `og:type` / `twitter:*` | ✅ Aanwezig |
| **`og:image`** | ❌ **Ontbreekt op alle 19 pagina's** |
| **`rel=canonical`** | ❌ **Ontbreekt op alle 19 pagina's** |
| **JSON-LD / structured data** | ❌ **Nergens.** Voor een lokale inkoper (`LocalBusiness`, `FAQPage` op de homepage) is dat gemiste winst |
| `html[lang]` | ⚠️ **`lang="en"` op alle 19 pagina's, terwijl de content Nederlands is** |
| `sitemap.xml` / `robots.txt` | Niet in de export (Webflow serveert ze zelf) — opnieuw aanmaken |
| Favicon | ✅ `images/favicon.jpg` + `images/webclip.jpg` |
| Redirects | Zitten in Webflow site-settings, **niet in de export** — zie open vraag 5 |

`lang="en"` → `lang="nl"` is een **afwijking van het origineel die ik wil aanbrengen**: het is aantoonbaar fout, het beïnvloedt screenreaders en hyphenation, en het is geen ranking-gok. Wel expliciet vastleggen in `FIDELITY.md`. Canonical, `og:image` en JSON-LD zijn toevoegingen — voorstel: canonical wél (technisch noodzakelijk bij een domeinmigratie), JSON-LD als aparte opdracht ná livegang, zodat de migratie zelf attribueerbaar blijft.

**Analytics:** GA4 `G-687K5LD8PT` via gtag. Geen GTM-container, geen cookiebanner. ⚠️ Nederlandse site zonder consent-mechanisme voor analytics — dat is een juridische vraag voor de klant, geen technische. Ik neem over wat er is en voeg niets toe.

---

## 9. Componenten — wat de audit als patroon herkent

40 klassecombinaties komen ≥3× voor. Na wegen van de dev-pagina's (die veel ruis geven: `styles__*` 327×, `cc-*` 89× — allemaal Mast-template) blijft dit over als échte structuur:

**Layoutsysteem:** een eigen 12-koloms grid (`row` 67× · `col col-lg-4 col-sm-6 col-xs-12` 40× · `container` 78×) met spacing-utilities (`u-mb-md`, `u-mt-sm`, `u-mb-lg`, `u-mt-xxl`). Dat is géén CSS-soep maar een bewust systeem — overnemen als layout-atoms (`Container`, `Row`, `Col`) plus spacing-props, niet als losse utility-klassen.

**Terugkerende blokken:** `button` (56×) · `card` / `card-body` (126×) · `nav-link__label` (63×) · `footer-link` (60×) · `section-divider_line` (42×, het logo-tussen-lijnen-motief dat op de homepage 4× voorkomt) · `input-group` + `input-label` (40× / 36×) · `rich-text-component` (62×) · `heading-component` (44×) · `inkoop-icon_sm` (27×).

De volledige mapping staat in `COMPONENT_MAPPING.md`.

---

## 10. Beslissingen die genomen moeten worden

Ik heb geen enkele hiervan zelf ingevuld — ze veranderen wat er gebouwd wordt.

| # | Vraag | Mijn voorstel |
|---|---|---|
| 1 | **Formulier-backend?** Astro API-route (site is toch SSR) → n8n webhook, of Formspree/Web3Forms | **Astro API-route → n8n webhook.** Je draait n8n al, de site is al SSR vanwege de auth-gating, en er komt geen derde partij bij. |
| 2 | **`lang="en"` → `lang="nl"` corrigeren?** | Ja. Aantoonbaar fout, a11y-impact, geen ranking-risico. |
| 3 | **Publieke signup behouden?** `auth/signup.html` bestaat, maar de handoff zegt 3 gebruikers via invite | Signup-route **niet** bouwen. Invite-only. Anders kan iedereen zich registreren en B2B-prijzen zien. |
| 4 | **Goldbroker-widget behouden?** Live goudkoers-iframe van een derde partij op 2 pagina's | Vervangen door eigen data uit `metal_prices` — je hebt de koers al in de database, en het scheelt een externe iframe. Alleen als de opmaak visueel gelijk kan blijven; anders behouden. |
| 5 | **Redirect-lijst uit Webflow** (Site settings → Publishing) | Nodig vóór livegang. Alle 7 slugs blijven gelijk, dus er komt uit de conversie zelf geen enkele redirect bij. |
| 6 | **Trailing slash** — wat serveert `rpmedelmetaal.nl` nu? | Moet ik verifiëren op de live site voordat ik `astro.config.mjs` vastzet. |
| 7 | **Google Fonts loader schrappen?** | Ja — dubbel met self-hosted, render-blocking, geen visueel verschil. |

---

## 11. Wat dit betekent voor het hoofdplan

De conversie raakt fase 3–5 van de handoff. Volgorde-implicaties:

- **Fase 3 (Astro publiek)** = fase 0–4 van deze skill, maar de prijstabellen krijgen dummy-props tot Supabase staat. Ze zijn dan al af qua opmaak.
- Het is efficiënter om **fase 1 van de handoff (datamodel) parallel** te doen, zodat `/inkoopprijzen` in fase 4 meteen echte data krijgt in plaats van twee keer aangeraakt te worden.
- De **B2B-gating** komt pas in fase 4 van de handoff — tot die tijd bouwen we `/b2b/inkoopprijzen` als route die achter middleware komt, met de zakelijke kolom als aparte prop.

**Blijft blocker voor het hoofdplan** (handoff §11): goud zakelijk **6500 of 8000** per kilo. Die vraag staat los van deze conversie, maar blijft openstaan.
