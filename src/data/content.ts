/** De teksten van de zeven pagina's, letterlijk uit de Webflow-export.
 *
 *  Titels en meta-descriptions zijn woordelijk overgenomen: tijdens een
 *  technische migratie iets herschrijven maakt elke rankingverandering
 *  onattribueerbaar.
 *
 *  Typefouten uit het origineel zijn NIET gecorrigeerd — die staan als losse
 *  vraag in PROGRESS.md, zodat de conversie zelf tekstueel neutraal blijft.
 */
import type { IconName } from './icons';

export const seo = {
  home: {
    title: 'Goud & Zilver Verkopen Sneek | RPM Edelmetaal Friesland',
    description:
      'Verkoop uw goud, zilver en edelmetalen bij RPM Edelmetaal in Sneek. 20+ jaar ervaring, gratis taxatie aan huis, eerlijke prijzen. 4.9/5 op Google.',
  },
  overOns: {
    title: 'Over ons | RPM Edelmetaal',
    description:
      'Een familliebedrijf met jarenlange ervaring in de inkoop van waardevolle sierraden en objecten.',
  },
  testwijze: {
    title: 'Testwijze | RPM Edelmetaal',
    description: 'Hoe wij de edelmetalen testen om tot een zo eerlijk mogelijke prijs te komen.',
  },
  inkoopprijzen: {
    title: 'Inkoopprijzen | RPM Edelmetaal',
    description:
      'Ontdek de prijzen die wij u kunnen bieden voor uw edelmetalen. Eerlijk en transparant',
  },
  b2b: { title: '🔒 Inkoopprijzen B2B', description: undefined },
  contact: {
    title: 'Gratis taxatie aanvragen | RPM Edelmetaal',
    description:
      'Vraag gemakkelijk en snel een gratis taxatie aan voor uw edelmetalen of sierraden.',
  },
  notFound: { title: 'Not Found', description: undefined },
} as const;

export type Usp = { icon: IconName; title: string; text: string };

export const uspsHome: Usp[] = [
  {
    icon: 'family',
    title: 'Betrouwbaar familiebedrijf',
    text: '20+ jaar ervaring, persoonlijke service en eerlijk advies.',
  },
  {
    icon: 'clock',
    title: 'Binnen 24 uur reactie',
    text: 'Altijd snel antwoord en flexibele afspraken, op locatie of in Sneek.',
  },
  {
    icon: 'home',
    title: 'Gratis taxaties aan huis',
    text: 'Vrijblijvende taxatie van uw edelmetalen, bij ons of bij u thuis.',
  },
];

export const uspsTaxatie: Usp[] = [
  {
    icon: 'inkoop',
    title: 'inkoop edelmetalen',
    text: 'Goud, Zilver, Platina, Palladium en andere edelmetalen.',
  },
  {
    icon: 'taxatie',
    title: 'Eerlijke Taxaties',
    text: 'Gratis en vrijblijvend, onder het genot van een kopje koffie.',
  },
  {
    icon: 'home',
    title: 'Taxatie aan huis',
    text: 'Wij komen kosteloos bij u thuis langs voor een taxatie van uw edelmetalen.',
  },
  {
    icon: 'familie-alt',
    title: 'Betrouwbaar familiebedrijf',
    text: 'Een vertrouwd familiebedrijf met meer dan 20 jaar ervaring.',
  },
  { icon: 'clock', title: 'Binnen 24 uur reactie', text: 'U krijgt altijd snel een persoonlijk antwoord.' },
  {
    icon: 'flexibel',
    title: 'Flexibele tijden',
    text: 'We plannen de afspraak wanneer het u het beste uitkomt.',
  },
];

export const contactKaarten: Usp[] = [
  { icon: 'mail-lg', title: 'Email', text: 'info@rpmedelmetaal.nl' },
  { icon: 'phone-lg', title: 'Telefoon', text: '+31 85 060 1486' },
  { icon: 'location', title: 'Onze locatie', text: 'RPM Edelmetaal, 8601 BE Sneek' },
];

export const faq = [
  {
    vraag: 'Komen jullie ook bij mij thuis voor taxatie?',
    antwoord: 'Ja, wij bieden een gratis en vrijblijvende taxatie aan huis, zonder voorrijkosten.',
  },
  {
    vraag: 'Moet ik mijn sieraden verkopen bij de taxatie?',
    antwoord: 'Nee, de taxatie is volledig vrijblijvend. U beslist zelf of u wilt verkopen.',
  },
  {
    vraag: 'Hoe snel krijg ik een bod?',
    antwoord: 'Wij doen een direct reëel bod na de taxatie, u ontvangt meteen antwoord.',
  },
  {
    vraag: 'Welke soorten goud kopen jullie in?',
    antwoord: 'Wij kopen diverse soorten goud in, waaronder 8, 14, 18 en 21,6 karaat.',
  },
];

export const cta = {
  title: 'Laat uw sieraden gratis en vrijblijvend taxeren',
  text: 'Plan een gratis en vrijblijvende taxatie bij ons in de winkel of aan huis. Eerlijke prijzen, persoonlijke service en directe uitbetaling.',
};

/** Onder deze regel staat de tekst letterlijk zoals op rpmedelmetaal.nl, inclusief
 *  de typefouten daar. Zie de lijst in PROGRESS.md: corrigeren is een inhoudelijke
 *  keuze van de klant, niet van de conversie. */
export const contactSectie = {
  title: 'Persoonlijk advies en vrijblijvende taxatie, bij u thuis of in Sneek',
  text: 'Heeft u vragen over de waarde van uw sieraden of wilt u direct een taxatie aanvragen? Wij staan klaar om u te helpen in onze winkel in Sneek of gewoon bij u thuis.',
};
