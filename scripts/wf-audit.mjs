#!/usr/bin/env node
/**
 * wf-audit.mjs — deterministic inventory of a Webflow export.
 *
 * Usage:
 *   node scripts/wf-audit.mjs [--src _webflow_source] [--out audit]
 *
 * Writes audit/audit.json (machine-readable) + audit/AUDIT_RAW.md (human summary).
 * Zero dependencies. Regex-based: fast and good enough for inventory, but it is
 * INPUT for your analysis, not a substitute for reading the important files.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const argOf = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : dflt;
};
const SRC = path.resolve(argOf('--src', '_webflow_source'));
const OUT = path.resolve(argOf('--out', 'audit'));

if (!fs.existsSync(SRC)) {
  console.error(`✗ Source folder not found: ${SRC}\n  Extract the Webflow .zip there first.`);
  process.exit(1);
}

/* ---------------------------------------------------------------- helpers */

const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
};

const rel = (p) => path.relative(SRC, p).split(path.sep).join('/');
const read = (p) => fs.readFileSync(p, 'utf8');
const bump = (map, key, by = 1) => map.set(key, (map.get(key) || 0) + by);
const topN = (map, n = 60) =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => ({ value: k, count: v }));

/** Strip comments so they don't pollute the regex passes. */
const decomment = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * Split CSS into { selector, body } blocks, keeping source order and tracking
 * the enclosing at-rule (@media / @supports) so cascade context survives.
 */
function cssBlocks(css, origin) {
  const out = [];
  const src = decomment(css);
  const stack = [];
  let i = 0, buf = '';
  while (i < src.length) {
    const ch = src[i];
    if (ch === '{') {
      const head = buf.trim();
      buf = '';
      if (head.startsWith('@') && /^@(media|supports|layer|container)\b/.test(head)) {
        stack.push(head);
        i++;
        continue;
      }
      // collect body until matching close (handles nested @ inside, rare)
      let depth = 1, body = '';
      i++;
      while (i < src.length && depth > 0) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) break; }
        body += src[i];
        i++;
      }
      i++;
      out.push({ selector: head, atRule: stack.join(' > ') || null, body, origin });
      continue;
    }
    if (ch === '}') { stack.pop(); buf = ''; i++; continue; }
    buf += ch;
    i++;
  }
  return out;
}

const declarations = (body) => {
  const out = [];
  for (const raw of body.split(';')) {
    const idx = raw.indexOf(':');
    if (idx === -1) continue;
    const prop = raw.slice(0, idx).trim();
    const value = raw.slice(idx + 1).trim();
    if (prop && value) out.push({ prop, value });
  }
  return out;
};

/* ------------------------------------------------------------- collection */

const files = walk(SRC);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const cssFiles = files.filter((f) => f.endsWith('.css'));
const jsFiles = files.filter((f) => f.endsWith('.js'));

const IMG_EXT = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.ico'];
const FONT_EXT = ['.woff', '.woff2', '.ttf', '.otf', '.eot'];
const VIDEO_EXT = ['.mp4', '.webm', '.mov'];

const byExt = (exts) =>
  files
    .filter((f) => exts.includes(path.extname(f).toLowerCase()))
    .map((f) => ({ file: rel(f), kb: +(fs.statSync(f).size / 1024).toFixed(1) }));

/* --- CSS: gather every block from .css files and every inline <style> --- */

const allBlocks = [];
for (const f of cssFiles) allBlocks.push(...cssBlocks(read(f), rel(f)));
for (const f of htmlFiles) {
  const html = read(f);
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    allBlocks.push(...cssBlocks(m[1], `${rel(f)} (inline <style>)`));
  }
}

/* --- design tokens --- */

const tokenDefs = new Map(); // name -> [{value, selector, origin, atRule}]
const themeBlocks = [];
const fontFaces = [];

