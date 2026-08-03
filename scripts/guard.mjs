#!/usr/bin/env node
/**
 * guard.mjs — enforce the architecture rules that are otherwise just good intentions.
 *
 * Usage:
 *   node scripts/guard.mjs                 # report; exit 1 on errors
 *   node scripts/guard.mjs --strict        # warnings fail too
 *   node scripts/guard.mjs --json          # machine-readable
 *   node scripts/guard.mjs --src src       # different source root
 *
 * Run this yourself BEFORE every checkpoint. A rule nobody checks is a rule that
 * quietly dies under time pressure — that is exactly what turns a component
 * library back into CSS soup.
 *
 * Escape hatch: a line with `/* guard-ignore: <reason> *\/` or
 * `<!-- guard-ignore: <reason> -->` on it (or the line above) is exempt, and the
 * reason is printed in the report so it stays visible rather than invisible.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const argOf = (f, d) => { const i = args.indexOf(f); return i !== -1 && args[i + 1] ? args[i + 1] : d; };
const SRC = path.resolve(argOf('--src', 'src'));
const STRICT = args.includes('--strict');
const JSON_OUT = args.includes('--json');

const BUDGETS = { atoms: 60, molecules: 140, sections: 260, layouts: 160, pages: 120 };
const STYLE_DIR = path.join(SRC, 'styles');

if (!fs.existsSync(SRC)) { console.error(`✗ No ${SRC}/ — run from the project root.`); process.exit(1); }

const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc); else acc.push(p);
  }
  return acc;
};

const files = walk(SRC);
const rel = (p) => path.relative(process.cwd(), p);
const findings = [];
const add = (level, rule, file, line, message, hint) =>
  findings.push({ level, rule, file: rel(file), line, message, hint });

/** Blank out strings/comments-ish regions that cause false positives. */
const stripNoise = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));

const ignoreReason = (lines, i) => {
  const re = /guard-ignore:\s*([^*>\n]+)/;
  return lines[i]?.match(re)?.[1]?.trim() || lines[i - 1]?.match(re)?.[1]?.trim() || null;
};

const ignored = [];

/* ------------------------------------------------------------------ rules */

