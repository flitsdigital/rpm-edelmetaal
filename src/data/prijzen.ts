import { supabase } from '../lib/supabase';
import type { Prijsgroep } from '../components/sections/SectionPrijstabel.astro';
import type { MetaalPrijs } from './site';

const PRESENTATIE = {
  goud: {
    label: 'Karaat',
    prijslabel: 'Prijs particulier:',
    titel: 'Actuele goudprijzen per karaat',
    intro:
      'De waarde van goud hangt af van het karaat. Hieronder vindt u onze actuele inkoopprijzen per gram, zodat u snel inzicht krijgt in wat uw goud waard is.',
    widget: 'https://goldbroker.com/widget/live/XAU?currency=EUR&weight_unit=kg&height=320',
  },
  zilver: {
    label: 'Gehalte',
    prijslabel: 'Prijs:',
    titel: 'Actuele Zilverprijzen per gehalte',
    intro:
      'De waarde van zilver hangt af van het gehalte. Hieronder vindt u onze actuele inkoopprijzen per gram, zodat u snel inzicht krijgt in wat uw zilver waard is.',
  },
  platina: {
    label: 'Gehalte',
    prijslabel: 'Prijs:',
    titel: 'Actuele Platinaprijzen per gehalte',
    intro:
      'De waarde van Platina hangt af van het gehalte. Hieronder vindt u onze actuele inkoopprijzen per gram, zodat u snel inzicht krijgt in wat uw Platina waard is.',
  },
  palladium: {
    label: 'Gehalte',
    prijslabel: 'Prijs:',
    titel: 'Actuele Palladiumprijzen per gehalte',
    intro:
      'De waarde van Palladium hangt af van het gehalte. Hieronder vindt u onze actuele inkoopprijzen per gram, zodat u snel inzicht krijgt in wat uw Palladium waard is.',
  },
} as const satisfies Record<string, { label: string; prijslabel: string; titel: string; intro: string; widget?: string }>;

type Rij = {
  slug: string;
  nummer: string;
  fijn_gehalte: number;
  metal_slug: keyof typeof PRESENTATIE;
  metaal_naam: string;
  symbool: string;
  atoomnummer: number;
  metaal_volgorde: number;
  volgorde: number;
  marktprijs_per_gram: string | number;
  prijs_particulier: string | number;
  prijs_zakelijk?: string | number;
};

const bedrag = (n: string | number, decimalen = 2) => Number(n).toFixed(decimalen);

const KOLOMMEN =
  'slug, nummer, fijn_gehalte, metal_slug, metaal_naam, symbool, atoomnummer, metaal_volgorde, volgorde, marktprijs_per_gram, prijs_particulier';

function groepeer(rijen: Rij[]): Prijsgroep[] {
  const perMetaal = new Map<string, Rij[]>();
  for (const rij of rijen) {
    const lijst = perMetaal.get(rij.metal_slug) ?? [];
    lijst.push(rij);
    perMetaal.set(rij.metal_slug, lijst);
  }

  return [...perMetaal.entries()].map(([slug, lijst]) => {
    const eerste = lijst[0];
    const p = PRESENTATIE[slug as keyof typeof PRESENTATIE];
    return {
      metaal: eerste.metaal_naam,
      symbool: eerste.symbool,
      atoomnummer: eerste.atoomnummer,
      marktprijs: bedrag(eerste.marktprijs_per_gram, 4),
      label: p.label,
      prijslabel: p.prijslabel,
      titel: p.titel,
      intro: p.intro,
      ...('widget' in p ? { widget: p.widget } : {}),
      rijen: lijst.map((r) => ({
        nummer: r.nummer,
        gehalte: String(r.fijn_gehalte),
        prijs: bedrag(r.prijs_particulier),
        ...(r.prijs_zakelijk !== undefined ? { zakelijk: bedrag(r.prijs_zakelijk) } : {}),
      })),
    };
  });
}

export async function haalPrijzen() {
  const { data, error } = await supabase
    .from('v_prijzen_publiek')
    .select(KOLOMMEN)
    .order('metaal_volgorde')
    .order('volgorde');

  if (error) throw new Error(`Prijzen ophalen mislukt: ${error.message}`);
  if (!data?.length) throw new Error('Geen prijzen gevonden in v_prijzen_publiek.');

  const groepen = groepeer(data as Rij[]);
  return { groepen, ...afgeleid(groepen) };
}

export async function haalPrijzenB2b(client = supabase) {
  const { data, error } = await client
    .from('v_prijzen_b2b')
    .select(`${KOLOMMEN}, prijs_zakelijk`)
    .order('metaal_volgorde')
    .order('volgorde');

  if (error) throw new Error(`B2B-prijzen ophalen mislukt: ${error.message}`);
  if (!data?.length) throw new Error('Geen prijzen gevonden in v_prijzen_b2b.');

  const groepen = groepeer(data as Rij[]);
  return { groepen, ...afgeleid(groepen) };
}

function afgeleid(groepen: Prijsgroep[]) {
  const topPrijzen: MetaalPrijs[] = groepen.map((g) => ({
    symbool: g.symbool,
    naam: g.metaal,
    prijs: g.marktprijs,
  }));

  const topKaarten = groepen.map((g) => ({
    symbool: g.symbool,
    atoomnummer: g.atoomnummer,
    naam: g.metaal,
    prijs: g.marktprijs,
  }));

  return { topPrijzen, topKaarten };
}
