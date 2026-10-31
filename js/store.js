/*
 * Progress is kept in this browser's localStorage, one key. Every read and write is wrapped:
 * private windows and blocked storage must never break the page. Without storage the site
 * still works, progress just is not remembered between visits.
 */

const KEY = 'derivatives-notebook:v1';

const empty = () => ({ cards: {}, lessons: {}, log: {} });

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw);
    return { ...empty(), ...data };
  } catch {
    return empty();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: keep working in memory */
  }
}
