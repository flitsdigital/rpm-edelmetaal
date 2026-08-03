#!/usr/bin/env node
/**
 * visual-diff.mjs — pixel-compare the Webflow original against the Astro build.
 *
 * This is what turns "pixel-perfect" from a claim into a number. Eyeballing two
 * tabs reliably misses 4px spacing drift and line-height differences; a diff map
 * points straight at them.
 *
 * Setup (once, in the project):
 *   npm i -D playwright pixelmatch pngjs && npx playwright install chromium
 *
 * Usage:
 *   node scripts/visual-diff.mjs                      # uses fidelity.config.json
 *   node scripts/visual-diff.mjs --route home         # single route
 *   node scripts/visual-diff.mjs --threshold 0.1      # per-pixel colour tolerance
 *
 * fidelity.config.json:
 * {
 *   "astroBase": "http://localhost:4321",
 *   "originalBase": "http://localhost:5599",   // serve _webflow_source, e.g. npx serve _webflow_source -l 5599
 *   "widths": [1440, 991, 767, 479],
 *   "outDir": "fidelity",
 *   "routes": [
 *     { "name": "home",      "original": "/index.html",         "astro": "/" },
 *     { "name": "over-ons",  "original": "/over-ons.html",      "astro": "/over-ons" }
 *   ]
 * }
 *
 * Serve the original over http rather than file:// — file:// breaks fonts and
 * some scripts through CORS, which produces diffs that are artefacts of the
 * harness rather than of your conversion.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const argOf = (f, d) => { const i = args.indexOf(f); return i !== -1 && args[i + 1] ? args[i + 1] : d; };

let chromium, pixelmatch, PNG;
try {
  ({ chromium } = await import('playwright'));
  pixelmatch = (await import('pixelmatch')).default;
  ({ PNG } = await import('pngjs'));
} catch {
  console.error(`✗ Missing dependencies. Install them in the project first:

    npm i -D playwright pixelmatch pngjs
    npx playwright install chromium
`);
  process.exit(1);
}

const CONFIG_PATH = path.resolve(argOf('--config', 'fidelity.config.json'));
if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`✗ No ${path.basename(CONFIG_PATH)} — create one (see the header of this script for the shape).`);
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const widths = cfg.widths?.length ? cfg.widths : [1440, 991, 767, 479];
const outDir = path.resolve(cfg.outDir || 'fidelity');
const threshold = parseFloat(argOf('--threshold', '0.1'));
const only = argOf('--route', null);
const routes = only ? cfg.routes.filter((r) => r.name === only) : cfg.routes;
if (!routes?.length) { console.error('✗ No routes to compare.'); process.exit(1); }

/** Freeze the page so animations/carousels don't produce phantom diffs. */
const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important; animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important; transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  html { scroll-behavior: auto !important; }
  video { visibility: hidden !important; }
