-- ═══════════════════════════════════════════════════════════════════════════
-- RPM Edelmetaal — datamodel, views, gating en seed
-- Blok 1 t/m 6. Plak van boven naar beneden in de Supabase SQL Editor.
-- Blok 7 (automatisch ophalen) staat in 02-cron.sql.
--
-- Uitgangspunten uit het migratieplan:
--   · Prijzen worden NERGENS opgeslagen. Ze komen altijd uit een view, berekend
--     uit de laatste marktprijs. Zo kan niets out-of-sync raken.
--   · metal_prices is append-only: nooit updaten, altijd inserten. Levert gratis
--     historie op en maakt "wat stond er dinsdag?" beantwoordbaar.
--   · De zakelijke prijs wordt afgeschermd met GRANTS op rollen, niet met RLS.
--     RLS filtert rijen, geen kolommen.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. TABELLEN ───────────────────────────────────────────────────────────

create table metals (
  slug              text primary key,          -- goud | zilver | platina | palladium
  naam              text not null,
  symbool           text not null,             -- AU, AG, PT, PD
  atoomnummer       int  not null,             -- 79, 47, 78, 46 (staat op de prijskaart)
  volgorde          int  not null default 0,   -- tabvolgorde op /inkoopprijzen

  -- 'percentage'    → marge is een percentage van de marktprijs
  -- 'vast_per_kilo' → marge is een bedrag in euro per kilo
  -- Dit is het hele punt van deze kolom: in het Webflow-CMS heette het veld voor
  -- alle vier de metalen 'sloopwaarde-particulier', maar bij goud stond er een
  -- euro-bedrag en bij de rest een percentage. Zelfde naam, twee betekenissen.
  marge_type        text not null check (marge_type in ('percentage', 'vast_per_kilo')),
  marge_particulier numeric not null,
  marge_zakelijk    numeric not null,

  updated_at        timestamptz not null default now()
);

comment on column metals.marge_type is
  'percentage = marge_* is een percentage van de marktprijs; vast_per_kilo = marge_* is euro per kilo.';


create table metal_prices (
  id             bigint generated always as identity primary key,
  metal_slug     text not null references metals(slug),
  prijs_per_gram numeric(12,4) not null check (prijs_per_gram > 0),
  valuta         text not null default 'EUR',
  opgehaald_op   timestamptz not null default now()
);

create index metal_prices_lookup on metal_prices (metal_slug, opgehaald_op desc);

comment on table metal_prices is
  'Append-only. Nooit updaten — elke ophaalronde is een nieuwe rij.';


create table gehaltes (
  id           bigint generated always as identity primary key,
  interne_naam text not null,                  -- "Goud 24k"
  slug         text unique not null,           -- "goud-24k"
  nummer       text,                           -- "24" of "925" — wat op de tegel staat
  fijn_gehalte int  not null check (fijn_gehalte between 1 and 1000),
  metal_slug   text not null references metals(slug),
  volgorde     int  not null default 0,
  zichtbaar    boolean not null default true
);

create index gehaltes_metaal on gehaltes (metal_slug, volgorde);


create table reviews (
  id            bigint generated always as identity primary key,
  naam          text not null,
  tekst         text not null,
  score         int check (score between 1 and 5),
  gepubliceerd  boolean not null default true,
  aangemaakt_op timestamptz not null default now()
);


-- ─── 2. VIEWS ──────────────────────────────────────────────────────────────
-- security_invoker staat op ALLE views aan. Zonder die optie draait een view met
-- de rechten van de eigenaar en omzeilt hij daarmee RLS op de onderliggende
-- tabellen — een klassieke Supabase-valkuil.
--
-- Bewust GEEN view-op-view: met security_invoker zou de publieke view dan ook
-- leesrecht op de tussenview nodig hebben, en juist die wil je dichtzetten. De
-- formule staat daarom in een functie die beide views gebruiken.

create view v_actuele_marktprijzen
  with (security_invoker = on) as
select distinct on (metal_slug)
  metal_slug,
  prijs_per_gram,
  opgehaald_op
from metal_prices
order by metal_slug, opgehaald_op desc;


