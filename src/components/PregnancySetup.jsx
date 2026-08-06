import { useEffect, useMemo, useState } from 'react';
import {
  dueDateFromCurrentWeek,
  formatPrettyDate,
  pregnancyWeekFromDueDate,
  startDateFromDueDate,
} from '../data/pregnancyDates';

/**
 * First-run (and re-open) setup for the pregnancy plan: due date or current week.
 */
export default function PregnancySetup({ initialDueDate = '', onSave, onCancel }) {
  const [mode, setMode] = useState('due'); // due | week
  const [dueDate, setDueDate] = useState(initialDueDate || '');
  const [week, setWeek] = useState('20');

  useEffect(() => {
    setDueDate(initialDueDate || '');
  }, [initialDueDate]);

  const previewDue = useMemo(() => {
    if (mode === 'due') return dueDate;
    return dueDateFromCurrentWeek(week);
  }, [mode, dueDate, week]);

  const previewStart = useMemo(() => startDateFromDueDate(previewDue), [previewDue]);
  const previewWeek = useMemo(
    () => (previewDue ? pregnancyWeekFromDueDate(previewDue) : null),
    [previewDue]
  );

  const canSave = Boolean(previewDue && previewStart);

  const submit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({ dueDate: previewDue, startDate: previewStart });
  };

  return (
    <div className="sheet-scrim preg-setup-scrim" role="presentation" onClick={onCancel}>
      <div
        className="preg-setup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preg-setup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="sheet-grabber" aria-hidden="true" />
        <span className="eyebrow">Pregnancy plan</span>
        <h2 id="preg-setup-title">When is your due date?</h2>
        <p className="preg-setup-lead">
          We’ll line up the 40-week reading plan with your pregnancy so today’s reading matches
          where you are.
        </p>

        <div className="preg-setup-modes" role="tablist" aria-label="How to set your date">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'due'}
            className={`chip${mode === 'due' ? ' active' : ''}`}
            onClick={() => setMode('due')}
          >
            Due date
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'week'}
            className={`chip${mode === 'week' ? ' active' : ''}`}
            onClick={() => setMode('week')}
          >
            Current week
          </button>
        </div>

        <form className="preg-setup-form" onSubmit={submit}>
          {mode === 'due' ? (
            <label className="preg-setup-field">
              <span>Due date</span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                autoFocus
              />
            </label>
          ) : (
            <label className="preg-setup-field">
              <span>I am currently in week</span>
              <input
                type="number"
                min={1}
                max={40}
                value={week}
                onChange={(e) => setWeek(e.target.value)}
                required
                autoFocus
              />
            </label>
          )}

          {canSave && (
            <p className="preg-setup-preview">
              About week {previewWeek} today · readings start {formatPrettyDate(previewStart)} · due{' '}
              {formatPrettyDate(previewDue)}
            </p>
          )}

          <div className="preg-setup-actions">
            {onCancel && (
              <button type="button" className="btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={!canSave}>
              Start this plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
