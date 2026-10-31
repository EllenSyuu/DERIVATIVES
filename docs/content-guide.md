# Writing lessons

Each lesson is plain data in [`data/lessons.js`](../data/lessons.js): an explanation, the
key ideas, formulas, a worked example, and drills. Drills are generators, so every visit
gets fresh numbers.

## Lesson shape

```js
{
  id: 'forward-price',            // unique
  no: 4,                          // order in the course
  zh: '远期价格：无收益资产',       // Chinese title
  en: 'Forward price of a non-dividend asset',
  ref: 'Hull 第 5 章',             // chapter the topic follows (for orientation only)
  intro: ['…', '…'],              // the core idea, a few short paragraphs
  keyIdeas: ['…'],                // what to remember
  formulas: [{ tex: 'F_0 = S_0 e^{rT}', zh: '…' }],
  example: () => ({ title: '…', steps: ['…'] }),   // computed with js/math.js
  drills: [{ id: 'fwd-1', zh: '…', gen: r => problem }],
}
```

## Drills

- `choice(question, correct, wrongs, why)`: the first option is correct; the page shuffles.
- `num(question, answer, why, { unit, tol })`: the learner types a number. Default tolerance
  is 1% of the answer (at least 0.005).

Every number a drill asks for is computed by `js/math.js`, the same code the tests check
against known values.

## Rules

- **Original writing only.** Explanations, examples and numbers are written for this site.
  Chapter numbers are given only to help learners find the topic in a textbook.
- Chinese explanation, English terms kept as they appear in textbooks.
- Math in `$…$` is typeset with KaTeX. Use `\\` for LaTeX backslashes in JS strings.
- `npm test` must pass: every drill runs over 40 seeds, and every choice has one correct
  option with no duplicates.
