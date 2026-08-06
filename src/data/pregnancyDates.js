/**
 * Pregnancy calendar helpers.
 *
 * Dating matches common clinical gestational age:
 * - LMP (last menstrual period) = due date − 280 days
 * - “I’m X weeks pregnant” ≈ floor(daysSinceLMP / 7) (week 0 in the first
 *   few days is shown as week 1 for our plan UI)
 */

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

function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** LMP date from due date (due = LMP + 280 days). */
export function lmpFromDueDate(dueISO) {
  const due = parseISODate(dueISO);
  if (!due) return null;
  return toISODate(new Date(due.getTime() - PREGNANCY_DAYS * MS_PER_DAY));
}

/** @deprecated alias — LMP start for gestation math */
export function startDateFromDueDate(dueISO) {
  return lmpFromDueDate(dueISO);
}

/** Due date if LMP was `startISO`. */
export function dueDateFromStartDate(startISO) {
  const start = parseISODate(startISO);
  if (!start) return null;
  return toISODate(new Date(start.getTime() + PREGNANCY_DAYS * MS_PER_DAY));
}

/** Whole days since LMP (0 on the LMP date). */
export function daysSinceLmp(dueISO, onDate = new Date()) {
  const lmpISO = lmpFromDueDate(dueISO);
  const lmp = parseISODate(lmpISO);
  if (!lmp) return 0;
  const on = startOfLocalDay(onDate);
  return Math.floor((on - lmp) / MS_PER_DAY);
}

/**
 * Infer a due date from “I’m currently at week W” (1–40).
 * Uses the start of that gestational week (W weeks 0 days).
 */
export function dueDateFromCurrentWeek(week, today = new Date()) {
  const w = Math.min(40, Math.max(1, Math.round(Number(week) || 1)));
  const daysSince = w * 7; // e.g. week 6 → 42 days since LMP (6w0d)
  const base = startOfLocalDay(today);
  return toISODate(new Date(base.getTime() + (PREGNANCY_DAYS - daysSince) * MS_PER_DAY));
}

/**
 * Plan/catalog day 1–280 for a calendar date.
 * Aligns with gestational days so week 6 content matches “6 weeks pregnant.”
 */
export function pregnancyDayFromDueDate(dueISO, onDate = new Date()) {
  const since = daysSinceLmp(dueISO, onDate);
  // Map 0 (LMP day) → plan day 1; 42 (6w0d) → plan day 42 (end of catalog week 6).
  return Math.min(PREGNANCY_DAYS, Math.max(1, since || 1));
}

/**
 * Gestational week people mean by “I’m X weeks pregnant.”
 * At 42–48 days since LMP → 6; at 49 → 7.
 */
export function pregnancyWeekFromDueDate(dueISO, onDate = new Date()) {
  const since = daysSinceLmp(dueISO, onDate);
  const w = Math.floor(since / 7);
  return Math.min(40, Math.max(1, w || 1));
}

/** Days from today through due date (inclusive), clamped to 1–280. */
export function daysLeftInPregnancy(dueISO, onDate = new Date()) {
  const due = parseISODate(dueISO);
  if (!due) return PREGNANCY_DAYS;
  const on = startOfLocalDay(onDate);
  const left = Math.floor((due - on) / MS_PER_DAY) + 1;
  return Math.min(PREGNANCY_DAYS, Math.max(1, left));
}

export function formatPrettyDate(iso) {
  const d = parseISODate(iso);
  if (!d) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** True if this start date is an old LMP-style backdate for the due date. */
export function isBackdatedPregnancyStart(startISO, dueISO) {
  const aligned = lmpFromDueDate(dueISO);
  return Boolean(aligned && startISO && aligned === startISO);
}
