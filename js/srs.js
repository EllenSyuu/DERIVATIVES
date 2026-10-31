/*
 * Spaced repetition: a Leitner schedule applied to drills. Each drill sits in a box 0 to 7.
 * A clean answer moves it up one box and pushes the next review out (1, 2, 4, 7, 15, 30,
 * 60 days). A wrong answer, or one that needed the answer revealed, sends it back to box 1,
 * due tomorrow. Pure functions over plain objects, so they are easy to test.
 */

export const INTERVALS = [0, 1, 2, 4, 7, 15, 30, 60];
export const LEARNED_BOX = 5;
export const MAX_BOX = INTERVALS.length - 1;

export const dayKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const addDays = (key, n) => {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n));
};

export const fresh = () => ({ box: 0, due: null, right: 0, wrong: 0, last: null });

/* Grade one answer and return a new card state. */
export function grade(card, ok, today = dayKey()) {
  const c = { ...fresh(), ...(card || {}) };
  if (ok) {
    c.box = Math.min(MAX_BOX, c.box + 1);
    c.right += 1;
  } else {
    c.box = 1;
    c.wrong += 1;
  }
  c.due = addDays(today, INTERVALS[c.box]);
  c.last = today;
  return c;
}

export const isDue = (card, today = dayKey()) => !!card && !!card.due && card.due <= today;
export const isLearned = card => !!card && card.box >= LEARNED_BOX;

/* Drill ids that are due today, oldest first, capped. */
export function dueToday(ids, cards, { cap = 30, today = dayKey() } = {}) {
  return ids
    .filter(id => isDue(cards[id], today))
    .sort((a, b) => (cards[a].due < cards[b].due ? -1 : cards[a].due > cards[b].due ? 1 : 0))
    .slice(0, cap);
}
