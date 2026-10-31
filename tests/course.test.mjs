import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, problemsFor, getAligned, getLegacy, chapterStatus } from '../data/course.js';
import { rng, shuffleChoice } from '../js/drill.js';
import { gradeChoice, gradeNumber, gradeShort, gradeProblem } from '../js/grade.js';

const SEEDS = 40;
const aligned = TOPICS.map(([no]) => getAligned(no)).filter(Boolean);

test('aligned chapters are the ones that have sections and book problems', () => {
  assert.ok(aligned.length >= 2);
  for (const c of aligned) {
    assert.ok(c.sections.length >= 5, `chapter ${c.no} needs its textbook sections`);
    assert.ok(c.problems.length >= 5, `chapter ${c.no} needs problems`);
    for (const s of c.sections) assert.match(s.id, /^\d+\.\d+$/);
  }
});

test('problem ids are unique across the whole course', () => {
  const ids = TOPICS.flatMap(([no]) => problemsFor(no).map(p => p.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('book problems keep the book numbering', () => {
  for (const c of aligned) {
    for (const p of c.problems) assert.match(p.no, /^\d+\.\d+$/, `${p.id}: bad book number`);
  }
});

for (const c of aligned) {
  for (const p of c.problems) {
    test(`book problem ${p.id} grades its own model answer as correct`, () => {
      assert.ok(p.why, `${p.id}: needs a worked solution`);
      if (p.kind === 'choice') {
        for (let seed = 1; seed <= 8; seed += 1) {
          const s = shuffleChoice(p, rng(seed));
          assert.equal(gradeChoice(s, s.answer).verdict, 'correct');
          const wrong = s.options.findIndex((_, i) => i !== s.answer);
          assert.equal(gradeChoice(s, wrong).verdict, 'wrong');
        }
      } else if (p.kind === 'number') {
        assert.ok(Number.isFinite(p.answer));
        assert.equal(gradeNumber(p, String(p.answer)).verdict, 'correct');
      } else if (p.kind === 'short') {
        assert.equal(gradeShort(p.rubric.model, p.rubric).verdict, 'correct', `${p.id}: model answer must score correct`);
        assert.notEqual(gradeShort('不知道', p.rubric).verdict, 'correct');
        assert.equal(gradeShort('不知道', p.rubric).verdict, 'wrong');
      } else {
        assert.fail(`${p.id}: unknown kind ${p.kind}`);
      }
    });
  }
}

test('legacy chapters are flagged pending and still have generated drills', () => {
  for (const [no] of TOPICS) {
    const st = chapterStatus(no);
    if (getLegacy(no).length) assert.equal(st === 'aligned' ? 'aligned' : 'pending', st === 'aligned' ? 'aligned' : 'pending');
  }
  for (const [no] of TOPICS) {
    for (const l of getLegacy(no)) {
      assert.equal(l.status, 'pending', `${l.id} should be marked pending until re-aligned`);
    }
  }
});

for (const [no] of TOPICS) {
  for (const l of getLegacy(no)) {
    for (const d of l.drills) {
      test(`legacy drill ${d.id} generates valid problems over ${SEEDS} seeds`, () => {
        for (let seed = 1; seed <= SEEDS; seed += 1) {
          const p = d.gen(rng(seed * 9973));
          assert.doesNotMatch(p.q + p.why, /NaN|undefined|Infinity/);
          if (p.kind === 'choice') {
            assert.ok(p.options.length >= 3 && p.options.length <= 4);
            assert.equal(new Set(p.options).size, p.options.length);
            const s = shuffleChoice(p, rng(seed));
            assert.equal(gradeChoice(s, s.answer).verdict, 'correct');
          } else {
            assert.equal(p.kind, 'number');
            assert.equal(gradeNumber(p, String(p.answer)).verdict, 'correct');
          }
        }
      });
    }
  }
}
