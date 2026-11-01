/*
 * Drawings, in the atelier style of ellensyuu.github.io: blue-black ink and graphite on warm
 * paper, construction lines first, hand-lettered notes, orange kept for the maple leaf and
 * for what matters. Every stroke uses pathLength="1" so the page can ink it in (.ink).
 */

export const INK = '#22314a';
export const GRAPH = '#6f7b8c';
export const FAINT = '#b4bcc7';
export const ORANGE = '#cf602b';
export const AMBER = '#e0a046';

export const MAPLE =
  'M0 -22 L4 -12 L11 -15 L9 -5 L18 -7 L14 0 L20 4 L9 6 L11 12 L3 9 L1 20 L-1 20 L-3 9 L-11 12 L-9 6 L-20 4 L-14 0 L-18 -7 L-9 -5 L-11 -15 L-4 -12 Z';

/* A hand-drawn tick or cross, inked in when it appears. */
export const tickMark = (color = ORANGE) =>
  `<svg viewBox="0 0 40 40" class="mark" aria-hidden="true"><path class="ink" pathLength="1" d="M9 21 l8 9 l15 -20" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
export const crossMark = (color = INK) =>
  `<svg viewBox="0 0 40 40" class="mark" aria-hidden="true"><path class="ink" pathLength="1" d="M11 11 L29 29 M29 11 L11 29" stroke="${color}" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`;

/* Last-30-days sketch: one square per day, hatched by how much was studied, ticked when the
   day's plan was finished. */
export function monthSketch(days) {
  const cell = 26;
  const gap = 6;
  const cols = 10;
  const w = cols * (cell + gap);
  const rows = Math.ceil(days.length / cols);
  const h = rows * (cell + gap) + 16;
  const parts = days.map((d, i) => {
    const x = (i % cols) * (cell + gap);
    const y = Math.floor(i / cols) * (cell + gap);
    const n = d.count;
    const hatch = n === 0 ? 0 : n < 6 ? 2 : n < 15 ? 4 : 7;
    const lines = Array.from({ length: hatch }, (_, k) => {
      const o = ((k + 1) * cell) / (hatch + 1);
      return `<path d="M${x + o} ${y + cell} L${x} ${y + cell - o}" />`;
    }).join('');
    const tick = d.done
      ? `<path class="ink" pathLength="1" style="transition-delay:${(0.3 + i * 0.03).toFixed(2)}s" d="M${x + 6} ${y + 14} l5 6 l10 -13" stroke="${ORANGE}" stroke-width="2" fill="none" stroke-linecap="round"/>`
      : '';
    const today = d.today ? `<rect x="${x - 3}" y="${y - 3}" width="${cell + 6}" height="${cell + 6}" fill="none" stroke="${ORANGE}" stroke-width="0.8" stroke-dasharray="2 2"/>` : '';
    return `<g><title>${d.key}: ${n}</title><rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="none" stroke="${d.count ? INK : FAINT}" stroke-width="0.8"/><g stroke="${GRAPH}" stroke-width="0.7">${lines}</g>${tick}${today}</g>`;
  });
  return `<svg viewBox="-4 -4 ${w + 4} ${h}" class="month" role="img" aria-label="Study activity over the last 30 days">${parts.join('')}</svg>`;
}

/* Now and then a gull or a pigeon crosses the page, as on the personal site. */
export function startBirds() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ns = 'http://www.w3.org/2000/svg';
  const sky = document.createElementNS(ns, 'svg');
  sky.setAttribute('class', 'sky');
  sky.setAttribute('aria-hidden', 'true');
  const g = document.createElementNS(ns, 'g');
  const wing = document.createElementNS(ns, 'path');
  const body = document.createElementNS(ns, 'path');
  wing.setAttribute('fill', 'none');
  wing.setAttribute('stroke', INK);
  wing.setAttribute('stroke-width', '1.3');
  wing.setAttribute('stroke-linecap', 'round');
  body.setAttribute('fill', INK);
  g.append(wing, body);
  g.style.opacity = '0';
  sky.append(g);
  document.body.append(sky);

  const gull = f => {
    const a = 4 + f * 9;
    return `M-17 ${(-a * 0.55).toFixed(1)} Q-9 ${(-a - 4).toFixed(1)} -1 0 M1 0 Q9 ${(-a - 4).toFixed(1)} 17 ${(-a * 0.55).toFixed(1)}`;
  };
  const pigeon = f => {
    const a = 3 + f * 8;
    return `M-3 -1 Q-8 ${(-a - 5).toFixed(1)} -15 ${(-a * 0.7).toFixed(1)} Q-9 ${(-a * 0.2).toFixed(1)} -2 1 M2 -1 Q7 ${(-a - 5).toFixed(1)} 13 ${(-a * 0.7).toFixed(1)} Q8 ${(-a * 0.2).toFixed(1)} 2 1`;
  };
  let n = 0;
  const fly = () => {
    if (document.hidden || document.body.dataset.view === 'session') {
      setTimeout(fly, 15000);
      return;
    }
    const kind = n++ % 3 === 2 ? 'pigeon' : 'gull';
    const W = window.innerWidth;
    const H = window.innerHeight;
    const ltr = Math.random() < 0.6;
    const y0 = H * (0.1 + Math.random() * 0.3);
    const y1 = y0 + (Math.random() - 0.5) * H * 0.16;
    const s = (kind === 'gull' ? 1 : 0.85) * (0.9 + Math.random() * 0.5) * (W < 700 ? 0.75 : 1);
    const dur = (kind === 'gull' ? 13000 : 9500) * (W < 700 ? 0.7 : 1);
    const hz = kind === 'gull' ? 2.2 : 4.4;
    body.setAttribute(
      'd',
      kind === 'gull'
        ? 'M-5 0.5 Q0 -2 6 0 Q8 0.4 9 1 Q2 2.6 -5 0.5 Z'
        : 'M-7 1 Q-2 -4 6 -1 Q9 -0.5 10 0.8 Q4 4 -7 1 Z',
    );
    g.style.opacity = '1';
    const start = performance.now();
    const step = now => {
      const t = Math.min(1, (now - start) / dur);
      const x = ltr ? -60 + (W + 120) * t : W + 60 - (W + 120) * t;
      const y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI * 3) * 14;
      const phase = (now - start) / 1000;
      const burst = Math.sin(phase * 0.9) > -0.2;
      const f = burst ? Math.sin(phase * hz * Math.PI * 2) : 0.75;
      wing.setAttribute('d', (kind === 'gull' ? gull : pigeon)(f));
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${ltr ? s : -s} ${s})`);
      if (t < 1) requestAnimationFrame(step);
      else {
        g.style.opacity = '0';
        setTimeout(fly, 60000 + Math.random() * 40000);
      }
    };
    requestAnimationFrame(step);
  };
  setTimeout(fly, 6000);
}
