#!/usr/bin/env node
/**
 * token-extract.mjs — turn a Webflow export's variables into the Astro style layer.
 *
 * Usage:
 *   node scripts/token-extract.mjs [--src _webflow_source] [--out src/styles] [--dry]
 *
 * Produces src/styles/{tokens.css,themes.css,fonts.css}. Source order and selector
 * text are preserved verbatim, because Webflow's theming depends on cascade order
 * and on descendant selectors like `[data-theme="dark"] [data-theme="invert"]`.
 *
 * This is a FIRST PASS, not the final file. Review every block, especially where
 * it reports conflicts. Never overwrite hand-edited files: existing files are
 * written as *.generated.css instead.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const argOf = (flag, dflt) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : dflt;
};
const SRC = path.resolve(argOf('--src', '_webflow_source'));
const OUT = path.resolve(argOf('--out', 'src/styles'));
const DRY = args.includes('--dry');

if (!fs.existsSync(SRC)) { console.error(`✗ Not found: ${SRC}`); process.exit(1); }

const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc); else acc.push(p);
  }
  return acc;
};
const rel = (p) => path.relative(SRC, p).split(path.sep).join('/');
const decomment = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

function cssBlocks(css, origin) {
  const out = []; const src = decomment(css); const stack = [];
  let i = 0, buf = '';
  while (i < src.length) {
    const ch = src[i];
    if (ch === '{') {
      const head = buf.trim(); buf = '';
      if (head.startsWith('@') && /^@(media|supports|layer|container)\b/.test(head)) { stack.push(head); i++; continue; }
      let depth = 1, body = ''; i++;
      while (i < src.length && depth > 0) {
        if (src[i] === '{') depth++;
        else if (src[i] === '}') { depth--; if (depth === 0) break; }
        body += src[i]; i++;
      }
      i++;
      out.push({ selector: head, atRule: stack.slice(), body, origin });
      continue;
    }
    if (ch === '}') { stack.pop(); buf = ''; i++; continue; }
    buf += ch; i++;
  }
  return out;
}
const declarations = (body) => body.split(';').map((raw) => {
  const idx = raw.indexOf(':');
  if (idx === -1) return null;
  const prop = raw.slice(0, idx).trim(); const value = raw.slice(idx + 1).trim();
  return prop && value ? { prop, value } : null;
}).filter(Boolean);

/* ---------------------------------------------------------------- collect */

const files = walk(SRC);
const blocks = [];
// CSS files first (Webflow load order: normalize → webflow → site css), then
// inline <style> blocks, which legitimately override.
for (const f of files.filter((f) => f.endsWith('.css')).sort()) {
  blocks.push(...cssBlocks(fs.readFileSync(f, 'utf8'), rel(f)));
}
for (const f of files.filter((f) => f.endsWith('.html')).sort()) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    blocks.push(...cssBlocks(m[1], `${rel(f)} inline`));
  }
}

const wrapAt = (atRule, css) =>
  atRule.length ? `${atRule.join(' {\n')} {\n${css}\n${atRule.map(() => '}').join('\n')}` : css;

const isRootish = (sel) =>
  sel.split(',').every((s) => /^\s*(:root|html|body|\*)\s*$/.test(s)) ;

const tokenBlocks = [];   // :root-ish variable blocks
const themeBlocksOut = []; // [data-theme] variable blocks
const fontFaceBlocks = [];
const skipped = [];
const seenTheme = new Set();
const tokenValues = new Map(); // name -> Set(values) in :root scope

