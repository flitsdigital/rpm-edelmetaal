# COMPONENT_MAPPING — Webflow → Astro

Gebaseerd op `audit/audit.json → componentCandidates`, gefilterd op de 7 échte
pagina's (dev/-pagina's van het Mast-template zijn uitgesloten — die leverden de
`styles__*`- en `cc-*`-ruis in de raw audit).

Kolom **Reuse** = aantal voorkomens in de export. Kolom **Waar** = de routes die
het component gebruiken.

---

## Atoms — `src/components/atoms/` ✅ gebouwd

| Webflow class | Astro component | Regels | Props |
|---|---|---|---|
| `container` / `container cc-nav` | `Container.astro` | 32 | `variant?: 'default' \| 'nav'` |
| `row`, `row-justify-*`, `row-gap-*` | `Row.astro` | 56 | `justify?` · `align?` · `gap?` |
| `col col-lg-* col-md-* col-sm-* col-xs-*` | `Col.astro` | 58 | `lg?` · `md?` · `sm?` · `xs?` (1–12) |
| `button` + `btn-text` + `u-link-cover` | `Button.astro` | 90 | `variant` · `href?` · `type?` · `full?` · `disabled?` |
| `heading-component` + `h1`…`h6` | `Heading.astro` | 32 | `level: 1-6` · `size?: 1-6` · `align?` · `tone?` |
| `paragraph-*` | `Text.astro` | 45 | `size` · `tone?` · `align?` · `element?` · `flush?` |
| `eyebrow-component` + `eyebrow` | `Eyebrow.astro` | 45 | `align?` · `flush?` |
| inline SVG's | `Icon.astro` | 44 | `name` (15 iconen) · `size` · `tone?` · `label?` |
| `nav-logo_link` / `section-divider_logo` | `Logo.astro` | 32 | `variant: 'wordmark' \| 'mark'` · `label?` |
| `img-component` + `u-img-cover` | `Media.astro` | 51 | `src` · `alt` · `ratio` · `position?` · `loading?` |
| `bg-img_component` + `bg-img_overlay` | `BgImage.astro` | 39 | `src` · `alt?` · `loading?` |
| `section-divider` + `_line` + `_logo` | `SectionDivider.astro` | 34 | — |

**Verplaatst naar molecules:** `Field.astro` (137) vervangt Input + Select + Textarea in één —
die drie deelden exact dezelfde 25 regels styling. Label + control = twee dingen, dus molecule.

**Bewust géén component:**

- `u-mt-*` / `u-mb-*` blijven utilities in `base.css` (`@layer utilities`). Een schaal, geen
  patroon; er props van maken zou hem op ieder component dupliceren.
- `u-sr-only` idem.
- `u-text-secondary` / `u-text-accent` / `u-text-center` zijn wél props geworden (`tone`, `align`)
  op `Heading` en `Text`.
- Checkbox en Radio: de export heeft er CSS voor, maar geen enkel formulier op de 7 pagina's
  gebruikt ze. Toevoegen wanneer dat verandert.

---

## Molecules — `src/components/molecules/` ✅ gebouwd

| Webflow class | Astro component | Regels | Props |
|---|---|---|---|
| `input-group` + `input` + `input-label` | `Field.astro` | 137 | `name` · `label` · `control` · `placeholder?` · `required?` · `options?` · `rows?` |
| `nav-link` + `nav-link__label` | `NavLink.astro` | 76 | `href` · `current?` |
| `nav-banner_inkoop-item` + `inkoop-icon_sm` | `PriceTicker.astro` | 62 | `metalen: MetaalPrijs[]` |
| `usp-card` | `UspCard.astro` | 40 | `icon` · `title` · `text` |
| `reviews-badge_component` | `ReviewsBadge.astro` | 62 | — (leest `site.ts`) |
| `rich-text` (`w-richtext`) | `RichText.astro` | 26 | `html: string` |
| `accordion-css__*` | `Accordion.astro` | 159 | `items[]` · `closeSiblings?` · `openIndex?` · `id?` |
| formulier + `.w-form-done` / `.w-form-fail` | `TaxatieForm.astro` | 137 | `action?` · `id?` |
| de vier `[data-gehalte]`-selects | `GehalteSelect.astro` | 56 | `bron: string` |
| `inkoopprijzen_item` | `PriceRow.astro` | 92 | `nummer` · `label` · `gehalte` · `prijs` · `zakelijk?` · `accent?` |
| `inkoopprijzen_card` | `InkoopCard.astro` | 55 | `symbool` · `gehalte` · `naam` · `prijs` · `accent?` |
| — (showcase) | `Specimen.astro`, `TokenSwatch`, `TokenScale`, `TypeSpecimen` | | alleen voor de review-routes |