for (const b of allBlocks) {
  if (/^@font-face/i.test(b.selector)) {
    const d = Object.fromEntries(declarations(b.body).map((x) => [x.prop, x.value]));
    fontFaces.push({
      family: (d['font-family'] || '').replace(/["']/g, ''),
      weight: d['font-weight'] || 'normal',
      style: d['font-style'] || 'normal',
      display: d['font-display'] || null,
      src: d.src || '',
      files: [...(d.src || '').matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]),
      origin: b.origin,
    });
    continue;
  }
  const decls = declarations(b.body);
  const vars = decls.filter((d) => d.prop.startsWith('--'));
  if (vars.length) {
    for (const v of vars) {
      if (!tokenDefs.has(v.prop)) tokenDefs.set(v.prop, []);
      tokenDefs.get(v.prop).push({
        value: v.value, selector: b.selector, origin: b.origin, atRule: b.atRule,
      });
    }
  }
  if (/\[data-theme/i.test(b.selector)) {
    themeBlocks.push({
      selector: b.selector.replace(/\s+/g, ' ').trim(),
      atRule: b.atRule,
      origin: b.origin,
      varCount: vars.length,
      vars: vars.map((v) => `${v.prop}: ${v.value}`),
    });
  }
}

/**
 * A token defined with different values is only a *conflict* when the
 * definitions compete in the same context. Theme remaps ([data-theme=…]) and
 * responsive overrides (inside @media) are supposed to differ — flagging those
 * would bury the handful of real conflicts in noise.
 */
const isRemap = (d) => /\[data-theme/i.test(d.selector) || !!d.atRule;
const realConflict = (defs) => {
  const plain = defs.filter((d) => !isRemap(d));
  return new Set(plain.map((d) => d.value)).size > 1;
};

/** Group tokens by their prefix (--swatch--, --theme--, --space--, …). */
const tokenGroups = {};
for (const [name, defs] of tokenDefs) {
  const g = (name.match(/^--([a-z0-9]+)/i)?.[1] || 'other').toLowerCase();
  (tokenGroups[g] ||= []).push({
    name,
    definitions: defs.length,
    values: [...new Set(defs.map((d) => d.value))],
    remappedPerTheme: defs.some((d) => /\[data-theme/i.test(d.selector)),
    responsive: defs.some((d) => !!d.atRule),
    conflicting: realConflict(defs),
  });
}
for (const g of Object.values(tokenGroups)) g.sort((a, b) => a.name.localeCompare(b.name));

/* --- media queries (breakpoints actually used) --- */

const breakpoints = new Map();
for (const b of allBlocks) {
  if (!b.atRule) continue;
  for (const m of b.atRule.matchAll(/(max|min)-width:\s*([\d.]+)(px|rem|em)/g)) {
    bump(breakpoints, `${m[1]}-width: ${m[2]}${m[3]}`);
  }
}

/* --- HTML: classes, data-attrs, meta, forms, embeds --- */

const classSingles = new Map();
const classCombos = new Map();
const dataAttrs = new Map();
const pages = [];
const forms = [];
const richtext = [];
const embeds = new Map();

for (const f of htmlFiles) {
  const html = read(f);
  const grab = (re) => html.match(re)?.[1]?.trim() || null;

  for (const m of html.matchAll(/class=["']([^"']+)["']/g)) {
    const combo = m[1].trim().split(/\s+/).sort().join(' ');
    if (combo) bump(classCombos, combo);
    for (const c of m[1].trim().split(/\s+/)) if (c) bump(classSingles, c);
  }
  for (const m of html.matchAll(/\s(data-[a-z0-9-]+)=["']([^"']*)["']/gi)) {
    bump(dataAttrs, `${m[1]}="${m[2]}"`);
  }
  for (const cls of ['w-richtext', 'w-slider', 'w-nav', 'w-dropdown', 'w-tabs', 'w-embed', 'swiper', 'w-form', 'w-lightbox', 'w-background-video']) {
    const n = (html.match(new RegExp(`\\b${cls}\\b`, 'g')) || []).length;
    if (n) bump(embeds, cls, n);
  }
  const formCount = (html.match(/<form\b/gi) || []).length;
  if (formCount) {
    forms.push({
      page: rel(f),
      count: formCount,
      actions: [...html.matchAll(/<form[^>]*\saction=["']([^"']*)["']/gi)].map((m) => m[1]),
      fields: [...html.matchAll(/<(input|textarea|select)[^>]*\sname=["']([^"']+)["']/gi)].map((m) => `${m[1]}:${m[2]}`),
      hasSuccessState: /w-form-done/.test(html),
      hasErrorState: /w-form-fail/.test(html),
    });
  }
  if (/w-richtext/.test(html)) richtext.push(rel(f));

  const inlineScripts = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1].trim())
    .filter((s) => s.length > 40 && !/^\s*window\.__WEBFLOW/.test(s));

  pages.push({
    file: rel(f),
    title: grab(/<title[^>]*>([\s\S]*?)<\/title>/i),
    description: grab(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i),
    canonical: grab(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i),
    ogImage: grab(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i),
    lang: grab(/<html[^>]+lang=["']([^"']*)["']/i),
    bodyTheme: grab(/<body[^>]+data-theme=["']([^"']*)["']/i),
    sections: (html.match(/<section\b/gi) || []).length,
    bytes: fs.statSync(f).size,
    externalScripts: [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]),
    inlineScriptCount: inlineScripts.length,
    inlineScriptHints: [...new Set(
      inlineScripts.flatMap((s) => [
        /new Swiper/.test(s) && 'Swiper init',
        /gsap|ScrollTrigger/i.test(s) && 'GSAP',
        /Webflow\.push/.test(s) && 'Webflow.push',
        /jQuery|\$\(/.test(s) && 'jQuery',
        /dataLayer|gtag|GTM-/.test(s) && 'analytics/GTM',
        /addEventListener/.test(s) && 'custom listener',
      ].filter(Boolean)),
    )],
    inlineScripts,
  });
}

/**
 * Class combinations that repeat are the objective signal for "this is a
 * component". Webflow's own .w-* runtime classes are excluded — they say
 * something about the widget, not about your design system.
 */
const componentCandidates = [...classCombos.entries()]
  .filter(([combo, n]) => n >= 3 && combo.split(/\s+/).every((c) => !/^w-/.test(c)))
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 40)
  .map(([combo, n]) => ({
    classes: combo,
    occurrences: n,
    suggestedLevel: combo.split(/\s+/).length === 1 && n >= 6 ? 'atom' : n >= 3 ? 'molecule?' : 'unclear',
  }));

/* ------------------------------------------------------------------ write */

const report = {
  generatedAt: new Date().toISOString(),
  source: rel(SRC) || path.basename(SRC),
  counts: {
    html: htmlFiles.length, css: cssFiles.length, js: jsFiles.length,
    images: byExt(IMG_EXT).length, fonts: byExt(FONT_EXT).length, videos: byExt(VIDEO_EXT).length,
    tokens: tokenDefs.size, themeBlocks: themeBlocks.length, fontFaces: fontFaces.length,
  },
  pages,
  cssFiles: cssFiles.map((f) => ({ file: rel(f), kb: +(fs.statSync(f).size / 1024).toFixed(1) })),
  tokens: tokenGroups,
  tokenConflicts: [...tokenDefs.entries()]
    .filter(([, defs]) => realConflict(defs))
    .map(([name, defs]) => ({ name, defs: defs.map((d) => ({ value: d.value, selector: d.selector, origin: d.origin })) })),
  themeBlocks,
  fontFaces,
  breakpoints: topN(breakpoints, 20),
  classSingles: topN(classSingles, 80),
  componentCandidates,
  dataAttributes: topN(dataAttrs, 40),
  webflowWidgets: [...embeds.entries()].map(([k, v]) => ({ widget: k, occurrences: v })),
  forms,
  richtextPages: richtext,
  assets: { images: byExt(IMG_EXT), fonts: byExt(FONT_EXT), videos: byExt(VIDEO_EXT) },
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'audit.json'), JSON.stringify(report, null, 2));

