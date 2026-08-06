import { useCallback } from 'react';
import { DAYS_PER_WEEK, getPlanMeta } from '../data/plans';
import { useData } from '../context/DataProvider';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Derives the current day/week and date helpers from the plan start date and
 * the active plan’s length.
 */
export function usePlanStart() {
  const { startDate, setStartDate, planId } = useData();
  const totalDays = getPlanMeta(planId).days;

  const start = new Date(`${startDate}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const elapsedDays = Math.floor((today - start) / MS_PER_DAY);
  const currentDay = Math.min(Math.max(elapsedDays + 1, 1), totalDays);
  const currentWeek = Math.ceil(currentDay / DAYS_PER_WEEK);

  const dayDate = useCallback(
    (day) => new Date(start.getTime() + (day - 1) * MS_PER_DAY),
    [start]
  );

  const weekDateRange = useCallback(
    (week) => {
      const first = new Date(start.getTime() + (week - 1) * DAYS_PER_WEEK * MS_PER_DAY);
      const last = new Date(first.getTime() + 6 * MS_PER_DAY);
      const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return `${fmt(first)} – ${fmt(last)}`;
    },
    [start]
  );

  return {
    startDate,
    setStartDate,
    planId,
    totalDays,
    currentDay,
    currentWeek,
    dayDate,
    weekDateRange,
  };
}
