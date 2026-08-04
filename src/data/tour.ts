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
  /** ISO-datum, voor sortering en voor <time datetime>. */
  datumISO: string;
  /** Waar de camper staat, bv. 'Plus Klazienaveen'. */
  locatie: string;
  /** Bv. '17.30 - 18.30'. */
  tijd: string;
}

export interface TourStad {
  slug: string;
  naam: string;
  /** Straat en huisnummer van de vaste standplaats. */
  adres: string;
  postcode: string;
  /** Volledige zoekterm voor Google Maps. */
  maps: string;
  /** Eén zin onder de H1 op de stadspagina. */
  intro: string;
  stops: Stop[];
}

const mapsUrl = (zoekterm: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zoekterm)}`;

export const tourSteden: TourStad[] = [
  {
    slug: 'klazienaveen',
    naam: 'Klazienaveen',
    adres: 'De Bukakkers 20',
    postcode: '7891 XZ',
    maps: mapsUrl('De Bukakkers 20, 7891 XZ Klazienaveen'),
    intro:
      'Als dé edelmetalen-specialist van Nederland verzorgen wij de inkoop van goud, zilver en andere edelmetalen — nu ook bij u in de buurt.',
    stops: [
      { datum: '28 november 2026', datumISO: '2026-11-28', locatie: 'Plus Klazienaveen', tijd: '17.30 - 18.30' },
      { datum: '14 juli 2027', datumISO: '2027-07-14', locatie: 'Jumbo Klazienaveen', tijd: '17.30 - 18.30' },
    ],
  },
  {
    slug: 'westerbork',
    naam: 'Westerbork',
    adres: 'Hoofdstraat 12',
    postcode: '9431 AE',
    maps: mapsUrl('Hoofdstraat 12, 9431 AE Westerbork'),
    intro:
      'Onze taxateurs komen met de camper naar Westerbork. Laat uw goud en zilver gratis en vrijblijvend taxeren.',
    stops: [],
  },
  {
    slug: 'erica',
    naam: 'Erica',
    adres: 'Kerkweg 8',
    postcode: '7887 BE',
    maps: mapsUrl('Kerkweg 8, 7887 BE Erica'),
    intro:
      'Onze taxateurs komen met de camper naar Erica. Laat uw goud en zilver gratis en vrijblijvend taxeren.',
    stops: [],
  },
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