const md = [];
const h = (s) => md.push(`\n## ${s}\n`);
md.push(`# Webflow export — raw audit\n`);
md.push(`Generated ${report.generatedAt} from \`${report.source}\`. Machine output — verify anything surprising by opening the file.\n`);
md.push(`**Counts:** ${Object.entries(report.counts).map(([k, v]) => `${v} ${k}`).join(' · ')}`);

h('Pages');
md.push('| Page | Title | Sections | data-theme | Inline scripts | Hints |');
md.push('|---|---|---|---|---|---|');
for (const p of pages) {
  md.push(`| ${p.file} | ${(p.title || '').slice(0, 40)} | ${p.sections} | ${p.bodyTheme || '—'} | ${p.inlineScriptCount} | ${p.inlineScriptHints.join(', ') || '—'} |`);
}

h('Design tokens by group');
for (const [group, list] of Object.entries(tokenGroups).sort()) {
  md.push(`\n**--${group}--** (${list.length})`);
  md.push(list.map((t) => `\`${t.name}\`${t.conflicting ? ' ⚠︎' : ''}`).join(' · '));
}
if (report.tokenConflicts.length) {
  md.push(`\n⚠︎ **${report.tokenConflicts.length} token(s) genuinely conflict** — same context, different value. See \`audit.json → tokenConflicts\` and decide which wins before extracting. (Theme remaps and @media overrides are excluded here; those are supposed to differ.)`);
}

