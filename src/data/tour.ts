/** RPM on Tour — de rijdende taxatiebalie.
 *
 *  Eén bron voor zowel /goud-verkopen als /goud-verkopen/[stad]. De stops op de
 *  overzichtspagina en die op de stadspagina komen dus uit hetzelfde object en
 *  kunnen niet uit de pas lopen. Dat is hier extra belangrijk: iemand die op de
 *  verkeerde datum voor een dichte deur staat, komt niet terug.
 *
 *  Data staat bewust in code en niet in Supabase. De tourdata verandert een paar
 *  keer per jaar en wordt door één persoon bijgehouden; een tabel plus een
 *  beheerscherm zou meer onderhoud kosten dan het oplevert. Verandert dat, dan
 *  is dit bestand de plek om te vervangen — de componenten kennen alleen de
 *  types hieronder.
 */

import type { Usp } from './content';

export interface Stop {
  /** Zoals getoond: '28 november 2026'. */
  datum: string;
  /** ISO-datum, voor sortering en voor <time datetime>.
   *  Ontbreekt bij een plaatshouder — dan is het geen datum en dus ook geen
   *  `<time>`, en komt de stop niet in de Event-markup terecht. */
  datumISO?: string;
  /** Waar de camper staat, bv. 'Plus Klazienaveen'. */
  locatie: string;
  /** Bv. '17.30 - 18.30'. */
  tijd: string;
}

export interface TourStad {
  slug: string;
  naam: string;
  /** Straat en huisnummer van de standplaats. Ontbreekt zolang die niet vaststaat —
   *  liever geen adres dan een adres waar niemand staat. */
  adres?: string;
  postcode?: string;
  /** Eén zin onder de H1 op de stadspagina. */
  intro: string;
  stops: Stop[];
}

/** Zoeklink naar Google Maps. Zonder adres valt de plaatsnaam terug — die is
 *  altijd juist, alleen minder precies. */
export const mapsUrl = (stad: TourStad) => {
  const zoekterm = stad.adres
    ? `${stad.adres}, ${stad.postcode ?? ''} ${stad.naam}`.replace(/\s+/g, ' ').trim()
    : `${stad.naam}, Drenthe`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zoekterm)}`;
};

const intro = (naam: string) =>
  `Onze taxateurs komen met de camper naar ${naam}. Laat uw goud, zilver en andere edelmetalen gratis en vrijblijvend taxeren, vlak bij u in de buurt.`;

/** ⚠️ De stops hieronder zijn plaatshouders, geen echte data.
 *
 *  Ze staan er zodat de opmaak compleet is; de tekst zegt met zoveel woorden
 *  dat er nog niets vaststaat. Bewust géén plausibel ogende datum of adres:
 *  dat leest als een toezegging en stuurt mensen naar een leeg parkeerterrein.
 *
 *  Vervangen zodra RPM de route rond heeft. Zet dan ook `datumISO` erbij —
 *  zonder die waarde komt een stop niet in de Event-markup en dus niet in de
 *  zoekresultaten. */
const plaatshouder: Stop[] = [
  { datum: 'Datum volgt', locatie: 'Locatie volgt', tijd: 'Tijd volgt' },
  { datum: 'Datum volgt', locatie: 'Locatie volgt', tijd: 'Tijd volgt' },
];
export const tourSteden: TourStad[] = [
  { slug: 'klazienaveen', naam: 'Klazienaveen', intro: intro('Klazienaveen'), stops: plaatshouder },
  { slug: 'erica', naam: 'Erica', intro: intro('Erica'), stops: plaatshouder },
  { slug: 'emmer-compascuum', naam: 'Emmer-Compascuum', intro: intro('Emmer-Compascuum'), stops: plaatshouder },
  { slug: 'westerbork', naam: 'Westerbork', intro: intro('Westerbork'), stops: plaatshouder },
  { slug: 'beilen', naam: 'Beilen', intro: intro('Beilen'), stops: plaatshouder },
];

/** Presentatietekst van de tour. Staat hier zodat de pagina's alleen structuur bevatten. */
export const tour = {
  eyebrow: 'RPM on Tour',

  hoofdpagina: {
    title: 'Goud verkopen bij u in de buurt | RPM Edelmetaal',
    description:
      'RPM Edelmetaal komt met een rijdende taxatiebalie naar u toe. Bekijk de locaties en data, en laat uw goud gratis en vrijblijvend taxeren.',
    h1: 'Goud verkopen, bij jou in de buurt',
    locatiesTitel: 'Onze locaties',
    locatiesTekst: 'Goud verkopen bij jou in de buurt? Bekijk onze locaties.',
  },

  uitleg: {
    titel: 'Wij komen naar u toe',
    tekst:
      'Onze experts in de taxatie van gouden voorwerpen reizen door heel Nederland in een speciaal uitgeruste camper en maken korte stops op zoveel mogelijk locaties, zodat u uw gouden voorwerpen eenvoudig kunt laten taxeren.\n\nDoor van tevoren een afspraak te boeken, verzekert u zich van persoonlijke service bij de stop van uw keuze.',
  },

  contact: {
    titel: 'Alvast een gratis taxatie aanvragen?',
    tekst:
      'Heeft u vragen over de waarde van uw sieraden of wilt u direct een taxatie aanvragen? Wij helpen u graag verder.',
  },

  geenStops: 'De data voor deze locatie worden binnenkort bekendgemaakt.',
};

export const vindStad = (slug: string) => tourSteden.find((s) => s.slug === slug);

/** De zes redenen onder de stadspagina. Iconen komen uit de bestaande set. */
export const tourUsps: Usp[] = [
  { icon: 'inkoop', title: 'Inkoop edelmetalen', text: 'Goud, zilver, platina, palladium en andere edelmetalen.' },
  { icon: 'taxatie', title: 'Eerlijke taxaties', text: 'Gratis en vrijblijvend, onder het genot van een kopje koffie.' },
  { icon: 'home', title: 'Taxatie aan huis', text: 'Wij komen kosteloos bij u thuis langs voor een taxatie van uw edelmetalen.' },
  { icon: 'familie-alt', title: 'Betrouwbaar familiebedrijf', text: 'Een vertrouwd familiebedrijf met meer dan 20 jaar ervaring.' },
  { icon: 'clock', title: 'Binnen 24 uur reactie', text: 'U krijgt altijd snel een persoonlijk antwoord.' },
  { icon: 'flexibel', title: 'Flexibele tijden', text: 'We plannen de afspraak wanneer het u het beste uitkomt.' },
];

