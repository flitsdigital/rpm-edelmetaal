# FIDELITY — RPM Edelmetaal

Stand na fase 4. De visual diff draait tegen de Webflow-export (`npx serve
_webflow_source -l 5599`) op vier breekpunten.

## Visual diff — 3 augustus 2026

`node scripts/visual-diff.mjs` · **gemiddeld 18,93% afwijkende pixels over 20 vergelijkingen.**
Beginstand was 31,18%.

| Route | 1440 | 991 | 767 | 479 | Hoogte Δ @1440 |
|---|---|---|---|---|---|
| inkoopprijzen | **4,1%** | 12,6% | 8,4% | 13,9% | −47px |
| home | 16,1% | 23,3% | 21,3% | 17,8% | −102px |
| over-ons | 21,4% | 26,4% | 18,1% | 32,1% | +47px |
| testwijze | 22,7% | 25,0% | 25,4% | 33,2% | +115px |
| contact | 26,8% | 11,8% | 9,2% | 8,9% | −444px |

**De hoogtes kloppen nu binnen ~100px** op pagina's van 3000–10000px, en de
sectievolgorde komt 1-op-1 overeen.

**Op smallere breedtes lopen home en inkoopprijzen juist verder uiteen**
(+989 tot +2762px) — en dat hoort zo. De export toont daar lege CMS-lijsten,
de nieuwe site 4 prijskaarten en 29 gehaltes. Onder 991px stapelen die
verticaal, dus het verschil vermenigvuldigt.

### Wat de diff structureel niet kan meten

- **De prijsbalk in de nav.** De export toont "No items found" omdat Webflow geen
  CMS-content exporteert; de nieuwe site toont vier echte prijzen. Dat verschil
  staat op élke pagina en bovenaan élke screenshot.
- **De prijstabellen.** Zelfde reden: in de export leeg, hier 29 gehaltes.
- **De Memberstack-badge.** De export toont linksonder een "Test Mode"-balkje van
  Memberstack. Verdwijnt.

## ✅ `/inkoopprijzen-b2b` is nu server-side afgeschermd (3 augustus 2026)

Geverifieerd tegen de dev-server:

| Verzoek | Resultaat |
|---|---|
| `/inkoopprijzen-b2b` zonder cookie | 302 → `/auth/login?terug=%2Finkoopprijzen-b2b` |
| `/inkoopprijzen-b2b` met vervalste `rpm-auth`-cookie | 302 → `/auth/login` |
| `/auth/callback` zonder code | 302 → `/auth/login?fout=geen-code` |
| Zakelijke prijzen in statische HTML | geen enkele |
| `/inkoopprijzen-b2b` in `dist/` | geen HTML-bestand, alleen een serverfunctie |
| `/inkoopprijzen-b2b` en `/auth/login` in de sitemap | uitgesloten |

De middleware doet de redirect, de grant op `v_prijzen_b2b` doet het slot. Het
buitenste mag falen — precies wat hieronder beschreven staat over het origineel.

## ⚠️ Hoe het in de export was

Niet omdat het lastig was, maar omdat de pagina in de export niet te bekijken is:
**Memberstack stuurt elke bezoeker zonder sessie door naar de homepage.**
Geverifieerd met Playwright:

| | Eindpagina | Prijsrijen zichtbaar |
|---|---|---|
| Met Memberstack | `/#` (homepage) | — |
| Memberstack geblokkeerd | 🔒 Inkoopprijzen B2B | 4 |

De volledige B2B-HTML wordt dus aan iedereen geserveerd; de afscherming is een
client-side redirect die je omzeilt door één script te blokkeren. Dat bevestigt
de aanname uit de handoff, en het is het argument voor server-side grants in
fase 4 van het migratieplan.

## Gevonden en gerepareerd

