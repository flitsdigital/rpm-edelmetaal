

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
    : `${stad.postcode ?? ''} ${stad.naam}`.trim();
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
  {
    slug: 'ugchelen',
    naam: 'Ugchelen',
    adres: 'Bogaardslaan 81',
    postcode: '7339 AN',
    intro: intro('Ugchelen'),
    foto: 'tourAchter',
    stops: [stop('Maandag 21 september', '2026-09-21', 'Ons Dorpshuis')],
  },
  {
    slug: 'veendam',
    naam: 'Veendam',
    adres: 'Museumplein 3',
    postcode: '9641 AD',
    intro: intro('Veendam'),
    foto: 'tourOpLocatie',
    stops: [
      stop('Dinsdag 22 september', '2026-09-22', 'Brouwhotel Parkzicht'),
      stop('Woensdag 23 september', '2026-09-23', 'Brouwhotel Parkzicht'),
    ],
  },
  {
    slug: 'westervoort',
    naam: 'Westervoort',
    adres: 'Dorpstraat 11',
    postcode: '6931 BA',
    intro: intro('Westervoort'),
    foto: 'tourZijkant',
    stops: [
      stop('Dinsdag 22 september', '2026-09-22', 'Zalencentrum Wieleman'),
      stop('Woensdag 23 september', '2026-09-23', 'Zalencentrum Wieleman'),
    ],
  },
  {
    slug: 'groenlo',
    naam: 'Groenlo',
    adres: 'Markt 4',
    postcode: '7141 AA',
    intro: intro('Groenlo'),
    foto: 'tourAchter',
    stops: [
      stop('Donderdag 24 september', '2026-09-24', 'Eetwinkel Vier'),
      stop('Vrijdag 25 september', '2026-09-25', 'Eetwinkel Vier'),
    ],
  },
  {
    slug: 'epe',
    naam: 'Epe',
    adres: 'Hoofdstraat 106A',
    postcode: '8162 AN',
    intro: intro('Epe'),
    foto: 'tourOpLocatie',
    stops: [
      stop('Donderdag 24 september', '2026-09-24', 'De Slimmerick'),
      stop('Vrijdag 25 september', '2026-09-25', 'De Slimmerick'),
    ],
  },
  {
    slug: 'norg',
    naam: 'Norg',
    adres: 'Brink 1',
    postcode: '9331 AA',
    intro: intro('Norg'),
    foto: 'tourZijkant',
    stops: [stop('Maandag 5 oktober', '2026-10-05', 'MFC De Brinkhof')],
  },
  {
    slug: 'beneden-leeuwen',
    naam: 'Beneden-Leeuwen',
    adres: 'Leliestraat 19',
    postcode: '6658 XN',
    intro: intro('Beneden-Leeuwen'),
    foto: 'tourAchter',
    stops: [
      stop('Dinsdag 6 oktober', '2026-10-06', 'Brasserie De Rosmolen'),
      stop('Woensdag 7 oktober', '2026-10-07', 'Brasserie De Rosmolen'),
    ],
  },
  {
    slug: 'zwartemeer',
    naam: 'Zwartemeer',
    adres: 'De Blokken 41',
    postcode: '7894 CH',
    intro: intro('Zwartemeer'),
    foto: 'tourOpLocatie',
    stops: [
      stop('Dinsdag 6 oktober', '2026-10-06', 'Dorpshuis De Meerstal'),
      stop('Woensdag 7 oktober', '2026-10-07', 'Dorpshuis De Meerstal'),
    ],
  },
  {
    slug: 'geldermalsen',
    naam: 'Geldermalsen',
    adres: 'Rijksstraatweg 64',
    postcode: '4191 SG',
    intro: intro('Geldermalsen'),
    foto: 'tourZijkant',
    stops: [
      stop('Donderdag 8 oktober', '2026-10-08', 'De Pluk'),
      stop('Vrijdag 9 oktober', '2026-10-09', 'De Pluk'),
    ],
  },
  {
    slug: 'groesbeek',
    naam: 'Groesbeek',
    adres: 'Pompweg 2B',
    postcode: '6562 AK',
    intro: intro('Groesbeek'),
    foto: 'tourAchter',
    stops: [
      stop('Donderdag 8 oktober', '2026-10-08', 'Zaal Wilhelmina'),
      stop('Vrijdag 9 oktober', '2026-10-09', 'Zaal Wilhelmina'),
    ],
  },
  {
    slug: 'sleen',
    naam: 'Sleen',
    adres: 'Menso Altingstraat 6',
    postcode: '7841 CB',
    intro: intro('Sleen'),
    foto: 'tourOpLocatie',
    stops: [stop('Zaterdag 10 oktober', '2026-10-10', 'De Deel')],
  },
  {
    slug: 'swifterbant',
    naam: 'Swifterbant',
    // ponytail: straatnaam ontbreekt in de planning
    postcode: '8255 HT',
    intro: intro('Swifterbant'),
    foto: 'tourZijkant',
    stops: [stop('Maandag 12 oktober', '2026-10-12', 'De Schutsluis')],
  },
  {
    slug: 'oosterbeek',
    naam: 'Oosterbeek',
    adres: 'Generaal Urquhartlaan 1',
    postcode: '6861 GE',
    intro: intro('Oosterbeek'),
    foto: 'tourAchter',
    stops: [
      stop('Dinsdag 13 oktober', '2026-10-13', 'De Zoomerij'),
      stop('Woensdag 14 oktober', '2026-10-14', 'De Zoomerij'),
    ],
  },
  {
    slug: 'renkum',
    naam: 'Renkum',
    adres: 'Groeneweg 12',
    postcode: '6871 DD',
    intro: intro('Renkum'),
    foto: 'tourOpLocatie',
    stops: [
      stop('Dinsdag 13 oktober', '2026-10-13', 'Stichting Broedplaats Renkum'),
      stop('Woensdag 14 oktober', '2026-10-14', 'Stichting Broedplaats Renkum'),
    ],
  },
  {
    slug: 'berlicum',
    naam: 'Berlicum',
    adres: 'Kerkwijk 61',
    postcode: '5258 KB',
    intro: intro('Berlicum'),
    foto: 'tourZijkant',
    stops: [
      stop('Donderdag 15 oktober', '2026-10-15', 'Den Durpsherd'),
      stop('Vrijdag 16 oktober', '2026-10-16', 'Den Durpsherd'),
    ],
  },
  {
    slug: 'nieuw-dordrecht',
    naam: 'Nieuw-Dordrecht',
    adres: 'Rietdekkershof 5',
    postcode: '7885 GA',
    intro: intro('Nieuw-Dordrecht'),
    foto: 'tourAchter',
    stops: [
      stop('Donderdag 15 oktober', '2026-10-15', 'Dorpshuis De Klink'),
      stop('Vrijdag 16 oktober', '2026-10-16', 'Dorpshuis De Klink'),
    ],
  },
  {
    slug: 'biddinghuizen',
    naam: 'Biddinghuizen',
    adres: 'Akkerhof 3A',
    postcode: '8256 BK',
    intro: intro('Biddinghuizen'),
    foto: 'tourOpLocatie',
    stops: [stop('Maandag 19 oktober', '2026-10-19', 'MFC De Binding')],
  },
  {
    slug: 'aalten',
    naam: 'Aalten',
    adres: 'Lichtenvoordsestraatweg 87',
    postcode: '7121 RD',
    intro: intro('Aalten'),
    foto: 'tourZijkant',
    stops: [
      stop('Dinsdag 20 oktober', '2026-10-20', 'Café Restaurant "Domme Aanleg"'),
      stop('Woensdag 21 oktober', '2026-10-21', 'Café Restaurant "Domme Aanleg"'),
    ],
  },
  {
    slug: 'lunteren',
    naam: 'Lunteren',
    adres: 'Dorpsstraat 28',
    postcode: '6741 AL',
    intro: intro('Lunteren'),
    foto: 'tourAchter',
    stops: [
      stop('Dinsdag 20 oktober', '2026-10-20', 'Dorpshuis Het Westhoffhuis'),
      stop('Woensdag 21 oktober', '2026-10-21', 'Dorpshuis Het Westhoffhuis'),
    ],
  },
  {
    slug: 'dieren',
    naam: 'Dieren',
    adres: 'Ericaplein 5',
    postcode: '6951 CP',
    intro: intro('Dieren'),
    foto: 'tourOpLocatie',
    stops: [
      stop('Donderdag 22 oktober', '2026-10-22', 'De Zoomerij Bibliotheek / Cultuur'),
      stop('Vrijdag 23 oktober', '2026-10-23', 'De Zoomerij Bibliotheek / Cultuur'),
    ],
  },
  {
    slug: 'twello',
    naam: 'Twello',
    adres: 'H.W. Iordensweg 3',
    postcode: '7391 KA',
    intro: intro('Twello'),
    foto: 'tourZijkant',
    stops: [
      stop('Donderdag 22 oktober', '2026-10-22', 'Taverne Twello'),
      stop('Vrijdag 23 oktober', '2026-10-23', 'Taverne Twello'),
    ],
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

// Bouwtijd-datum: de site wordt bij elke deploy opnieuw gebouwd (prijzen ook).
export const vandaag = new Date().toISOString().slice(0, 10);

export const komendeStops = (stad: TourStad) => stad.stops.filter((s) => !s.datumISO || s.datumISO >= vandaag);

// Nieuwste eerst, maximaal vier — de locatiepagina blijft bestaan na de tour.
export const geweestStops = (stad: TourStad) =>
  stad.stops
    .filter((s) => s.datumISO && s.datumISO < vandaag)
    .sort((a, b) => b.datumISO!.localeCompare(a.datumISO!))
    .slice(0, 4);

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

// Eén bron voor het agenda-item (ics én Google Agenda).
export const agendaItem = (stad: TourStad, stop: Stop) => {
  const tijd = stop.tijd.match(/(\d\d):(\d\d)\D+(\d\d):(\d\d)/);
  const dag = stop.datumISO!.replace(/-/g, '');
  return {
    titel: `Gratis goudtaxatie RPM Edelmetaal – ${stad.naam}`,
    adres: [stop.locatie, stad.adres, `${stad.postcode ?? ''} ${stad.naam}`.trim()].filter(Boolean).join(', '),
    omschrijving: `Loop vrijblijvend binnen, een afspraak is niet nodig. Neem uw goud, zilver en legitimatie mee.\nhttps://www.rpmedelmetaal.nl/goud-verkopen/${stad.slug}`,
    url: `https://www.rpmedelmetaal.nl/goud-verkopen/${stad.slug}`,
    dag,
    start: tijd ? `${dag}T${tijd[1]}${tijd[2]}00` : undefined,
    eind: tijd ? `${dag}T${tijd[3]}${tijd[4]}00` : undefined,
  };
};

export const googleAgendaUrl = (stad: TourStad, stop: Stop) => {
  const item = agendaItem(stad, stop);
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: item.titel,
    dates: item.start ? `${item.start}/${item.eind}` : `${item.dag}/${item.dag}`,
    ctz: 'Europe/Amsterdam',
    location: item.adres,
    details: item.omschrijving,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
};
