/**
 * Shared input data, generators and interval helpers.
 *
 * Interval semantics (important, documented once here):
 * Tasks are HALF-OPEN intervals [start, end). Two tasks do NOT overlap when
 * one ends exactly when the other starts (a.end <= b.start). This matches the
 * real delivery scenario: a driver can finish a delivery and immediately
 * start the next one.
 */

/** Sample input from the exercise. */
export const sampleTasks = [
  { start: 1, end: 3 },
  { start: 2, end: 5 },
  { start: 4, end: 6 },
  { start: 6, end: 7 },
  { start: 5, end: 9 },
  { start: 8, end: 10 }
];

/** True when the two half-open intervals [a.start, a.end) and [b.start, b.end) overlap. */
export function overlaps(a, b) {
  return a.start < b.end && b.start < a.end;
}

/** True when `selected` is a set of pairwise non-overlapping tasks. */
export function isFeasible(selected) {
  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      if (overlaps(selected[i], selected[j])) return false;
    }
  }
  return true;
}

/** Canonical string key for a task, used to compare result sets independent of order. */
export function taskKey(t) {
  return `${t.start}-${t.end}`;
}

/** Normalized (sorted) key list of a selection, for exact set comparison. */
export function selectionKeys(selected) {
  return selected.map(taskKey).sort();
}

/**
 * Deterministic PRNG (mulberry32) so benchmarks are reproducible.
 */
export function createRng(seed = 42) {
  let state = seed >>> 0;
  return function rng() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate `n` random tasks.
 * Starts are uniform in [0, timeHorizon), durations are uniform in [1, maxDuration].
 */
export function generateRandomTasks(n, { timeHorizon = 100000, maxDuration = 50, seed = 42 } = {}) {
  const rng = createRng(seed);
  const tasks = new Array(n);
  for (let i = 0; i < n; i++) {
    const start = Math.floor(rng() * timeHorizon);
    const end = start + 1 + Math.floor(rng() * maxDuration);
    tasks[i] = { start, end };
  }
  return tasks;
}

/** All tasks overlap each other (every task is the same interval). */
export function allOverlapping(n) {
  return Array.from({ length: n }, () => ({ start: 0, end: 10 }));
}

/** No two tasks overlap (a chain of disjoint intervals). */
export function allNonOverlapping(n) {
  return Array.from({ length: n }, (_, i) => ({ start: i * 2, end: i * 2 + 1 }));
}

/** All tasks share the same start time. */
export function sameStart(n) {
  return Array.from({ length: n }, (_, i) => ({ start: 5, end: 10 + i }));
}

/** All tasks share the same end time. */
export function sameEnd(n) {
  return Array.from({ length: n }, (_, i) => ({ start: i, end: 100 }));
}

/** Chain of back-to-back tasks where each starts exactly when the previous one ends. */
export function touchingChain(n) {
  return Array.from({ length: n }, (_, i) => ({ start: i, end: i + 1 }));
}
