import { buildPlan, groupIntoWeeks as groupYearWeeks, DAYS, WEEKS, DAYS_PER_WEEK, TOTAL_CHAPTERS } from './generatePlan';
import {
  buildPregnancyPlan,
  pregnancyTotalChapters,
  PREGNANCY_DAYS,
  PREGNANCY_WEEKS,
} from './pregnancyPlan';

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
    blurb: '40 weeks of Scripture for the journey of carrying new life.',
    days: PREGNANCY_DAYS,
    weeks: PREGNANCY_WEEKS,
    build: buildPregnancyPlan,
    totalChapters: pregnancyTotalChapters(),
    groupSections: 'trimesters',
  },
];

export const DEFAULT_PLAN_ID = 'bible-year';

export function getPlanMeta(planId) {
  return PLANS.find((p) => p.id === planId) || PLANS[0];
}

export function buildPlanById(planId) {
  return getPlanMeta(planId).build();
}

/** Group any day list into week buckets (works for 52- or 40-week plans). */
export function groupIntoWeeks(days, daysPerWeek = DAYS_PER_WEEK) {
  if (!days?.length) return [];
  // Year plan keeps the original helper when shape matches.
  if (days.length === DAYS && daysPerWeek === DAYS_PER_WEEK) {
    return groupYearWeeks(days);
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
