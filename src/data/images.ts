/** De 16 afbeeldingen die de zeven echte pagina's gebruiken, met de srcsets
 *  precies zoals Webflow ze genereerde. De andere 81 bestanden in de export
 *  (10,6 MB) horen bij de dev-pagina's van het Mast-template en zijn niet
 *  gekopieerd.
 *
 *  Eén plek voor alle beeldverwijzingen: pagina's noemen een sleutel, niet een
 *  pad. Dat scheelt bij het straks vervangen van beeldmateriaal.
 */
export type Afbeelding = { src: string; srcset?: string; sizes?: string; alt: string };

const p = (naam: string) => `/images/${naam}`;

export const images = {
  /* ── RPM on Tour ────────────────────────────────────────────────────────
     Foto's van de taxatiewagen, aangeleverd door RPM. De portretopnames zijn
     midden uitgesneden naar 4:3 zodat ze naast een tekstkolom passen. */
  tourHero: {
    src: p('tour-hero-1440.jpg'),
    srcset: `${p('tour-hero-500.jpg')} 500w, ${p('tour-hero-800.jpg')} 800w, ${p('tour-hero-1080.jpg')} 1080w, ${p('tour-hero-1440.jpg')} 1440w`,
    sizes: '100vw',
    alt: 'De taxatiewagen van RPM Edelmetaal op een parkeerplaats',
  },
  tourWagen: {
    src: p('tour-wagen-1120.jpg'),
    srcset: `${p('tour-wagen-560.jpg')} 560w, ${p('tour-wagen-800.jpg')} 800w, ${p('tour-wagen-1120.jpg')} 1120w`,
    sizes: '(max-width: 991px) 100vw, 560px', // guard-ignore: hardcoded-px — sizes-attribuut, geen CSS-lengte
    alt: 'De taxatiewagen van RPM Edelmetaal, met gratis taxatie van gouden en zilveren sieraden op de zijkant',
  },
  tourZijkant: {
    src: p('tour-zijkant-1120.jpg'),
    srcset: `${p('tour-zijkant-560.jpg')} 560w, ${p('tour-zijkant-800.jpg')} 800w, ${p('tour-zijkant-1120.jpg')} 1120w`,
    sizes: '(max-width: 991px) 100vw, 560px', // guard-ignore: hardcoded-px — idem
    alt: 'Zijaanzicht van de taxatiewagen van RPM Edelmetaal',
  },
  tourAchter: {
    src: p('tour-achter-1120.jpg'),
    srcset: `${p('tour-achter-560.jpg')} 560w, ${p('tour-achter-800.jpg')} 800w, ${p('tour-achter-1120.jpg')} 1120w`,
    sizes: '(max-width: 991px) 100vw, 560px', // guard-ignore: hardcoded-px — idem
    alt: 'De taxatiewagen van RPM Edelmetaal met de deur aan de achterzijde',
  },

  /** Achtergrond van de hero en alle CTA-secties. */
  achtergrond: {
    src: p('Bg-.jpg'),
    srcset: `${p('Bg--p-500.jpg')} 500w, ${p('Bg--p-800.jpg')} 800w, ${p('Bg--p-1080.jpg')} 1080w, ${p('Bg-.jpg')} 1440w`,
    sizes: '(max-width: 1440px) 100vw, 1440px', // guard-ignore: hardcoded-px — sizes-attribuut, geen CSS-lengte
    alt: '',
  },
  portretVader: {
    src: p('Rectangle-1.jpg'),
    srcset: `${p('Rectangle-1-p-500.jpg')} 500w, ${p('Rectangle-1.jpg')} 624w`,
    sizes: '(max-width: 800px) 100vw, 800px', // guard-ignore: hardcoded-px — idem
    alt: 'De oprichter van RPM Edelmetaal',
  },
  portretZoon: {
    src: p('Rectangle-2.jpg'),
    srcset: `${p('Rectangle-2-p-500.jpg')} 500w, ${p('Rectangle-2.jpg')} 624w`,
    sizes: '(max-width: 800px) 100vw, 800px', // guard-ignore: hardcoded-px — idem
    alt: 'Zijn zoon, inmiddels ook werkzaam in het bedrijf',
  },
  taxatie: {
    src: p('DXL1-e16ce49a.jpeg'),
    srcset: `${p('DXL1-e16ce49a-p-500.jpeg')} 500w, ${p('DXL1-e16ce49a.jpeg')} 800w`,
    sizes: '(max-width: 800px) 100vw, 800px', // guard-ignore: hardcoded-px — idem
    alt: 'Taxatie van een sieraad',
  },
  goudenSieraden: { src: p('Gouden-Jewelries.avif'), alt: 'Gouden sieraden' },
  goudsmid: { src: p('Goldsmith-Studio.avif'), alt: 'Werkbank van een goudsmid' },
  goudenRing: { src: p('Vormgeven-van-gouden-ring.avif'), alt: 'Het vormgeven van een gouden ring' },
  taxatieAanHuis: {
    src: p('13a336_96f8d9b9bd9c49f28b088f692ec0e49f~mv2.avif'),
    alt: 'Taxatie van edelmetaal aan huis',
  },
  team: {
    src: p('Jennifer-Snippe-Fotografie---origineel-1.avif'),
    alt: 'Het team van RPM Edelmetaal',
  },
} as const satisfies Record<string, Afbeelding>;
