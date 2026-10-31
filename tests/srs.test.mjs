import { test } from 'node:test';
import assert from 'node:assert/strict';
import { grade, dueToday, isDue, addDays, INTERVALS, MAX_BOX } from '../js/srs.js';

test('a clean answer climbs one box and pushes the review out', () => {
  let c = grade(undefined, true, '2026-11-01');
  assert.equal(c.box, 1);
  assert.equal(c.due, addDays('2026-11-01', INTERVALS[1]));
  c = grade(c, true, '2026-11-02');
  assert.equal(c.box, 2);
  assert.equal(c.right, 2);
});

test('a wrong answer drops back to box 1, due tomorrow', () => {
  const c = grade({ box: 5, right: 5, wrong: 0 }, false, '2026-11-01');
  assert.equal(c.box, 1);
  assert.equal(c.due, '2026-11-02');
  assert.equal(c.wrong, 1);
});

test('boxes never exceed the maximum', () => {
  let c = undefined;
  for (let i = 0; i < 20; i += 1) c = grade(c, true, '2026-11-01');
  assert.equal(c.box, MAX_BOX);
});

test('dueToday returns only due drills, oldest first, capped', () => {
  const cards = { a: { due: '2026-11-03' }, b: { due: '2026-11-01' }, c: { due: '2026-12-01' } };
  assert.deepEqual(dueToday(['a', 'b', 'c'], cards, { today: '2026-11-03' }), ['b', 'a']);
  assert.equal(isDue(undefined, '2026-11-03'), false);
  assert.deepEqual(dueToday(['a', 'b'], cards, { cap: 1, today: '2026-11-03' }), ['b']);
});
