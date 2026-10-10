/**
 * Step 5 (bonus): stress test both approaches with edge cases.
 *
 * Cases:
 *  - all tasks overlapping
 *  - all tasks non-overlapping (brute force's worst case)
 *  - all tasks sharing the same start time
 *  - all tasks sharing the same end time
 *  - back-to-back tasks (start == previous end)
 *  - empty input / single task
 *  - random fuzzing: brute force vs greedy cross-check on small inputs
 *  - scale behaviour: greedy at 10k tasks, brute force at 10k tasks (expected to fail)
 */
import { bruteForceMaxTasks } from '../src/bruteForce.js';
import { greedyMaxTasks } from '../src/greedy.js';
import {
  generateRandomTasks,
  allOverlapping,
  allNonOverlapping,
  sameStart,
  sameEnd,
  touchingChain,
  isFeasible
} from '../src/tasks.js';

const { performance } = await import('node:perf_hooks');

let failures = 0;

function check(name, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? '✅' : '❌'} ${name}: got ${actual}, expected ${expected}`);
}

function section(title) {
  console.log(`\n${title}`);
  console.log('-'.repeat(title.length));
}

// ---------------------------------------------------------------
section('Edge-case correctness (small inputs, both algorithms)');
// ---------------------------------------------------------------
const cases = [
  { name: 'all overlapping (n=20)', tasks: allOverlapping(20), expected: 1 },
  { name: 'all non-overlapping (n=16)', tasks: allNonOverlapping(16), expected: 16 },
  { name: 'same start time (n=15)', tasks: sameStart(15), expected: 1 },
  { name: 'same end time (n=15)', tasks: sameEnd(15), expected: 1 },
  { name: 'back-to-back touching chain (n=16, brute force worst case)', tasks: touchingChain(16), expected: 16 },
  { name: 'empty input', tasks: [], expected: 0 },
  { name: 'single task', tasks: [{ start: 3, end: 4 }], expected: 1 }
];

for (const c of cases) {
  const b = bruteForceMaxTasks(c.tasks);
  const g = greedyMaxTasks(c.tasks);
  console.log(`\n${c.name}:`);
  check(`brute-force count`, b.length, c.expected);
  check(`greedy count`, g.length, c.expected);
  check(`brute-force selection feasible`, isFeasible(b) ? 1 : 0, 1);
  check(`greedy selection feasible`, isFeasible(g) ? 1 : 0, 1);
}

// ---------------------------------------------------------------
section('Fuzz cross-check: 200 random inputs, n <= 18');
// ---------------------------------------------------------------
let fuzzMismatches = 0;
for (let i = 0; i < 200; i++) {
  const n = 1 + (i % 18);
  const tasks = generateRandomTasks(n, { timeHorizon: 40, maxDuration: 12, seed: 1000 + i });
  const b = bruteForceMaxTasks(tasks);
  const g = greedyMaxTasks(tasks);
  if (b.length !== g.length || !isFeasible(g)) fuzzMismatches++;
}
check('mismatches between brute force and greedy', fuzzMismatches, 0);

// ---------------------------------------------------------------
section('Scale behaviour');
// ---------------------------------------------------------------
const N = 10000;

// Greedy: 10,000 random tasks and 10,000 worst-case (all disjoint) tasks.
for (const [label, tasks] of [
  ['greedy on 10,000 random tasks', generateRandomTasks(N, { seed: 3 })],
  ['greedy on 10,000 all-disjoint tasks', allNonOverlapping(N)]
]) {
  const t0 = performance.now();
  const res = greedyMaxTasks(tasks);
  const ms = performance.now() - t0;
  console.log(`  ✅ ${label}: ${res.length} selected in ${ms.toFixed(2)} ms (feasible: ${isFeasible(res)})`);
}

// Brute force: expect a stack overflow, or an abort via the demo safety valve.
// The budget (5M explored nodes) only guarantees the harness terminates; the
// true cost at n = 10,000 is 2^10000 — see scripts/benchmark.js.
function runBruteSafe(label, tasks, budget = 5_000_000) {
  try {
    const t0 = performance.now();
    const res = bruteForceMaxTasks(tasks, { maxExploreCalls: budget });
    console.log(`  ⚠️ ${label}: finished in ${(performance.now() - t0).toFixed(2)} ms (${res.length} selected)`);
  } catch (err) {
    if (err.code === 'BRUTE_FORCE_BUDGET_EXCEEDED') {
      console.log(`  ❌ ${label}: ABORTED — ${err.message}`);
    } else {
      console.log(`  ❌ ${label}: CRASHED — ${err.constructor.name}: ${err.message}`);
      console.log('     (10,000-deep recursion blows the JS call stack)');
    }
  }
}

runBruteSafe('brute force on 10,000 all-overlapping tasks', allOverlapping(N));
runBruteSafe('brute force on 10,000 random tasks', generateRandomTasks(N, { seed: 5 }));

console.log(`\n${failures === 0 ? '=== Stress test PASSED ===' : `=== Stress test FAILED (${failures} failures) ===`}`);
if (failures > 0) process.exit(1);