for (const file of files) {
  const ext = path.extname(file);
  if (!['.astro', '.css', '.ts', '.tsx', '.jsx', '.js', '.svelte', '.vue'].includes(ext)) continue;
  const raw = fs.readFileSync(file, 'utf8');
  const clean = stripNoise(raw);
  const lines = clean.split('\n');
  const rawLines = raw.split('\n');
  const inStyleLayer = file.startsWith(STYLE_DIR);
  const isToken = /(tokens|themes|fonts|base)\.css$/.test(file);

  lines.forEach((text, i) => {
    const n = i + 1;
    const check = (rule, cond, level, message, hint) => {
      if (!cond) return;
      const why = ignoreReason(rawLines, i);
      if (why) { ignored.push({ file: rel(file), line: n, rule, why }); return; }
      add(level, rule, file, n, message, hint);
    };

    // 1. Hardcoded colours outside the token layer.
    if (!isToken) {
      const color = text.match(/(#[0-9a-f]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\))/i);
      const isCurrent = /currentColor|transparent|inherit/i.test(text);
      check('hardcoded-color', !!color && !isCurrent, 'error',
        `hardcoded colour ${color?.[1]}`,
        'Consume a semantic token from themes.css, or add a swatch to tokens.css if it is genuinely new.');
    }

    // 2. !important — a specificity fight you should win structurally.
    check('important', /!important/.test(text), 'error',
      '!important',
      'Fix the cascade instead: use @layer, or move the rule into the component that owns the element.');

    // 3. Layout px outside the token layer and outside media queries.
    if (!inStyleLayer && !/@media|@container/.test(text)) {
      const m = text.match(/\b(font-size|line-height|letter-spacing|margin[a-z-]*|padding[a-z-]*|gap|row-gap|column-gap|width|height|max-width|min-height|top|right|bottom|left)\s*:\s*[^;]*?(-?\d*\.?\d+)px/i);
      const hairline = m && Math.abs(parseFloat(m[2])) <= 2;
      check('hardcoded-px', !!m && !hairline, 'warn',
        `hardcoded ${m?.[1]}: …${m?.[2]}px`,
        'Use a --size--/--space-- token. If the value is genuinely new, promote it to a token first.');
    }

    // 4. Inline style attributes — styling that escapes the design system.
    check('inline-style', /\sstyle=["'](?!\s*["'])/.test(text) && !/define:vars|--[a-z]/i.test(text), 'warn',
      'inline style attribute',
      'Move into scoped CSS. For dynamic values use Astro `define:vars` with a token-backed custom property.');

    // 5. Global escape hatches.
    check('global-css', /(\bis:global\b|:global\()/.test(text), 'warn',
      'global style escape hatch',
      'Legitimate for slotted/set:html content — leave a `guard-ignore:` note saying which, so it stays deliberate.');

    // 6. Importing the Webflow framework CSS wholesale.
    check('webflow-css-import', /@import[^;\n]*(webflow|normalize)\.css|from ['"][^'"]*webflow\.css/i.test(text), 'error',
      'imports Webflow framework CSS',
      'Reverse-engineer only the .w-* behaviour a component actually needs into that component.');

    // 7. Referencing the export folder from source.
    check('source-leak', /_webflow_source/.test(text), 'error',
      'references _webflow_source',
      'The export is reference material only; it must not be reachable from the build.');

    // 8. Unfinished work markers.
    const todo = text.match(/\b(TODO|FIXME|HACK|XXX)\b/);
    check('todo', !!todo, 'warn',
      todo?.[1] ?? 'TODO',
      'Resolve it, or record it as a known deviation in FIDELITY.md.');

    // 9. Raw swatch consumption in components (skipping the theme layer).
    if (!inStyleLayer) {
      check('swatch-in-component', /var\(\s*--swatch--/.test(text), 'warn',
        'component reads a primitive swatch directly',
        'Components consume --theme--* / --button--* semantics, so theming keeps working. Direct swatches break dark/invert.');
    }
  });

  // 10. Component size budgets.
  // The escape hatch documented in SKILL.md ("keep the file and add a
  // `guard-ignore: <reason>` comment so the exception stays visible and argued
  // for") applies here too — a `guard-ignore` anywhere in the file exempts it,
  // since the overflow is a property of the whole file, not of one line.
  const bucket = Object.keys(BUDGETS).find((b) => file.includes(`${path.sep}${b}${path.sep}`));
  if (bucket && ext === '.astro') {
    const budget = BUDGETS[bucket];
    if (rawLines.length > budget) {
      const why = raw.match(/guard-ignore:\s*size-budget\s*[—-]?\s*([^*>\n]+)/)?.[1]?.trim();
      if (why) ignored.push({ file: rel(file), line: rawLines.length, rule: 'size-budget', why });
      else add(rawLines.length > budget * 1.5 ? 'error' : 'warn', 'size-budget', file, rawLines.length,
        `${rawLines.length} lines (${bucket} budget ${budget})`,
        'Split out the repeated part into a lower-level component — that is usually a missing molecule.');
    }
  }

  // 11. Typed props on components.
  if (ext === '.astro' && /components[\\/]/.test(file)) {
    const hasFrontmatter = /^---[\s\S]*?---/.test(raw);
    const usesProps = /Astro\.props/.test(raw);
    if (usesProps && !/interface\s+Props|type\s+Props/.test(raw)) {
      add('warn', 'untyped-props', file, 1, 'uses Astro.props without an interface Props',
        'Typed props are how the next person discovers what a component accepts.');
    }
    if (!hasFrontmatter && usesProps) add('error', 'untyped-props', file, 1, 'Astro.props without frontmatter', '');
  }
}

/* ------------------------------------------- hydration + duplicate markup */

const hydrated = [];
for (const file of files.filter((f) => f.endsWith('.astro'))) {
  const raw = fs.readFileSync(file, 'utf8');
  for (const m of raw.matchAll(/client:(load|visible|idle|only|media)/g)) {
    hydrated.push({ file: rel(file), directive: m[0] });
  }
}

/** Cheap duplicate-markup signal: identical normalised 5-line windows across files. */
const windows = new Map();
for (const file of files.filter((f) => f.endsWith('.astro'))) {
  const body = fs.readFileSync(file, 'utf8').split(/^---$/m).slice(2).join('---');
  const lines = body.split('\n').map((l) => l.trim())
    .filter((l) => l.length > 12 && /^</.test(l) && !/^<\/|^<style|^<script/.test(l));
  for (let i = 0; i + 4 < lines.length; i++) {
    const key = lines.slice(i, i + 5).join('|').replace(/\s+/g, ' ');
    if (!windows.has(key)) windows.set(key, new Set());
    windows.get(key).add(rel(file));
  }
}
const dupes = [...windows.entries()].filter(([, set]) => set.size > 1).slice(0, 10);
for (const [, set] of dupes) {
  add('warn', 'duplicate-markup', path.resolve([...set][0]), 0,
    `identical 5-line markup block in: ${[...set].join(', ')}`,
    'One pattern = one component. Promote it before it is copy-pasted a third time.');
}

/* ----------------------------------------------------------------- output */

const errors = findings.filter((f) => f.level === 'error');
const warns = findings.filter((f) => f.level === 'warn');

if (JSON_OUT) {
  console.log(JSON.stringify({ errors, warns, ignored, hydrated, files: files.length }, null, 2));
} else {
  const byRule = new Map();
  for (const f of findings) { if (!byRule.has(f.rule)) byRule.set(f.rule, []); byRule.get(f.rule).push(f); }
  for (const [rule, list] of [...byRule.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const lvl = list.some((f) => f.level === 'error') ? '✗' : '!';
    console.log(`\n${lvl} ${rule} (${list.length})`);
    console.log(`  ${list[0].hint}`);
    for (const f of list.slice(0, 8)) console.log(`    ${f.file}:${f.line}  ${f.message}`);
    if (list.length > 8) console.log(`    …and ${list.length - 8} more`);
  }
  if (ignored.length) {
    console.log(`\nℹ ${ignored.length} guard-ignore(s) in place:`);
    for (const i of ignored) console.log(`    ${i.file}:${i.line}  ${i.rule} — ${i.why}`);
  }
  console.log(`\nHydration: ${hydrated.length} client: directive(s)`);
  for (const h of hydrated) console.log(`    ${h.file}  ${h.directive}`);
  console.log(`\n${errors.length} error(s), ${warns.length} warning(s) across ${files.length} files.`);
  if (!errors.length && !warns.length) console.log('✓ clean');
}

process.exit(errors.length || (STRICT && warns.length) ? 1 : 0);
