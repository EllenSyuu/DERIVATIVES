import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lessons, allDrills } from '../data/lessons.js';
import { rng, shuffleChoice, isCorrect } from '../js/drill.js';

const SEEDS = 40;

test('every lesson has an id, a title, explanations and at least one drill', () => {
  const ids = new Set();
  for (const l of lessons) {
    assert.ok(l.id && l.zh && l.en, `lesson ${l.id} missing title`);
    assert.ok(!ids.has(l.id), `duplicate lesson id ${l.id}`);
    ids.add(l.id);
    assert.ok(l.intro.length >= 2, `${l.id} needs an explanation`);
    assert.ok(l.drills.length >= 2, `${l.id} needs drills`);
  }
});

test('drill ids are unique', () => {
  const ids = allDrills().map(d => d.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('worked examples and formulas render with no NaN or undefined', () => {
  for (const l of lessons) {
    const ex = l.example();
    assert.ok(ex.title && ex.steps.length >= 2, `${l.id} example too short`);
    for (const s of ex.steps) assert.doesNotMatch(s, /NaN|undefined|Infinity/, `${l.id}: ${s}`);
    for (const t of [...l.intro, ...l.keyIdeas]) assert.doesNotMatch(t, /NaN|undefined/, l.id);
  }
});

test('math delimiters are balanced in every text', () => {
  const check = (t, where) => {
    const dollars = (t.match(/(?<!\\)\$/g) || []).length;
    assert.equal(dollars % 2, 0, `unbalanced $ in ${where}: ${t}`);
  };
  for (const l of lessons) {
    [...l.intro, ...l.keyIdeas, ...l.example().steps].forEach(t => check(t, l.id));
  }
});

for (const drill of allDrills()) {
  test(`drill ${drill.id} generates valid problems over ${SEEDS} seeds`, () => {
    for (let seed = 1; seed <= SEEDS; seed += 1) {
      const r = rng(seed * 9973);
      const p = drill.gen(r);
      assert.ok(p.q && p.why, `${drill.id} seed ${seed}: missing question or explanation`);
      assert.doesNotMatch(p.q + p.why, /NaN|undefined|Infinity/, `${drill.id} seed ${seed}`);
      if (p.kind === 'choice') {
        assert.ok(p.options.length >= 3 && p.options.length <= 4, `${drill.id}: option count`);
        assert.equal(new Set(p.options).size, p.options.length, `${drill.id}: duplicate options`);
        const s = shuffleChoice(p, rng(seed));
        assert.equal(s.options[s.answer], p.options[0], `${drill.id}: shuffle moved the answer`);
        assert.ok(isCorrect(s, s.answer));
      } else {
        assert.equal(p.kind, 'number');
        assert.ok(Number.isFinite(p.answer), `${drill.id} seed ${seed}: answer not finite`);
        assert.ok(isCorrect(p, p.answer));
        assert.ok(!isCorrect(p, p.answer + 1000 * Math.max(1, Math.abs(p.answer))));
      }
    }
  });
}
