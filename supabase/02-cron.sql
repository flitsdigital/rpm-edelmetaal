-- ═══════════════════════════════════════════════════════════════════════════
-- RPM Edelmetaal — marktprijzen automatisch ophalen, volledig in Supabase
--
-- Vervangt de metals.dev-kant van de n8n-workflow. Draai dit ná 01-datamodel.sql.
--
-- Waarom twee cron-regels en niet één: pg_net is asynchroon. Je vuurt een
-- request af en krijgt een id terug; het antwoord landt even later in
-- net._http_response. In pure SQL kun je daar niet op wachten. Dus:
--     :00  → request afvuren
--     :02  → antwoord verwerken
-- Twee minuten is ruim; metals.dev antwoordt binnen een seconde.
--
-- ⚠️ VOORAF: zet je metals.dev-key in de Vault, niet in deze SQL.
--    Dashboard → Project Settings → Vault → New secret
--       naam:   metals_dev_key
--       waarde: <je NIEUWE key>
--
--    Roteer de key eerst bij metals.dev. De huidige staat als querystring in de
--    URL van de n8n-node "Get Metals" en dus ook in elke executie-log.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. EXTENSIES ──────────────────────────────────────────────────────────

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net  with schema extensions;
create extension if not exists supabase_vault with schema vault;


-- ─── 2. LOGTABEL ───────────────────────────────────────────────────────────
-- Zonder log weet je niet waarom er een ronde is overgeslagen. Dit is de
-- vervanging voor n8n's executie-overzicht.

create table prijs_ophalen_log (
  id           bigint generated always as identity primary key,
  request_id   bigint,
  status       text not null,     -- 'aangevraagd' | 'verwerkt' | 'geweigerd' | 'fout'
  toelichting  text,
  moment       timestamptz not null default now()
);

create index prijs_ophalen_log_moment on prijs_ophalen_log (moment desc);


-- ─── 3. STAP 1: request afvuren ────────────────────────────────────────────

create or replace function prijzen_ophalen()
returns void
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  v_key text;
  v_request_id bigint;
begin
  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'metals_dev_key';

  if v_key is null then
    insert into prijs_ophalen_log (status, toelichting)
    values ('fout', 'Secret metals_dev_key niet gevonden in de Vault.');
    return;
  end if;

  -- Key gaat als header mee, niet als querystring: zo staat hij niet in logs.
  select net.http_get(
    url     := 'https://api.metals.dev/v1/latest?currency=EUR&unit=g',
    headers := jsonb_build_object('x-api-key', v_key),
    timeout_milliseconds := 15000
  ) into v_request_id;

  insert into prijs_ophalen_log (request_id, status, toelichting)
  values (v_request_id, 'aangevraagd', 'Request naar metals.dev verstuurd.');
end;
$$;


-- ─── 4. STAP 2: antwoord verwerken, mét sanity check ───────────────────────
-- De sanity check is het belangrijkste deel van dit bestand. Bij een API-storing
-- of een unit-fout (per ounce in plaats van per gram) zou je anders in één klap
-- onzinprijzen publiceren aan zakelijke klanten. Wijkt een prijs meer dan 20%
-- af van de vorige, dan gaat de hele ronde niet door — niet alleen dat ene metaal.

create or replace function prijzen_verwerken()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_log     record;
  v_body    jsonb;
  v_metalen jsonb;
  v_nieuw   numeric;
  v_vorig   numeric;
  v_slug    text;
  v_sleutel text;
  v_bezwaar text := null;
begin
  -- Pak de meest recente aanvraag die nog niet verwerkt is.
  select * into v_log
  from prijs_ophalen_log
  where status = 'aangevraagd'
  order by moment desc
  limit 1;

  if v_log is null then
    return;  -- niets te doen
  end if;

  select content::jsonb into v_body
  from net._http_response
  where id = v_log.request_id and status_code = 200;

  if v_body is null then
    update prijs_ophalen_log set status = 'fout',
      toelichting = 'Geen geldig antwoord (status ≠ 200 of nog niet binnen).'
    where id = v_log.id;
    return;
  end if;

  v_metalen := v_body -> 'metals';

  if v_metalen is null then
    update prijs_ophalen_log set status = 'fout',
      toelichting = 'Antwoord bevat geen "metals"-object.'
    where id = v_log.id;
    return;
  end if;

  -- Sanity check over alle vier vóórdat er iets wordt weggeschreven.
  foreach v_slug in array array['goud', 'zilver', 'platina', 'palladium'] loop
    v_sleutel := case v_slug
      when 'goud'      then 'gold'
      when 'zilver'    then 'silver'
      when 'platina'   then 'platinum'
      when 'palladium' then 'palladium'
    end;

    v_nieuw := (v_metalen ->> v_sleutel)::numeric;

    if v_nieuw is null or v_nieuw <= 0 then
      v_bezwaar := format('%s: ontbreekt of is niet positief (%s)', v_slug, v_nieuw);
      exit;
    end if;

    select prijs_per_gram into v_vorig
    from metal_prices
    where metal_slug = v_slug
    order by opgehaald_op desc
    limit 1;

    if v_vorig is not null and abs(v_nieuw - v_vorig) / v_vorig > 0.20 then
      v_bezwaar := format('%s: %s wijkt meer dan 20%% af van %s', v_slug, v_nieuw, v_vorig);
      exit;
    end if;
  end loop;

  if v_bezwaar is not null then
    update prijs_ophalen_log set status = 'geweigerd', toelichting = v_bezwaar
    where id = v_log.id;
    return;
  end if;

  -- Alles akkoord: alle vier in één transactie.
  insert into metal_prices (metal_slug, prijs_per_gram) values
    ('goud',      (v_metalen ->> 'gold')::numeric),
    ('zilver',    (v_metalen ->> 'silver')::numeric),
    ('platina',   (v_metalen ->> 'platinum')::numeric),
    ('palladium', (v_metalen ->> 'palladium')::numeric);

  update prijs_ophalen_log set status = 'verwerkt',
    toelichting = format('Goud %s · zilver %s · platina %s · palladium %s',
      v_metalen ->> 'gold', v_metalen ->> 'silver',
      v_metalen ->> 'platinum', v_metalen ->> 'palladium')
  where id = v_log.id;
end;
$$;


-- ─── 5. DE CRON ────────────────────────────────────────────────────────────
-- Zelfde momenten als de bestaande n8n-workflow: 8:00, 14:00 en 22:00 UTC.
-- Dat houdt het Supabase-project ook actief, dus de auto-pause van de free tier
-- (7 dagen zonder activiteit) is geen risico.

select cron.schedule('rpm-prijzen-ophalen',  '0 8,14,22 * * *', $$select prijzen_ophalen()$$);
select cron.schedule('rpm-prijzen-verwerken','2 8,14,22 * * *', $$select prijzen_verwerken()$$);


-- ─── 6. HANDMATIG TESTEN ───────────────────────────────────────────────────
-- Draai deze twee los, met een pauze ertussen:
--
--   select prijzen_ophalen();
--   -- wacht 5 seconden
--   select prijzen_verwerken();
--   select * from prijs_ophalen_log order by moment desc limit 5;
--
-- Verwacht: één regel met status 'verwerkt' en de vier prijzen in de toelichting.


-- ─── 7. OPRUIMEN (mocht je terug willen naar n8n) ──────────────────────────
--   select cron.unschedule('rpm-prijzen-ophalen');
--   select cron.unschedule('rpm-prijzen-verwerken');