| Wat | Hoe gevonden |
|---|---|
| Homepage-sectie "Over ons" had de verkeerde structuur — kop links, tekst rechts en dáéronder twee portretten, niet tekst-naast-beeld | screenshot-vergelijking |
| De taxatie-sectie op de homepage miste het volle-breedte 4:3-beeld erboven (≈1080px) | hoogteverschil van 1345px op één sectie |
| De winkel-sectie op /over-ons gebruikte `BgImage` terwijl het origineel een gewoon 4:3-beeld ná de tekst heeft | hoogteverschil van 962px |
| `/inkoopprijzen` miste de rij van vier compacte prijskaarten boven de tabel | hoogteverschil van 422px |
| De FAQ had 3 items; het origineel heeft er 4 ("Welke soorten goud kopen jullie in?") | sectiehoogte |
| Footerlogo stond op 5rem; het origineel gebruikt daar `.nav-logo_link` (12rem) | opgemerkt door de gebruiker |
| CTA-padding: het origineel schaalt alleen de rem-delen, niet de vw-component | tokenvergelijking in fase 3 |
| **Zes ontbrekende section-dividers** — 3 op /testwijze, 2 op /over-ons, 1 op /contact en 1 op /inkoopprijzen, elk 215px | structuurvergelijking van de directe kinderen van `<main>` |
| `svg { display: block }` in mijn reset — staat niet in de export. Een inline SVG krijgt regelhoogte mee; dat scheelde 7px per divider | dividerhoogte 208 vs 215px |
| **De 8rem nav-compensatie ontbrak.** De nav staat vast bovenaan; `.page-main` geeft de inhoud 8rem ruimte om er niet onder te vallen, en `.page-main.has-bg` zet dat op 0 voor de hero. Zonder die regel begon élke pagina zonder hero 128px te hoog, waardoor alles eronder verschoof en als verschil telde | eerste sectie op y=0 i.p.v. y=128 |
| Paginakoppen stonden op 56px waar het origineel 48px heeft. Ik gebruik een `<h1>` voor de semantiek (`/over-ons`, `/testwijze` en `/contact` hebben er in het origineel géén), maar nu op de h2-schaal via `Heading size` | fontsize-vergelijking van de eerste kop |
| De Astro dev-toolbar stond in de screenshots | zichtbaar in de diff-crop |

## Bewuste afwijkingen van het origineel

Elk van deze is een verbetering die de diff als verschil telt.

| Wat | Waarom |
|---|---|
| `prefers-reduced-motion`-fallback | Het origineel negeert de OS-instelling volledig |
| `lang="en"` → `lang="nl"` | Aantoonbaar fout; raakt screenreaders en woordafbreking |
| `Button` is een echte `<a>`/`<button>` | Webflow rendeerde een `<div>` met een `aria-hidden` label en een onzichtbare overlay-link — vier elementen en een dubbele toegankelijke naam |
| Accordeon-trigger is een `<button>` met `aria-expanded` | Was een `<div>`, niet bedienbaar met het toetsenbord |
| Prijstabel-tabs volgen de WAI-ARIA tabs-pattern | Waren `<div>`s met een onzichtbare `<button tabindex="-1">` eroverheen; pijltjestoetsen deden niets |
| Honeypot + focusverplaatsing op het formulier | Het origineel had geen spambescherming en meldde de verzending niet aan screenreaders |
| Verborgen gehalte-selects worden ook `disabled` | Anders bevat de inzending vier gehaltes in plaats van één |
| Google Fonts-loader geschrapt | Dubbel met de self-hosted `.woff2`, render-blocking, geen visueel verschil |
| `mast@latest`-CDN vervangen door eigen code | Niet gepind — productie hing aan een derde partij |
| `rel=canonical` toegevoegd | Ontbrak op alle 19 pagina's |
| Alt-teksten ingevuld | Waren overal leeg |
| Inloggen met magic link i.p.v. wachtwoord | Het wachtwoordveld kwam van Memberstack; het bijbehorende reset-scherm in de export is een onafgemaakte placeholder ("Step 1 of 4"). De hashes komen niet mee uit Memberstack, dus iedereen moet toch opnieuw. Geen wachtwoord = niets te lekken of te resetten |
| Zelfde melding bij een bekend en een onbekend adres | Anders kun je met het inlogformulier uitvinden wélke adressen een account hebben |
| B2B-link staat altijd in de nav | Was `data-ms-content` (client-side). De overige pagina's zijn statisch en weten niet wie er kijkt; alleen daarvoor JS toevoegen geeft een flits van de verkeerde staat. De URL is geen geheim — het slot zit in de database |
| Uitloggen is een POST | Een GET-uitloglink wordt door prefetch of een link-preview uitgevoerd |

