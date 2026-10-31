/*
 * The course map: every chapter of the textbook in order, with its status.
 *
 *  - aligned: the chapter's sections, examples and problems follow the book.
 *  - pending: the chapter has earlier material that is not yet re-aligned with the book.
 *  - todo:    not started.
 *
 * Problems come in two forms. Fixed problems are the book's end-of-chapter questions
 * (answers are in the data). Generated drills (legacy lessons) make a fresh problem each time.
 */
import { chapter as ch1 } from './ch01.js';
import { chapter as ch2 } from './ch02.js';
import { lessons } from './lessons.js';
import { rng, shuffleChoice } from '../js/drill.js';

/* Hull 7th edition, chapters 1 to 34 (titles as in the book's contents). */
export const TOPICS = [
  [1, 'Introduction', '导论'],
  [2, 'Mechanics of futures markets', '期货市场的机制'],
  [3, 'Hedging strategies using futures', '用期货对冲'],
  [4, 'Interest rates', '利率'],
  [5, 'Determination of forward and futures prices', '远期与期货价格的决定'],
  [6, 'Interest rate futures', '利率期货'],
  [7, 'Swaps', '互换'],
  [8, 'Mechanics of options markets', '期权市场的机制'],
  [9, 'Properties of stock options', '股票期权的性质'],
  [10, 'Trading strategies involving options', '期权交易策略'],
  [11, 'Binomial trees', '二叉树'],
  [12, 'Wiener processes and Itô\'s lemma', '维纳过程与伊藤引理'],
  [13, 'The Black-Scholes-Merton model', 'Black-Scholes-Merton 模型'],
  [14, 'Derivatives markets in developing countries', '发展中国家的衍生品市场'],
  [15, 'Options on stock indices and currencies', '股指与货币期权'],
  [16, 'Futures options', '期货期权'],
  [17, 'The Greek letters', '希腊字母'],
  [18, 'Volatility smiles', '波动率微笑'],
  [19, 'Basic numerical procedures', '基本数值方法'],
  [20, 'Value at risk', '风险价值（VaR）'],
  [21, 'Estimating volatilities and correlations', '估计波动率与相关系数'],
  [22, 'Credit risk', '信用风险'],
  [23, 'Credit derivatives', '信用衍生品'],
  [24, 'Exotic options', '奇异期权'],
  [25, 'Weather, energy, and insurance derivatives', '天气、能源与保险衍生品'],
  [26, 'More on models and numerical procedures', '模型与数值方法补充'],
  [27, 'Martingales and measures', '鞅与测度'],
  [28, 'Interest rate derivatives: the standard market models', '利率衍生品：标准市场模型'],
  [29, 'Convexity, timing, and quanto adjustments', '凸性、时点与 quanto 调整'],
  [30, 'Interest rate derivatives: models of the short rate', '利率衍生品：短期利率模型'],
  [31, 'Interest rate derivatives: HJM and LMM', '利率衍生品：HJM 与 LMM'],
  [32, 'Swaps revisited', '互换再讨论'],
  [33, 'Real options', '实物期权'],
  [34, 'Derivatives mishaps and what we can learn from them', '衍生品事故与教训'],
];

const ALIGNED = [ch1, ch2];

/* Legacy lessons from the first version, keyed by the Hull chapter they belong to. */
const legacyByChapter = {};
for (const l of lessons) (legacyByChapter[l.hull] ||= []).push(l);

export function chapterStatus(no) {
  if (ALIGNED.some(c => c.no === no)) return 'aligned';
  if (legacyByChapter[no]) return 'pending';
  return 'todo';
}

export function getAligned(no) {
  return ALIGNED.find(c => c.no === no) || null;
}

export function getLegacy(no) {
  return legacyByChapter[no] || [];
}

/* Every problem in a chapter, as { id, sec, no, fixed?, gen? }. Book problems come first. */
export function problemsFor(no) {
  const out = [];
  const aligned = getAligned(no);
  if (aligned) for (const p of aligned.problems) out.push({ ...p, fixed: true });
  for (const l of getLegacy(no)) for (const d of l.drills) out.push({ id: d.id, zh: d.zh, gen: d.gen, lessonId: l.id, fixed: false });
  return out;
}

/* Turn an entry into a concrete problem (shuffled if it is a choice). */
export function instantiate(item) {
  const raw = item.fixed ? item : item.gen(rng(Math.floor(Math.random() * 2 ** 31)));
  if (raw.kind === 'choice') return shuffleChoice(raw, rng(Math.floor(Math.random() * 2 ** 31)));
  return raw;
}

export const allProblemIds = () => TOPICS.flatMap(([no]) => problemsFor(no).map(p => p.id));
export const findItem = id => {
  for (const [no] of TOPICS) {
    const hit = problemsFor(no).find(p => p.id === id);
    if (hit) return { ...hit, chapter: no };
  }
  return null;
};
