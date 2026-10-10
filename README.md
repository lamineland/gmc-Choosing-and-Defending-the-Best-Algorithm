# Best Algorithm — Maximum Non-Overlapping Delivery Tasks

Brute-force vs. greedy comparison for the interval-scheduling problem: *"select the
maximum number of non-overlapping tasks a single delivery driver can perform."*

**Interval semantics:** tasks are half-open `[start, end)`. A task that starts exactly
when another ends is **not** an overlap (the driver can drop off and immediately start
the next delivery). Both algorithms share this convention via `src/tasks.js`.

## Project layout

```
src/
  tasks.js        Sample input, seeded random generators, interval helpers
  bruteForce.js   Brute force  — explores ALL combinations (take / skip every task)
  greedy.js       Greedy       — always picks the task ending earliest
scripts/
  validate.js     Runs both on the sample; asserts identical, optimal results
  benchmark.js    Times greedy on 10,000 tasks; measures brute-force growth & extrapolates
  stressTest.js   Edge cases + 200-case fuzz cross-check + scale behaviour
```

## How to run

```bash
node scripts/validate.js     # correctness on the sample
node scripts/benchmark.js    # performance on ~10,000 tasks
node scripts/stressTest.js   # bonus: edge cases & failure modes
# or: npm run all
```

## 1. The two algorithms

| | Brute force (`src/bruteForce.js`) | Greedy (`src/greedy.js`) |
|---|---|---|
| Strategy | Recursively branch on *take* or *skip* every task; keep the largest valid combination found | Sort by end time ascending; take every task that starts at/after the last selected end |
| Time | **O(2ⁿ · n)** — every subset of tasks is explored | **O(n log n)** — dominated by the sort |
| Space | O(n) recursion stack + current selection | O(n) for the sorted copy (O(1) extra if sorting in place) |
| Optimality | Exact (by exhaustive search) | Exact (proven by an exchange argument, see `src/greedy.js`) |

## 2. Validation & measured results

Sample input — both algorithms return the **same optimal selection of 4 tasks**:
`[1,3) [4,6) [6,7) [8,10)` (`scripts/validate.js` confirms feasibility and set equality).
200 randomized fuzz cases (n ≤ 18) show **zero** mismatches between the two.

Benchmark (Node v26, Apple Silicon, `scripts/benchmark.js`):

| Input | Brute force | Greedy |
|---|---|---|
| 10,000 random tasks | **not runnable** (2¹⁰⁰⁰⁰ combinations) | **~2.5 ms median** (~4,000,000 tasks/sec) |
| n = 16, worst case | 1.7 ms | — |
| n = 18, worst case | 7.2 ms | — |
| n = 20, worst case | 29.2 ms | — |
| n = 22, worst case | 121.0 ms | — |
| n = 10,000 (extrapolated) | **~10³⁰⁰³ seconds** | **~2.5 ms (measured)** |

The worst case for brute force is precisely the *all non-overlapping* input: every
subset is valid, so the full 2ⁿ tree is explored — measured time **quadruples for
every +2 tasks** (1.7 → 7.2 → 29 → 121 ms). At n = 10,000 that extrapolates to
10³⁰⁰³ seconds vs. the age of the universe at ~4.3 × 10¹⁷ seconds.

## 3. Comparison (short version)

**Which is faster for large inputs and why?** The greedy algorithm, by an astronomical
margin. Brute force enumerates every one of the 2ⁿ subsets of tasks and validates each
one, so its cost doubles with each additional task: it is unusable past ~25 tasks.
Greedy sorts once and scans once (O(n log n)); it processed 10,000 tasks in ~2.5 ms
(~4M tasks/sec) — comfortably above the "thousands of tasks per second" requirement.

**Which is easier to maintain and scale?** Greedy. It is ~15 lines of straightforward
code with a well-known optimality proof, no recursion, no combinatorial state, and its
runtime is predictable regardless of input shape. Brute force's runtime depends on the
data, is untestable at production sizes, and even crashes (stack overflow) at 10,000
tasks before it has a chance to run forever.

**Memory trade-offs?** Both use O(n) working memory, but for different reasons. Greedy
needs a sorted copy of the input plus the result (O(n); the sort itself uses
O(log n)–O(n) depending on the engine). Brute force needs only the recursion stack and
the current candidate set — O(n) — which looks leaner on paper, but that comparison is
meaningless: brute force trades memory for *time* that simply does not exist (10³⁰⁰³
seconds), and its n-deep recursion overflows the JS call stack at production input
sizes. Memory is the one resource brute force "saves", and it saves it in the wrong
currency.

## 4. Recommendation

**Use the greedy earliest-finish algorithm (`src/greedy.js`) in the final system.**

- **Performance:** O(n log n) and measured at ~4M tasks/sec on this machine — it meets
  the real-time requirement with huge headroom, where brute force is physically
  impossible (10³⁰⁰³ s at n = 10,000) and crashes the call stack first anyway.
- **Clarity:** the implementation is short, iterative, and its correctness rests on the
  classic exchange argument taught in every algorithms course — easy to review, easy to
  hand to the next developer. Brute force is "obviously correct" too, but only as a
  specification, not as production code.
- **Real-world applicability:** greedy's runtime is data-independent and predictable,
  which is essential for a scheduler with a latency budget; it also degrades gracefully
  (more tasks → more sorting, never a combinatorial explosion).

**When brute force is still relevant:** as a **reference oracle**. It is trivially
correct by construction, which makes it perfect for (a) verifying the greedy
implementation in tests (as `scripts/stressTest.js` does with a 200-case fuzz
cross-check), (b) prototyping or checking tiny instances (n ≤ ~20) while developing,
and (c) teaching/interviewing. If the problem ever gains constraints that break the
greedy exchange argument — e.g. task weights/priorities (→ weighted interval scheduling,
solved with DP in O(n log n)), limits on total working hours, or multiple drivers with
shared capacity (→ DP / flow formulations) — brute force remains useful as the
ground-truth oracle for the new solution's tests, while the production path must be DP
or a solver, never brute force.

## 5. Bonus — stress test findings (`scripts/stressTest.js`)

| Edge case | Brute force | Greedy |
|---|---|---|
| All tasks overlapping | ✅ returns 1 (fast — branching pruned) | ✅ returns 1 |
| All tasks non-overlapping | ✅ returns n (n ≤ 16 tested; this is its 2ⁿ worst case) | ✅ returns n, incl. n = 10,000 in ~1.4 ms |
| All same start time | ✅ returns 1 | ✅ returns 1 |
| All same end time | ✅ returns 1 | ✅ returns 1 |
| Back-to-back touching chain | ✅ returns n | ✅ returns n |
| Empty input / single task | ✅ 0 / 1 | ✅ 0 / 1 |
| 10,000 tasks | ❌ **crashes** (`RangeError: Maximum call stack size exceeded`) — and would need 2¹⁰⁰⁰⁰ time if it didn't | ✅ 2–3 ms |

**Verdict:** both algorithms are correct and agree on every tested input; only greedy
survives contact with production-sized data. Brute force fails to scale gracefully in
*two* independent ways — exponential time and a recursion-depth crash.

