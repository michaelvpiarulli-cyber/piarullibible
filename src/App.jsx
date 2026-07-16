import { useMemo, useState } from 'react';
import './App.css';
import { buildPlan, groupIntoWeeks } from './data/generatePlan';
import { useProgress } from './hooks/useProgress';
import { usePlanStart } from './hooks/usePlanStart';
import { useAnnotations } from './hooks/useAnnotations';
import { AnnotationsProvider } from './context/annotations';
import BottomNav from './components/BottomNav';
import TodayView from './components/TodayView';
import WeekCard from './components/WeekCard';
import NotesView from './components/NotesView';
import ProgressView from './components/ProgressView';
import VerseActionSheet from './components/VerseActionSheet';

const TITLES = { today: 'Today', plan: 'Plan', notes: 'Notes & Highlights', progress: 'Progress' };

function App() {
  const plan = useMemo(() => buildPlan(), []);
  const weeks = useMemo(() => groupIntoWeeks(plan), [plan]);
  const totalReadings = useMemo(() => plan.reduce((n, d) => n + d.readings.length, 0), [plan]);

  const { isDone, toggle, doneCount } = useProgress();
  const { startDate, setStartDate, currentDay, currentWeek, dayDate, weekDateRange } = usePlanStart();
  const { highlights, notes, setHighlight, setNote } = useAnnotations();
  const [tab, setTab] = useState('today');
  const [selectedVerse, setSelectedVerse] = useState(null);

  const annotations = useMemo(
    () => ({ highlights, notes, onSelectVerse: setSelectedVerse }),
    [highlights, notes]
  );

  return (
    <AnnotationsProvider value={annotations}>
      <div className="app">
        <BottomNav active={tab} onChange={setTab} />

        <div className="app-body">
          <header className="app-bar">
            <h1>{TITLES[tab]}</h1>
          </header>

          <main className="app-main">
            {tab === 'today' && (
              <TodayView
                plan={plan}
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

            {tab === 'notes' && (
              <NotesView
                highlights={highlights}
                notes={notes}
                onSelectVerse={setSelectedVerse}
                setHighlight={setHighlight}
                setNote={setNote}
              />
            )}

            {tab === 'progress' && (
              <ProgressView
                plan={plan}
                isDone={isDone}
                doneCount={doneCount}
                totalReadings={totalReadings}
                startDate={startDate}
                setStartDate={setStartDate}
                currentDay={currentDay}
                currentWeek={currentWeek}
              />
            )}
          </main>
        </div>

        {selectedVerse && (
          <VerseActionSheet
            verse={selectedVerse}
            highlight={highlights[selectedVerse.id]}
            note={notes[selectedVerse.id]}
            onHighlight={setHighlight}
            onSaveNote={setNote}
            onClose={() => setSelectedVerse(null)}
          />
        )}
      </div>
    </AnnotationsProvider>
  );
}

export default App;
