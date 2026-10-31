# Writing chapters

The course follows Hull, *Options, Futures and Other Derivatives* (7th edition), chapter by
chapter. Each chapter is a module in `data/`, and `data/course.js` lists all 34 chapters and
their status.

## Status

- **aligned**: the chapter has its own module (`data/chNN.js`). Its section headings and order
  follow the book, its examples use the book's figures, and its problems are the book's
  end-of-chapter questions with the book's numbers, restated in our own words.
- **pending**: the chapter only has early-version lessons in `data/lessons.js` (tagged
  `status: 'pending'`). The site shows a notice and still offers the generated drills.
- **todo**: no content yet.

## Chapter module

```js
export const chapter = {
  no: 2,
  zh: '期货市场的机制', en: 'Mechanics of futures markets', hull: 'Chapter 2', status: 'aligned',
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

`tests/course.test.mjs` checks that every model answer grades as correct and that a
"不知道" answer does not. Run `npm test` after any change.

## Rules

- Section headings and order follow the book. Problems keep the book's numbers.
- Restate the book's text and problems in our own words. Do not paste long passages.
- Explanations are in Chinese; English terms stay as the book uses them.
- Math in `$…$` is typeset with KaTeX. In JS strings, write LaTeX backslashes as `\\`.
