/*
 * Grading. Three kinds of answer, one result shape:
 *
 *   { verdict: 'correct' | 'partial' | 'wrong' | 'invalid', score, feedback: [string], model }
 *
 *  - choice: pick one option. Wrong picks can carry their own explanation (explain[i]).
 *  - number: a value with a tolerance. Wrong values are diagnosed: a sign flip, a unit slip
 *    (x100, /100), or a rate applied to the wrong quantity each get a specific message.
 *  - short: a written answer, graded against a rubric of concepts. Each concept lists
 *    groups of accepted phrasings (Chinese, English, abbreviations). A concept counts as
 *    present when every group has at least one phrasing in the answer, so different wording
 *    is not marked wrong. A phrasing preceded by 不 / 没 / 无 / 非 is treated as negated.
 *
 * Nothing here calls a server or a model: the same input always gives the same feedback.
 */

/* ---------- text normalisation ---------- */

const PUNCT = /[\s　，。、；：！？,.;:!?()（）\[\]【】"'“”‘’\-—_\/\\*|·…~`]+/g;

/* Lower-case, full-width to half-width, and drop spaces and punctuation. */
export function normalize(s) {
  return String(s)
    .normalize('NFKC')
    .toLowerCase()
    .replace(PUNCT, '');
}

const NEGATORS = ['不', '没', '无', '非', '未', 'not', 'no'];

/* Words that start with a negator but do not negate what follows. */
const NOT_NEGATION = ['不变', '不同', '不仅', '不断', '不少', '不管', '不论', '无论', '非常', '未来', '无风险', '非线性', 'note', 'notice', 'nor', 'now', 'non'];

/* Like normalize, but sentence punctuation becomes a "|" break, so negation never reaches across it. */
function normalizeWithBreaks(s) {
  return String(s)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/(\d)[.,](?=\d)/g, '$1') // 6.5 and 1,000 are numbers, not clause breaks (normalize drops the mark too)
    .replace(/[，。；！？,.;!?、：:\n]+/g, '|')
    .replace(/[\s\u3000()（）\[\]【】"'“”‘’\-—_\/\\*·…~`]+/g, '');
}

/* Does `phrase` occur in `text` with no negator in the three characters before it (same clause)? */
function hasPositive(text, phrase) {
  const p = normalize(phrase);
  if (!p) return false;
  let from = 0;
  for (;;) {
    const at = text.indexOf(p, from);
    if (at < 0) return false;
    let before = text.slice(Math.max(0, at - 3), at);
    const br = before.lastIndexOf('|');
    if (br >= 0) before = before.slice(br + 1);
    const start = at - before.length;
    let negated = false;
    for (const n of NEGATORS) {
      let j = before.indexOf(n);
      while (j >= 0) {
        const tail = text.slice(start + j, start + j + 4);
        if (!NOT_NEGATION.some(w => tail.startsWith(w))) negated = true;
        j = before.indexOf(n, j + 1);
      }
    }
    if (!negated) return true;
    from = at + 1;
  }
}

/* ---------- choice ---------- */

export function gradeChoice(problem, index) {
  const k = Number(index);
  const ok = k === problem.answer;
  const feedback = [];
  if (!ok && problem.explain && problem.explain[k]) feedback.push(problem.explain[k]);
  return {
    verdict: ok ? 'correct' : 'wrong',
    score: ok ? 1 : 0,
    feedback,
    model: problem.options[problem.answer],
  };
}

/* ---------- number ---------- */

const UNIT_WORDS = /[元美元$¥份桶股张个美分cents]|cents?|per|dollars?|usd|元/gi;

/* Parse what a learner types: 1,000 / -9元 / (9) / −9 / 4.5% (as 0.045). Returns NaN if unreadable. */
export function parseNumber(raw) {
  let t = String(raw).normalize('NFKC').replace(/[−–]/g, '-').replace(/,/g, '').replace(/\s+/g, '');
  t = t.replace(UNIT_WORDS, '');
  let pct = false;
  if (t.endsWith('%')) {
    pct = true;
    t = t.slice(0, -1);
  }
  let neg = false;
  if (/^\(.*\)$/.test(t)) {
    neg = true;
    t = t.slice(1, -1);
  }
  let x = Number(t);
  if (!Number.isFinite(x)) return NaN;
  if (neg) x = -x;
  if (pct) x /= 100;
  return x;
}

const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* Default checks for common slips. A problem may add its own with `diagnose`. */
const DEFAULT_DIAGNOSES = [
  {
    test: (x, a, tol) => a !== 0 && near(x, -a, tol),
    msg: '符号反了。正负号表示赚或亏、买方或卖方，方向弄反时数字的大小对，符号却相反。',
  },
  {
    test: (x, a, tol) => a !== 0 && (near(x, a * 100, Math.max(tol, Math.abs(a) * 0.01)) || near(x, a / 100, Math.max(tol, Math.abs(a) * 0.01))),
    msg: '单位差了 100 倍。通常是百分比（%）和小数混淆，或者 cents 和 dollars 混淆。',
  },
  {
    test: (x, a, tol) => a !== 0 && near(x, a * 1000, Math.max(tol, Math.abs(a) * 0.01)),
    msg: '数量级差了 1000 倍，检查合约大小（例如 1,000 桶还是 100 桶）是否用对。',
  },
];

export function gradeNumber(problem, raw) {
  const x = parseNumber(raw);
  if (!Number.isFinite(x)) {
    return { verdict: 'invalid', score: 0, feedback: ['请输入数字（可以带单位，例如 -9 或 1,000）。'], model: fmt(problem) };
  }
  const a = problem.answer;
  const tol = problem.tol ?? Math.max(0.005, Math.abs(a) * 0.01);
  // "52.5%" is read as 0.525; when the expected answer is in percentage points, accept 52.5 too.
  const asTyped = /%\s*$/.test(String(raw)) ? x * 100 : x;
  if (near(x, a, tol) || near(asTyped, a, tol)) {
    return { verdict: 'correct', score: 1, feedback: [], model: fmt(problem) };
  }
  const feedback = [];
  const checks = [...(problem.diagnose || []), ...DEFAULT_DIAGNOSES];
  for (const d of checks) {
    if (d.test(x, a, tol)) {
      feedback.push(d.msg);
      break;
    }
  }
  return { verdict: 'wrong', score: 0, feedback, model: fmt(problem) };
}

const fmt = p => `${p.answer}${p.unit ? ' ' + p.unit : ''}`;

/* ---------- short written answers ---------- */

/*
 * spec = {
 *   concepts: [{ id, weight?, groups: [[phrasing, ...], ...], missing: '说明', }],
 *   traps?:   [{ any: [phrasing, ...], msg }],     // a common misconception appeared
 *   model:    '参考答案（完整）',
 * }
 */
export function gradeShort(raw, spec) {
  const text = normalizeWithBreaks(raw);
  if (text.replace(/\|/g, '').length < 2) {
    return { verdict: 'invalid', score: 0, feedback: ['先写下你的理由，哪怕只有一句。'], model: spec.model };
  }
  const feedback = [];
  let total = 0;
  let got = 0;
  for (const c of spec.concepts) {
    const w = c.weight ?? 1;
    total += w;
    const present = c.groups.every(g => g.some(p => hasPositive(text, p)));
    if (present) {
      got += w;
      feedback.push(`✓ ${c.ok || c.id}`);
    } else {
      feedback.push(`✗ 缺少：${c.missing}`);
    }
  }
  let trapped = false;
  for (const t of spec.traps || []) {
    if (t.any.some(p => hasPositive(text, p))) {
      trapped = true;
      feedback.push(`⚠ ${t.msg}`);
    }
  }
  const score = total ? got / total : 0;
  let verdict = score >= 0.8 ? 'correct' : score >= 0.5 ? 'partial' : 'wrong';
  if (trapped && verdict === 'correct') verdict = 'partial';
  return { verdict, score, feedback, model: spec.model };
}

/* Route to the right grader. */
export function gradeProblem(problem, input) {
  if (problem.kind === 'choice') return gradeChoice(problem, input);
  if (problem.kind === 'number') return gradeNumber(problem, input);
  return gradeShort(input, problem.rubric);
}

export const isPass = result => result.verdict === 'correct';
