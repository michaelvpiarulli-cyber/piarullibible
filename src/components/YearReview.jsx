import { useMemo } from 'react';
import { useData } from '../context/DataProvider';
import { useProgress } from '../hooks/useProgress';
import { computeStreak, dayComplete } from '../data/streaks';
import { MAX_LEVEL } from '../hooks/useMemory';
import { TOTAL_CHAPTERS } from '../data/generatePlan';

const pretty = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * A look back at the year: what was read, what was learned, and — the part
 * worth keeping — the prayers that were answered.
 */
export default function YearReview({ plan, currentDay }) {
  const { journal, memory, sermons, examens, rule, highlights, notes } = useData();
  const { isDone } = useProgress();

  const stats = useMemo(() => {
    const readings = plan.flatMap((d) => d.readings);
    const doneReadings = readings.filter((r) => isDone(r.id));
    const chapters = doneReadings.reduce((n, r) => n + r.chapters.length, 0);
    const daysDone = plan.filter((d) => dayComplete(d, isDone)).length;
    const { best } = computeStreak(plan, isDone, currentDay);

    const answered = journal.filter((e) => e.answeredAt);
    const verses = memory.verses || [];
    const habitDays = (rule.habits || []).reduce(
      (n, h) => n + Object.keys(h.days || {}).length,
      0
    );

    return {
      chapters,
      pct: Math.round((chapters / TOTAL_CHAPTERS) * 100),
      daysDone,
      best,
      answered,
      prayerCount: journal.filter((e) => e.kind === 'prayer').length,
      mastered: verses.filter((v) => v.level >= MAX_LEVEL).length,
      learning: verses.length,
      sermonCount: sermons.length,
      examenCount: examens.length,
      habitDays,
      highlightCount: Object.keys(highlights).length,
      noteCount: Object.keys(notes).length,
    };
  }, [plan, isDone, currentDay, journal, memory, sermons, examens, rule, highlights, notes]);

  const nothingYet =
    stats.chapters === 0 &&
    stats.answered.length === 0 &&
    stats.learning === 0 &&
    stats.sermonCount === 0;

  if (nothingYet) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <p className="empty-title">Your year is just beginning</p>
        <p className="empty-sub">
          As you read, pray, and memorise, this page fills in — a record of what God did over
          twelve months.
        </p>
      </div>
    );
  }

  return (
    <div className="year-review">
      <section className="year-hero">
        <span className="eyebrow">Your year so far</span>
        <span className="year-big">{stats.chapters.toLocaleString()}</span>
        <span className="year-big-label">
          chapters read — {stats.pct}% of the whole Bible
        </span>
      </section>

      <div className="stat-grid">
        <div className="stat-tile">
          <span className="tile-num">{stats.daysDone}</span>
          <span className="tile-label">Days completed</span>
        </div>
        <div className="stat-tile">
          <span className="tile-num">{stats.best}</span>
          <span className="tile-label">Longest streak</span>
        </div>
        <div className="stat-tile">
          <span className="tile-num">{stats.mastered}</span>
          <span className="tile-label">Verses mastered</span>
        </div>
      </div>

      {stats.answered.length > 0 && (
        <>
          <h3 className="section-title">Prayers God answered</h3>
          <ul className="answered-list">
            {stats.answered.map((e) => (
              <li key={e.id} className="answered-card">
                <p>{e.text}</p>
                <span className="answered-when">Answered {pretty(e.answeredAt)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="section-title">Everything else</h3>
      <ul className="tally-list">
        <Tally n={stats.prayerCount} label="prayers written" />
        <Tally n={stats.learning} label="verses being memorised" />
        <Tally n={stats.examenCount} label="evening examens" />
        <Tally n={stats.habitDays} label="days of practice kept" />
        <Tally n={stats.sermonCount} label="sermons noted" />
        <Tally n={stats.highlightCount} label="verses highlighted" />
        <Tally n={stats.noteCount} label="notes on scripture" />
      </ul>

      <p className="year-footer">
        “He who began a good work in you will complete it.” — Philippians 1:6
      </p>
    </div>
  );
}

function Tally({ n, label }) {
  if (!n) return null;
  return (
    <li className="tally">
      <span className="tally-n">{n.toLocaleString()}</span>
      <span className="tally-label">{label}</span>
    </li>
  );
}
