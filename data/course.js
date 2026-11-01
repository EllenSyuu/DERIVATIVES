/*
 * The course map: the 34 chapters of Hull, Options, Futures and Other Derivatives (7th ed.),
 * in the book's order, grouped into parts for the contents page. A chapter is available when
 * its module exists in data/ (listed in data/chapters.js).
 *
 * Every problem is one of the book's end-of-chapter questions (see docs/content-guide.md).
 */
import { CHAPTERS } from './chapters.js';
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
  [12, "Wiener processes and Itô's lemma", '维纳过程与伊藤引理'],
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

/* Parts for the contents page. The book has no parts; this grouping is ours. */
export const PARTS = [
  { no: 1, en: 'Forwards, Futures and Swaps', zh: '远期、期货与互换', from: 1, to: 7, blurb: '交易所与场外市场、保证金、对冲、利率、远期定价、利率期货、互换。' },
  { no: 2, en: 'Options', zh: '期权', from: 8, to: 11, blurb: '期权市场、期权价格的上下限与平价、组合策略、二叉树定价。' },
  { no: 3, en: 'Pricing Models', zh: '定价模型', from: 12, to: 16, blurb: '布朗运动与伊藤引理、Black-Scholes-Merton、指数、货币与期货期权。' },
  { no: 4, en: 'Hedging and Market Risk', zh: '对冲与市场风险', from: 17, to: 21, blurb: '希腊字母、波动率微笑、数值方法、VaR、波动率与相关系数的估计。' },
  { no: 5, en: 'Credit', zh: '信用', from: 22, to: 23, blurb: '违约概率、信用敞口与 CVA、信用违约互换与 CDO。' },
  { no: 6, en: 'Exotics and Advanced Models', zh: '奇异期权与进阶模型', from: 24, to: 27, blurb: '奇异期权、天气与能源衍生品、更多模型与数值方法、鞅与测度。' },
  { no: 7, en: 'Interest Rate Derivatives', zh: '利率衍生品', from: 28, to: 32, blurb: 'Black 模型、凸性调整、短期利率模型、HJM 与 LMM、各类互换。' },
  { no: 8, en: 'Real Options and Lessons', zh: '实物期权与教训', from: 33, to: 34, blurb: '用期权思维评估投资项目，以及衍生品事故留下的教训。' },
];

export const topic = no => TOPICS.find(t => t[0] === no) || null;
export const partOf = no => PARTS.find(p => no >= p.from && no <= p.to);
export const getChapter = no => CHAPTERS.find(c => c.no === no) || null;
export const chapterStatus = no => (getChapter(no) ? 'aligned' : 'todo');

/* Every problem of a chapter, in the book's order. */
export function problemsFor(no) {
  const c = getChapter(no);
  return c ? c.problems.map(p => ({ ...p, fixed: true, chapter: no })) : [];
}

/* A concrete problem to show: choice options are shuffled each time. */
export function instantiate(item) {
  return item.kind === 'choice' ? shuffleChoice(item, rng(Math.floor(Math.random() * 2 ** 31))) : item;
}

export const allProblemIds = () => CHAPTERS.flatMap(c => c.problems.map(p => p.id));

export function findItem(id) {
  for (const c of CHAPTERS) {
    const p = c.problems.find(x => x.id === id);
    if (p) return { ...p, fixed: true, chapter: c.no };
  }
  return null;
}

export const totalProblems = () => CHAPTERS.reduce((n, c) => n + c.problems.length, 0);
