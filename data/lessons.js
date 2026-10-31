/*
 * The lessons. Written for this project from first principles and from the chapter order of
 * a standard derivatives course (see docs/content-guide.md). Explanations are in Chinese;
 * English terms are kept as they appear in textbooks and exams.
 *
 * Math written as $...$ is typeset with KaTeX when it is available.
 *
 * Every drill is a generator: gen(rng) returns a fresh problem (see js/drill.js).
 */
import {
  forwardPrice,
  futureValue,
  presentValue,
  toContinuous,
  fromContinuous,
  putFromParity,
  blackScholes,
  bsDelta,
  binomialUpDown,
  riskNeutralP,
  oneStepValue,
  hedgeRatio,
  contractsToHedge,
  callPayoff,
  putPayoff,
  round,
} from '../js/math.js';

const f2 = x => x.toFixed(2);
const f4 = x => x.toFixed(4);

/* A choice drill: correct answer first, the builder shuffles the options later. */
const choice = (q, correct, wrong, why) => () => ({
  q,
  kind: 'choice',
  options: [correct, ...wrong],
  answer: 0,
  why,
});

/* A number drill. */
const num = (q, answer, why, { unit = '', tol } = {}) => ({
  q,
  kind: 'number',
  answer,
  unit,
  tol,
  why,
});

