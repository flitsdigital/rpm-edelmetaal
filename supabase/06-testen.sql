-- ═══════════════════════════════════════════════════════════════════════════
-- RPM Edelmetaal — de prijsophaling testen zonder op de cron te wachten
--
-- Drie tests, oplopend in wat ze bewijzen. Selecteer per stap en draai los.
--
--   TEST 1  werkt de logica?          → de functies direct aanroepen
--   TEST 2  vuurt pg_cron ook echt?   → tijdelijk elke minuut
--   TEST 3  houdt de sanity check?    → met opzet een onzinprijs aanbieden
--
-- Test 1 is wat je normaal doet. Test 2 en 3 hoef je één keer te draaien, maar
-- ze vangen wel de twee dingen die je anders pas maanden later merkt: een cron
-- die stilstaat, en een vangnet dat niet vangt.
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══ TEST 1 — werkt de logica? ═════════════════════════════════════════════
-- Doet een echte call naar metals.dev en schrijft echte prijzen weg.

-- 1a. Afvuren
select prijzen_ophalen();

-- 1b. Kwam er iets terug? (na ~1 seconde)
select id, status_code, left(content, 120) as begin_van_antwoord, created
from net._http_response
order by created desc
limit 3;
--    Verwacht: status_code 200 en JSON met "metals".
--    401/403 → key klopt niet of staat niet in de Vault.
--    Leeg    → pg_net staat niet aan, of de request is nog onderweg.

-- 1c. Verwerken (wacht ~5 seconden na 1a)
select prijzen_verwerken();

-- 1d. Wat is er gebeurd?
select status, toelichting, moment
from prijs_ophalen_log
order by moment desc
limit 3;
--    Verwacht: status 'verwerkt' met de vier prijzen in de toelichting.

-- 1e. Staan ze in de tabel, en kloppen de afgeleide prijzen?
select metal_slug, prijs_per_gram, opgehaald_op
from metal_prices
order by opgehaald_op desc, metal_slug
limit 8;

select interne_naam, marktprijs_per_gram, prijs_particulier, prijs_zakelijk
from v_prijzen_b2b
where slug in ('goud-24k', 'zilver-999', 'platina-850', 'palladium-500')
order by metaal_volgorde;


-- ═══ TEST 2 — vuurt pg_cron ook echt? ══════════════════════════════════════
-- Test 1 bewijst dat de functies werken, niet dat de planner ze aanroept. Dit
-- is een ander soort storing: extensie niet aan, job niet actief, verkeerde
-- schedule. Zet de jobs tijdelijk op elke minuut.

-- 2a. Omzetten naar elke minuut
select cron.alter_job(
  (select jobid from cron.job where jobname = 'rpm-prijzen-ophalen'),
  schedule := '* * * * *'
);
select cron.alter_job(
  (select jobid from cron.job where jobname = 'rpm-prijzen-verwerken'),
  schedule := '* * * * *'
);

-- 2b. Wacht 2–3 minuten. Draai dan:
select j.jobname, r.status, r.return_message, r.start_time
from cron.job_run_details r
join cron.job j on j.jobid = r.jobid
where j.jobname like 'rpm-%'
order by r.start_time desc
limit 10;
--    Verwacht: meerdere regels met status 'succeeded'.
--    Niets    → pg_cron draait niet. Check `select * from cron.job` op active.

-- 2c. ⚠️ NIET VERGETEN: terugzetten naar 3× per dag
select cron.alter_job(
  (select jobid from cron.job where jobname = 'rpm-prijzen-ophalen'),
  schedule := '0 8,14,22 * * *'
);
select cron.alter_job(
  (select jobid from cron.job where jobname = 'rpm-prijzen-verwerken'),
  schedule := '2 8,14,22 * * *'
);

-- 2d. Controleren dat het terugstaat
select jobname, schedule, active from cron.job where jobname like 'rpm-%';


-- ═══ TEST 3 — houdt de sanity check? ═══════════════════════════════════════
-- Het vangnet dat voorkomt dat een API-storing of een unit-fout (per ounce in
-- plaats van per gram) in één klap onzinprijzen publiceert aan zakelijke
-- klanten. Dit is het enige onderdeel dat je nooit vanzelf ziet falen.
--
-- Werkwijze: zet met opzet een absurde "vorige" goudprijs neer. De volgende
-- ophaling wijkt daar meer dan 20% van af en moet dus geweigerd worden.
--
-- ⚠️ Tussen 3a en 3d staat er een onzinprijs in de views. Doe dit vóórdat de
--    site live is, en draai 3d meteen.

-- 3a. Onzinprijs erin (goud op 10 euro per gram)
insert into metal_prices (metal_slug, prijs_per_gram) values ('goud', 10.0);

-- 3b. Ophalen en verwerken (wacht ~5 seconden tussen de twee)
select prijzen_ophalen();
select prijzen_verwerken();

-- 3c. Is het geweigerd?
select status, toelichting, moment
from prijs_ophalen_log
order by moment desc
limit 2;
--    Verwacht: status 'geweigerd', toelichting ongeveer
--    "goud: 113.27 wijkt meer dan 20% af van 10.0000".
--
--    Staat er 'verwerkt'? Dan is de check stuk. Niet live zetten.
--
--    Belangrijk: er hoort NIETS te zijn weggeschreven, ook niet voor zilver,
--    platina of palladium. De check weigert de hele ronde, niet één metaal.

-- 3d. Opruimen — de onzinprijs weg
delete from metal_prices
where metal_slug = 'goud' and prijs_per_gram = 10.0;

-- 3e. Controleren dat de goudprijs weer klopt
select metal_slug, prijs_per_gram, opgehaald_op
from v_actuele_marktprijzen
order by metal_slug;
--    Verwacht: goud rond de 113, niet 10.

-- 3f. En daarna een schone ronde draaien
select prijzen_ophalen();
-- wacht 5 seconden
select prijzen_verwerken();
select status, toelichting from prijs_ophalen_log order by moment desc limit 1;
--    Verwacht: 'verwerkt'.


-- ═══ Als test 1 al faalt ═══════════════════════════════════════════════════
--
-- "Secret metals_dev_key niet gevonden in de Vault"
--     → Project Settings → Vault → New secret, naam exact `metals_dev_key`.
--
-- status_code 401 of 403 in net._http_response
--     → key klopt niet, of metals.dev verwacht hem anders. Sommige plannen
--       willen `?api_key=` in de URL in plaats van de x-api-key header. Check
--       je dashboard bij metals.dev en pas prijzen_ophalen() aan.
--
-- Geen enkele regel in net._http_response
--     → pg_net staat niet aan:  create extension if not exists pg_net with schema extensions;
--
-- 'Antwoord bevat geen "metals"-object'
--     → de API antwoordde iets anders dan verwacht. Kijk in
--       net._http_response wat er precies terugkwam.
