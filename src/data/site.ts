/** Sitebrede content die in de export op elke pagina herhaald stond.
 *  Structuur zit in de componenten, tekst hier. */

export const contact = {
  telefoon: '+31 85 060 1486',
  telefoonHref: 'tel:+31850601486',
  email: 'info@rpmedelmetaal.nl',
  emailHref: 'mailto:info@rpmedelmetaal.nl',
  whatsapp: 'https://wa.me/31850601486',
  adres: 'RPM Edelmetaal, 8601 BE Sneek',
} as const;

export const navLinks = [
  { href: '/over-ons', label: 'Over ons' },
  { href: '/testwijze', label: 'Testwijze' },
  { href: '/inkoopprijzen', label: 'Inkoopprijzen' },
  { href: '/contact', label: 'Contact' },
] as const;

/** De B2B-link staat altijd in de nav.
 *
 *  De export verborg hem client-side met `data-ms-content`, maar de meeste
 *  pagina's zijn hier statisch en weten dus niet wie er kijkt. Alleen daarvoor
 *  JavaScript toevoegen zou een flits van de verkeerde staat opleveren.
 *
 *  Kan ook: de URL is geen geheim. Wie erop klikt zonder sessie belandt op de
 *  loginpagina, en de zakelijke prijzen zitten achter een grant in de database. */
export const b2bLinks = [{ href: '/inkoopprijzen-b2b', label: 'B2B' }] as const;

export const footerLinks = [
  { href: '/', label: 'Home' },
  { href: '/over-ons', label: 'Over Ons' },
  { href: '/testwijze', label: 'Testwijze' },
  { href: '/inkoopprijzen', label: 'Inkoopprijzen' },
  { href: '/auth/login', label: 'Inloggen' },
  { href: '/contact', label: 'Contact' },
] as const;

export const openingstijden = [
  { dag: 'Maandag', uren: '10:00 - 18:00' },
  { dag: 'Dinsdag', uren: '10:00 - 18:00' },
  { dag: 'Woensdag', uren: '10:00 - 18:00' },
  { dag: 'Donderdag', uren: '10:00 - 19:00' },
  { dag: 'Vrijdag', uren: '10:00 - 19:00' },
  { dag: 'Zaterdag', uren: '12:00 - 17:00' },
  { dag: 'Zondag', uren: 'Gesloten' },
] as const;

export const reviews = {
  score: '4.9/5 op Google',
  sterren: '★★★★★',
  aantal: 'Op basis van 300+ reviews',
} as const;

/** Gehaltes per metaal voor het taxatieformulier. In de export stonden alle vier
 *  de lijsten in de HTML en werden ze door JS uit de DOM geknipt en geplakt.
 *  Let op: het origineel had "Goud 10k" twee keer in de lijst — hier één keer. */
export const gehaltesPerMetaal = {
  Goud: ['8k', '9k', '10k', '12k', '14k', '16k', '18k', '20k', '21k', '21.6k', '22k', '23k', '23.6k', '24k'],
  Zilver: ['640', '720', '800', '835', '900', '925', '999'],
  Platina: ['850', '900', '950', '999'],
  Palladium: ['500', '900', '950', '999'],
} as const;

type Metaal = keyof typeof gehaltesPerMetaal;
export const metalen = Object.keys(gehaltesPerMetaal) as Metaal[];

/** Eén rij in de prijsbalk boven de nav. Prijs is al geformatteerd — opmaak
 *  hoort niet in een component. Wordt in fase 4 gevoed uit `v_prijzen_publiek`. */
export type MetaalPrijs = {
  /** Afkorting in het vierkantje, bv. 'Au'. */
  symbool: string;
  naam: string;
  prijs: string;
};
