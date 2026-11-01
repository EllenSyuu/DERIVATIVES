/*
 * Check one chapter module before it joins the course:
 *   node scripts/check-chapter.mjs 7
 *
 * Structure, book numbering, unique ids, every model answer graded as correct, "不知道"
 * graded as wrong, and every piece of maths rendered by the vendored KaTeX in strict mode.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { gradeChoice, gradeNumber, gradeShort } from '../js/grade.js';

// The vendored browser build is UMD; load it the way a <script> would.
const katex = (() => {
  const module = { exports: {} };
  new Function('module', 'exports', readFileSync(new URL('../vendor/katex/katex.min.js', import.meta.url), 'utf8'))(module, module.exports);
  return module.exports.default || module.exports;
})();

const n = Number(process.argv[2]);
if (!n) {
  console.error('usage: node scripts/check-chapter.mjs <chapter number>');
  process.exit(2);
}
const file = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'data', `ch${String(n).padStart(2, '0')}.js`);
const { chapter: c } = await import(pathToFileURL(file).href);

const errors = [];
const warn = [];
const fail = msg => errors.push(msg);

function checkText(str, where) {
  if (typeof str !== 'string') return fail(`${where}: not a string`);
  if (/NaN|undefined|Infinity/.test(str)) fail(`${where}: contains NaN/undefined/Infinity`);
  const parts = str.split(/(?<!\\)\$/);
  if (parts.length % 2 === 0) return fail(`${where}: unbalanced $ in: ${str.slice(0, 80)}`);
  parts.forEach((p, i) => {
    if (i % 2 === 1) {
      try {
        katex.renderToString(p, { throwOnError: true, strict: 'ignore' });
      } catch (e) {
        fail(`${where}: KaTeX error "${e.message.slice(0, 120)}" in $${p}$`);
      }
    }
  });
}

if (c.no !== n) fail(`chapter.no is ${c.no}, expected ${n}`);
for (const k of ['zh', 'en', 'hull', 'status']) if (!c[k]) fail(`chapter.${k} missing`);
if (c.status !== 'aligned') fail('status must be "aligned"');
if (!Array.isArray(c.sections) || c.sections.length < 2) fail('needs the book sections');
if (!Array.isArray(c.problems)) fail('problems must be an array');
for (const f of c.formulas || []) {
  try {
    katex.renderToString(f.tex, { throwOnError: true, displayMode: true, strict: 'ignore' });
  } catch (e) {
    fail(`formula "${f.tex}": ${e.message.slice(0, 100)}`);
  }
  if (!f.zh) fail(`formula "${f.tex}" needs a zh caption`);
}

const secIds = new Set();
for (const s of c.sections || []) {
  if (!new RegExp(`^${n}\\.\\d+$`).test(s.id)) fail(`section id "${s.id}" must look like ${n}.k`);
  if (secIds.has(s.id)) fail(`duplicate section ${s.id}`);
  secIds.add(s.id);
  if (!s.zh || !s.en) fail(`section ${s.id} needs zh and en headings`);
  if (!s.body || !s.body.length) fail(`section ${s.id} has no body`);
  (s.body || []).forEach((t, i) => checkText(t, `section ${s.id} body[${i}]`));
  for (const ex of s.examples || []) {
    checkText(ex.title, `section ${s.id} example title`);
    if (!ex.steps || ex.steps.length < 2) fail(`section ${s.id} example "${ex.title}" needs steps`);
    (ex.steps || []).forEach((t, i) => checkText(t, `section ${s.id} example step ${i}`));
  }
}

const ids = new Set();
for (const p of c.problems || []) {
  const w = `problem ${p.id}`;
  if (!new RegExp(`^h${n}-${n}\\.\\d+[a-z]?$`).test(p.id)) fail(`${w}: id must look like h${n}-${n}.12 or h${n}-${n}.12a`);
  if (ids.has(p.id)) fail(`${w}: duplicate id`);
  ids.add(p.id);
  if (!new RegExp(`^${n}\\.\\d+$`).test(p.no)) fail(`${w}: no must be the book number like ${n}.12`);
  if (!p.sec) fail(`${w}: sec missing`);
  checkText(p.q, `${w} q`);
  checkText(p.why || '', `${w} why`);
  if (!p.why) fail(`${w}: why missing`);
  if (p.kind === 'choice') {
    if (!Array.isArray(p.options) || p.options.length < 3 || p.options.length > 4) fail(`${w}: 3-4 options`);
    if (new Set(p.options).size !== p.options.length) fail(`${w}: duplicate options`);
    p.options.forEach((o, i) => checkText(o, `${w} option ${i}`));
    (p.explain || []).forEach((o, i) => o && checkText(o, `${w} explain ${i}`));
    if (gradeChoice(p, p.answer).verdict !== 'correct') fail(`${w}: answer index does not grade correct`);
  } else if (p.kind === 'number') {
    if (!Number.isFinite(p.answer)) fail(`${w}: answer not a number`);
    else if (gradeNumber(p, String(p.answer)).verdict !== 'correct') fail(`${w}: answer does not grade correct`);
    for (const d of p.diagnose || []) {
      checkText(d.msg, `${w} diagnose`);
      if (d.test(p.answer, p.answer, p.tol ?? Math.abs(p.answer) * 0.01)) fail(`${w}: a diagnose test fires on the correct answer`);
    }
  } else if (p.kind === 'short') {
    const r = p.rubric;
    if (!r || !r.model || !Array.isArray(r.concepts) || r.concepts.length < 2) fail(`${w}: rubric needs model and >= 2 concepts`);
    else {
      checkText(r.model, `${w} model`);
      for (const k of r.concepts) {
        if (!k.missing) fail(`${w}: concept ${k.id} needs "missing"`);
        for (const g of k.groups || []) for (const ph of g) if (String(ph).replace(/\s/g, '').length < 2) fail(`${w}: phrasing "${ph}" too short, it would match almost anything`);
        checkText(k.missing, `${w} concept ${k.id}`);
        if (k.ok) checkText(k.ok, `${w} concept ${k.id} ok`);
      }
      const g = gradeShort(r.model, r);
      if (g.verdict !== 'correct') fail(`${w}: model answer grades "${g.verdict}" — ${g.feedback.filter(f => f.startsWith('✗')).join(' | ')}`);
      if (gradeShort('不知道', r).verdict === 'correct') fail(`${w}: "不知道" grades correct`);
      if (gradeShort('这道题我不太确定，可能和价格有关。', r).verdict === 'correct') fail(`${w}: a vague answer grades correct; phrasings are too loose`);
    }
  } else fail(`${w}: unknown kind ${p.kind}`);
}

const kinds = (c.problems || []).reduce((m, p) => ((m[p.kind] = (m[p.kind] || 0) + 1), m), {});
console.log(`chapter ${n}: ${c.sections?.length} sections, ${c.problems?.length} problems ${JSON.stringify(kinds)}, ${(c.formulas || []).length} formulas`);
if (warn.length) console.log(warn.map(x => 'warn: ' + x).join('\n'));
if (errors.length) {
  console.log(errors.map(x => 'ERROR: ' + x).join('\n'));
  process.exit(1);
}
console.log('OK');