**Vervallen t.o.v. het plan:** `Card`, `FooterLink`, `OpeningHoursRow`, `ReviewCard`. De
`card`/`card-body`-klassen (64×) zaten uitsluitend op de dev-pagina's van het Mast-template;
footerlinks en openingstijden zijn twee regels markup in `Footer` en geen eigen component
waard; en er staat op geen van de zeven pagina's een review-kaart — alleen de badge.

---

## Sections — `src/components/sections/` ✅ gebouwd

| Astro component | Regels | Waar | Bijzonderheden |
|---|---|---|---|
| `Section.astro` | 45 | overal | Basiswrapper. `paddingTop/Bottom`: `default \| none \| double \| half` |
| `Navbar.astro` | 371 | globaal | Prijsbalk, burgermenu < 768px, krimpt bij omlaag scrollen |
| `Footer.astro` | 177 | globaal | Openingstijden, links, jaartal op build-time |
| `HeroHome.astro` | 66 | `/` | Schermvullend beeld, tekst onderin |
| `SectionContent.astro` | 92 | 7× over 3 pagina's | `imagePosition: 'left' \| 'right'` |
| `SectionUsp.astro` | 37 | `/`, `/over-ons`, `/contact` | Raster van `UspCard` |
| `SectionCta.astro` | 68 | 6× | Dubbele verticale ruimte |
| `SectionIntro.astro` | 37 | in andere secties | Gecentreerde kop + inleiding |
| `SectionInkoopprijzen.astro` | 45 | `/` | Compacte rij van vier |
| `SectionPrijstabel.astro` | 216 | `/inkoopprijzen`, `/b2b` | Tabs per metaal; `zakelijk` per rij, alleen op de B2B-route |
| `SectionFaq.astro` | 30 | `/` | Accordeon |
| `SectionContact.astro` | 62 | `/`, `/inkoopprijzen`, `/contact` | Tekst + taxatieformulier |

`SectionOver` en `SectionTaxatie` uit het plan bleken varianten van `SectionContent` en
`SectionUsp` te zijn; `SectionCertificeringen` verviel omdat er geen Swiper op de site staat
(de CDN-bundle werd wel geladen, maar nergens gebruikt).

**Layout:** `PageLayout.astro` (39) = `BaseLayout` + `Navbar` + `Footer`. Losgehouden zodat de
auth-routes in fase 4 wel de meta en fonts krijgen, maar niet de site-navigatie.

---

## Hydratie — definitief

| Component | Directive | JS |
|---|---|---|
| `Navbar` | scoped `<script>` | menu-toggle + scrollrichting |
| `Accordion` | scoped `<script>` | open/dicht + siblings sluiten |
| `SectionPrijstabel` | scoped `<script>` | tabs + pijltjesnavigatie |
| `GehalteSelect` | scoped `<script>` | metaal → gehalte-veld |
| `TaxatieForm` | scoped `<script>` | fetch + done/fail |

**Resultaat: 2,7 kB inline JS, 0 framework-bundles, 0 `client:`-directives.** De export laadde
jQuery + `webflow.js` (55 kB) + GSAP + vier `mast@latest`-bundles van een CDN. Swiper is niet
nodig gebleken.

---

## Wat níét overgenomen wordt

| Webflow | Reden |
|---|---|
| `styles__*`, `cc-*`, `slot` (327 + 89 + 67×) | Mast dev-template, alleen op `dev/`-pagina's |
| `data-theme-toggle` CSS | Toggle staat nergens in de body — dode CSS |
| `w-mod-js` / `w-mod-touch` | Geen enkele stijl hangt eraan |
| `data-wf-page` / `data-wf-site` | Webflow-runtime |
| `w-dyn-bind-empty` placeholders | Lege CMS-bindings; content komt uit Supabase |
| `data-ms-content` / `data-ms-action` | Client-side gating — vervangen door server-side (zie `ANALYSE.md` §6) |
| `webflow.js`, jQuery | Geen IX2-interacties in gebruik |
| `mast@latest/theme-toggle.min.js`, `modal.min.js` | Aangestuurde markup bestaat niet in de export |

---

## Nog te bepalen bij het bouwen

- `Icon.astro`: de export gebruikt overal inline SVG's. Inventariseren hoeveel
  unieke iconen er zijn en of een sprite loont. Beslissing in fase 2.
- `SectionContent.astro`: 7 generieke `section`-blokken over 3 pagina's — pas bij
  het bouwen blijkt of dat één component met props wordt of twee varianten.
- Prijstabel-componenten krijgen in fase 3 dummy-data; de echte props sluiten aan
  op `v_prijzen_publiek` / `v_prijzen_b2b`.
