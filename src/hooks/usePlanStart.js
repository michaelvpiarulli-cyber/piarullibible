import { useCallback, useState } from 'react';
import { DAYS, DAYS_PER_WEEK } from '../data/generatePlan';

const STORAGE_KEY = 'bible-plan-start-date';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Local calendar date, not UTC. toISOString() would roll over to tomorrow for
 * anyone west of UTC in the evening, defaulting the plan to start a day late.
 */
function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function load() {
  return localStorage.getItem(STORAGE_KEY) || todayISO();
}

export function usePlanStart() {
  const [startDate, setStartDateState] = useState(load);

  const setStartDate = useCallback((value) => {
    setStartDateState(value);
    localStorage.setItem(STORAGE_KEY, value);
  }, []);

  const start = new Date(`${startDate}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const elapsedDays = Math.floor((today - start) / MS_PER_DAY);
  const currentDay = Math.min(Math.max(elapsedDays + 1, 1), DAYS);
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

  return { startDate, setStartDate, currentDay, currentWeek, dayDate, weekDateRange };
}
