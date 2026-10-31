import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, parseNumber, gradeNumber, gradeShort, gradeChoice } from '../js/grade.js';
import { getAligned } from '../data/course.js';

const ch1 = getAligned(1);
const q = id => ch1.problems.find(p => p.id === id);

test('normalize ignores case, spaces, full-width forms and punctuation', () => {
  assert.equal(normalize('Long，多头 。'), 'long多头');
  assert.equal(normalize('ＬＯＮＧ'), 'long');
});

test('parseNumber reads signs, commas, units, brackets and percentages', () => {
  assert.equal(parseNumber('1,000'), 1000);
  assert.equal(parseNumber('-9元'), -9);
  assert.equal(parseNumber('−9'), -9);
  assert.equal(parseNumber('(9)'), -9);
  assert.equal(parseNumber('4.5%'), 0.045);
  assert.ok(Number.isNaN(parseNumber('abc')));
});

test('number: sign flip gets a specific message', () => {
  const p = q('h1-1.5a');
  const r = gradeNumber(p, '-1000');
  assert.equal(r.verdict, 'wrong');
  assert.match(r.feedback[0], /符号反了/);
});

test('number: unit slip (cents vs dollars) gets a specific message', () => {
  const p = q('h1-1.6a');
  const r = gradeNumber(p, '90000');
  assert.equal(r.verdict, 'wrong');
  assert.match(r.feedback[0], /单位错误/);
});

test('number: a correct value with a unit and comma is accepted', () => {
  assert.equal(gradeNumber(q('h1-1.5b'), '-2,000 美元').verdict, 'correct');
  assert.equal(gradeNumber(q('h1-1.5b'), '亏 2000').verdict, 'invalid');
});

test('number: unreadable input is invalid, not wrong', () => {
  assert.equal(gradeNumber(q('h1-1.5a'), '不知道').verdict, 'invalid');
});

test('short: different wording for the same idea is not marked wrong', () => {
  const p = q('h1-1.1');
  const r = gradeShort('多头就是到期买入标的的一方，空头是到期卖出的一方，两人盈亏相反。', p.rubric);
  assert.equal(r.verdict, 'correct');
  const r2 = gradeShort('Long side buys the asset later; short side sells it. Their payoffs offset each other.', p.rubric);
  assert.equal(r2.verdict, 'correct');
});

test('short: a negated phrase does not count as the concept', () => {
  const p = q('h1-1.1');
  const r = gradeShort('多头不是买入资产的一方，空头也不是卖出的一方。', p.rubric);
  assert.notEqual(r.verdict, 'correct');
  assert.ok(r.feedback.some(f => f.startsWith('✗')));
});

test('short: missing points are named, present points are confirmed', () => {
  const p = q('h1-1.2');
  const r = gradeShort('对冲是为了减少风险。', p.rubric);
  assert.equal(r.verdict, 'wrong');
  assert.ok(r.feedback.some(f => f.startsWith('✓')));
  assert.ok(r.feedback.some(f => f.startsWith('✗') && f.includes('投机')));
});

test('short: a known misconception caps the verdict at partial', () => {
  const p = q('h1-1.2');
  const r = gradeShort('对冲就是投机，套利是无风险的，对冲减少风险，投机承担风险。', p.rubric);
  assert.equal(r.verdict, 'partial');
  assert.ok(r.feedback.some(f => f.startsWith('⚠')));
});

test('short: a one-character answer is invalid, not wrong', () => {
  assert.equal(gradeShort('a', q('h1-1.1').rubric).verdict, 'invalid');
});

test('choice: the wrong option explanation is shown', () => {
  const p = q('h1-1.17');
  const r = gradeChoice(p, 2);
  assert.equal(r.verdict, 'wrong');
  assert.ok(r.feedback[0].includes('义务'));
});