-- De formule, één keer: (marktprijs − sloopwaarde) × fijn_gehalte / 1000.
create or replace function bereken_prijs(
  marktprijs   numeric,
  marge_type   text,
  marge        numeric,
  fijn_gehalte int
)
returns numeric
language sql
immutable
as $$
  select round(
    (marktprijs - case
       when marge_type = 'percentage' then marktprijs * (marge / 100.0)
       else marge / 1000.0
     end) * fijn_gehalte / 1000.0,
    2
  );
$$;


-- Publiek: géén zakelijke kolom. Niet verborgen — hij bestaat hier niet.
create view v_prijzen_publiek
  with (security_invoker = on) as
select
  g.id, g.slug, g.interne_naam, g.nummer, g.fijn_gehalte, g.metal_slug,
  m.naam as metaal_naam, m.symbool, m.atoomnummer,
  m.volgorde as metaal_volgorde, g.volgorde,
  p.prijs_per_gram as marktprijs_per_gram,
  bereken_prijs(p.prijs_per_gram, m.marge_type, m.marge_particulier, g.fijn_gehalte) as prijs_particulier,
  p.opgehaald_op
from gehaltes g
join metals m                 on m.slug = g.metal_slug
join v_actuele_marktprijzen p on p.metal_slug = g.metal_slug
where g.zichtbaar;


-- B2B: inclusief zakelijke kolom.
create view v_prijzen_b2b
  with (security_invoker = on) as
select
  g.id, g.slug, g.interne_naam, g.nummer, g.fijn_gehalte, g.metal_slug,
  m.naam as metaal_naam, m.symbool, m.atoomnummer,
  m.volgorde as metaal_volgorde, g.volgorde,
  p.prijs_per_gram as marktprijs_per_gram,
  bereken_prijs(p.prijs_per_gram, m.marge_type, m.marge_particulier, g.fijn_gehalte) as prijs_particulier,
  bereken_prijs(p.prijs_per_gram, m.marge_type, m.marge_zakelijk,    g.fijn_gehalte) as prijs_zakelijk,
  p.opgehaald_op
from gehaltes g
join metals m                 on m.slug = g.metal_slug
join v_actuele_marktprijzen p on p.metal_slug = g.metal_slug
where g.zichtbaar;


-- ─── 3. RLS OP DE BASISTABELLEN ────────────────────────────────────────────
-- Nodig omdat security_invoker de rechten van de bezoeker gebruikt: zonder deze
-- policies ziet anon niets, ook niet via de publieke view.

alter table metals       enable row level security;
alter table metal_prices enable row level security;
alter table gehaltes     enable row level security;
alter table reviews      enable row level security;

create policy "iedereen mag metalen lezen"
  on metals for select to anon, authenticated using (true);

create policy "iedereen mag marktprijzen lezen"
  on metal_prices for select to anon, authenticated using (true);

create policy "iedereen mag zichtbare gehaltes lezen"
  on gehaltes for select to anon, authenticated using (zichtbaar);

create policy "iedereen mag gepubliceerde reviews lezen"
  on reviews for select to anon, authenticated using (gepubliceerd);

-- Schrijven gebeurt uitsluitend met de service_role key (de cron of n8n).
-- Die omzeilt RLS, dus er is bewust geen insert/update/delete-policy.


-- ─── 4. GRANTS — hier zit het slot ─────────────────────────────────────────

grant execute on function bereken_prijs(numeric, text, numeric, int) to anon, authenticated;

grant select on v_actuele_marktprijzen to anon, authenticated;
grant select on v_prijzen_publiek      to anon, authenticated;

-- Uitgelogd = permission denied, geen lege lijst. De zakelijke prijs komt nooit
-- in de HTML terecht omdat de query zelf al faalt.
revoke all on v_prijzen_b2b from anon, public;
grant select on v_prijzen_b2b to authenticated;

-- Let op: nu geldt "ingelogd = zakelijk". Komen er later ook particuliere
-- accounts, dan komt er een profiles-tabel met is_b2b bij en wordt v_prijzen_b2b
-- een RPC met een expliciete check. Bouw dat nu niet vooruit — 3 gebruikers.


