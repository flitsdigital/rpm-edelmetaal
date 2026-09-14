

import type { Usp } from './content';

export interface Stop {

  datum: string;

  datumISO?: string;

  locatie: string;

  tijd: string;
}

export interface TourStad {
  slug: string;
  naam: string;

  adres?: string;
  postcode?: string;

  intro: string;

  foto: 'tourOpLocatie' | 'tourZijkant' | 'tourAchter';
  stops: Stop[];
}

export const mapsUrl = (stad: TourStad) => {
  const zoekterm = stad.adres
    ? `${stad.adres}, ${stad.postcode ?? ''} ${stad.naam}`.replace(/\s+/g, ' ').trim()
    : `${stad.naam}, Drenthe`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zoekterm)}`;
};

export const icsUrl = (stad: TourStad) => `/goud-verkopen/${stad.slug}.ics`;

const intro = (naam: string) =>
  `Wij komen naar ${naam} toe. Laat uw goud, zilver en andere edelmetalen gratis en vrijblijvend taxeren, vlak bij u in de buurt.`;

const stop = (datum: string, datumISO: string, locatie: string): Stop => ({
  datum,
  datumISO,
  locatie,
  tijd: '10:00 – 16:00 uur',
});

export const tourSteden: TourStad[] = [
  {
    slug: 'westerblokker',
    naam: 'Westerblokker',
    adres: 'Westerblokker 171',
    postcode: '1695 AE',
    intro: intro('Westerblokker'),
    foto: 'tourOpLocatie',
    stops: [stop('Maandag 14 september', '2026-09-14', 'De Nadorst')],
  },
  {
    slug: 'elst',
    naam: 'Elst',
    adres: 'Dorpsstraat 28',
    postcode: '6661 EL',
    intro: intro('Elst'),
    foto: 'tourZijkant',
    stops: [
      stop('Dinsdag 15 september', '2026-09-15', 'Hotel & Grandcafé Het Wapen van Elst'),
      stop('Woensdag 16 september', '2026-09-16', 'Hotel & Grandcafé Het Wapen van Elst'),
    ],
  },
  {
    slug: 'eelde',
    naam: 'Eelde',
    adres: 'Hoofdweg 90',
    postcode: '9761 EK',
    intro: intro('Eelde'),
    foto: 'tourAchter',
    stops: [
      stop('Donderdag 17 september', '2026-09-17', 'Herberg van Hilbrantsz'),
      stop('Vrijdag 18 september', '2026-09-18', 'Herberg van Hilbrantsz'),
    ],
  },
  {
    slug: 'ijsselmuiden',
    naam: 'IJsselmuiden',
    adres: 'Burg. van Engelenweg 100',
    postcode: '8271 AV',
    intro: intro('IJsselmuiden'),
    foto: 'tourOpLocatie',
    stops: [
      stop('Donderdag 17 september', '2026-09-17', "'t Danshuus"),
      stop('Vrijdag 18 september', '2026-09-18', "'t Danshuus"),
    ],
  },
  {
    slug: 'roden',
    naam: 'Roden',
    adres: 'Koerskamp 2a',
    postcode: '9301 BE',
    intro: intro('Roden'),
    foto: 'tourZijkant',
    stops: [stop('Vrijdag 18 september', '2026-09-18', 'De Dobbe Roden')],
  },
];

export const tour = {
  eyebrow: 'RPM on Tour',

  hoofdpagina: {
    title: 'Goud verkopen bij u in de buurt | RPM Edelmetaal',
    description:
      'RPM Edelmetaal komt naar u toe. Bekijk onze locaties en data, en laat uw goud gratis en vrijblijvend taxeren, vlak bij u in de buurt.',
    h1: 'Goud verkopen, bij jou in de buurt',
    locatiesTitel: 'Onze locaties',
    locatiesTekst: 'Goud verkopen bij jou in de buurt? Bekijk onze locaties.',
  },

  uitleg: {
    titel: 'Wij komen naar u toe',
    tekst:
      'Onze experts in de taxatie van gouden voorwerpen reizen door heel Nederland en maken korte stops op zoveel mogelijk locaties, zodat u uw gouden voorwerpen eenvoudig kunt laten taxeren — dicht bij huis, zonder dat u ervoor hoeft te reizen.\n\nDoor van tevoren een afspraak te boeken, verzekert u zich van persoonlijke service bij de stop van uw keuze.',
  },

  contact: {
    titel: 'Alvast een gratis taxatie aanvragen?',
    tekst:
      'Heeft u vragen over de waarde van uw sieraden of wilt u direct een taxatie aanvragen? Wij helpen u graag verder.',
  },

  geenStops: 'De data voor deze locatie worden binnenkort bekendgemaakt.',
};

export const vindStad = (slug: string) => tourSteden.find((s) => s.slug === slug);

export const tourUsps: Usp[] = [
  { icon: 'inkoop', title: 'Inkoop edelmetalen', text: 'Goud, zilver, platina, palladium en andere edelmetalen.' },
  { icon: 'taxatie', title: 'Eerlijke taxaties', text: 'Gratis en vrijblijvend, onder het genot van een kopje koffie.' },
  { icon: 'home', title: 'Taxatie aan huis', text: 'Wij komen kosteloos bij u thuis langs voor een taxatie van uw edelmetalen.' },
  { icon: 'familie-alt', title: 'Betrouwbaar familiebedrijf', text: 'Een vertrouwd familiebedrijf met meer dan 20 jaar ervaring.' },
  { icon: 'clock', title: 'Binnen 24 uur reactie', text: 'U krijgt altijd snel een persoonlijk antwoord.' },
  { icon: 'flexibel', title: 'Flexibele tijden', text: 'We plannen de afspraak wanneer het u het beste uitkomt.' },
];

export const tourFaq = (naam: string) => [
  {
    vraag: 'Moet ik een afspraak maken?',
    antwoord: `Dat hoeft niet, u kunt gewoon langskomen tijdens onze stop in ${naam}. Met een afspraak weet u wel zeker dat er tijd voor u is en hoeft u niet te wachten.`,
  },
  {
    vraag: 'Wat moet ik meenemen?',
    antwoord:
      'Uw sieraden of voorwerpen en een geldig identiteitsbewijs. Dat laatste zijn wij als edelmetaalhandelaar verplicht te controleren en vast te leggen.',
  },
  {
    vraag: 'Wat kost een taxatie?',
    antwoord:
      'Niets. De taxatie is gratis en volledig vrijblijvend — u beslist zelf of u wilt verkopen.',
  },
  {
    vraag: 'Hoe snel weet ik wat mijn goud waard is?',
    antwoord:
      'Meteen. Wij taxeren ter plekke en doen daarna een direct reëel bod, dus u weet binnen enkele minuten waar u aan toe bent.',
  },
  {
    vraag: 'Hoe bepalen jullie de prijs?',
    antwoord:
      'Wij rekenen per gram, op basis van het karaat of gehalte en de actuele marktprijs van die dag. Onze inkoopprijzen staan op deze pagina en worden meerdere keren per dag bijgewerkt.',
  },
  {
    vraag: 'Koopt u ook kapotte of onvolledige sieraden?',
    antwoord:
      'Ja. Een losse oorbel, een gebroken ketting of een verbogen ring is voor ons net zoveel waard als een heel sieraad: wij betalen op basis van het gewicht en het gehalte, niet op basis van het uiterlijk.',
  },
  {
    vraag: 'Welke edelmetalen koopt u in?',
    antwoord:
      'Goud, zilver, platina en palladium — als sieraad, als munt of als schroot. Twijfelt u of iets edelmetaal is? Neem het gerust mee, testen is gratis.',
  },
  {
    vraag: `Ik kan niet op de datum dat u in ${naam} bent. Wat nu?`,
    antwoord: `Dan kunt u terecht bij een van onze andere stops, in onze winkel in Sneek, of u laat ons kosteloos bij u thuis langskomen voor een taxatie.`,
  },
];
