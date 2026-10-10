/**
 * Step 2 (timing): time both implementations on large inputs.
 *
 * Greedy  : timed directly on 10,000 random tasks (fast, runs in milliseconds).
 * Brute   : CANNOT finish on 10,000 tasks (2^10000 combinations). We therefore
 *           time it on growing small inputs to measure its actual exponential
 *           growth rate, then extrapolate the cost for n = 10,000 honestly
 *           instead of hanging the process until the heat death of the universe.
 */
import { bruteForceMaxTasks } from '../src/bruteForce.js';
import { greedyMaxTasks } from '../src/greedy.js';
import {
  generateRandomTasks,
  allNonOverlapping,
  isFeasible
} from '../src/tasks.js';

const { performance } = await import('node:perf_hooks');

function timeMs(fn) {
  const t0 = performance.now();
  const result = fn();
  const t1 = performance.now();
  return { ms: t1 - t0, result };
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

console.log('=== Performance benchmark ===\n');

// ---------------------------------------------------------------
// 1. Greedy on 10,000 random tasks
// ---------------------------------------------------------------
const N_LARGE = 10000;
const large = generateRandomTasks(N_LARGE, { seed: 7 });

const greedyRuns = [];
let greedyResult = null;
for (let r = 0; r < 5; r++) {
  const { ms, result } = timeMs(() => greedyMaxTasks(large));
  greedyRuns.push(ms);
  greedyResult = result;
}
console.log(`Greedy  | n = ${N_LARGE.toLocaleString()} random tasks`);
console.log(`        | runs (ms): ${greedyRuns.map((m) => m.toFixed(3)).join(', ')}`);
console.log(`        | median: ${median(greedyRuns).toFixed(3)} ms  -> selected ${greedyResult.length} tasks (feasible: ${isFeasible(greedyResult)})`);
console.log(`        | throughput: ~${Math.round(N_LARGE / (median(greedyRuns) / 1000)).toLocaleString()} tasks/second\n`);

// Sanity: brute force would be astronomically slow at this size, so we do NOT run it.
console.log(`Brute   | n = ${N_LARGE.toLocaleString()}: SKIPPED — 2^${N_LARGE} combinations is not runnable by any computer.\n`);

// ---------------------------------------------------------------
// 2. Brute-force scaling on small n (random tasks + worst case)
// ---------------------------------------------------------------
console.log('Brute-force scaling (median of 3 runs per size):\n');
console.log('  n     random tasks (ms)   all-disjoint worst case (ms)');
console.log('  ---   -----------------   ----------------------------');

const timings = [];
for (const n of [8, 10, 12, 14, 16, 18, 20, 22]) {
  const randTasks = generateRandomTasks(n, { timeHorizon: 200, maxDuration: 20, seed: 11 });
  const disjoint = allNonOverlapping(n); // worst case: every subset is valid -> full 2^n tree

  const randRuns = [];
  for (let r = 0; r < 3; r++) randRuns.push(timeMs(() => bruteForceMaxTasks(randTasks)).ms);
  const disRuns = [];
  for (let r = 0; r < 3; r++) disRuns.push(timeMs(() => bruteForceMaxTasks(disjoint)).ms);

  const randMed = median(randRuns);
  const disMed = median(disRuns);
  timings.push({ n, randMed, disMed });
  console.log(
    `  ${String(n).padStart(3)}   ${randMed.toFixed(3).padStart(17)}   ${disMed.toFixed(3).padStart(28)}`
  );
}

// ---------------------------------------------------------------
// 3. Extrapolation to n = 10,000 (log10 space to avoid overflow)
// ---------------------------------------------------------------
const last = timings[timings.length - 1];
const log10Estimate = Math.log10(last.disMed / 1000) + (N_LARGE - last.n) * Math.log10(2);

console.log(`\nExtrapolation (from n = ${last.n}, worst case, doubling per extra task):`);
console.log(`  Estimated brute-force time for n = ${N_LARGE.toLocaleString()}: 10^${log10Estimate.toFixed(0)} seconds`);
console.log('  For reference, the age of the universe is ~4.3 x 10^17 seconds.');
console.log('  Greedy for the same input, measured above: a few milliseconds.');

console.log('\n=== Benchmark complete ===');
