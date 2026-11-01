# Writing chapters

The course follows Hull, *Options, Futures and Other Derivatives* (7th edition), chapter by
chapter. Each chapter is a module in `data/`, and `data/course.js` lists all 34 chapters and
their status.

## Adding a chapter

1. Write `data/chNN.js` (format below).
2. `node scripts/check-chapter.mjs NN` until it prints OK.
3. `node scripts/gen-chapters.mjs` to add it to `data/chapters.js`, then `npm test`.

## Chapter module

```js
export const chapter = {
  no: 2,
  zh: '期货市场的机制', en: 'Mechanics of futures markets', hull: 'Chapter 2', status: 'aligned',
  formulas: [{ tex: '…', zh: '…' }],
  sections: [{ id: '2.4', zh: '每日结算与保证金', en: 'Daily settlement and margins',
               body: ['…'], examples: [{ title: '…', steps: ['…'] }] }],
  problems: [ /* see below */ ],
};
```

## Problems

Every problem has `id`, `no` (the book's number), `sec` (the section it tests), `q`
(the question), `why` (the worked solution), and one of three kinds.

- `kind: 'choice'`: `options`, `answer` (index of the right one), and optional `explain`
  (a message for each wrong option, same order as `options`).
- `kind: 'number'`: `answer`, `unit`, optional `tol`, and optional `diagnose` (specific
  messages for likely slips, each `{ test(x, answer), msg }`). Sign flips and x100 / ÷100
  unit slips are already diagnosed by default.
- `kind: 'short'`: `rubric` with `concepts` (each with `groups` of accepted phrasings, a
  `missing` message, and optional `weight`), optional `traps` (common misconceptions), and a
  `model` answer. A concept counts as present when every group has at least one phrasing
  present, and a phrasing preceded by 不 / 没 / 无 / 非 (within three characters) does not count.

`scripts/check-chapter.mjs` (run for every chapter by `npm test`) checks that every model
answer grades as correct, that "不知道" and a vague answer do not, that every phrasing is at
least two characters, and that all maths renders in KaTeX.

## Rules

- Section headings and order follow the book. Problems keep the book's numbers.
- Restate the book's text and problems in our own words. Do not paste long passages.
- Explanations are in Chinese; English terms stay as the book uses them.
- Math in `$…$` is typeset with KaTeX. In JS strings, write LaTeX backslashes as `\\`.
