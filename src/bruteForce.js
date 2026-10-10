import { overlaps } from './tasks.js';

/**
 * BRUTE-FORCE solution: explore ALL combinations of tasks.
 *
 * For every task we branch on two choices: "take it" (only if it is compatible
 * with everything already chosen) or "skip it". At the leaves we keep the
 * largest valid selection found.
 *
 * Time complexity : O(2^n * n) in the worst case (every subset is explored and
 *                   each "take" is checked against the current selection).
 * Space complexity: O(n) for the recursion stack plus the current selection.
 *
 * NOTE: this is intentionally the naive "try everything" version — no sorting,
 * no memoization, no pruning beyond the overlap check. That is the point of the
 * comparison.
 *
 * Optional `maxExploreCalls` is a DEMO SAFETY VALVE only (default: Infinity).
 * It aborts with a BRUTE_FORCE_BUDGET_EXCEEDED error once the exploration tree
 * grows past the budget, so test harnesses can demonstrate the exponential
 * blow-up without hanging forever. It never changes the algorithm's behaviour
 * below the budget.
 */
export function bruteForceMaxTasks(tasks, { maxExploreCalls = Infinity } = {}) {
  const n = tasks.length;
  let best = [];
  const chosen = [];
  let calls = 0;

  function explore(i) {
    if (++calls > maxExploreCalls) {
      const err = new Error(
        `brute-force aborted after ${maxExploreCalls.toLocaleString()} explored nodes (exponential blow-up)`
      );
      err.code = 'BRUTE_FORCE_BUDGET_EXCEEDED';
      throw err;
    }
    if (i === n) {
      if (chosen.length > best.length) best = chosen.slice();
      return;
    }

    // Option 1: skip task i
    explore(i + 1);

    // Option 2: take task i if it does not overlap anything already chosen
    const candidate = tasks[i];
    let compatible = true;
    for (let k = 0; k < chosen.length; k++) {
      if (overlaps(candidate, chosen[k])) {
        compatible = false;
        break;
      }
    }
    if (compatible) {
      chosen.push(candidate);
      explore(i + 1);
      chosen.pop();
    }
  }

  explore(0);
  return best;
}
