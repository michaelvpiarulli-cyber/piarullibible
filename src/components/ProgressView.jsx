import { TRACKS } from '../data/books';
import { DAYS, TOTAL_CHAPTERS } from '../data/generatePlan';
import { PASTOR_BOOK, bookStats } from '../data/pastorBook';
import { computeStreak } from '../data/streaks';

const TRACK_LIST = [TRACKS.LAW_HISTORY, TRACKS.WISDOM, TRACKS.PROPHETS, TRACKS.NEW_TESTAMENT];

function bibleChaptersIn(reading) {
  return reading.kind === 'book' ? 0 : reading.chapters?.length || 0;
}

export default function ProgressView({
  plan,
  isDone,
  doneCount,
  totalReadings,
  startDate,
  setStartDate,
  currentDay,
  currentWeek,
  bookPlanDays,
  setBookPlanDays,
  bookDayOptions,
}) {
  const pct = Math.round((doneCount / totalReadings) * 100);
  const allReadings = plan.flatMap((d) => d.readings);
  const bookReadings = allReadings.filter((r) => r.kind === 'book');
  const bookDone = bookReadings.filter((r) => isDone(r.id)).length;
  const bookMeta = bookStats(PASTOR_BOOK);

  const chaptersRead = allReadings
    .filter((r) => isDone(r.id))
    .reduce((sum, r) => sum + bibleChaptersIn(r), 0);

  const daysComplete = plan.filter(
    (d) => d.readings.length > 0 && d.readings.every((r) => isDone(r.id))
  ).length;

  const streak = computeStreak(plan, isDone, currentDay);

  const perTrack = TRACK_LIST.map((name) => {
    const readings = allReadings.filter((r) => r.trackName === name);
    const done = readings.filter((r) => isDone(r.id)).length;
    const chapters = readings.reduce((n, r) => n + bibleChaptersIn(r), 0);
    const chaptersDone = readings
      .filter((r) => isDone(r.id))
      .reduce((n, r) => n + bibleChaptersIn(r), 0);
    return { name, chapters, chaptersDone, pct: Math.round((done / readings.length) * 100) };
  });

  return (
    <div className="progress-view">
      <div className="stat-hero">
        <span className="stat-big">{pct}%</span>
        <span className="stat-sub">
          {chaptersRead} of {TOTAL_CHAPTERS} chapters · {doneCount} of {totalReadings} readings
        </span>
        <div className="progress-bar-outer">
          <div className="progress-bar-inner" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-tile">
          <span className="tile-num">{daysComplete}</span>
          <span className="tile-label">Days complete</span>
        </div>
        <div className="stat-tile">
          <span className="tile-num">{currentDay}</span>
          <span className="tile-label">of {DAYS} days</span>
        </div>
        <div className="stat-tile">
          <span className="tile-num">{currentWeek}</span>
          <span className="tile-label">of 52 weeks</span>
        </div>
      </div>

      <h3 className="section-title">Streak</h3>
      <div className="stat-grid">
        <div className="stat-tile">
          <span className="tile-num">{streak.current}</span>
          <span className="tile-label">Current streak</span>
        </div>
        <div className="stat-tile">
          <span className="tile-num">{streak.best}</span>
          <span className="tile-label">Best streak</span>
        </div>
        <div className="stat-tile">
          <span className="tile-num">{streak.behind}</span>
          <span className="tile-label">{streak.behind === 0 ? 'Caught up' : 'Days behind'}</span>
        </div>
      </div>

      <h3 className="section-title">By section</h3>
      <div className="track-stats">
        {perTrack.map((t) => (
          <div key={t.name} className="track-stat">
            <div className="track-stat-head">
              <span className="track-stat-name">{t.name}</span>
              <span className="track-stat-count">
                {t.chaptersDone}/{t.chapters} ch
              </span>
            </div>
            <div className="progress-bar-outer thin">
              <div className="progress-bar-inner" style={{ width: `${t.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {bookReadings.length > 0 && (
        <>
          <h3 className="section-title">{PASTOR_BOOK.title}</h3>
          <div className="track-stats">
            <div className="track-stat">
              <div className="track-stat-head">
                <span className="track-stat-name">Daily portions</span>
                <span className="track-stat-count">
                  {bookDone}/{bookReadings.length}
                </span>
              </div>
              <div className="progress-bar-outer thin">
                <div
                  className="progress-bar-inner"
                  style={{
                    width: `${Math.round((bookDone / bookReadings.length) * 100)}%`,
                  }}
                />
              </div>
              <p className="track-stat-note">
                {bookMeta.chapters} chapters · ~{bookMeta.words.toLocaleString()} words
                {' · '}
                {bookReadings.length} day{bookReadings.length === 1 ? '' : 's'} with this text
                {PASTOR_BOOK.placeholder ? ' · sample' : ''}
              </p>
            </div>
          </div>
        </>
      )}

      <h3 className="section-title">Plan settings</h3>
      <div className="setting-card">
        <label className="setting-row">
          <span className="setting-label">Start date</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <div className="setting-row">
          <span className="setting-label">Today</span>
          <span className="setting-value">
            Day {currentDay} · Week {currentWeek}
          </span>
        </div>
        {setBookPlanDays && (
          <label className="setting-row">
            <span className="setting-label">
              Book plan length
              <span className="setting-hint">Max days to spread the book (shorter text may finish sooner)</span>
            </span>
            <select
              value={bookPlanDays}
              onChange={(e) => setBookPlanDays(Number(e.target.value))}
              aria-label="How many days to spread Days with Jesus across"
            >
              {(bookDayOptions || []).map((n) => (
                <option key={n} value={n}>
                  {n} days
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
