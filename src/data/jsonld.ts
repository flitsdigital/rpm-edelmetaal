import { contact, openingstijden } from './site';
import { faq } from './content';
import type { TourStad } from './tour';

const SITE = 'https://www.rpmedelmetaal.nl';

/** `Maandag` → `Monday`. Schema.org wil de Engelse dagnamen. */
const DAG = {
  Maandag: 'Monday',
  Dinsdag: 'Tuesday',
  Woensdag: 'Wednesday',
  Donderdag: 'Thursday',
  Vrijdag: 'Friday',
  Zaterdag: 'Saturday',
  Zondag: 'Sunday',
} as const;

/** `10:00 - 18:00` → `{ opens, closes }`. Gesloten dagen vallen weg: schema.org
 *  kent geen "dicht", en een dag die ontbreekt is dicht. */
const openingsuren = openingstijden.flatMap(({ dag, uren }) => {
  const [opens, closes] = uren.split('-').map((t) => t.trim());
  if (!closes) return [];
  return [{ '@type': 'OpeningHoursSpecification', dayOfWeek: DAG[dag], opens, closes }];
});

/** De winkel zelf. Staat op elke pagina, met een vaste `@id` zodat zoekmachines
 *  het als één bedrijf zien en niet als zeven.
 *
 *  Bewust níét meegenomen: de Google-score van 4.9. `aggregateRating` mag alleen
 *  over reviews die je zelf host of mag markeren — die van Google markeren op je
 *  eigen site is tegen de richtlijnen en levert een handmatige maatregel op.
 *
 *  Het adres heeft geen straatnaam. Die staat ook nergens op de live site; zodra
 *  hij er is hoort `streetAddress` erbij, anders koppelt Google dit niet aan het
 *  bedrijfsprofiel. */
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

/** Alleen op de homepage — daar staat de accordeon ook. Dezelfde bron, dus de
 *  markup kan niet uit de pas lopen met wat de bezoeker leest. Dat is de eis:
 *  gestructureerde data moet overeenkomen met de zichtbare pagina. */
export const faqPage = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map(({ vraag, antwoord }) => ({
    '@type': 'Question',
    name: vraag,
    acceptedAnswer: { '@type': 'Answer', text: antwoord },
  })),
};

/** Eén `Event` per stop van een tourlocatie.
 *
 *  De data staan al in de accordeon, maar een zoekmachine leest die niet als
 *  agenda. Zo kunnen ze wél in de resultaten verschijnen — en het is dezelfde
 *  bron, dus markup en zichtbare datum kunnen niet uiteenlopen. */
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
