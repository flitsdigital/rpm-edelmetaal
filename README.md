# RPM Edelmetaal

De website van [RPM Edelmetaal](https://www.rpmedelmetaal.nl), gemigreerd van
Webflow + Memberstack naar Astro + Supabase.

De getallen op deze site zijn geld. Een verkeerde prijs is erger dan een kapotte
pagina.

## Aan de slag

```bash
npm install
cp .env.example .env   # vul de Supabase-sleutels in
npm run dev
```

| Commando | Wat het doet |
|---|---|
| `npm run dev` | Dev-server op http://localhost:4321 |
| `npm run build` | Productiebuild (Vercel-adapter) |
| `npm run guard` | Architectuurcontroles: geen `!important`, geen losse px, componentbudgetten |
| `npx astro check` | TypeScript + prop-validatie |

## Hoe het in elkaar zit

```
src/
  components/   atoms → molecules → sections   (atomic design)
  data/         prijzen · content · icons · images · site
  layouts/      BaseLayout (head) → PageLayout (nav + footer)
  lib/          supabase (anoniem, build-time) · supabase-server (sessie, per request)
  pages/        7 publieke routes + /auth/* + /api/taxatie
  styles/       tokens.css · base.css   (@layer reset, tokens, base, components, utilities)
supabase/       01…08 — in volgorde draaien
scripts/        guard.mjs · visual-diff.mjs · wf-audit.mjs
```

### Prijzen

Marktprijzen komen elke dag om 8, 14 en 22 uur binnen via `pg_cron` + `pg_net`
(metals.dev), en worden append-only weggeschreven in `metal_prices`. De
inkoopprijzen zijn daarvan afgeleid, in de database:

```sql
round((marktprijs - marge) * fijn_gehalte / 1000.0, 2)
```

Eén formule, één plek. Er staat geen berekende prijs in een tabel en geen
tweede kopie van de formule in de frontend.

### Afscherming

`/inkoopprijzen-b2b` zit achter twee sloten:

1. **De middleware** stuurt bezoekers zonder sessie naar `/auth/login`.
2. **De grant** in Postgres — `v_prijzen_b2b` is ingetrokken voor `anon`.

Het buitenste slot mag falen. De oude site had er maar één, en dat was een
client-side redirect.

Inloggen gaat via een magic link; er zijn geen wachtwoorden.

## Documentatie

| Bestand | Inhoud |
|---|---|
| [PROGRESS.md](PROGRESS.md) | Status per fase, beslissingen, wat er nog moet gebeuren |
| [ANALYSE.md](ANALYSE.md) | Wat er in de Webflow-export zat |
| [COMPONENT_MAPPING.md](COMPONENT_MAPPING.md) | Webflow-klasse → Astro-component |
| [FIDELITY.md](FIDELITY.md) | Visual diff, bewuste afwijkingen, gevonden bugs |
| [AUDIT.md](AUDIT.md) | Verschillen met de live site, inclusief de zes typefouten |