-- ─── 5. SEED: metalen ──────────────────────────────────────────────────────
-- Goudmarge bevestigd op 3 augustus 2026: particulier 8800/kg, zakelijk 6500/kg.
-- De draaiende n8n-workflow heeft daar nog 8000 hardcoded staan; dat was een bug.
-- Zilver, platina en palladium: 15% voor beide.

insert into metals (slug, naam, symbool, atoomnummer, volgorde, marge_type, marge_particulier, marge_zakelijk) values
  ('goud',      'Goud',      'AU', 79, 1, 'vast_per_kilo', 8800, 6500),
  ('zilver',    'Zilver',    'AG', 47, 2, 'percentage',      15,   15),
  ('platina',   'Platina',   'PT', 78, 3, 'percentage',      15,   15),
  ('palladium', 'Palladium', 'PD', 46, 4, 'percentage',      15,   15);


-- ─── 6. SEED: 29 gehaltes ──────────────────────────────────────────────────
-- Fijn gehaltes overgenomen van www.rpmedelmetaal.nl (3 augustus 2026), niet
-- berekend — 10k is daar 417 en 16k is 667, niet de afgeronde 416/666.

insert into gehaltes (interne_naam, slug, nummer, fijn_gehalte, metal_slug, volgorde) values
  ('Goud 8k',      'goud-8k',      '8',    333, 'goud',  1),
  ('Goud 9k',      'goud-9k',      '9',    375, 'goud',  2),
  ('Goud 10k',     'goud-10k',     '10',   417, 'goud',  3),
  ('Goud 12k',     'goud-12k',     '12',   500, 'goud',  4),
  ('Goud 14k',     'goud-14k',     '14',   585, 'goud',  5),
  ('Goud 16k',     'goud-16k',     '16',   667, 'goud',  6),
  ('Goud 18k',     'goud-18k',     '18',   750, 'goud',  7),
  ('Goud 20k',     'goud-20k',     '20',   833, 'goud',  8),
  ('Goud 21k',     'goud-21k',     '21',   875, 'goud',  9),
  ('Goud 21.6k',   'goud-21-6k',   '21.6', 900, 'goud', 10),
  ('Goud 22k',     'goud-22k',     '22',   916, 'goud', 11),
  ('Goud 23k',     'goud-23k',     '23',   958, 'goud', 12),
  ('Goud 23.6k',   'goud-23-6k',   '23.6', 983, 'goud', 13),
  ('Goud 24k',     'goud-24k',     '24',   999, 'goud', 14),

  ('Zilver 640',   'zilver-640',   '640',  640, 'zilver', 1),
  ('Zilver 720',   'zilver-720',   '720',  720, 'zilver', 2),
  ('Zilver 800',   'zilver-800',   '800',  800, 'zilver', 3),
  ('Zilver 835',   'zilver-835',   '835',  835, 'zilver', 4),
  ('Zilver 900',   'zilver-900',   '900',  900, 'zilver', 5),
  ('Zilver 925',   'zilver-925',   '925',  925, 'zilver', 6),
  ('Zilver 999',   'zilver-999',   '999',  999, 'zilver', 7),

  ('Platina 850',  'platina-850',  '850',  850, 'platina', 1),
  ('Platina 900',  'platina-900',  '900',  900, 'platina', 2),
  ('Platina 950',  'platina-950',  '950',  950, 'platina', 3),
  ('Platina 999',  'platina-999',  '999',  999, 'platina', 4),

  ('Palladium 500','palladium-500','500',  500, 'palladium', 1),
  ('Palladium 900','palladium-900','900',  900, 'palladium', 2),
  ('Palladium 950','palladium-950','950',  950, 'palladium', 3),
  ('Palladium 999','palladium-999','999',  999, 'palladium', 4);


-- ─── 7. TESTPRIJZEN — voor de verificatie hieronder ────────────────────────
-- Marktprijzen van www.rpmedelmetaal.nl op 3 augustus 2026. Zodra de cron of
-- n8n draait komen er echte rijen bij; deze blijven staan als startpunt van de
-- historie. Wil je ze niet: verwijder dit blok en draai de cron één keer.

insert into metal_prices (metal_slug, prijs_per_gram) values
  ('goud',      113.2661),
  ('zilver',      1.6167),
  ('platina',    45.6952),
  ('palladium',  35.4607);