h('Theme blocks (data-theme)');
for (const t of themeBlocks) md.push(`- \`${t.selector}\` — ${t.varCount} vars — ${t.origin}`);

h('Breakpoints in use');
md.push(report.breakpoints.map((b) => `\`${b.value}\` ×${b.count}`).join(' · ') || '—');

h('Component candidates (class combos seen ≥3×)');
md.push('| Occurrences | Classes | Likely level |');
md.push('|---|---|---|');
for (const c of componentCandidates) md.push(`| ${c.occurrences} | \`${c.classes}\` | ${c.suggestedLevel} |`);

h('Webflow widgets present');
md.push(report.webflowWidgets.map((w) => `${w.widget} ×${w.occurrences}`).join(' · ') || '—');

h('Forms');
if (!forms.length) md.push('None found.');
for (const f of forms) {
  md.push(`- **${f.page}** — ${f.count} form(s), fields: ${f.fields.join(', ') || '—'}, success state: ${f.hasSuccessState}, error state: ${f.hasErrorState}`);
}
if (forms.length) md.push(`\n→ Webflow form handling does not survive export. Decide the backend in Phase 0 (see \`references/forms-seo-i18n.md\`).`);

h('Custom data-attributes');
md.push(report.dataAttributes.map((d) => `\`${d.value}\` ×${d.count}`).join(' · ') || '—');

h('Fonts');
for (const f of fontFaces) md.push(`- ${f.family} ${f.weight} ${f.style} → ${f.files.join(', ')}`);

h('Next');
md.push('Use this as raw input for `ANALYSE.md` and `COMPONENT_MAPPING.md` — do not paste it in wholesale. Then run `token-extract.mjs`.');

fs.writeFileSync(path.join(OUT, 'AUDIT_RAW.md'), md.join('\n'));

console.log(`✓ ${path.relative(process.cwd(), path.join(OUT, 'audit.json'))} + AUDIT_RAW.md`);
console.log(`  ${htmlFiles.length} pages · ${tokenDefs.size} tokens · ${themeBlocks.length} theme blocks · ${fontFaces.length} @font-face · ${componentCandidates.length} component candidates · ${forms.length} page(s) with forms`);
if (report.tokenConflicts.length) console.log(`  ⚠︎ ${report.tokenConflicts.length} tokens with conflicting values — review before extracting.`);