export const lessons = [
  /* ------------------------------------------------------------------ 1 */
  {
    id: 'intro',
    no: 1,
    zh: '衍生品是什么',
    en: 'What is a derivative',
    ref: 'Hull 第 1 章',
    intro: [
      '衍生品（derivative）是一份合约，它的价值由另一样东西决定，这样东西叫标的资产（underlying asset），例如股票、石油、黄金、汇率或利率。',
      '四种最基本的衍生品：远期合约（forward）、期货（futures）、期权（option）和互换（swap）。学会它们，后面的内容就是把它们逐个拆开看。',
      '市场里有三类人：对冲者（hedger）想减少风险；投机者（speculator）用赌方向来赚钱；套利者（arbitrageur）利用同一样东西在两个地方的价格差来赚无风险利润。三者缺一，市场就转不动。',
    ],
    keyIdeas: [
      '远期合约：两方约定未来某天以某个价格买卖，场外交易（OTC），条款可以随意定。',
      '期货合约：同样是约定未来买卖，但在交易所里交易，条款标准化，每天结算盈亏（mark to market）。',
      '期权：买方有权利、没有义务。看涨（call）是有权买，看跌（put）是有权卖。买方付出期权费（premium）。',
      '互换：两方交换一系列现金流，例如固定利率换浮动利率。',
    ],
    formulas: [],
    example: () => ({
      title: '一个农民的故事',
      steps: [
        '农民六个月后要卖出小麦，他担心价格下跌，于是和面粉厂签一份远期合约，锁定今天约定的卖价。',
        '他是对冲者：他本来就持有小麦，合约让他的收入变得确定。',
        '如果六个月后小麦涨到更高价格，他会少赚，但这正是他为确定性付出的代价。',
      ],
    }),
    drills: [
      {
        id: 'intro-1',
        zh: '农民担心半年后小麦价格下跌，于是用合约锁定卖价。他属于哪类参与者？',
        gen: choice(
          '农民担心半年后小麦价格下跌，于是用合约锁定卖价。他属于哪类参与者？',
          '对冲者（hedger）',
          ['投机者（speculator）', '套利者（arbitrageur）', '做市商（market maker）'],
          '他本来就持有小麦、面临价格下跌的风险，合约用来减少这个风险，所以是对冲者。',
        ),
      },
      {
        id: 'intro-2',
        zh: '某人预期油价会涨，于是买入石油期货，但手上并没有石油。他属于哪类？',
        gen: choice(
          '某人预期油价会涨，于是买入石油期货，但手上并没有石油。他属于哪类？',
          '投机者（speculator）',
          ['对冲者（hedger）', '套利者（arbitrageur）', '保险公司'],
          '他没有石油需要保护，而是在押注价格方向，这就是投机。',
        ),
      },
      {
        id: 'intro-3',
        zh: '远期合约与期货合约最主要的区别是什么？',
        gen: choice(
          '远期合约与期货合约最主要的区别是什么？',
          '远期在场外私下签订、条款灵活；期货在交易所标准化交易，并每天结算',
          ['远期合约没有到期日', '期货的价格永远等于现货价格', '期货只能用于商品，远期用于股票'],
          '远期是两个人之间的私人合同（OTC）；期货有统一的规格，经交易所清算，每天结算盈亏。',
        ),
      },
      {
        id: 'intro-4',
        zh: '期权的买方拥有什么？',
        gen: choice(
          '期权的买方拥有什么？',
          '权利，但没有义务去买或卖',
          ['义务，必须在到期时买入', '标的资产本身', '免费获得的保证金'],
          '期权买方付出期权费，换来在到期前（或到期时）按约定执行的权利，可以选择不执行。',
        ),
      },
    ],
  },

  /* ------------------------------------------------------------------ 2 */
  {
    id: 'payoff',
    no: 2,
    zh: '远期与期货的盈亏',
    en: 'Payoffs of forwards and futures',
    ref: 'Hull 第 2 章 · 第 5 章',
    intro: [
      '一份远期合约在签约时，双方约定一个交割价格 $F_0$（delivery price）。到期时，标的的市价是 $S_T$。',
      '多头（long，约定要买入的一方）的盈亏是 $S_T - F_0$：市价比约定价高，多头赚钱。空头（short）正好相反，盈亏是 $F_0 - S_T$。',
      '注意：这是到期时的盈亏，不含任何费用。签约那一刻合约本身的价值通常为零，因为 $F_0$ 就是按公平原则定出来的。',
    ],
    keyIdeas: [
      '多头盈亏：$S_T - F_0$；空头盈亏：$F_0 - S_T$。两者加起来永远是零（零和）。',
      '期货的盈亏形式相同，只是它每天结算，所以中间的现金流会提前发生。',
    ],
    formulas: [
      { tex: 'P_{\\text{long}} = S_T - F_0', zh: '多头远期在到期时的盈亏' },
      { tex: 'P_{\\text{short}} = F_0 - S_T', zh: '空头远期在到期时的盈亏' },
    ],
    example: () => {
      const F0 = 50;
      const ST = 56;
      return {
        title: '例子：多头买入铜',
        steps: [
          `签约时约定以 ${F0} 元买入一吨铜（交割价 $F_0 = ${F0}$）。`,
          `到期时市价 $S_T = ${ST}$。`,
          `多头盈亏 $= S_T - F_0 = ${ST} - ${F0} = ${ST - F0}$ 元：可以用 ${F0} 元买到值 ${ST} 元的铜。`,
        ],
      };
    },
    drills: [
      {
        id: 'payoff-1',
        zh: '多头盈亏',
        gen: r => {
          const F0 = r.int(40, 80);
          const ST = F0 + r.int(-15, 15);
          return num(
            `签约交割价 $F_0 = ${F0}$，到期市价 $S_T = ${ST}$。多头的盈亏是多少（元）？`,
            ST - F0,
            `多头盈亏 $= S_T - F_0 = ${ST} - ${F0} = ${ST - F0}$。正数表示赚钱，负数表示亏钱。`,
            { unit: '元', tol: 0.001 },
          );
        },
      },
      {
        id: 'payoff-2',
        zh: '空头盈亏',
        gen: r => {
          const F0 = r.int(40, 80);
          const ST = F0 + r.int(-15, 15);
          return num(
            `签约交割价 $F_0 = ${F0}$，到期市价 $S_T = ${ST}$。空头的盈亏是多少（元）？`,
            F0 - ST,
            `空头盈亏 $= F_0 - S_T = ${F0} - ${ST} = ${F0 - ST}$。空头与多头正好相反。`,
            { unit: '元', tol: 0.001 },
          );
        },
      },
      {
        id: 'payoff-3',
        zh: '零和',
        gen: choice(
          '一份远期合约，多头赚了 8 元。空头的盈亏是多少？',
          '亏 8 元',
          ['赚 8 元', '赚 16 元', '不赚不亏'],
          '远期是零和游戏：多头赚的，正是空头亏的。空头盈亏 $= -8$ 元。',
        ),
      },
    ],
  },

  /* ------------------------------------------------------------------ 3 */
  {
    id: 'rates',
    no: 3,
    zh: '利率与连续复利',
    en: 'Interest rates and continuous compounding',
    ref: 'Hull 第 4 章',
    intro: [
      '金融里最常用的是连续复利（continuously compounded）。如果本金 $P$ 以年利率 $r$ 连续复利计息，$T$ 年后的金额是 $P e^{rT}$。',
      '连续复利的好处是公式干净：贴现只要乘 $e^{-rT}$，利率的加减乘除都很直接。',
      '年利率和连续复利率之间可以互相换算：$R_c = \\ln(1+R)$，$R = e^{R_c} - 1$。',
    ],
    keyIdeas: [
      '$P$ 在 $T$ 年后的终值（future value）：$P e^{rT}$。',
      '$A$ 在 $T$ 年后到手，它现在值 $A e^{-rT}$（现值，present value）。',
      '年利率 $R$ 换成连续复利率：$R_c = \\ln(1+R)$。',
    ],
    formulas: [
      { tex: 'A = P e^{rT}', zh: '连续复利的终值' },
      { tex: 'PV = A e^{-rT}', zh: '现值' },
      { tex: 'R_c = \\ln(1+R)', zh: '年利率换成连续复利率' },
    ],
    example: () => {
      const P = 1000;
      const r = 0.06;
      const T = 2;
      return {
        title: '例子：1000 元存两年',
        steps: [
          `本金 $P = ${P}$，连续复利 $r = 6\\%$，$T = ${T}$ 年。`,
          `终值 $= 1000 e^{0.06 \\times 2} = 1000 e^{0.12} \\approx ${f2(futureValue(P, r, T))}$ 元。`,
        ],
      };
    },
    drills: [
      {
        id: 'rates-1',
        zh: '终值',
        gen: r => {
          const P = r.int(10, 50) * 100;
          const rate = r.int(3, 8);
          const T = r.int(1, 5);
          return num(
            `本金 ${P} 元，连续复利年利率 ${rate}%，存 ${T} 年。到期金额是多少（元，保留两位小数）？`,
            futureValue(P, rate / 100, T),
            `$A = P e^{rT} = ${P} e^{${rate / 100} \\times ${T}}$，计算得约 ${f2(futureValue(P, rate / 100, T))} 元。`,
            { unit: '元', tol: 0.05 },
          );
        },
      },
      {
        id: 'rates-2',
        zh: '现值',
        gen: r => {
          const A = r.int(10, 40) * 100;
          const rate = r.int(2, 9);
          const T = r.int(1, 4);
          return num(
            `${T} 年后将收到 ${A} 元，连续复利年利率 ${rate}%。它现在值多少（元，保留两位小数）？`,
            presentValue(A, rate / 100, T),
            `$PV = A e^{-rT} = ${A} e^{-${rate / 100} \\times ${T}}$，约 ${f2(presentValue(A, rate / 100, T))} 元。`,
            { unit: '元', tol: 0.05 },
          );
        },
      },
      {
        id: 'rates-3',
        zh: '年利率换算',
        gen: r => {
          const Rpct = r.int(3, 12);
          return num(
            `年利率 ${Rpct}%（每年复利一次）换成连续复利率，应该是多少（百分比，保留两位小数）？`,
            round(toContinuous(Rpct / 100) * 100, 2),
            `$R_c = \\ln(1+R) = \\ln(1.${String(Rpct).padStart(2, '0')}) \\approx ${f4(toContinuous(Rpct / 100))}$，即约 ${f2(toContinuous(Rpct / 100) * 100)}%。连续复利率总比同样的年利率略小。`,
            { unit: '%', tol: 0.02 },
          );
        },
      },
    ],
  },

  /* ------------------------------------------------------------------ 4 */
  {
    id: 'forward-price',
    no: 4,
    zh: '远期价格：无收益资产',
    en: 'Forward price of a non-dividend asset',
    ref: 'Hull 第 5 章',
    intro: [
      '为什么远期价格不等于现在的市价？因为买家现在不付钱，要等到到期才付；这段时间里，钱本可以存进银行赚利息。',
      '对于不付红利、不产生收益的资产（例如一个不付息的零息资产），公平的远期价格是 $F_0 = S_0 e^{rT}$。',
      '判断方法是套利：如果 $F_0$ 偏高，就买入现货、同时卖出远期，到期交割，锁定无风险利润；如果偏低，反过来做。',
    ],
    keyIdeas: [
      '远期价格 $F_0 = S_0 e^{rT}$：现价加上持有成本（利息）。',
      '如果市场价格偏离这个公式，就存在无风险套利机会。',
    ],
    formulas: [{ tex: 'F_0 = S_0 e^{rT}', zh: '无收益资产的远期价格' }],
    example: () => {
      const S0 = 50;
      const r = 0.05;
      const T = 0.5;
      return {
        title: '例子：股票半年远期',
        steps: [
          `现价 $S_0 = ${S0}$，无风险利率 $r = 5\\%$，期限 $T = 0.5$ 年。`,
          `$F_0 = 50 e^{0.05 \\times 0.5} \\approx ${f2(forwardPrice(S0, r, T))}$ 元。`,
          '如果市场远期报价是 52 元，就有套利：借钱买现货，卖出远期，到期交割。',
        ],
      };
    },
    drills: [
      {
        id: 'fwd-1',
        zh: '远期价格',
        gen: r => {
          const S0 = r.int(20, 90);
          const rate = r.int(2, 8);
          const T = r.pick([0.25, 0.5, 1, 2]);
          return num(
            `资产现价 ${S0} 元，无收益，无风险利率 ${rate}%（连续复利），期限 ${T} 年。远期价格是多少（元）？`,
            forwardPrice(S0, rate / 100, T),
            `$F_0 = S_0 e^{rT} = ${S0} e^{${rate / 100} \\times ${T}}$，约 ${f2(forwardPrice(S0, rate / 100, T))} 元。`,
            { unit: '元', tol: 0.05 },
          );
        },
      },
      {
        id: 'fwd-2',
        zh: '为什么远期更贵',
        gen: choice(
          '无收益资产的远期价格高于现货价格，主要因为什么？',
          '买方要等到到期才付钱，这段时间的利息由远期价格补偿',
          ['远期合约的手续费', '市场预期资产一定会涨', '交易所的税费'],
          '远期价格里包含持有成本：现价的资金如果存银行本可以生息，远期价格要把这笔利息算进去。',
        ),
      },
    ],
  },

  /* ------------------------------------------------------------------ 5 */
  {
    id: 'option-payoff',
    no: 5,
    zh: '期权到期的收益',
    en: 'Option payoffs at expiry',
    ref: 'Hull 第 9–10 章',
    intro: [
      '欧式期权（European option）只能在到期日执行。设执行价（strike price）为 $K$，到期标的价为 $S_T$。',
      '看涨期权的收益是 $\\max(S_T - K, 0)$：涨过 $K$ 才有收益，否则放弃。看跌期权的收益是 $\\max(K - S_T, 0)$。',
      '期权买方付出期权费 $c$（或 $p$）。净利润 $=$ 收益 $-$ 期权费。这里一定要记得减掉期权费，否则就算错了。',
    ],
    keyIdeas: [
      '收益永远不会是负数：买方最多亏掉期权费，这是期权的特点。',
      '卖方的收益正好相反：收到期权费，但可能要承担大额损失。',
    ],
    formulas: [
      { tex: 'C_T = \\max(S_T - K, 0)', zh: '看涨期权到期收益' },
      { tex: 'P_T = \\max(K - S_T, 0)', zh: '看跌期权到期收益' },
      { tex: '\\text{净利润} = \\text{收益} - \\text{期权费}', zh: '买方的净利润' },
    ],
    example: () => ({
      title: '例子：买入看涨',
      steps: [
        '执行价 $K = 40$，期权费 $c = 3$。',
        '若到期 $S_T = 45$：收益 $= \\max(45-40, 0) = 5$，净利润 $= 5 - 3 = 2$。',
        '若到期 $S_T = 38$：收益 $= 0$，净利润 $= -3$，亏掉的就是期权费。',
      ],
    }),
    drills: [
      {
        id: 'opt-1',
        zh: '看涨净利润',
        gen: r => {
          const K = r.int(30, 60);
          const c = r.int(1, 6);
          const ST = K + r.int(-12, 12);
          const payoff = callPayoff(ST, K);
          return num(
            `买入一份执行价 $K = ${K}$ 的欧式看涨期权，期权费 ${c} 元。到期标的价 $S_T = ${ST}$，净利润是多少（元）？`,
            payoff - c,
            `收益 $= \\max(${ST} - ${K}, 0) = ${payoff}$，净利润 $= ${payoff} - ${c} = ${payoff - c}$。`,
            { unit: '元', tol: 0.001 },
          );
        },
      },
      {
        id: 'opt-2',
        zh: '看跌净利润',
        gen: r => {
          const K = r.int(30, 60);
          const p = r.int(1, 6);
          const ST = K + r.int(-12, 12);
          const payoff = putPayoff(ST, K);
          return num(
            `买入一份执行价 $K = ${K}$ 的欧式看跌期权，期权费 ${p} 元。到期标的价 $S_T = ${ST}$，净利润是多少（元）？`,
            payoff - p,
            `收益 $= \\max(${K} - ${ST}, 0) = ${payoff}$，净利润 $= ${payoff} - ${p} = ${payoff - p}$。`,
            { unit: '元', tol: 0.001 },
          );
        },
      },
      {
        id: 'opt-3',
        zh: '买方最大亏损',
        gen: choice(
          '买入一份期权，最多会亏多少？',
          '期权费（付出的那笔钱）',
          ['无限大', '执行价减去期权费', '标的资产的全部价值'],
          '买方的权利不是义务：到期不执行，损失就只是当初付出的期权费。',
        ),
      },
    ],
  },

  /* ------------------------------------------------------------------ 6 */
  {
    id: 'parity',
    no: 6,
    zh: '看涨看跌平价',
    en: 'Put-call parity',
    ref: 'Hull 第 9 章',
    intro: [
      '对同样的标的、同样的执行价 $K$ 和到期日，看涨期权 $c$ 和看跌期权 $p$ 之间有一个固定关系，叫看跌看涨平价（put-call parity）。',
      '左边组合：一份看涨加上 $K e^{-rT}$ 的现金（到期正好攒够 $K$）。右边组合：一份看跌加上一股标的。两边到期时都等于 $\\max(S_T, K)$，所以现在价格必须相等。',
      '公式：$c + K e^{-rT} = p + S_0$（标的不付收益）。',
    ],
    keyIdeas: [
      '知道其中三个量，就能算出第四个。',
      '如果平价关系被打破，就存在套利机会，这正是衍生品定价的基础思路。',
    ],
    formulas: [{ tex: 'c + K e^{-rT} = p + S_0', zh: '看跌看涨平价（无收益标的）' }],
    example: () => ({
      title: '例子：由看涨求看跌',
      steps: [
        '$S_0 = 100$，$K = 100$，$r = 5\\%$，$T = 1$，看涨价 $c = 10$。',
        '$p = c + K e^{-rT} - S_0 = 10 + 100 e^{-0.05} - 100 \\approx 10 + 95.12 - 100 = 5.12$。',
      ],
    }),
    drills: [
      {
        id: 'parity-1',
        zh: '由看涨求看跌',
        gen: r => {
          const S = r.int(40, 120);
          const K = S + r.int(-10, 10);
          const rate = r.int(2, 8);
          const T = r.pick([0.5, 1, 2]);
          const c = r.int(3, 20);
          return num(
            `$S_0 = ${S}$，$K = ${K}$，$r = ${rate}\\%$，$T = ${T}$ 年，看涨期权价 $c = ${c}$。用看跌看涨平价求同样条件下看跌期权的价格 $p$（元，保留两位小数）。`,
            putFromParity(c, S, K, rate / 100, T),
            `$p = c + K e^{-rT} - S_0 = ${c} + ${K} e^{-${rate / 100} \\times ${T}} - ${S}$，约 ${f2(putFromParity(c, S, K, rate / 100, T))} 元。`,
            { unit: '元', tol: 0.05 },
          );
        },
      },
      {
        id: 'parity-2',
        zh: '平价的含义',
        gen: choice(
          '看跌看涨平价说明，"买一份看涨 + 存 $K e^{-rT}$" 相当于什么？',
          '"买一份看跌 + 买一股标的"',
          ['"卖一份看跌 + 买一股标的"', '"买一份看涨 + 卖一股标的"', '"买两份看涨"'],
          '两个组合到期时都等于 $\\max(S_T, K)$，所以它们现在的价格相同。',
        ),
      },
    ],
  },

  /* ------------------------------------------------------------------ 7 */
  {
    id: 'hedge',
    no: 7,
    zh: '对冲比率与基差',
    en: 'Hedge ratio and basis risk',
    ref: 'Hull 第 3 章',
    intro: [
      '对冲的目标是让手上的风险变小。如果用期货对冲，最关心的是：需要买卖多少份合约？',
      '最小方差对冲比率（minimum variance hedge ratio）为 $h = \\rho \\dfrac{\\sigma_S}{\\sigma_F}$。其中 $\\rho$ 是现货与期货价格变化的相关系数，$\\sigma_S$、$\\sigma_F$ 分别是它们的标准差。',
      '需要的合约份数为 $N^* = h \\dfrac{Q_A}{Q_F}$，$Q_A$ 是要对冲的数量，$Q_F$ 是一份合约的标准数量。',
    ],
    keyIdeas: [
      '相关性越高，期货越能代替现货，对冲越有效。',
      '现货与期货价格不完全同步，两者之差叫基差（basis）；基差的波动就是基差风险。',
    ],
    formulas: [
      { tex: 'h = \\rho \\dfrac{\\sigma_S}{\\sigma_F}', zh: '最小方差对冲比率' },
      { tex: 'N^* = h \\dfrac{Q_A}{Q_F}', zh: '需要的合约份数' },
    ],
    example: () => ({
      title: '例子：用期货对冲一批原油',
      steps: [
        '要对冲 $Q_A = 100{,}000$ 桶原油；一份期货合约 $Q_F = 1{,}000$ 桶。',
        '$\\rho = 0.9$，$\\sigma_S = 0.04$，$\\sigma_F = 0.05$（均为价格变化的标准差）。',
        '$h = 0.9 \\times 0.04 / 0.05 = 0.72$，$N^* = 0.72 \\times 100{,}000 / 1{,}000 = 72$ 份。',
      ],
    }),
    drills: [
      {
        id: 'hedge-1',
        zh: '对冲比率',
        gen: r => {
          const rho = r.pick([0.5, 0.6, 0.8, 0.9]);
          const sS = r.pick([0.02, 0.03, 0.04, 0.06]);
          const sF = r.pick([0.03, 0.04, 0.05]);
          return num(
            `$\\rho = ${rho}$，$\\sigma_S = ${sS}$，$\\sigma_F = ${sF}$。最小方差对冲比率 $h$ 是多少（保留三位小数）？`,
            round(hedgeRatio(rho, sS, sF), 3),
            `$h = \\rho \\sigma_S / \\sigma_F = ${rho} \\times ${sS} / ${sF} = ${f4(hedgeRatio(rho, sS, sF))}$。`,
            { tol: 0.0015 },
          );
        },
      },
      {
        id: 'hedge-2',
        zh: '合约份数',
        gen: r => {
          const h = r.pick([0.6, 0.75, 0.8, 1.2]);
          const QA = r.pick([50000, 100000, 200000]);
          const QF = r.pick([1000, 5000]);
          return num(
            `对冲比率 $h = ${h}$，要对冲的数量 $Q_A = ${QA.toLocaleString('en-US')}$，一份合约 $Q_F = ${QF.toLocaleString('en-US')}$。需要多少份合约？`,
            contractsToHedge(h, QA, QF),
            `$N^* = h Q_A / Q_F = ${h} \\times ${QA} / ${QF} = ${contractsToHedge(h, QA, QF)}$ 份。`,
            { unit: '份', tol: 0.001 },
          );
        },
      },
      {
        id: 'hedge-3',
        zh: '基差风险',
        gen: choice(
          '用期货对冲时，"基差风险" 指的是什么？',
          '现货与期货价格之间的差距发生变化，使对冲不再完美',
          ['期货合约的交易手续费', '标的资产被政府没收的风险', '期货价格永远高于现货'],
          '基差 = 现货价格 - 期货价格。基差变化意味着对冲的效果会有偏差。',
        ),
      },
    ],
  },

  /* ------------------------------------------------------------------ 8 */
  {
    id: 'binomial',
    no: 8,
    zh: '二叉树定价',
    en: 'Binomial trees',
    ref: 'Hull 第 11 章',
    intro: [
      '二叉树（binomial tree）把时间切成小段，每段里标的只有两种走法：涨到 $Su$ 或跌到 $Sd$。',
      '关键技巧是风险中性定价：假装所有人都不在乎风险，把概率换成一个"风险中性概率" $p$，然后按无风险利率贴现。这样算出的价格与真实市场一致。',
      '$p = \\dfrac{e^{r\\Delta t} - d}{u - d}$，期权价值 $f = e^{-r\\Delta t}[p f_u + (1-p) f_d]$。$f_u$、$f_d$ 分别是涨跌两种情况下的期权价值。',
    ],
    keyIdeas: [
      '必须满足 $d < e^{r\\Delta t} < u$，否则会有明显的套利机会。',
      '一步树算出的是一步之后的价值；多步树就是从后往前，一层一层地倒推。',
    ],
    formulas: [
      { tex: 'p = \\dfrac{e^{r\\Delta t} - d}{u - d}', zh: '风险中性概率' },
      { tex: 'f = e^{-r\\Delta t}[p f_u + (1-p) f_d]', zh: '一步之后倒推' },
    ],
    example: () => {
      const S = 100;
      const K = 100;
      const r = 0.05;
      const u = 1.2;
      const d = 0.8;
      const dt = 1;
      const p = riskNeutralP(r, dt, u, d);
      const fu = callPayoff(S * u, K);
      const fd = callPayoff(S * d, K);
      return {
        title: '例子：一步树上的看涨',
        steps: [
          `$S = 100$，$K = 100$，$u = 1.2$，$d = 0.8$，$r = 5\\%$，$\\Delta t = 1$。`,
          `$p = (e^{0.05} - 0.8)/(1.2 - 0.8) \\approx ${f4(p)}$。`,
          `$f_u = \\max(120 - 100, 0) = ${fu}$，$f_d = \\max(80 - 100, 0) = ${fd}$。`,
          `$f = e^{-0.05}[${f4(p)} \\times ${fu} + ${f4(1 - p)} \\times ${fd}] \\approx ${f2(oneStepValue(fu, fd, r, dt, p))}$。`,
        ],
      };
    },
    drills: [
      {
        id: 'bin-1',
        zh: '风险中性概率',
        gen: r => {
          const u = r.pick([1.1, 1.2, 1.25]);
          const d = r.pick([0.8, 0.85, 0.9]);
          const rate = r.pick([3, 4, 5, 6]);
          return num(
            `$u = ${u}$，$d = ${d}$，$r = ${rate}\\%$，$\\Delta t = 1$。风险中性概率 $p$ 是多少（保留三位小数）？`,
            round(riskNeutralP(rate / 100, 1, u, d), 3),
            `$p = (e^{${rate / 100}} - ${d}) / (${u} - ${d}) = ${f4(riskNeutralP(rate / 100, 1, u, d))}$。`,
            { tol: 0.0015 },
          );
        },
      },
      {
        id: 'bin-2',
        zh: '一步期权价值',
        gen: r => {
          const S = r.pick([50, 80, 100]);
          const K = S;
          const u = 1.2;
          const d = 0.8;
          const rate = r.pick([4, 5, 6]);
          const p = riskNeutralP(rate / 100, 1, u, d);
          const fu = callPayoff(S * u, K);
          const fd = callPayoff(S * d, K);
          const value = oneStepValue(fu, fd, rate / 100, 1, p);
          return num(
            `$S = ${S}$，$K = ${K}$，$u = 1.2$，$d = 0.8$，$r = ${rate}\\%$，$\\Delta t = 1$。欧式看涨期权的现值是多少（保留两位小数）？`,
            value,
            `$f_u = ${fu}$，$f_d = ${fd}$，$p \\approx ${f4(p)}$，$f = e^{-${rate / 100}}[${f4(p)} \\times ${fu} + ${f4(1 - p)} \\times ${fd}] \\approx ${f2(value)}$。`,
            { unit: '元', tol: 0.02 },
          );
        },
      },
    ],
  },

  /* ------------------------------------------------------------------ 9 */
  {
    id: 'bs',
    no: 9,
    zh: 'Black-Scholes 定价',
    en: 'The Black-Scholes-Merton model',
    ref: 'Hull 第 13 章',
    intro: [
      'Black-Scholes-Merton 模型给出了欧式期权的解析公式。标的价格假设服从对数正态分布，波动率 $\\sigma$ 固定。',
      '$d_1 = \\dfrac{\\ln(S_0/K) + (r + \\sigma^2/2)T}{\\sigma\\sqrt{T}}$，$d_2 = d_1 - \\sigma\\sqrt{T}$。',
      '看涨：$c = S_0 N(d_1) - K e^{-rT} N(d_2)$；看跌：$p = K e^{-rT} N(-d_2) - S_0 N(-d_1)$。$N(\\cdot)$ 是标准正态分布的累积概率。',
      '不必死记：先算 $d_1$、$d_2$，再查 $N$ 的值，代入即可。',
    ],
    keyIdeas: [
      '$N(d_2)$ 可以理解为"到期时期权最终被执行"的风险中性概率。',
      '波动率越大，期权越贵：买方有更大机会赚到大钱，而亏损最多只是期权费。',
    ],
    formulas: [
      { tex: 'c = S_0 N(d_1) - K e^{-rT} N(d_2)', zh: '看涨期权价格' },
      { tex: 'p = K e^{-rT} N(-d_2) - S_0 N(-d_1)', zh: '看跌期权价格' },
    ],
    example: () => {
      const S = 42;
      const K = 40;
      const r = 0.1;
      const T = 0.5;
      const sigma = 0.2;
      const { d1, d2, call, put } = blackScholes(S, K, r, T, sigma);
      return {
        title: '例子：S=42, K=40',
        steps: [
          `$S_0 = 42$，$K = 40$，$r = 10\\%$，$T = 0.5$，$\\sigma = 20\\%$。`,
          `$d_1 \\approx ${f4(d1)}$，$d_2 \\approx ${f4(d2)}$。`,
          `看涨 $c \\approx ${f2(call)}$，看跌 $p \\approx ${f2(put)}$（用平价验证：$c + Ke^{-rT} - S_0 = p$）。`,
        ],
      };
    },
    drills: [
      {
        id: 'bs-1',
        zh: '看涨价格',
        gen: r => {
          const S = r.int(30, 60);
          const K = S + r.int(-5, 5);
          const rate = r.pick([5, 8, 10]);
          const T = r.pick([0.5, 1]);
          const sigma = r.pick([20, 25, 30, 40]);
          const { call } = blackScholes(S, K, rate / 100, T, sigma / 100);
          return num(
            `$S_0 = ${S}$，$K = ${K}$，$r = ${rate}\\%$，$T = ${T}$，$\\sigma = ${sigma}\\%$。欧式看涨期权价格是多少（元，保留两位小数）？`,
            call,
            `先算 $d_1$、$d_2$，再代入 $c = S_0 N(d_1) - K e^{-rT} N(d_2) \\approx ${f2(call)}$。`,
            { unit: '元', tol: 0.02 },
          );
        },
      },
      {
        id: 'bs-2',
        zh: '波动率与期权价格',
        gen: choice(
          '其他条件不变，波动率 $\\sigma$ 变大，欧式期权的价格通常会怎样？',
          '看涨和看跌都变贵',
          ['看涨变贵，看跌变便宜', '都变便宜', '价格不受影响'],
          '波动率越大，标的到期时落在很远的位置的可能性越大。买方亏损有限、收益可能很大，所以期权更贵。',
        ),
      },
    ],
  },

  /* ------------------------------------------------------------------ 10 */
  {
    id: 'delta',
    no: 10,
    zh: '希腊字母：Delta',
    en: 'The Greeks: delta',
    ref: 'Hull 第 17 章',
    intro: [
      '期权的价格会随很多因素变化，风险管理者用"希腊字母"量化每一种敏感度。最常用的是 Delta（$\\Delta$）：标的价格变动 1 元，期权价格大约变动多少。',
      '欧式看涨的 Delta 是 $N(d_1)$，取值在 0 和 1 之间；看跌的 Delta 是 $N(d_1) - 1$，取值在 -1 和 0 之间。',
      'Delta 对冲：持有 $\\Delta$ 份标的，可以抵消期权的方向性风险。Delta 随标的价格变化，所以对冲需要不断调整。',
    ],
    keyIdeas: [
      '深度实值（deep in the money）的看涨，Delta 接近 1；深度虚值（deep out of the money）的看涨，Delta 接近 0。',
      'Delta 是一阶敏感度；它的变化速度叫 Gamma，后面再学。',
    ],
    formulas: [
      { tex: '\\Delta_{\\text{call}} = N(d_1)', zh: '看涨 Delta' },
      { tex: '\\Delta_{\\text{put}} = N(d_1) - 1', zh: '看跌 Delta' },
    ],
    example: () => ({
      title: '例子：Delta 对冲',
      steps: [
        '一份看涨期权的 Delta 是 0.6，你卖出了它。',
        '为了对冲，你买入 $0.6$ 股标的。标的涨 1 元，期权亏约 0.6 元，股票赚 0.6 元，相互抵消。',
      ],
    }),
    drills: [
      {
        id: 'delta-1',
        zh: '看涨 Delta',
        gen: r => {
          const S = r.int(40, 60);
          const K = S + r.int(-5, 5);
          const rate = r.pick([5, 8]);
          const T = r.pick([0.5, 1]);
          const sigma = r.pick([20, 25, 30]);
          const { call } = bsDelta(S, K, rate / 100, T, sigma / 100);
          return num(
            `$S_0 = ${S}$，$K = ${K}$，$r = ${rate}\\%$，$T = ${T}$，$\\sigma = ${sigma}\\%$。欧式看涨期权的 Delta 是多少（保留三位小数）？`,
            round(call, 3),
            `$\\Delta = N(d_1) \\approx ${f4(call)}$。`,
            { tol: 0.0015 },
          );
        },
      },
      {
        id: 'delta-2',
        zh: '看跌 Delta',
        gen: r => {
          const S = r.int(40, 60);
          const K = S + r.int(-5, 5);
          const rate = r.pick([5, 8]);
          const T = r.pick([0.5, 1]);
          const sigma = r.pick([20, 25, 30]);
          const { put } = bsDelta(S, K, rate / 100, T, sigma / 100);
          return num(
            `同样的条件（$S_0 = ${S}$，$K = ${K}$，$r = ${rate}\\%$，$T = ${T}$，$\\sigma = ${sigma}\\%$）。欧式看跌期权的 Delta 是多少（保留三位小数）？`,
            round(put, 3),
            `看跌 Delta $= N(d_1) - 1 \\approx ${f4(put)}$。它一定是负数。`,
            { tol: 0.0015 },
          );
        },
      },
      {
        id: 'delta-3',
        zh: 'Delta 的含义',
        gen: choice(
          '一份看涨期权的 Delta 是 0.6。标的价格上涨 1 元，期权价格大约会怎样变化？',
          '大约上涨 0.6 元',
          ['大约上涨 1 元', '大约下跌 0.6 元', '不变'],
          'Delta 就是价格对标的变动的近似敏感度：标的动 1 元，期权动约 0.6 元。',
        ),
      },
    ],
  },
];

export const lessonById = id => lessons.find(l => l.id === id);

/* Every drill in the course, with its lesson, in teaching order. */
export const allDrills = () =>
  lessons.flatMap(l => l.drills.map(d => ({ ...d, lessonId: l.id })));
