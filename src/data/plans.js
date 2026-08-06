import { buildPlan, groupIntoWeeks as groupYearWeeks, DAYS, WEEKS, DAYS_PER_WEEK, TOTAL_CHAPTERS } from './generatePlan';
import {
  buildPregnancyPlan,
  pregnancyTotalChapters,
  PREGNANCY_DAYS,
  PREGNANCY_WEEKS,
} from './pregnancyPlan';
import { pregnancyWeekFromDueDate } from './pregnancyDates';

export { DAYS_PER_WEEK };

/** All selectable reading plans. */
export const PLANS = [
  {
    id: 'bible-year',
    title: 'Bible in a Year',
    blurb: 'The whole Bible in 52 weeks across four daily tracks.',
    days: DAYS,
    weeks: WEEKS,
    build: buildPlan,
    totalChapters: TOTAL_CHAPTERS,
    groupSections: 'tracks', // Progress “By section” uses Law/Wisdom/Prophets/NT
  },
  {
    id: 'pregnancy',
    title: 'Pregnancy',
    blurb: 'Scripture for the days left until your due date.',
    days: PREGNANCY_DAYS,
    weeks: PREGNANCY_WEEKS,
    build: buildPregnancyPlan,
    totalChapters: pregnancyTotalChapters(),
    groupSections: 'trimesters',
  },
];

export const DEFAULT_PLAN_ID = 'bible-year';

/**
 * @param {string} planId
 * @param {{ dueDate?: string, plan?: object[] }} [opts]
 */
export function getPlanMeta(planId, opts = {}) {
  const base = PLANS.find((p) => p.id === planId) || PLANS[0];
  if (base.id !== 'pregnancy') return base;

  const built = opts.plan || buildPregnancyPlan({ dueDate: opts.dueDate, asOfDate: opts.startDate });
  const weeksLeft = new Set(built.map((d) => d.week)).size;
  const left = built.length;
  const pregWeek = opts.dueDate
    ? pregnancyWeekFromDueDate(
        opts.dueDate,
        opts.startDate ? new Date(`${opts.startDate}T00:00:00`) : new Date()
      )
    : 1;

  return {
    ...base,
    days: built.length,
    weeks: weeksLeft,
    totalChapters: built.reduce(
      (n, d) => n + d.readings.reduce((m, r) => m + r.chapters.length, 0),
      0
    ),
    blurb: opts.dueDate
      ? `${left} day${left === 1 ? '' : 's'} through your due date · from pregnancy week ${pregWeek}`
      : base.blurb,
  };
}

export function buildPlanById(planId, opts = {}) {
  const meta = getPlanMeta(planId);
  if (meta.id === 'pregnancy') {
    return buildPregnancyPlan({ dueDate: opts.dueDate, asOfDate: opts.startDate });
  }
  return meta.build();
}

/** Group any day list into week buckets (works for 52- or 40-week plans). */
export function groupIntoWeeks(days, daysPerWeek = DAYS_PER_WEEK) {
  if (!days?.length) return [];
  // Year plan keeps the original helper when shape matches.
  if (days.length === DAYS && daysPerWeek === DAYS_PER_WEEK) {
    return groupYearWeeks(days);
  }

  // Pregnancy plan: group by pregnancy week number (may start mid-pregnancy).
  if (days[0]?.pregnancyDay != null) {
    const byWeek = new Map();
    for (const d of days) {
      if (!byWeek.has(d.week)) byWeek.set(d.week, []);
      byWeek.get(d.week).push(d);
    }
    return [...byWeek.entries()].map(([week, weekDays]) => ({
      week,
      days: weekDays,
      theme: weekDays[0]?.theme || null,
    }));
  }

  const weeks = [];
  const weekCount = Math.ceil(days.length / daysPerWeek);
  for (let w = 0; w < weekCount; w++) {
    weeks.push({
      week: w + 1,
      days: days.slice(w * daysPerWeek, (w + 1) * daysPerWeek),
      theme: days[w * daysPerWeek]?.theme || null,
    });
  }
  return weeks;
}