for (const b of blocks) {
  if (/^@font-face/i.test(b.selector)) {
    fontFaceBlocks.push(b);
    continue;
  }
  const vars = declarations(b.body).filter((d) => d.prop.startsWith('--'));
  if (!vars.length) continue;

  const css = `${b.selector} {\n${vars.map((v) => `  ${v.prop}: ${v.value};`).join('\n')}\n}`;
  if (/\[data-theme/i.test(b.selector)) {
    const key = `${b.atRule.join('|')}::${b.selector.replace(/\s+/g, ' ')}::${vars.map((v) => v.prop + v.value).join('|')}`;
    if (seenTheme.has(key)) continue; // identical block repeated on every page
    seenTheme.add(key);
    themeBlocksOut.push({ ...b, css, count: vars.length });
  } else if (isRootish(b.selector)) {
    for (const v of vars) {
      if (!tokenValues.has(v.prop)) tokenValues.set(v.prop, new Set());
      tokenValues.get(v.prop).add(v.value);
    }
    tokenBlocks.push({ ...b, css, count: vars.length });
  } else {
    skipped.push({ selector: b.selector.replace(/\s+/g, ' ').slice(0, 90), origin: b.origin, count: vars.length });
  }
}

/* --------------------------------------------------------- dedupe :root ---
 * Webflow repeats the same :root block on every page. Keep the first
 * occurrence of each variable; report any later occurrence with a different
 * value as a conflict for a human to resolve. */

const emitted = new Map();
const conflicts = [];
const rootLines = [];
for (const b of tokenBlocks) {
  if (b.atRule.length) continue; // handled below
  for (const v of declarations(b.body).filter((d) => d.prop.startsWith('--'))) {
    if (!emitted.has(v.prop)) {
      emitted.set(v.prop, { value: v.value, origin: b.origin });
      rootLines.push({ ...v, origin: b.origin });
    } else if (emitted.get(v.prop).value !== v.value) {
      conflicts.push({ name: v.prop, kept: emitted.get(v.prop), dropped: { value: v.value, origin: b.origin } });
    }
  }
}
const mediaTokenBlocks = tokenBlocks.filter((b) => b.atRule.length);

/** Group root tokens by prefix, keeping first-seen order inside each group. */
const groups = new Map();
for (const l of rootLines) {
  const g = l.prop.match(/^--([a-z0-9]+)/i)?.[1]?.toLowerCase() || 'other';
  if (!groups.has(g)) groups.set(g, []);
  groups.get(g).push(l);
}

/* ------------------------------------------------------------------ write */

const banner = (title, note) =>
  `/* ${title}\n * Generated by token-extract.mjs from the Webflow export.\n * ${note}\n */\n`;

let tokensCss = banner('tokens.css — primitives (layer 1)',
  'Raw, theme-agnostic values. Components must NOT consume these directly — they consume the semantic tokens in themes.css.');
tokensCss += `\n:root {\n`;
for (const [g, lines] of groups) {
  tokensCss += `\n  /* --- ${g} --- */\n`;
  for (const l of lines) tokensCss += `  ${l.prop}: ${l.value};\n`;
}
tokensCss += `}\n`;
for (const b of mediaTokenBlocks) {
  tokensCss += `\n${wrapAt(b.atRule, b.css)}\n`;
}

let themesCss = banner('themes.css — semantic tokens per theme (layer 2)',
  'Selector text and ORDER are load-bearing: `[data-theme="dark"] [data-theme="invert"]` makes invert flip relative to its parent. Do not reorder or "simplify" these selectors.');
for (const b of themeBlocksOut) {
  themesCss += `\n/* ${b.origin} */\n${wrapAt(b.atRule, b.css)}\n`;
}

let fontsCss = banner('fonts.css — @font-face',
  'url() paths rewritten to /fonts/<file>. Copy the font files to public/fonts/ and preload the critical ones in BaseLayout.');
const fontFiles = new Set();
for (const b of fontFaceBlocks) {
  const decls = declarations(b.body).map((d) => {
    if (d.prop !== 'src') return d;
    const value = d.value.replace(/url\(["']?([^"')]+)["']?\)/g, (_, u) => {
      const base = u.split('/').pop().split('?')[0];
      fontFiles.add(u);
      return `url("/fonts/${base}")`;
    });
    return { ...d, value };
  });
  const key = decls.map((d) => d.prop + d.value).join('|');
  if (fontsCss.includes(`/* key:${key} */`)) continue;
  fontsCss += `\n/* key:${key} */\n@font-face {\n${decls.map((d) => `  ${d.prop}: ${d.value};`).join('\n')}\n}\n`;
}
fontsCss = fontsCss.replace(/^\/\* key:.*\*\/\n/gm, '');

const targets = [
  ['tokens.css', tokensCss],
  ['themes.css', themesCss],
  ['fonts.css', fontsCss],
];

if (DRY) {
  console.log('— dry run, nothing written —');
} else {
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, content] of targets) {
    let file = path.join(OUT, name);
    if (fs.existsSync(file)) {
      file = path.join(OUT, name.replace('.css', '.generated.css'));
      console.log(`  ! ${name} exists → wrote ${path.basename(file)} instead; merge by hand.`);
    }
    fs.writeFileSync(file, content);
  }
}

/* ----------------------------------------------------------------- report */

console.log(`\n✓ tokens: ${rootLines.length} in :root across ${groups.size} groups (${[...groups.keys()].join(', ')})`);
if (mediaTokenBlocks.length) console.log(`  + ${mediaTokenBlocks.length} token block(s) inside media queries — responsive token overrides, kept in tokens.css`);
console.log(`✓ themes: ${themeBlocksOut.length} unique [data-theme] block(s)`);
console.log(`✓ fonts:  ${fontFaceBlocks.length} @font-face rule(s), ${fontFiles.size} distinct file(s)`);
if (fontFiles.size) {
  console.log(`  → copy these to public/fonts/:`);
  for (const f of fontFiles) console.log(`     ${f}`);
}
if (conflicts.length) {
  console.log(`\n⚠︎ ${conflicts.length} token(s) redefined with a different value — first wins, review each:`);
  for (const c of conflicts.slice(0, 15)) {
    console.log(`   ${c.name}: kept "${c.kept.value}" (${c.kept.origin}) · dropped "${c.dropped.value}" (${c.dropped.origin})`);
  }
  if (conflicts.length > 15) console.log(`   …and ${conflicts.length - 15} more`);
}
if (skipped.length) {
  console.log(`\nℹ ${skipped.length} variable block(s) on non-root, non-theme selectors were NOT extracted.`);
  console.log(`  These are usually component-scoped variables — migrate them into the component's own scoped CSS:`);
  for (const s of [...new Map(skipped.map((s) => [s.selector, s])).values()].slice(0, 12)) {
    console.log(`   ${s.selector}  (${s.count} vars, ${s.origin})`);
  }
}
console.log(`\nNext: read every block, delete what the site never uses, then verify on /styleguide with an
invert block nested inside BOTH a dark and a light parent.`);
