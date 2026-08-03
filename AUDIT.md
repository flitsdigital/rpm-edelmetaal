# AUDIT — nieuwe site vs. www.rpmedelmetaal.nl

Uitgevoerd 3 augustus 2026, tegen de **live site** (niet de Webflow-export — die
bevat geen CMS-content). Vergeleken per pagina: alle koppen, alinea's,
lijstitems, links, afbeeldingen, iframes en meta-tags.

## Samenvatting

| | Resultaat |
|---|---|
| Teksten | **77 van 79 letterlijk gelijk**. De 2 resterende zijn Webflow's Engelse formulierbevestiging, bewust vervangen. |
| Titels & meta-descriptions | **5 van 5 exact gelijk** |
| Afbeeldingen | **5 van 5 pagina's gelijk aantal en gelijke bestanden** |
| Links | **5 van 5 pagina's gelijk** |
| Prijsdata | 29 gehaltes, letterlijk overgenomen |

## Gevonden en gerepareerd tijdens deze audit

| # | Wat | Ernst |
|---|---|---|
| 1 | **FAQ-antwoord 3 was verzonnen.** Ik had "Meestal direct tijdens de taxatie, en anders binnen 24 uur" geschreven; live staat "Wij doen een direct reëel bod na de taxatie, u ontvangt meteen antwoord." | **Hoog** — verzonnen klantcommunicatie |
| 2 | **Sectie ontbrak op `/inkoopprijzen`:** de kop "Snel en eerlijk inzicht in uw edelmetalen" met de tekst "Klik op de tabs om de actuele inkoopprijzen … te bekijken" stond niet in de nieuwe site | Hoog |
| 3 | Drie alinea's waren opgesplitst in losse `<p>`'s waar het origineel `<br>` binnen één alinea gebruikt (home, over-ons, testwijze). Dat scheelt ~10px witruimte per breuk | Middel |
| 4 | De XRF-opsomming had ik als `<ul>` gemaakt; het origineel is één alinea met `•`-tekens | Laag |

## Tekstwijzigingen die ik had aangebracht — nu teruggedraaid

Ik had zes typefouten stil gecorrigeerd. Dat hoort niet bij een technische
migratie: dan is een tekstverschil niet meer te herleiden. **Alles staat nu
letterlijk zoals live.** Wil je ze alsnog gecorrigeerd hebben, dan is het één
regel per stuk.

| Pagina | Live (nu ook in de nieuwe site) | Voorstel |
|---|---|---|
| home | "de inkoop van**goud**, zilver" | spatie erbij |
| home | "familiebedrijf **met**jarenlange ervaring" | spatie erbij |
| over-ons | "familiebedrijf met **jaren lange** ervaring" | "jarenlange" |
| testwijze | "is een **nauwkeurig-** middel" | streepje weg |
| testwijze | "kan je op die manier **op** benadering keuren" | "bij benadering" |
| testwijze | "om de **oud** en vertrouwde strijkproef" | "oude" |

Daarnaast staat op **`/inkoopprijzen`** de zin *"Bezoek onze 'inkoopprijzen'
pagina voor het volledige overzicht"* — op de inkoopprijzen-pagina zelf. Dat is
overgenomen van de homepage. Letterlijk overgenomen; het leest wel vreemd.

## Bewuste afwijkingen (blijven staan)

| Wat | Waarom |
|---|---|
| `lang="nl"` i.p.v. `lang="en"` | Live staat op Engels terwijl alle content Nederlands is |
| `rel=canonical` toegevoegd | Ontbreekt live volledig |
| Formulierbevestiging in het Nederlands | Live toont "Thank you for your submission!" |
| Eén `<h1>` per pagina | Live heeft 4 h1's op de homepage en géén h1 op over-ons, testwijze en contact. De koppen renderen wel op de originele maat |
| Tab-volgorde gecorrigeerd | Zie hieronder |

## ⚠️ Bug die live staat en hier gecorrigeerd is

Op `/inkoopprijzen` heet tab 3 **Platina** maar toont de **palladiumprijzen**, en
tab 4 andersom. De tabknoppen staan Goud–Zilver–Platina–Palladium, de panelen
Goud–Zilver–Palladium–Platina. Een bezoeker die op Platina klikt ziet €15,07 voor
850 in plaats van €33,01 — een factor twee mis, op de pagina waar mensen de
waarde van hun edelmetaal aflezen.

## Nog open

- **`og:image` ontbreekt op alle pagina's** — ook live. Bij delen op social media
  verschijnt er geen afbeelding. Aanleveren of uit een sectiebeeld genereren.
- **Geen JSON-LD.** Voor een lokale inkoper zijn `LocalBusiness` en `FAQPage`
  gemiste winst. Voorstel: apart oppakken ná livegang, zodat de migratie
  attribueerbaar blijft.
- **Decimaalteken.** Live: `€ 34.79` en `€113.2661` met een punt. Letterlijk
  overgenomen; een komma is voor een Nederlandse site gebruikelijker.
- **Openingstijden, telefoonnummer en adres** komen uit `src/data/site.ts` en zijn
  overgenomen uit de export — niet geverifieerd tegen de live footer.

## Visuele afwijking

`node scripts/visual-diff.mjs` — gemiddeld 19,2%. Zie `FIDELITY.md`. Let op: die
meting loopt tegen de **export**, die lege prijslijsten heeft; op smalle breedtes
verklaart dat het grootste deel van het verschil (op `/inkoopprijzen` @767 alleen
al 3030px aan prijsrijen die in de export niet bestaan).
