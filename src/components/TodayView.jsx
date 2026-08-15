import { useEffect, useState } from 'react';
import ReadingRow from './ReadingRow';
import DayQuiz from './DayQuiz';
import { DAYS_PER_WEEK } from '../data/plans';
import { prayerForDay } from '../data/prayers';
import { pregnancyStageForDay } from '../data/pregnancyStages';
import { pregnancyDayFromDueDate, pregnancyWeekFromDueDate } from '../data/pregnancyDates';
import { computeStreak } from '../data/streaks';

export default function TodayView({
  plan,
  planMeta,
  dueDate,
  currentDay,
  dayDate,
  isDone,
  toggle,
}) {
  const [selectedDay, setSelectedDay] = useState(currentDay);
  const [expandedId, setExpandedId] = useState(null);

  const streak = computeStreak(plan, isDone, currentDay, {
    trackBehind: planMeta?.id !== 'pregnancy',
  });
  const totalDays = planMeta?.days ?? plan.length;

  useEffect(() => {
    setSelectedDay(currentDay);
  }, [currentDay]);

  useEffect(() => {
    setSelectedDay((d) => Math.min(Math.max(d, 1), totalDays));
  }, [totalDays]);

  const dayData = plan[selectedDay - 1];
  if (!dayData) return null;

  const isPregnancy = planMeta?.id === 'pregnancy';
  const pregnancyWeek =
    isPregnancy && dueDate
      ? pregnancyWeekFromDueDate(dueDate, dayDate(selectedDay))
      : dayData.week;
  const week = pregnancyWeek;
  const weekDays = isPregnancy
    ? plan.filter((d) => {
        if (!dueDate) return d.week === dayData.week;
        return pregnancyWeekFromDueDate(dueDate, dayDate(d.day)) === pregnancyWeek;
      })
    : plan.slice((week - 1) * DAYS_PER_WEEK, week * DAYS_PER_WEEK);

  const total = dayData.readings.length;
  const doneCount = dayData.readings.filter((r) => isDone(r.id)).length;
  const complete = doneCount === total;
  const chapterCount = dayData.readings.reduce((n, r) => n + r.chapters.length, 0);

  const date = dayDate(selectedDay);
  const isToday = selectedDay === currentDay;
  const allDone = (d) => d.readings.every((r) => isDone(r.id));

  const pickDay = (day) => {
    setSelectedDay(day);
    setExpandedId(null);
  };

  const markDone = (id) => {
    if (!isDone(id)) toggle(id);
    setExpandedId(null);
  };

  return (
    <div className="today-view">
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
              onClick={() => pickDay(d.day)}
            >
              <span className="strip-weekday">
                {dd.toLocaleDateString(undefined, { weekday: 'narrow' })}
              </span>
              <span className="strip-num">{dd.getDate()}</span>
              <span className="strip-dot" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <header className="today-hero">
        <div className="today-hero-top">
          <div className="today-hero-copy">
            <p className="today-kicker">
              {isToday ? 'Today' : date.toLocaleDateString(undefined, { weekday: 'long' })}
              <span aria-hidden="true"> · </span>
              Day {selectedDay}
              {dayData.theme ? (
                <>
                  <span aria-hidden="true"> · </span>
                  {dayData.theme}
                </>
              ) : null}
            </p>
            <h2>{date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</h2>
          </div>

          {streak.behind > 0 ? (
            <button
              type="button"
              className="status-chip behind"
              onClick={() => pickDay(streak.firstIncomplete)}
            >
              {streak.behind} behind
            </button>
          ) : streak.current > 0 ? (
            <span className="status-chip streak">
              {streak.current}-day streak
            </span>
          ) : null}
        </div>

        <div className="hero-progress">
          <div className="progress-bar-outer thin">
            <div
              className="progress-bar-inner"
              style={{ width: `${Math.round((doneCount / Math.max(total, 1)) * 100)}%` }}
            />
          </div>
          <span className="hero-progress-label">
            {complete
              ? `All ${total} readings done`
              : `${doneCount} of ${total} · ${chapterCount} chapters`}
          </span>
        </div>
      </header>

      <ul className="reading-list card-list">
        {dayData.readings.map((reading) => (
          <ReadingRow
            key={reading.id}
            reading={reading}
            done={isDone(reading.id)}
            onToggle={() => toggle(reading.id)}
            expanded={expandedId === reading.id}
            onExpand={() => setExpandedId(expandedId === reading.id ? null : reading.id)}
            onMarkDone={() => markDone(reading.id)}
          />
        ))}
      </ul>

      <DayQuiz day={selectedDay} readings={dayData.readings} />

      {isPregnancy ? (
        (() => {
          const onDate = dayDate(selectedDay);
          const pregDay = dueDate ? pregnancyDayFromDueDate(dueDate, onDate) : selectedDay;
          const stage = pregnancyStageForDay(pregnancyWeek, pregDay);
          return (
            <section className="prayer-card preg-stage-card">
              <span className="prayer-label">
                Week {stage.week} · Day {stage.dayInWeek} of 7 · What God is forming
              </span>
              <h3 className="preg-stage-title">{stage.title}</h3>
              <p className="prayer-text">{stage.forming}</p>
              <div className="preg-tip">
                <span className="preg-tip-label">Today’s fact</span>
                <p className="preg-tip-text">{stage.fact}</p>
              </div>
              <div className="preg-tip">
                <span className="preg-tip-label">Today’s tip</span>
                <p className="preg-tip-text">{stage.tip}</p>
              </div>
            </section>
          );
        })()
      ) : (
        (() => {
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
        })()
      )}

      <div className="day-pager">
        <button
          type="button"
          className="pager-btn"
          disabled={selectedDay === 1}
          onClick={() => pickDay(selectedDay - 1)}
        >
          ← Prev
        </button>
        {!isToday && (
          <button type="button" className="btn-text" onClick={() => pickDay(currentDay)}>
            Today
          </button>
        )}
        <button
          type="button"
          className="pager-btn"
          disabled={selectedDay === totalDays}
          onClick={() => pickDay(selectedDay + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