## Prijsdata nagebouwd van de live site — 3 augustus 2026

De Webflow-export bevat geen CMS-content, dus de prijsblokken waren tot nu toe
gebaseerd op aannames. Ze zijn nu overgenomen van www.rpmedelmetaal.nl zelf.
Vier dingen bleken anders dan aangenomen:

| Wat | Aangenomen | Werkelijk |
|---|---|---|
| Prijsbalk in de nav | inkoopprijs van het hoogste gehalte ("Goud 24k: €104,58") | **marktprijs** met 4 decimalen ("Goud: €113.2661 p/gram") |
| Tegel op de prijskaart | symbool + gehalte (AU / 24k) | **atoomnummer + symbool** (79 / AU) |
| Label bij de prijs | "Particulier:" overal | **"Prijs particulier:"** bij goud, **"Prijs:"** bij de rest |
| Getalnotatie | komma (34,86) | **punt** (34.79) |

Alle 29 gehaltes komen nu letterlijk van de live site. De zakelijke prijzen staan
daar niet publiek; die zijn berekend uit dezelfde marktprijs met de bevestigde
marge van 6500/kg voor goud (beslissing 12).

⚠️ **De punt als decimaalteken** is Webflow's ruwe getaluitvoer. Voor een
Nederlandse site is een komma gebruikelijker, maar dat verandert wat klanten
lezen — dus letterlijk overgenomen en als vraag genoteerd in PROGRESS.md.

## Bug in het origineel, wél gecorrigeerd

Op `/inkoopprijzen` staat tab 3 op **Platina** maar toont het **Palladium**-paneel,
en tab 4 andersom. Geverifieerd op de live site: de tabknoppen staan in de
volgorde Goud–Zilver–Platina–Palladium, de panelen in Goud–Zilver–Palladium–Platina.
Een bezoeker die op Platina klikt ziet dus palladiumprijzen — op een pagina waar
mensen de waarde van hun edelmetaal aflezen.

Hier zijn de rijen aan het juiste metaal gekoppeld en komen label en inhoud uit
hetzelfde object, dus label en paneel kunnen niet meer uit de pas lopen. De
volgorde komt uit `metaal_volgorde` in Supabase; er is geen tweede lijst die
ermee uit de pas kan raken.

Nagemeten op de nieuwe site (3 augustus 2026, eerste rij per paneel):

| Tab | Paneel | Eerste prijs |
|---|---|---|
| AU Goud | 0 | 34,70 |
| AG Zilver | 1 | 0,88 |
| PT Platina | 2 | 32,61 |
| PD Palladium | 3 | 14,88 |

Platina hoger dan palladium, zoals het hoort. Live staat op tab "Platina" nog
€15,07 — de palladiumprijs.

## Nog te doen (fase 5)

- [ ] De resterende ~19% analyseren. De hoogtes kloppen nu grotendeels, dus dit
      is horizontale/positionele drift — waarschijnlijk kolombreedtes en
      regelafbrekingen. Open de diff-PNG's per route.
- [ ] `/over-ons` en `/testwijze` staan het hoogst (24% resp. 20% @1440).
- [ ] Beeldkeuze per slot nalopen — een aantal is op basis van bestandsnaam
      gekozen en niet geverifieerd tegen het origineel.
- [ ] Handmatige controle van hover-, focus- en actieve staten op de echte routes.
- [ ] Lighthouse ≥ 90 en het JS-budget per `client:`-directive verantwoorden
      (nu: 0 directives, ~2,7 kB inline).
- [ ] `_webflow_source` verwijderen, dode assets opruimen.
