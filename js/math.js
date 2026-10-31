/*
 * The formulas of the course, in plain JavaScript. Every lesson's answer key is computed
 * here, so the page and the tests agree by construction.
 *
 * Conventions: r is the continuously compounded risk-free rate per year, T is in years,
 * S is the spot price of the asset, K the strike price, sigma the annual volatility.
 */

/* erfc with fractional error below 1.2e-7 (Numerical Recipes, erfcc). */
function erfc(x) {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r =
    t *
    Math.exp(
      -z * z - 1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520398 +
                                t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))),
    );
  return x >= 0 ? r : 2 - r;
}

/* Standard normal cumulative distribution N(x). */
export const N = x => 0.5 * erfc(-x / Math.SQRT2);

/* Future value of P under continuous compounding: P e^{rT}. */
export const futureValue = (P, r, T) => P * Math.exp(r * T);

/* Present value of a cash amount A received at time T: A e^{-rT}. */
export const presentValue = (A, r, T) => A * Math.exp(-r * T);

/* Forward price of a non-dividend-paying asset: F0 = S0 e^{rT}. */
export const forwardPrice = (S, r, T) => S * Math.exp(r * T);

/* Convert an annual rate compounded m times per year to continuously compounded. */
export const toContinuous = (Rm, m = 1) => m * Math.log(1 + Rm / m);

/* Convert a continuously compounded rate to an annual rate compounded m times per year. */
export const fromContinuous = (rc, m = 1) => m * (Math.exp(rc / m) - 1);

/* Put-call parity for European options on a non-dividend-paying stock: c + K e^{-rT} = p + S. */
export const putFromParity = (c, S, K, r, T) => c + presentValue(K, r, T) - S;
export const callFromParity = (p, S, K, r, T) => p + S - presentValue(K, r, T);

/* Black-Scholes-Merton prices and d1, d2 for a European option on a non-dividend stock. */
export function blackScholes(S, K, r, T, sigma) {
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const call = S * N(d1) - K * Math.exp(-r * T) * N(d2);
  const put = K * Math.exp(-r * T) * N(-d2) - S * N(-d1);
  return { d1, d2, call, put };
}

/* Delta of a European call and put on a non-dividend stock. */
export function bsDelta(S, K, r, T, sigma) {
  const { d1 } = blackScholes(S, K, r, T, sigma);
  return { call: N(d1), put: N(d1) - 1 };
}

/* One-step binomial tree: up factor u, down factor d, risk-neutral probability p. */
export function binomialUpDown(sigma, dt) {
  const u = Math.exp(sigma * Math.sqrt(dt));
  return { u, d: 1 / u };
}

export function riskNeutralP(r, dt, u, d) {
  return (Math.exp(r * dt) - d) / (u - d);
}

/* Value of a derivative after one period in a binomial tree. */
export function oneStepValue(fu, fd, r, dt, p) {
  return Math.exp(-r * dt) * (p * fu + (1 - p) * fd);
}

/* Minimum-variance hedge ratio h = rho * sigma_S / sigma_F. */
export const hedgeRatio = (rho, sigmaS, sigmaF) => (rho * sigmaS) / sigmaF;

/* Number of futures contracts N* = h * Q_A / Q_F. */
export const contractsToHedge = (h, QA, QF) => (h * QA) / QF;

/* Payoffs at expiry for a long position. */
export const callPayoff = (ST, K) => Math.max(ST - K, 0);
export const putPayoff = (ST, K) => Math.max(K - ST, 0);
export const longFuturesPayoff = (ST, F0) => ST - F0;

/* Round for display and comparison. */
export const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
