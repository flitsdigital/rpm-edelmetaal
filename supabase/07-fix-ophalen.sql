-- ═══════════════════════════════════════════════════════════════════════════
-- RPM Edelmetaal — correctie op 02-cron.sql
--
-- Twee dingen:
--
-- 1. `prijzen_verwerken()` zette een aanvraag meteen op 'fout' zodra er nog geen
--    antwoord was. Kwam het antwoord een seconde later alsnog binnen, dan was de
--    regel al verbrand en werd hij nooit meer opgepakt. Nu blijft een aanvraag
--    'aangevraagd' tot hij ouder is dan 2 minuten; pas dan is het echt fout.
--
-- 2. metals.dev wil de key als querystring (`?api_key=`), niet als
--    x-api-key-header. Dat is ook wat de bestaande n8n-node doet en dus bewezen
--    werkend met deze key. De header-variant leverde geen 200 op.
--    Zie DIAGNOSE onderaan: check eerst wat er in jouw geval terugkwam.
--
-- Draai dit ná 02-cron.sql. De cron-regels zelf hoeven niet opnieuw.
-- ═══════════════════════════════════════════════════════════════════════════


-- ─── 1. Ophalen — key als querystring ──────────────────────────────────────

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

  -- De key gaat als querystring mee. Niet fraai, maar het is wat metals.dev
  -- accepteert. pg_net bewaart de URL niet in net._http_response, dus hij komt
  -- niet in een logtabel terecht.
  select net.http_get(
    url := 'https://api.metals.dev/v1/latest?currency=EUR&unit=g&api_key=' || v_key,
    timeout_milliseconds := 15000
  ) into v_request_id;

  insert into prijs_ophalen_log (request_id, status, toelichting)
  values (v_request_id, 'aangevraagd', 'Request naar metals.dev verstuurd.');
end;
$$;


-- ─── 2. Verwerken — geduldiger, en met betere foutmelding ──────────────────

create or replace function prijzen_verwerken()
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_log      record;
  v_resp     record;
  v_body     jsonb;
  v_metalen  jsonb;
  v_nieuw    numeric;
  v_vorig    numeric;
  v_slug     text;
  v_sleutel  text;
  v_bezwaar  text := null;
begin
  select * into v_log
  from prijs_ophalen_log
  where status = 'aangevraagd'
  order by moment desc
  limit 1;

  if v_log is null then
    return;  -- niets te doen
  end if;

  select * into v_resp
  from net._http_response
  where id = v_log.request_id;

  -- Nog niets binnen? Laat de aanvraag met rust zolang hij vers is. Pas na twee
  -- minuten is het echt mis. Zo overleeft een trage API één ronde.
  if v_resp is null then
    if v_log.moment < now() - interval '2 minutes' then
      update prijs_ophalen_log
      set status = 'fout',
          toelichting = 'Geen antwoord van metals.dev binnen 2 minuten.'
      where id = v_log.id;
    end if;
    return;
  end if;

  if v_resp.status_code <> 200 then
    update prijs_ophalen_log
    set status = 'fout',
        toelichting = format('metals.dev gaf status %s. %s',
          v_resp.status_code,
          coalesce(v_resp.error_msg, left(v_resp.content, 200), ''))
    where id = v_log.id;
    return;
  end if;

  begin
    v_body := v_resp.content::jsonb;
  exception when others then
    update prijs_ophalen_log
    set status = 'fout',
        toelichting = 'Antwoord is geen geldige JSON: ' || left(v_resp.content, 200)
    where id = v_log.id;
    return;
  end;

  v_metalen := v_body -> 'metals';

  if v_metalen is null then
    update prijs_ophalen_log
    set status = 'fout',
        toelichting = 'Geen "metals"-object. Antwoord: ' || left(v_resp.content, 200)
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


-- ─── 3. Opnieuw testen ─────────────────────────────────────────────────────
--
--   select prijzen_ophalen();
--   -- wacht 5 seconden
--   select prijzen_verwerken();
--   select status, toelichting, moment from prijs_ophalen_log order by moment desc limit 3;
--
-- De foutmelding vertelt nu wél wat er misging: statuscode plus het begin van
-- het antwoord, in plaats van "geen geldig antwoord".


-- ═══ DIAGNOSE — draai dit als het nog steeds misgaat ═══════════════════════

-- Wat kwam er precies terug?
select
  id,
  status_code,
  error_msg,
  left(content, 400) as antwoord,
  created
from net._http_response
order by created desc
limit 5;

-- Betekenis:
--   status_code 200 + JSON met "metals"  → goed; het lag aan de verwerking
--   status_code 401 / 403                → key wordt niet geaccepteerd
--   status_code 429                      → rate limit van metals.dev
--   error_msg gevuld, status_code leeg   → netwerkfout of timeout
--   helemaal geen regels                 → pg_net staat niet aan:
--        create extension if not exists pg_net with schema extensions;

-- Staat de key er wel, en klopt hij qua lengte?
select
  name,
  length(decrypted_secret) as sleutellengte,
  left(decrypted_secret, 4) || '…' as begint_met
from vault.decrypted_secrets
where name = 'metals_dev_key';

-- Oude 'fout'-regels opruimen zodat de log weer leesbaar is:
--   delete from prijs_ophalen_log where status = 'fout';
