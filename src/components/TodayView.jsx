import { useEffect, useState } from 'react';
import ReadingRow from './ReadingRow';
import { DAYS, DAYS_PER_WEEK } from '../data/generatePlan';
import { prayerForDay } from '../data/prayers';
import { computeStreak } from '../data/streaks';

export default function TodayView({ plan, currentDay, dayDate, isDone, toggle }) {
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [expandedId, setExpandedId] = useState(null);

  const streak = computeStreak(plan, isDone, currentDay);

  // If the plan's start date changes, follow it back to the real "today".
  useEffect(() => {
    setSelectedDay(currentDay);
  }, [currentDay]);

  const dayData = plan[selectedDay - 1];
  const week = Math.ceil(selectedDay / DAYS_PER_WEEK);
  const weekDays = plan.slice((week - 1) * DAYS_PER_WEEK, week * DAYS_PER_WEEK);

  const total = dayData.readings.length;
  const doneCount = dayData.readings.filter((r) => isDone(r.id)).length;
  const complete = doneCount === total;

  const date = dayDate(selectedDay);
  const isToday = selectedDay === currentDay;
  const allDone = (d) => d.readings.every((r) => isDone(r.id));

  return (
    <div className="today-view">
      {/* Mini week view: the whole week at a glance, tap to move between days. */}
      <div className="week-strip" role="tablist" aria-label={`Week ${week}`}>
        {weekDays.map((d) => {
          const dd = dayDate(d.day);
          return (
            <button
              key={d.day}
              type="button"
              role="tab"
              aria-selected={d.day === selectedDay}
              className={[
                'strip-day',
                d.day === selectedDay ? 'selected' : '',
                d.day === currentDay ? 'is-today' : '',
                allDone(d) ? 'complete' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                setSelectedDay(d.day);
                setExpandedId(null);
              }}
            >
              <span className="strip-weekday">
                {dd.toLocaleDateString(undefined, { weekday: 'narrow' })}
              </span>
              <span className="strip-num">{dd.getDate()}</span>
              <span className="strip-dot" />
            </button>
          );
        })}
      </div>

      <div className="streak-row">
        <div className="streak-pill">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2c1.5 3.5-.5 5.5-2 7-1.7 1.7-3 3.4-3 6a5 5 0 0 0 10 0c0-1.6-.6-2.8-1.3-3.8.3 1.3-.2 2.6-1 3-.1-2-1-3.4-2.2-4.4C13.7 8.2 14 5 12 2Z" />
          </svg>
          <span>{streak.current > 0 ? `${streak.current}-day streak` : 'Start your streak'}</span>
        </div>

        {streak.behind > 0 ? (
          <button
            type="button"
            className="streak-pill behind"
            onClick={() => {
              setSelectedDay(streak.firstIncomplete);
              setExpandedId(null);
            }}
          >
            {streak.behind} {streak.behind === 1 ? 'day' : 'days'} behind · Catch up
          </button>
        ) : (
          <div className="streak-pill caught-up">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
            <span>Caught up</span>
          </div>
        )}
      </div>

      <div className="today-hero">
        <span className="eyebrow">
          {isToday ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'long' })} · Week {week}
        </span>
        <h2>{date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</h2>
        <span className="today-dates">
          Day {selectedDay} of {DAYS}
        </span>

        <div className="hero-progress">
          <div className="progress-bar-outer">
            <div
              className="progress-bar-inner"
              style={{ width: `${Math.round((doneCount / total) * 100)}%` }}
            />
          </div>
          <span className="hero-progress-label">
            {complete
              ? `All ${total} readings done — nice work`
              : `${doneCount} of ${total} readings · ${dayData.readings.reduce(
                  (n, r) => n + r.chapters.length,
                  0
                )} chapters`}
          </span>
        </div>
      </div>

      <ul className="reading-list card-list">
        {dayData.readings.map((reading) => (
          <ReadingRow
            key={reading.id}
            reading={reading}
            done={isDone(reading.id)}
            onToggle={() => toggle(reading.id)}
            expanded={expandedId === reading.id}
            onExpand={() => setExpandedId(expandedId === reading.id ? null : reading.id)}
          />
        ))}
      </ul>

      {(() => {
        const prayer = prayerForDay(selectedDay);
        return (
          <section className="prayer-card">
            <span className="prayer-label">{prayer.label || 'Closing Prayer'}</span>
            <p className="prayer-text">{prayer.text}</p>
            <p className="prayer-author">
              {prayer.cite
                ? prayer.cite
                : `${prayer.attributed ? 'attributed to ' : '— '}${prayer.author} · ${prayer.era}`}
            </p>
          </section>
        );
      })()}

      <div className="day-pager">
        <button
          type="button"
          className="pager-btn"
          disabled={selectedDay === 1}
          onClick={() => setSelectedDay(selectedDay - 1)}
        >
          ← Previous day
        </button>
        {!isToday && (
          <button type="button" className="btn-text" onClick={() => setSelectedDay(currentDay)}>
            Jump to today
          </button>
        )}
        <button
          type="button"
          className="pager-btn"
          disabled={selectedDay === DAYS}
          onClick={() => setSelectedDay(selectedDay + 1)}
        >
          Next day →
        </button>
      </div>
    </div>
  );
}
