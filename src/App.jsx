import { useCallback, useMemo, useState } from 'react';
import './App.css';
import { buildPlanById, getPlanMeta, groupIntoWeeks } from './data/plans';
import { useProgress } from './hooks/useProgress';
import { usePlanStart } from './hooks/usePlanStart';
import { useAnnotations } from './hooks/useAnnotations';
import { useData } from './context/DataProvider';
import { AnnotationsProvider } from './context/annotations';
import BottomNav from './components/BottomNav';
import TodayView from './components/TodayView';
import WeekCard from './components/WeekCard';
import NotesView from './components/NotesView';
import JournalView from './components/JournalView';
import MemorizeView from './components/MemorizeView';
import SermonView from './components/SermonView';
import ReadView from './components/ReadView';
import ExamenView from './components/ExamenView';
import RuleView from './components/RuleView';
import YearReview from './components/YearReview';
import ProgressView from './components/ProgressView';
import GroupView from './components/GroupView';
import VerseActionSheet from './components/VerseActionSheet';
import AccountMenu from './components/AccountMenu';
import ThemeToggle from './components/ThemeToggle';
import { computeStreak } from './data/streaks';

const TITLES = {
  today: 'Today',
  plan: 'Plan',
  read: 'Read',
  prayer: 'Prayer & Practice',
  memorize: 'Memorize',
  notes: 'Notes',
  family: 'Family',
  progress: 'Progress',
};

/* The Prayer tab holds the daily spiritual practices. */
const PRAYER_SECTIONS = [
  { id: 'journal', label: 'Journal' },
  { id: 'examen', label: 'Examen' },
  { id: 'rule', label: 'Rule of Life' },
];

/* The Progress tab holds stats and the year-end look back. */
const PROGRESS_SECTIONS = [
  { id: 'stats', label: 'Stats' },
  { id: 'year', label: 'Year in Review' },
];

/* The Notes tab holds two related workspaces. */
const NOTE_SECTIONS = [
  { id: 'sermons', label: 'Sermon Notes' },
  { id: 'highlights', label: 'Highlights' },
];

function App() {
  const { planId, setPlanId } = useData();
  const planMeta = useMemo(() => getPlanMeta(planId), [planId]);
  const plan = useMemo(() => buildPlanById(planId), [planId]);
  const weeks = useMemo(() => groupIntoWeeks(plan), [plan]);
  const totalReadings = useMemo(() => plan.reduce((n, d) => n + d.readings.length, 0), [plan]);

  const { isDone, toggle, doneCount } = useProgress();
  const { startDate, setStartDate, currentDay, currentWeek, dayDate, weekDateRange } = usePlanStart();
  const { highlights, notes, setHighlight, setNote } = useAnnotations();
  const [tab, setTab] = useState('today');
  const [noteSection, setNoteSection] = useState('sermons');
  const [prayerSection, setPrayerSection] = useState('journal');
  const [progressSection, setProgressSection] = useState('stats');
  const [selectedVerse, setSelectedVerse] = useState(null);
  // Jump target for the Read tab — set by cross-ref links (and later deep links).
  const [readJump, setReadJump] = useState(null);

  const openPassage = useCallback((target) => {
    setReadJump(target);
    setTab('read');
  }, []);

  const annotations = useMemo(
    () => ({ highlights, notes, onSelectVerse: setSelectedVerse, onOpenPassage: openPassage }),
    [highlights, notes, openPassage]
  );

  // Shared summary for family groups — progress only, no notes/highlights.
  // Keys must match the group_members columns exactly (they're written as-is).
  const myStats = useMemo(() => {
    const { current } = computeStreak(plan, isDone, currentDay);
    const completed = plan.filter(
      (d) => d.readings.length > 0 && d.readings.every((r) => isDone(r.id))
    ).length;
    return { current_day: currentDay, streak: current, completed_days: completed };
  }, [plan, isDone, currentDay]);

  return (
    <AnnotationsProvider value={annotations}>
      <div className="app">
        <BottomNav active={tab} onChange={setTab} planTitle={planMeta.title} />

        <div className="app-body">
          <header className="app-bar">
            <h1>{TITLES[tab]}</h1>
            <div className="app-bar-actions">
              <ThemeToggle />
              <AccountMenu />
            </div>
          </header>

          <main className="app-main">
            <div className="view-pane" key={`${tab}-${planId}`}>
              {tab === 'today' && (
                <TodayView
                  plan={plan}
                  planMeta={planMeta}
                  currentDay={currentDay}
                  dayDate={dayDate}
                  isDone={isDone}
                  toggle={toggle}
                />
              )}

              {tab === 'plan' && (
                <div className="week-list">
                  {weeks.map((weekData) => (
                    <WeekCard
                      key={weekData.week}
                      weekData={weekData}
                      currentDay={currentDay}
                      dateRange={weekDateRange(weekData.week)}
                      dayDate={dayDate}
                      isDone={isDone}
                      toggle={toggle}
                    />
                  ))}
                </div>
              )}

              {tab === 'read' && <ReadView jumpTo={readJump} />}

              {tab === 'prayer' && (
                <>
                  <div className="filter-row section-switch">
                    {PRAYER_SECTIONS.map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        className={`chip${prayerSection === sec.id ? ' active' : ''}`}
                        onClick={() => setPrayerSection(sec.id)}
                      >
                        {sec.label}
                      </button>
                    ))}
                  </div>

                  {prayerSection === 'journal' && <JournalView currentDay={currentDay} />}
                  {prayerSection === 'examen' && <ExamenView />}
                  {prayerSection === 'rule' && <RuleView />}
                </>
              )}

              {tab === 'memorize' && <MemorizeView />}

              {tab === 'notes' && (
                <>
                  <div className="filter-row section-switch">
                    {NOTE_SECTIONS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`chip${noteSection === s.id ? ' active' : ''}`}
                        onClick={() => setNoteSection(s.id)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {noteSection === 'sermons' ? (
                    <SermonView />
                  ) : (
                    <NotesView
                      highlights={highlights}
                      notes={notes}
                      onSelectVerse={setSelectedVerse}
                      setHighlight={setHighlight}
                      setNote={setNote}
                    />
                  )}
                </>
              )}

              {tab === 'family' && <GroupView myStats={myStats} totalDays={planMeta.days} />}

              {tab === 'progress' && (
                <>
                  <div className="filter-row section-switch">
                    {PROGRESS_SECTIONS.map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        className={`chip${progressSection === sec.id ? ' active' : ''}`}
                        onClick={() => setProgressSection(sec.id)}
                      >
                        {sec.label}
                      </button>
                    ))}
                  </div>

                  {progressSection === 'year' ? (
                    <YearReview plan={plan} planMeta={planMeta} currentDay={currentDay} />
                  ) : (
                    <ProgressView
                      plan={plan}
                      planMeta={planMeta}
                      planId={planId}
                      setPlanId={setPlanId}
                      isDone={isDone}
                      doneCount={doneCount}
                      totalReadings={totalReadings}
                      startDate={startDate}
                      setStartDate={setStartDate}
                      currentDay={currentDay}
                      currentWeek={currentWeek}
                    />
                  )}
                </>
              )}
            </div>
          </main>
        </div>

        {selectedVerse && (
          <VerseActionSheet
            verse={selectedVerse}
            highlight={highlights[selectedVerse.id]}
            note={notes[selectedVerse.id]}
            onHighlight={setHighlight}
            onSaveNote={setNote}
            onOpenPassage={openPassage}
            onClose={() => setSelectedVerse(null)}
          />
        )}
      </div>
    </AnnotationsProvider>
  );
}

export default App;
