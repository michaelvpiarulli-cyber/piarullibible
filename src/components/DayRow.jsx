import { useState } from 'react';
import ReadingRow from './ReadingRow';

export default function DayRow({ dayData, date, isToday, isDone, toggle }) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const total = dayData.readings.length;
  const doneCount = dayData.readings.filter((r) => isDone(r.id)).length;
  const complete = doneCount === total;

  const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
  const dayNum = date.getDate();
  const summary = dayData.readings.map((r) => r.label).join(' · ');

  return (
    <li className={`day-row${open ? ' open' : ''}${isToday ? ' today' : ''}`}>
      <button type="button" className="day-head" onClick={() => setOpen(!open)}>
        <span className={`day-date${complete ? ' complete' : ''}`}>
          <span className="day-weekday">{weekday}</span>
          <span className="day-num">{dayNum}</span>
        </span>

        <span className="day-body">
          <span className="day-summary">{summary}</span>
          <span className="day-meta">
            Day {dayData.day}
            {isToday && <span className="today-pill sm">Today</span>}
          </span>
        </span>

        <span className={`day-count${complete ? ' complete' : ''}`}>
          {complete ? '✓' : `${doneCount}/${total}`}
        </span>
      </button>

      {open && (
        <ul className="reading-list nested">
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
      )}
    </li>
  );
}
