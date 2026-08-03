-- ═══════════════════════════════════════════════════════════════════════════
-- RPM Edelmetaal — CORRECTIE op de views uit 01-datamodel.sql
--
-- Wat er mis was
-- ──────────────
-- 01-datamodel.sql had drie views op elkaar gestapeld:
--
--     v_gehalte_prijzen   (de berekening)
--       ├── v_prijzen_publiek   (zelfde, zonder zakelijke kolom)
--       └── v_prijzen_b2b       (zelfde, mét)
--
-- en trok daarna `v_gehalte_prijzen` in voor anon. Maar met
-- `security_invoker = on` draait een view met de rechten van de BEZOEKER — dus
-- v_prijzen_publiek had voor een uitgelogde bezoeker alsnog leesrecht op
-- v_gehalte_prijzen nodig. Dat had ik net weggehaald.
--
-- Gevolg: `permission denied for view v_gehalte_prijzen`, en de publieke
-- prijstabel zou voor iedere bezoeker leeg zijn. Precies het omgekeerde van de
-- bedoeling.
--
-- Hoe het nu werkt
-- ────────────────
-- Geen view-op-view meer. De berekening zit in één functie die beide views
-- gebruiken, dus de formule staat nog steeds op één plek. Elke view leest
-- rechtstreeks uit de basistabellen.
--
--     bereken_prijs()  ← de formule, één keer
--       ├── v_prijzen_publiek   → anon + authenticated
--       └── v_prijzen_b2b       → alleen authenticated
--
-- Draai dit ná 01-datamodel.sql. Daarna is 03-verificatie.sql geldig.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. Oude views weg ─────────────────────────────────────────────────────

drop view if exists v_prijzen_publiek;
drop view if exists v_prijzen_b2b;
drop view if exists v_gehalte_prijzen;


-- ─── 2. De formule, één keer ───────────────────────────────────────────────
-- (marktprijs − sloopwaarde) × fijn_gehalte / 1000, afgerond op 2 decimalen.
--
-- De sloopwaarde is een percentage van de marktprijs (zilver, platina,
-- palladium) óf een vast bedrag per kilo (goud). Dat onderscheid is de reden dat
-- metals.marge_type bestaat: in het oude Webflow-CMS heette het veld voor alle
-- vier hetzelfde, maar betekende het bij goud iets anders.

create or replace function bereken_prijs(
  marktprijs  numeric,
  marge_type  text,
  marge       numeric,
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

comment on function bereken_prijs is
  'Inkoopprijs per gram. Eén bron voor de formule; de views rekenen niet zelf.';


-- ─── 3. Publieke view — géén zakelijke kolom ───────────────────────────────

create view v_prijzen_publiek
  with (security_invoker = on) as
select
  g.id,
  g.slug,
  g.interne_naam,
  g.nummer,
  g.fijn_gehalte,
  g.metal_slug,
  m.naam     as metaal_naam,
  m.symbool,
  m.atoomnummer,
  m.volgorde as metaal_volgorde,
  g.volgorde,
  p.prijs_per_gram as marktprijs_per_gram,
  bereken_prijs(p.prijs_per_gram, m.marge_type, m.marge_particulier, g.fijn_gehalte) as prijs_particulier,
  p.opgehaald_op
from gehaltes g
join metals m                 on m.slug = g.metal_slug
join v_actuele_marktprijzen p on p.metal_slug = g.metal_slug
where g.zichtbaar;


-- ─── 4. B2B-view — inclusief zakelijke kolom ───────────────────────────────

create view v_prijzen_b2b
  with (security_invoker = on) as
select
  g.id,
  g.slug,
  g.interne_naam,
  g.nummer,
  g.fijn_gehalte,
  g.metal_slug,
  m.naam     as metaal_naam,
  m.symbool,
  m.atoomnummer,
  m.volgorde as metaal_volgorde,
  g.volgorde,
  p.prijs_per_gram as marktprijs_per_gram,
  bereken_prijs(p.prijs_per_gram, m.marge_type, m.marge_particulier, g.fijn_gehalte) as prijs_particulier,
  bereken_prijs(p.prijs_per_gram, m.marge_type, m.marge_zakelijk,    g.fijn_gehalte) as prijs_zakelijk,
  p.opgehaald_op
from gehaltes g
join metals m                 on m.slug = g.metal_slug
join v_actuele_marktprijzen p on p.metal_slug = g.metal_slug
where g.zichtbaar;


-- ─── 5. Grants — hier zit het slot ─────────────────────────────────────────

grant execute on function bereken_prijs(numeric, text, numeric, int) to anon, authenticated;

grant select on v_actuele_marktprijzen to anon, authenticated;
grant select on v_prijzen_publiek      to anon, authenticated;

revoke all on v_prijzen_b2b from anon, public;
grant select on v_prijzen_b2b to authenticated;


-- ─── 6. Controleren ────────────────────────────────────────────────────────
-- Selecteer deze regels apart en draai ze (niet het hele bestand in één keer —
-- `set role` blijft anders staan voor de statements erna).
--
--   set role anon;
--   select count(*) from v_prijzen_publiek;   -- verwacht: 29
--   select count(*) from v_prijzen_b2b;       -- verwacht: permission denied
--   reset role;
--
-- Een permission error op de tweede is het GOEDE antwoord. Een lege lijst zou
-- betekenen dat de view wél bereikbaar is en alleen toevallig niets teruggeeft.
