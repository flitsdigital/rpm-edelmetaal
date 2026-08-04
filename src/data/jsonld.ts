import { contact, openingstijden } from './site';
import { faq } from './content';
import type { TourStad } from './tour';

const SITE = 'https://www.rpmedelmetaal.nl';

const DAG = {
  Maandag: 'Monday',
  Dinsdag: 'Tuesday',
  Woensdag: 'Wednesday',
  Donderdag: 'Thursday',
  Vrijdag: 'Friday',
  Zaterdag: 'Saturday',
  Zondag: 'Sunday',
} as const;

const openingsuren = openingstijden.flatMap(({ dag, uren }) => {
  const [opens, closes] = uren.split('-').map((t) => t.trim());
  if (!closes) return [];
  return [{ '@type': 'OpeningHoursSpecification', dayOfWeek: DAG[dag], opens, closes }];
});

export const localBusiness = {
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  '@id': `${SITE}/#winkel`,
  name: 'RPM Edelmetaal',
  url: SITE,
  telephone: contact.telefoon,
  email: contact.email,
  image: `${SITE}/images/webclip.jpg`,
  description:
    'Dé edelmetalen-specialist in Friesland, Groningen en Drenthe. Inkoop van goud, zilver en andere edelmetalen, met gratis en vrijblijvende taxatie.',
  areaServed: ['Friesland', 'Groningen', 'Drenthe'],
  address: {
    '@type': 'PostalAddress',
    postalCode: '8601 BE',
    addressLocality: 'Sneek',
    addressCountry: 'NL',
  },
  openingHoursSpecification: openingsuren,
};

export const faqPageVan = (items: { vraag: string; antwoord: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map(({ vraag, antwoord }) => ({
    '@type': 'Question',
    name: vraag,
    acceptedAnswer: { '@type': 'Answer', text: antwoord },
  })),
});

export const faqPage = faqPageVan(faq);

export const tourEvenementen = (steden: TourStad[]) =>
  steden.flatMap((stad) =>
    stad.stops
      .filter((stop) => stop.datumISO)
      .map((stop) => ({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: `RPM on Tour — ${stad.naam}`,
      startDate: stop.datumISO,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      url: `${SITE}/goud-verkopen/${stad.slug}`,
      location: {
        '@type': 'Place',
        name: stop.locatie,
        address: {
          '@type': 'PostalAddress',
          ...(stad.adres ? { streetAddress: stad.adres } : {}),
          ...(stad.postcode ? { postalCode: stad.postcode } : {}),
          addressLocality: stad.naam,
          addressCountry: 'NL',
        },
      },
      organizer: { '@id': localBusiness['@id'] },
    }))
  );
