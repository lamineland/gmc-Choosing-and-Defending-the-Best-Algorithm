/**
 * Step 1 + 2 (correctness): run both implementations on the sample input and
 * confirm they return the same, correct result.
 *
 * Expected optimum for the sample: 4 tasks —
 *   {1,3}, {4,6}, {6,7}, {8,10}   (6 touches 4's end -> allowed)
 */
import { bruteForceMaxTasks } from '../src/bruteForce.js';
import { greedyMaxTasks } from '../src/greedy.js';
import { sampleTasks, isFeasible, selectionKeys } from '../src/tasks.js';

const EXPECTED_COUNT = 4;

console.log('=== Correctness validation on the sample input ===\n');
console.log('Input tasks:');
for (const t of sampleTasks) console.log(`  [${t.start}, ${t.end})`);

const brute = bruteForceMaxTasks(sampleTasks);
const greedy = greedyMaxTasks(sampleTasks);

console.log('\nBrute-force result:');
for (const t of brute) console.log(`  [${t.start}, ${t.end})`);
console.log(`  -> ${brute.length} task(s), feasible: ${isFeasible(brute)}`);

console.log('\nGreedy result:');
for (const t of greedy) console.log(`  [${t.start}, ${t.end})`);
console.log(`  -> ${greedy.length} task(s), feasible: ${isFeasible(greedy)}`);

const sameSize = brute.length === greedy.length;
const sameSet = JSON.stringify(selectionKeys(brute)) === JSON.stringify(selectionKeys(greedy));

console.log(`\nBoth return ${brute.length} and ${greedy.length}? ${sameSize}`);
console.log(`Both select the identical task set? ${sameSet}`);

const ok = sameSize && isFeasible(brute) && isFeasible(greedy) && brute.length === EXPECTED_COUNT;

if (ok) {
  console.log(`\n✅ PASS: both algorithms agree and return the optimal result (${EXPECTED_COUNT} tasks).`);
} else {
  console.log(`\n❌ FAIL: expected ${EXPECTED_COUNT} tasks and identical feasible selections.`);
  process.exit(1);
}
