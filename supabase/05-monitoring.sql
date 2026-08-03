-- ═══════════════════════════════════════════════════════════════════════════
-- RPM Edelmetaal — cron en prijsophaling bekijken
--
-- Losse queries. Selecteer er één en draai hem; niet het hele bestand.
--
-- In het dashboard: Integrations → Cron (of Database → Cron Jobs, afhankelijk
-- van je projectversie). Daar zie je dezelfde jobs met een run-historie.
-- Onderstaande queries laten meer zien, met name de foutmeldingen.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── Welke jobs staan er gepland? ──────────────────────────────────────────

select
  jobid,
  jobname,
  schedule,
  active,
  command
from cron.job
order by jobname;

-- Verwacht: rpm-prijzen-ophalen (0 8,14,22 * * *) en
--           rpm-prijzen-verwerken (2 8,14,22 * * *), beide active = true.


-- ─── Hebben ze gedraaid, en hoe liep het af? ───────────────────────────────
-- Dit is de belangrijkste query. `status` is hier of de SQL zelf slaagde —
-- niet of de prijzen zijn geaccepteerd. Daarvoor is de volgende query.

select
  j.jobname,
  r.status,
  r.return_message,
  r.start_time,
  round(extract(epoch from (r.end_time - r.start_time))::numeric, 2) as duur_sec
from cron.job_run_details r
join cron.job j on j.jobid = r.jobid
where j.jobname like 'rpm-%'
order by r.start_time desc
limit 20;


-- ─── Wat is er inhoudelijk gebeurd? ────────────────────────────────────────
-- Hier zie je of een ronde is geweigerd door de sanity check, en waarom.
--
--   aangevraagd → request verstuurd, antwoord nog niet verwerkt
--   verwerkt    → prijzen opgeslagen (staan in de toelichting)
--   geweigerd   → afwijking > 20% t.o.v. de vorige prijs; niets opgeslagen
--   fout        → geen geldig antwoord, of de key ontbreekt in de Vault

select
  status,
  toelichting,
  moment
from prijs_ophalen_log
order by moment desc
limit 20;


-- ─── Draait het überhaupt nog? ─────────────────────────────────────────────
-- Eén regel die zegt hoe oud de nieuwste prijs is. Bij een cron die 3× per dag
-- draait hoort dit onder de 8 uur te blijven.

select
  max(opgehaald_op)                                        as laatste_ophaling,
  round(extract(epoch from (now() - max(opgehaald_op))) / 3600, 1) as uur_geleden,
  case
    when max(opgehaald_op) > now() - interval '9 hours' then '✓ actueel'
    else '✗ ACHTERSTALLIG — check cron.job_run_details en prijs_ophalen_log'
  end                                                      as oordeel
from metal_prices;


-- ─── Prijsverloop per metaal ───────────────────────────────────────────────
-- Omdat metal_prices append-only is, heb je hier gratis historie. Handig om te
-- zien of een sprong echt is of een API-hik.

select
  metal_slug,
  prijs_per_gram,
  opgehaald_op,
  round(
    (prijs_per_gram - lag(prijs_per_gram) over (partition by metal_slug order by opgehaald_op))
    / lag(prijs_per_gram) over (partition by metal_slug order by opgehaald_op) * 100,
    2
  ) as verschil_pct
from metal_prices
order by opgehaald_op desc, metal_slug
limit 40;


-- ─── Handmatig draaien (bijv. na het aanpassen van de Vault-key) ───────────
--   select prijzen_ophalen();
--   -- wacht 5 seconden
--   select prijzen_verwerken();
--   select * from prijs_ophalen_log order by moment desc limit 3;


-- ─── Tijdelijk uitzetten / weer aanzetten ──────────────────────────────────
--   select cron.alter_job((select jobid from cron.job where jobname = 'rpm-prijzen-ophalen'),   active := false);
--   select cron.alter_job((select jobid from cron.job where jobname = 'rpm-prijzen-verwerken'), active := false);
--
-- Definitief weg:
--   select cron.unschedule('rpm-prijzen-ophalen');
--   select cron.unschedule('rpm-prijzen-verwerken');


-- ─── Let op: cron.job_run_details groeit ───────────────────────────────────
-- pg_cron ruimt niet automatisch op. Met 6 runs per dag duurt het jaren voor dat
-- iets voorstelt, maar wil je het netjes houden:
--
--   delete from cron.job_run_details where start_time < now() - interval '90 days';