`;

async function shoot(page, url, width, file) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
  await page.addStyleTag({ content: FREEZE_CSS });
  await page.evaluate(async () => {
    // Trigger lazy loading and scroll-reveal, then return to the top.
    await new Promise((res) => {
      let y = 0;
      const step = () => {
        y += window.innerHeight;
        window.scrollTo(0, y);
        if (y < document.body.scrollHeight) requestAnimationFrame(step);
        else { window.scrollTo(0, 0); setTimeout(res, 300); }
      };
      step();
    });
    await (document.fonts?.ready ?? Promise.resolve());
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: file, fullPage: true });
  return page.evaluate(() => ({
    height: document.body.scrollHeight,
    fonts: [...new Set([...document.querySelectorAll('body *')]
      .slice(0, 400)
      .map((el) => getComputedStyle(el).fontFamily))].slice(0, 6),
  }));
}

function compare(aPath, bPath, diffPath) {
  const a = PNG.sync.read(fs.readFileSync(aPath));
  const b = PNG.sync.read(fs.readFileSync(bPath));
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const crop = (img) => {
    if (img.width === w && img.height === h) return img;
    const out = new PNG({ width: w, height: h });
    PNG.bitblt(img, out, 0, 0, w, h, 0, 0);
    return out;
  };
  const ca = crop(a), cb = crop(b);
  const diff = new PNG({ width: w, height: h });
  const changed = pixelmatch(ca.data, cb.data, diff.data, w, h, { threshold, includeAA: false });
  fs.writeFileSync(diffPath, PNG.sync.write(diff));
  return {
    changedPixels: changed,
    comparedPixels: w * h,
    mismatchPct: +((changed / (w * h)) * 100).toFixed(3),
    heightDelta: b.height - a.height,
    widthDelta: b.width - a.width,
  };
}

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
  colorScheme: 'light',
});
const page = await ctx.newPage();

const results = [];
for (const route of routes) {
  for (const width of widths) {
    const dir = path.join(outDir, route.name, String(width));
    fs.mkdirSync(dir, { recursive: true });
    const originalPng = path.join(dir, 'original.png');
    const astroPng = path.join(dir, 'astro.png');
    const diffPng = path.join(dir, 'diff.png');
    const row = { route: route.name, width };
    try {
      const o = await shoot(page, cfg.originalBase + route.original, width, originalPng);
      const n = await shoot(page, cfg.astroBase + route.astro, width, astroPng);
      Object.assign(row, compare(originalPng, astroPng, diffPng), {
        originalHeight: o.height, astroHeight: n.height,
      });
    } catch (err) {
      row.error = err.message.split('\n')[0];
    }
    results.push(row);
    const status = row.error ? `ERROR ${row.error}`
      : `${row.mismatchPct}% differing pixels · height Δ ${row.heightDelta}px`;
    console.log(`${row.mismatchPct === 0 ? '✓' : row.error ? '✗' : '·'} ${route.name} @${width}  ${status}`);
  }
}

await browser.close();

/* ------------------------------------------------------------------ report */

const ok = results.filter((r) => !r.error);
const worst = [...ok].sort((a, b) => b.mismatchPct - a.mismatchPct).slice(0, 5);
fs.writeFileSync(path.join(outDir, 'visual-diff.json'), JSON.stringify({ generatedAt: new Date().toISOString(), threshold, results }, null, 2));

const md = [
  '# Visual diff — original vs Astro',
  '',
  `Generated ${new Date().toISOString()} · per-pixel threshold ${threshold}`,
  '',
  '| Route | Width | Mismatch | Height Δ | Original h | Astro h |',
  '|---|---|---|---|---|---|',
  ...results.map((r) => r.error
    ? `| ${r.route} | ${r.width} | ERROR: ${r.error} | | | |`
    : `| ${r.route} | ${r.width} | ${r.mismatchPct}% | ${r.heightDelta}px | ${r.originalHeight} | ${r.astroHeight} |`),
  '',
  '## Reading this',
  '',
  'A **height delta** is the loudest signal: it almost always means a section padding or',
  'line-height token did not carry over, and it cascades into every measurement below it.',
  'Fix height deltas before chasing percentages.',
  '',
  'Anti-aliasing and font rasterisation put a realistic floor around **0.1–0.5%**. Above',
  '~1% open `diff.png` — the red regions localise the problem immediately.',
  '',
  '## Worst offenders',
  '',
  ...worst.map((r) => `- \`${r.route}\` @${r.width}px — ${r.mismatchPct}% (\`${path.join(outDir, r.route, String(r.width), 'diff.png')}\`)`),
  '',
  'Carry every unresolved item into `FIDELITY.md` with a reason.',
].join('\n');
fs.writeFileSync(path.join(outDir, 'VISUAL_DIFF.md'), md);

console.log(`\n✓ ${path.relative(process.cwd(), path.join(outDir, 'VISUAL_DIFF.md'))}`);
if (ok.length) {
  const avg = (ok.reduce((s, r) => s + r.mismatchPct, 0) / ok.length).toFixed(3);
  console.log(`  average mismatch ${avg}% across ${ok.length} comparison(s)`);
}
const failed = results.filter((r) => r.error);
if (failed.length) { console.log(`  ✗ ${failed.length} comparison(s) failed to run`); process.exit(1); }
