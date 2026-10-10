/**
 * GREEDY solution: always pick the task that finishes earliest among the
 * remaining compatible tasks (classic "activity selection" / interval scheduling).
 *
 * Proof sketch of optimality: an exchange argument. Take an optimal solution O
 * and the greedy solution G; replace the first task of O with the earliest-
 * finishing task g1 of G — the replacement is never worse because g1 frees the
 * driver at least as early as any other choice, so the rest of O stays valid.
 * Repeating this argument task by task shows |G| = |O|.
 *
 * Time complexity : O(n log n) — dominated by the sort by end time.
 * Space complexity: O(n) for the sorted copy (O(1) extra if sorting in place).
 *
 * `tasks` is NOT mutated: a copy is sorted.
 */
export function greedyMaxTasks(tasks) {
  const sorted = tasks
    .map((t, i) => ({ t, i }))
    .sort((a, b) => a.t.end - b.t.end || a.t.start - b.t.start || a.i - b.i)
    .map((x) => x.t);

  const selected = [];
  let lastEnd = -Infinity;

  for (const task of sorted) {
    // Half-open intervals: start === lastEnd is allowed (back-to-back deliveries).
    if (task.start >= lastEnd) {
      selected.push(task);
      lastEnd = task.end;
    }
  }

  return selected;
}
