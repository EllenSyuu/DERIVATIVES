import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { CHAPTERS } from '../data/chapters.js';
import { TOPICS, PARTS, problemsFor, findItem, allProblemIds } from '../data/course.js';

test('the course map lists the 34 chapters of the book in order, covered by the parts', () => {
  assert.equal(TOPICS.length, 34);
  TOPICS.forEach(([no], i) => assert.equal(no, i + 1));
  const covered = PARTS.flatMap(p => Array.from({ length: p.to - p.from + 1 }, (_, k) => p.from + k));
  assert.deepEqual(covered, TOPICS.map(t => t[0]));
});

test('problem ids are unique across the course and resolve back to their chapter', () => {
  const ids = allProblemIds();
  assert.equal(new Set(ids).size, ids.length);
  for (const c of CHAPTERS) for (const p of problemsFor(c.no)) assert.equal(findItem(p.id).chapter, c.no);
});

for (const c of CHAPTERS) {
  test(`chapter ${c.no} passes the chapter checker`, () => {
    try {
      execFileSync('node', ['scripts/check-chapter.mjs', String(c.no)], { stdio: 'pipe' });
    } catch (e) {
      assert.fail(String(e.stdout || e.message));
    }
  });
}
