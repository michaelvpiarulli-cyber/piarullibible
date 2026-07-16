import DayRow from './DayRow';

export default function WeekCard({ weekData, currentDay, dateRange, dayDate, isDone, toggle }) {
  const readings = weekData.days.flatMap((d) => d.readings);
  const doneCount = readings.filter((r) => isDone(r.id)).length;
  const complete = doneCount === readings.length;
  const isCurrentWeek = weekData.days.some((d) => d.day === currentDay);

  return (
    <section id={`week-${weekData.week}`} className={`week-card${isCurrentWeek ? ' current' : ''}`}>
      <header className="week-card-header">
        <div>
          <h3>
            Week {weekData.week}
            {isCurrentWeek && <span className="today-pill">This week</span>}
          </h3>
          <span className="week-date-range">{dateRange}</span>
        </div>
        <span className={`week-progress${complete ? ' complete' : ''}`}>
          {complete ? 'Done' : `${doneCount}/${readings.length}`}
        </span>
      </header>

      <ul className="day-list">
        {weekData.days.map((dayData) => (
          <DayRow
            key={dayData.day}
            dayData={dayData}
            date={dayDate(dayData.day)}
            isToday={dayData.day === currentDay}
            isDone={isDone}
            toggle={toggle}
          />
        ))}
      </ul>
    </section>
  );
}
