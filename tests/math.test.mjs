import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  N, blackScholes, bsDelta, forwardPrice, futureValue, presentValue,
  toContinuous, fromContinuous, putFromParity, riskNeutralP, oneStepValue,
  hedgeRatio, contractsToHedge, callPayoff, putPayoff,
} from '../js/math.js';

const close = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

test('standard normal CDF matches tabled values', () => {
  close(N(0), 0.5, 1e-6);
  close(N(1.96), 0.97500, 1e-4);
  close(N(-1), 0.15866, 1e-4);
  close(N(2.5), 0.99379, 1e-4);
});

test('Black-Scholes reproduces the textbook example S=42, K=40, r=10%, T=0.5, sigma=20%', () => {
  const { call, put } = blackScholes(42, 40, 0.10, 0.5, 0.20);
  close(call, 4.76, 0.01);
  close(put, 0.81, 0.01);
});

test('Black-Scholes satisfies put-call parity for many random inputs', () => {
  let seed = 7;
  const rnd = (lo, hi) => { seed = (seed * 16807) % 2147483647; return lo + ((seed % 10000) / 10000) * (hi - lo); };
  for (let k = 0; k < 200; k += 1) {
    const S = rnd(20, 120), K = rnd(20, 120), r = rnd(0, 0.12), T = rnd(0.1, 3), s = rnd(0.05, 0.6);
    const { call, put } = blackScholes(S, K, r, T, s);
    close(call - put, S - K * Math.exp(-r * T), 1e-7);
    assert.ok(call >= 0 && put >= 0);
    assert.ok(call >= Math.max(S - K * Math.exp(-r * T), 0) - 1e-9);
  }
});

test('Delta: call in (0,1), put = call - 1', () => {
  const { call, put } = bsDelta(50, 50, 0.05, 1, 0.3);
  assert.ok(call > 0 && call < 1);
  close(put, call - 1, 1e-12);
});

test('forward, compounding and discounting', () => {
  close(forwardPrice(50, 0.05, 0.5), 51.2658, 1e-3);
  close(futureValue(1000, 0.06, 2), 1127.4969, 1e-3);
  close(presentValue(1000, 0.06, 2), 886.92, 0.01);
  close(toContinuous(0.05), Math.log(1.05), 1e-12);
  close(fromContinuous(toContinuous(0.07)), 0.07, 1e-12);
});

test('put-call parity helper agrees with Black-Scholes', () => {
  const { call, put } = blackScholes(100, 100, 0.05, 1, 0.2);
  close(putFromParity(call, 100, 100, 0.05, 1), put, 1e-7);
});

test('binomial one step: probability in (0,1) and value between payoffs', () => {
  const p = riskNeutralP(0.05, 1, 1.2, 0.8);
  close(p, (Math.exp(0.05) - 0.8) / 0.4, 1e-12);
  const v = oneStepValue(20, 0, 0.05, 1, p);
  close(v, Math.exp(-0.05) * p * 20, 1e-12);
});

test('hedge ratio and contract count', () => {
  close(hedgeRatio(0.9, 0.04, 0.05), 0.72, 1e-12);
  close(contractsToHedge(0.72, 100000, 1000), 72, 1e-9);
});

test('payoffs never go negative', () => {
  for (let ST = 0; ST <= 100; ST += 5) {
    assert.ok(callPayoff(ST, 50) >= 0);
    assert.ok(putPayoff(ST, 50) >= 0);
  }
});
