-- ═══════════════════════════════════════════════════════════════════════════
-- RPM Edelmetaal — nieuwe prijzen ook op de site krijgen
--
-- De site is statisch: de prijzen worden tijdens `astro build` vastgelegd. Een
-- verse rij in metal_prices verandert dus nog niets aan wat bezoekers zien.
-- Dit blok roept na een geslaagde ronde een Vercel deploy-hook aan, waarna de
-- site opnieuw wordt gebouwd met de nieuwe prijzen.
--
-- Waarom zo en niet server-side renderen: de prijsbalk staat op élke pagina, dus
-- SSR zou betekenen dat iedere bezoeker een databasecall veroorzaakt voor data
-- die maar 3× per dag wijzigt. Drie builds per dag is goedkoper en robuuster —
-- valt Supabase even weg, dan staat de site er nog gewoon.
--
-- ⚠️ VOORAF, twee dingen:
--
--   1. Maak de deploy-hook aan in Vercel:
--        Project → Settings → Git → Deploy Hooks → Create Hook
--        naam: supabase-prijzen · branch: main
--      Je krijgt een URL van de vorm
--        https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy
--
--   2. Zet die URL in de Vault:
--        Integrations → Vault → Add new secret
--        naam: vercel_deploy_hook
--
--      De URL is zelf het geheim: wie hem heeft kan builds starten.
--
-- Draai dit ná 07-fix-ophalen.sql.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. De hook aanroepen ──────────────────────────────────────────────────

create or replace function site_herbouwen()
returns void
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  v_hook text;
  v_request_id bigint;
begin
  select decrypted_secret into v_hook
  from vault.decrypted_secrets
  where name = 'vercel_deploy_hook';

  -- Geen hook ingesteld? Dan slaan we dit stilletjes over. De prijzen staan
  -- gewoon in de database; alleen de site loopt achter. Dat mag geen reden zijn
  -- om de ophaalronde te laten mislukken.
  if v_hook is null then
    insert into prijs_ophalen_log (status, toelichting)
    values ('overgeslagen', 'Geen vercel_deploy_hook in de Vault — site niet herbouwd.');
    return;
  end if;

  select net.http_post(
    url     := v_hook,
    body    := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 15000
  ) into v_request_id;

  insert into prijs_ophalen_log (request_id, status, toelichting)
  values (v_request_id, 'herbouw gestart', 'Vercel deploy-hook aangeroepen.');
end;
$$;


-- ─── 2. Hem aanroepen na een geslaagde ronde ───────────────────────────────
-- Alleen bij status 'verwerkt'. Een geweigerde of mislukte ronde laat de site
-- met rust: liever de prijzen van vanochtend dan een build op onzin.

create or replace function prijzen_verwerken_en_publiceren()
returns void
language plpgsql
as $$
declare
  v_status text;
begin
  perform prijzen_verwerken();

  select status into v_status
  from prijs_ophalen_log
  order by moment desc
  limit 1;

  if v_status = 'verwerkt' then
    perform site_herbouwen();
  end if;
end;
$$;


-- ─── 3. De cron laten wijzen naar de nieuwe functie ────────────────────────

select cron.alter_job(
  (select jobid from cron.job where jobname = 'rpm-prijzen-verwerken'),
  command := $$select prijzen_verwerken_en_publiceren()$$
);

select jobname, schedule, command, active from cron.job where jobname like 'rpm-%';


-- ─── 4. Testen ─────────────────────────────────────────────────────────────
--
--   select prijzen_ophalen();
--   -- wacht 5 seconden
--   select prijzen_verwerken_en_publiceren();
--   select status, toelichting, moment from prijs_ophalen_log order by moment desc limit 4;
--
-- Verwacht twee regels: 'verwerkt' met de prijzen, en 'herbouw gestart'.
-- Check daarna in Vercel of er een deployment loopt.
--
-- Draai je dit vlak na een eerdere geslaagde ronde, dan wordt de tweede ophaling
-- geweigerd noch verwerkt — er is dan simpelweg geen nieuwe aanvraag om te
-- verwerken en de functie doet niets. Dat is correct gedrag.


-- ─── 5. Terugdraaien ───────────────────────────────────────────────────────
--   select cron.alter_job(
--     (select jobid from cron.job where jobname = 'rpm-prijzen-verwerken'),
--     command := $$select prijzen_verwerken()$$
--   );
