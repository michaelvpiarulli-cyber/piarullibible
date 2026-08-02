import { useCallback, useState } from 'react';
import {
  BOOK_PLAN_DAY_OPTIONS,
  clampBookDays,
  loadBookPlanDays,
  saveBookPlanDays,
} from '../data/generateBookPlan';

/** Local preference for how many days the pastor’s book plan should span. */
export function useBookPlanDays() {
  const [bookPlanDays, setBookPlanDaysState] = useState(loadBookPlanDays);

  const setBookPlanDays = useCallback((days) => {
    const next = clampBookDays(days);
    saveBookPlanDays(next);
    setBookPlanDaysState(next);
  }, []);

  return { bookPlanDays, setBookPlanDays, options: BOOK_PLAN_DAY_OPTIONS };
}
