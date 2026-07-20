/** A plan-day counts as done only when every reading in it is checked off. */
export function dayComplete(dayData, isDone) {
  return dayData.readings.length > 0 && dayData.readings.every((r) => isDone(r.id));
}

/**
 * Reading streak + backlog, all derived from progress.
 *
 * - current: consecutive completed days ending at today (or yesterday, so the
 *   streak stays "alive" until the day is over).
 * - best: longest run of completed days anywhere in the plan.
 * - behind: missed days strictly before today (today isn't overdue yet).
 * - firstIncomplete: oldest missed day, for the catch-up jump.
 */
export function computeStreak(plan, isDone, currentDay) {
  const complete = (d) => d >= 1 && d <= plan.length && dayComplete(plan[d - 1], isDone);

  let start = complete(currentDay) ? currentDay : currentDay - 1;
  let current = 0;
  for (let d = start; d >= 1 && complete(d); d--) current++;

  let best = 0;
  let run = 0;
  for (let d = 1; d <= plan.length; d++) {
    run = complete(d) ? run + 1 : 0;
    if (run > best) best = run;
  }

  let behind = 0;
  let firstIncomplete = null;
  for (let d = 1; d < currentDay; d++) {
    if (!complete(d)) {
      behind++;
      if (firstIncomplete === null) firstIncomplete = d;
    }
  }

  return { current, best, behind, firstIncomplete };
}
