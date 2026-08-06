/** Pregnancy calendar helpers — due date is for context; reading start is today. */

const PREGNANCY_DAYS = 280;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toISODate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(onDate = new Date()) {
  return toISODate(new Date(onDate.getFullYear(), onDate.getMonth(), onDate.getDate()));
}

export function parseISODate(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Legacy LMP-style backdate (day 280 = due date). Kept only to detect /
 * migrate old setups that made people look “behind.”
 */
export function startDateFromDueDate(dueISO) {
  const due = parseISODate(dueISO);
  if (!due) return null;
  return toISODate(new Date(due.getTime() - (PREGNANCY_DAYS - 1) * MS_PER_DAY));
}

/** Due date if day 1 of the plan started on `startISO`. */
export function dueDateFromStartDate(startISO) {
  const start = parseISODate(startISO);
  if (!start) return null;
  return toISODate(new Date(start.getTime() + (PREGNANCY_DAYS - 1) * MS_PER_DAY));
}

/**
 * Infer a due date from “I’m currently at week W” (1–40).
 * Places “today” at the first day of that pregnancy week.
 */
export function dueDateFromCurrentWeek(week, today = new Date()) {
  const w = Math.min(40, Math.max(1, Math.round(Number(week) || 1)));
  const dayOfPlan = (w - 1) * 7 + 1;
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return toISODate(new Date(base.getTime() + (PREGNANCY_DAYS - dayOfPlan) * MS_PER_DAY));
}

/** Pregnancy day number (1–280) for a calendar date given a due date. */
export function pregnancyDayFromDueDate(dueISO, onDate = new Date()) {
  const startISO = startDateFromDueDate(dueISO);
  const start = parseISODate(startISO);
  if (!start) return 1;
  const on = new Date(onDate.getFullYear(), onDate.getMonth(), onDate.getDate());
  const day = Math.floor((on - start) / MS_PER_DAY) + 1;
  return Math.min(PREGNANCY_DAYS, Math.max(1, day));
}

export function pregnancyWeekFromDueDate(dueISO, onDate = new Date()) {
  return Math.ceil(pregnancyDayFromDueDate(dueISO, onDate) / 7);
}

export function formatPrettyDate(iso) {
  const d = parseISODate(iso);
  if (!d) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** True if this start date is the old backdated LMP start for the due date. */
export function isBackdatedPregnancyStart(startISO, dueISO) {
  const aligned = startDateFromDueDate(dueISO);
  return Boolean(aligned && startISO && aligned === startISO);
}
