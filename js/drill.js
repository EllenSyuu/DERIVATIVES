/*
 * Drills: each drill is a generator. Every call makes a fresh problem with new numbers.
 *
 * A problem is { q, kind, options?, answer, tol?, unit?, why }:
 *  - kind 'choice': options is an array of strings, answer is the index of the right one.
 *  - kind 'number': answer is the exact value, tol is the allowed absolute error
 *    (default: 1% of the answer, at least 0.005).
 *  - why is the worked solution, shown after the learner answers.
 */

/* Small seeded random generator (mulberry32), so tests can replay any problem. */
export function rng(seed = 1) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: arr => arr[Math.floor(next() * arr.length)],
    /* a number with `dp` decimals, between lo and hi */
    dec: (lo, hi, dp = 1) => Number((lo + next() * (hi - lo)).toFixed(dp)),
  };
}

/* Is the learner's input right? Kept for the tests; the app uses js/grade.js. */
export function isCorrect(problem, input) {
  if (problem.kind === 'choice') return Number(input) === problem.answer;
  const x = Number(String(input).replace(/,/g, '').trim());
  if (!Number.isFinite(x)) return false;
  const tol = problem.tol ?? Math.max(0.005, Math.abs(problem.answer) * 0.01);
  return Math.abs(x - problem.answer) <= tol;
}

/* Shuffle the options of a choice problem and move the answer with them. */
export function shuffleChoice(problem, r) {
  const idx = problem.options.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i -= 1) {
    const j = Math.floor(r.next() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return {
    ...problem,
    options: idx.map(i => problem.options[i]),
    explain: problem.explain ? idx.map(i => problem.explain[i] ?? null) : undefined,
    answer: idx.indexOf(problem.answer),
  };
}
