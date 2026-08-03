-- ═══════════════════════════════════════════════════════════════════════════
-- RPM Edelmetaal — verificatie
--
-- Dit is het checkpoint uit het migratieplan: kloppen alle 29 rijen met wat er
-- nu live staat? Draai dit ná 01-datamodel.sql.
--
-- De verwachte waarden hieronder zijn letterlijk overgenomen van
-- www.rpmedelmetaal.nl op 3 augustus 2026, bij marktprijzen
-- goud 113,2661 · zilver 1,6167 · platina 45,6952 · palladium 35,4607 €/gram.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. Alle 29 rijen naast de huidige live-waarden ────────────────────────

with live(slug, verwacht_particulier) as (values
  ('goud-8k',       34.79), ('goud-9k',       39.17), ('goud-10k',      43.56),
  ('goud-12k',      52.23), ('goud-14k',      61.11), ('goud-16k',      69.68),
  ('goud-18k',      78.35), ('goud-20k',      87.02), ('goud-21k',      91.41),
  ('goud-21-6k',    94.02), ('goud-22k',      95.69), ('goud-23k',     100.08),
  ('goud-23-6k',   102.69), ('goud-24k',     104.36),
  ('zilver-640',     0.88), ('zilver-720',     0.99), ('zilver-800',     1.10),
  ('zilver-835',     1.15), ('zilver-900',     1.24), ('zilver-925',     1.27),
  ('zilver-999',     1.37),
  ('platina-850',   33.01), ('platina-900',   34.96), ('platina-950',   36.90),
  ('platina-999',   38.80),
  ('palladium-500', 15.07), ('palladium-900', 27.13), ('palladium-950', 28.63),
  ('palladium-999', 30.11)
)
select
  v.interne_naam,
  v.fijn_gehalte                                  as fijn,
  l.verwacht_particulier                          as live,
  v.prijs_particulier                             as berekend,
  round(v.prijs_particulier - l.verwacht_particulier, 2) as verschil,
  case when v.prijs_particulier = l.verwacht_particulier
       then '✓' else '✗ AFWIJKING' end            as oordeel,
  v.prijs_zakelijk
from v_prijzen_b2b v
join live l on l.slug = v.slug
order by v.metaal_volgorde, v.volgorde;

-- Verwacht: 29 rijen, allemaal ✓.
-- De kolom prijs_zakelijk staat niet publiek op de live site en is dus niet te
-- vergelijken. Voor goud is die berekend met de bevestigde 6500/kg; de nog
-- draaiende n8n-workflow gebruikt daar 8000, dus die cijfers gaan straks omhoog.


-- ─── 2. Samenvatting in één regel ──────────────────────────────────────────

with live(slug, verwacht) as (values
  ('goud-8k',34.79),('goud-9k',39.17),('goud-10k',43.56),('goud-12k',52.23),
  ('goud-14k',61.11),('goud-16k',69.68),('goud-18k',78.35),('goud-20k',87.02),
  ('goud-21k',91.41),('goud-21-6k',94.02),('goud-22k',95.69),('goud-23k',100.08),
  ('goud-23-6k',102.69),('goud-24k',104.36),
  ('zilver-640',0.88),('zilver-720',0.99),('zilver-800',1.10),('zilver-835',1.15),
  ('zilver-900',1.24),('zilver-925',1.27),('zilver-999',1.37),
  ('platina-850',33.01),('platina-900',34.96),('platina-950',36.90),('platina-999',38.80),
  ('palladium-500',15.07),('palladium-900',27.13),('palladium-950',28.63),('palladium-999',30.11)
)
select
  count(*)                                                            as rijen,
  count(*) filter (where v.prijs_particulier = l.verwacht)            as gelijk,
  count(*) filter (where v.prijs_particulier <> l.verwacht)           as afwijkend,
  max(abs(v.prijs_particulier - l.verwacht))                          as grootste_verschil
from v_prijzen_b2b v
join live l on l.slug = v.slug;

-- Verwacht: 29 / 29 / 0 / 0.00


-- ─── 3. Verandering in de zakelijke goudprijzen ────────────────────────────
-- De correctie van 8000 → 6500 per kilo. Dit is wat zakelijke klanten straks
-- méér krijgen. Even bewust zichtbaar maken voordat het live gaat.

select
  interne_naam,
  prijs_particulier                                                        as particulier,
  round((marktprijs_per_gram - 8.0) * fijn_gehalte / 1000.0, 2)            as zakelijk_oud_8000,
  prijs_zakelijk                                                           as zakelijk_nieuw_6500,
  round(prijs_zakelijk - (marktprijs_per_gram - 8.0) * fijn_gehalte / 1000.0, 2) as verschil
from v_prijzen_b2b
where metal_slug = 'goud'
order by volgorde;


-- ─── 4. Is de gating dicht? ────────────────────────────────────────────────
-- Draai deze twee in de SQL Editor met de rolwissel bovenin (of vanuit de app
-- met de anon key). Verwacht:
--   · v_prijzen_publiek  → 29 rijen
--   · v_prijzen_b2b      → permission denied for view v_prijzen_b2b
--
-- Een permission error is het goede antwoord. Een lege lijst zou betekenen dat
-- de kolom wél bereikbaar is en alleen toevallig niets teruggeeft.

-- Selecteer deze regels apart en draai ze los. Draai je het hele bestand in één
-- keer, dan blijft `set role` staan voor alles wat erna komt.
--
--   set role anon;
--   select count(*) from v_prijzen_publiek;   -- verwacht: 29
--   select count(*) from v_prijzen_b2b;       -- verwacht: permission denied
--   reset role;
