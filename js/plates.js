/*
 * Plates for the Derivatives Notebook, drawn in the same atelier style as FM Notebook and
 * ellensyuu.github.io: blue-black ink and graphite on warm paper, construction lines first,
 * hand-lettered notes, orange kept for the maple leaf and for what matters.
 * Every inked stroke uses pathLength="1" so the page can draw it in (.ink / .fade / .write).
 */
import { INK, GRAPH, FAINT, ORANGE, MAPLE } from './art.js';

const serif = `font-family="'Cormorant Garamond', Garamond, serif" font-style="italic"`;
const t = s => `style="transition-delay:${s.toFixed(2)}s"`;

/* Plate I — "the payoff": a drafting board with the payoff of a long call at expiry, the
   forward's straight line behind it, the premium dimensioned, break-even circled in orange.
   viewBox 0 0 640 520. */
export function heroPlate({ chapters = 34, problems = 0 } = {}) {
  const O = [112, 330]; // origin: S_T = 0, profit = 0
  const K = 300; // strike on the x axis
  const c = 40; // premium, drawn as a drop below the axis
  const right = 566;
  const rise = right - K; // 45° after the strike
  const ticks = [];
  for (let x = O[0] + 24; x < right + 10; x += 24) {
    const major = (x - O[0]) % 96 === 0;
    ticks.push(`<path class="ink thin" pathLength="1" ${t(0.8 + (x - O[0]) / 900)} d="M${x} ${O[1]} v${major ? 9 : 5}"/>`);
  }
  for (let y = O[1] - 48; y > 110; y -= 48) ticks.push(`<path class="ink thin" pathLength="1" ${t(0.9)} d="M${O[0]} ${y} h-6"/>`);
  for (let y = O[1] + 48; y < 440; y += 48) ticks.push(`<path class="ink thin" pathLength="1" ${t(0.9)} d="M${O[0]} ${y} h-6"/>`);

  return `
<svg viewBox="0 0 640 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Payoff of a long call option at expiry, with the forward's payoff line, the premium and the break-even point">
  <defs>
    <pattern id="dv-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="5" stroke="${GRAPH}" stroke-width="0.6"/>
    </pattern>
    <pattern id="dv-hatch-o" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="${ORANGE}" stroke-width="0.6" opacity="0.7"/>
    </pattern>
    <filter id="dv-rough" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2"/>
    </filter>
    <marker id="dv-ax" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="${INK}" stroke-width="1.2"/></marker>
    <marker id="dv-g" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="${GRAPH}" stroke-width="1.3"/></marker>
  </defs>

  <!-- title block frame -->
  <g class="fade" ${t(0.1)} stroke="${FAINT}" stroke-width="0.6" fill="none">
    <rect x="18" y="18" width="604" height="484"/>
    <rect x="26" y="26" width="588" height="468" stroke-dasharray="1 5"/>
    ${Array.from({ length: 13 }, (_, i) => `<path d="M${40 + i * 45} 18 v7 M${40 + i * 45} 502 v-7"/>`).join('')}
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${O[0] + 48 * (i + 1)} 104 V444" stroke-dasharray="1 6"/>`).join('')}
    ${Array.from({ length: 7 }, (_, i) => `<path d="M${O[0]} ${138 + 48 * i} H${right + 20}" stroke-dasharray="1 6"/>`).join('')}
  </g>

  <!-- axes -->
  <g filter="url(#dv-rough)" fill="none" stroke="${INK}" stroke-linecap="round">
    <path class="ink" pathLength="1" ${t(0.3)} stroke-width="1.2" d="M${O[0] - 18} ${O[1]} H${right + 34}" marker-end="url(#dv-ax)"/>
    <path class="ink" pathLength="1" ${t(0.45)} stroke-width="1.2" d="M${O[0]} 448 V100" marker-end="url(#dv-ax)"/>
  </g>
  <g stroke="${INK}" fill="none">${ticks.join('')}</g>

  <!-- the forward: straight through the strike, in graphite -->
  <path class="ink" pathLength="1" ${t(1.3)} d="M${K - 60} ${O[1] + 60} L${K + 220} ${O[1] - 220}" stroke="${GRAPH}" stroke-width="1" stroke-dasharray="6 5" fill="none"/>
  <text class="write" ${t(2.0)} x="${K + 92}" y="${O[1] - 106}" fill="${GRAPH}" font-size="18" ${serif} transform="rotate(-45 ${K + 92} ${O[1] - 106})">forward: S<tspan dy="4" font-size="12">T</tspan><tspan dy="-4"> − K</tspan></text>

  <!-- loss region under the axis, hatched -->
  <path class="fade" ${t(2.3)} d="M${O[0]} ${O[1]} H${K + c} L${K} ${O[1] + c} H${O[0]} Z" fill="url(#dv-hatch)" opacity="0.55"/>

  <!-- the call: flat at −c, then up at 45° after K -->
  <g filter="url(#dv-rough)">
    <path class="ink" pathLength="1" ${t(1.7)} d="M${O[0]} ${O[1] + c} H${K} L${right} ${O[1] + c - rise}" stroke="${INK}" stroke-width="2" fill="none" stroke-linejoin="round"/>
  </g>
  <text class="write" ${t(2.6)} x="${K + 150}" y="${O[1] - 48}" fill="${ORANGE}" font-size="27" ${serif}>max(S<tspan dy="7" font-size="16">T</tspan><tspan dy="-7"> − K, 0)</tspan></text>
  <text class="write hand" ${t(2.9)} x="${K + 158}" y="${O[1] - 20}" fill="${INK}" font-size="17">long call at expiry</text>

  <!-- premium dimension -->
  <g class="fade" ${t(2.4)} stroke="${GRAPH}" stroke-width="0.8" fill="none">
    <path d="M${O[0] + 70} ${O[1] + 3} V${O[1] + c - 3}" marker-start="url(#dv-g)" marker-end="url(#dv-g)"/>
  </g>
  <text class="write" ${t(2.6)} x="${O[0] + 80}" y="${O[1] + c / 2 + 7}" fill="${GRAPH}" font-size="20" ${serif}>c</text>
  <text class="write hand" ${t(2.9)} x="${O[0] + 18}" y="${O[1] + c + 36}" fill="${INK}" font-size="19" transform="rotate(-4 ${O[0] + 18} ${O[1] + c + 36})">premium paid</text>

  <!-- strike and break-even -->
  <text class="fade" ${t(2.2)} x="${K - 22}" y="${O[1] - 10}" fill="${INK}" font-size="22" ${serif}>K</text>
  <path class="fade" ${t(3.2)} d="M${K + c} ${O[1] - 90} V${O[1] + 34}" stroke="${ORANGE}" stroke-width="0.9" stroke-dasharray="3 3"/>
  <circle class="fade" ${t(3.3)} cx="${K + c}" cy="${O[1]}" r="6.5" fill="none" stroke="${ORANGE}" stroke-width="1.5"/>
  <text class="write hand" ${t(3.5)} x="${K + c + 8}" y="${O[1] + 32}" fill="${ORANGE}" font-size="21">break-even  K + c</text>

  <!-- axis labels -->
  <text class="write" ${t(1.1)} x="${right + 14}" y="${O[1] + 30}" fill="${INK}" font-size="22" ${serif}>S<tspan dy="6" font-size="14">T</tspan></text>
  <text class="write hand" ${t(1.0)} x="${O[0] + 12}" y="112" fill="${INK}" font-size="20">profit</text>

  <!-- set square resting at the lower right -->
  <g transform="translate(470 446) rotate(-6) scale(0.82)" filter="url(#dv-rough)" fill="none" stroke="${INK}" stroke-width="1.2">
    <path class="ink" pathLength="1" ${t(1.0)} d="M0 0 L120 0 L0 -90 Z"/>
    <path class="ink thin" pathLength="1" ${t(1.2)} d="M16 -10 L80 -10 L16 -58 Z"/>
    <path class="fade" ${t(1.4)} d="M0 0 L120 0 L0 -90 Z M16 -10 L16 -58 L80 -10 Z" fill="url(#dv-hatch)" fill-rule="evenodd" stroke="none" opacity="0.6"/>
    ${Array.from({ length: 9 }, (_, i) => `<path class="ink thin" pathLength="1" ${t(1.3 + i * 0.03)} d="M${10 + i * 12} 0 v-${i % 3 === 0 ? 7 : 4}"/>`).join('')}
  </g>

  <!-- pencil in the top right corner -->
  <g transform="translate(408 70) rotate(8)" filter="url(#dv-rough)" fill="none" stroke="${INK}" stroke-width="1.05" stroke-linejoin="round">
    <path class="ink" pathLength="1" ${t(1.2)} d="M0 0 H128 V12 H0 Z"/>
    <path class="ink" pathLength="1" ${t(1.4)} d="M128 0 L154 6 L128 12 M146 4 L154 6 L146 8"/>
    <path class="ink thin" pathLength="1" ${t(1.5)} d="M0 6 H128 M14 0 V12 M20 0 V12"/>
    <path class="fade" ${t(1.7)} d="M128 0 L154 6 L128 12 Z" fill="url(#dv-hatch)" stroke="none"/>
  </g>

  <g class="fade leaf" ${t(4.0)} transform="translate(214 168) rotate(-16) scale(0.95)">
    <path d="${MAPLE}" fill="${ORANGE}" opacity="0.85"/>
    <path d="M0 -14 V18 M0 2 L-10 -3 M0 2 L10 -3" stroke="#fffaf2" stroke-width="0.8" fill="none"/>
  </g>

  <!-- dimension line and title block -->
  <g class="fade" ${t(2.4)} stroke="${GRAPH}" stroke-width="0.7" fill="none">
    <path d="M84 466 V484 M444 466 V484 M86 476 H442"/>
    <path d="M86 476 l8 -3 v6 Z M442 476 l-8 -3 v6 Z" fill="${GRAPH}"/>
  </g>
  <g class="fade" ${t(2.6)} fill="${GRAPH}" font-family="'Cormorant Garamond', Garamond, serif">
    <text x="264" y="468" text-anchor="middle" font-size="17" font-style="italic">${chapters} chapters · ${problems} problems · Hull, 7th ed.</text>
    <text x="44" y="56" font-size="14" letter-spacing="3">PL. I</text>
    <text x="44" y="78" font-size="21" font-style="italic">the payoff</text>
    <text x="604" y="494" text-anchor="end" font-size="13" letter-spacing="2">45°30′N 73°34′W</text>
  </g>
</svg>`;
}

/* Small chapter mark: a hand-drawn roman numeral plate number used on chapter pages. */
export function chapterRule() {
  return `<svg viewBox="0 0 300 12" class="rule" aria-hidden="true"><path class="ink" pathLength="1" d="M2 6 H298" stroke="${INK}" stroke-width="0.8" fill="none"/><path class="ink" pathLength="1" style="transition-delay:.4s" d="M2 10 H180" stroke="${GRAPH}" stroke-width="0.5" fill="none"/></svg>`;
}
