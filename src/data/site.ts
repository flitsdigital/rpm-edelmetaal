

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

export const gehaltesPerMetaal = {
  Goud: ['8k', '9k', '10k', '12k', '14k', '16k', '18k', '20k', '21k', '21.6k', '22k', '23k', '23.6k', '24k'],
  Zilver: ['640', '720', '800', '835', '900', '925', '999'],
  Platina: ['850', '900', '950', '999'],
  Palladium: ['500', '900', '950', '999'],
} as const;

type Metaal = keyof typeof gehaltesPerMetaal;
export const metalen = Object.keys(gehaltesPerMetaal) as Metaal[];

export type MetaalPrijs = {

  symbool: string;
  naam: string;
  prijs: string;
};
