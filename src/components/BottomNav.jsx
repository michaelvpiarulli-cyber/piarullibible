import { useEffect, useState } from 'react';

const PRIMARY = [
  {
    id: 'today',
    label: 'Today',
    icon: <path d="M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5" />,
  },
  {
    id: 'plan',
    label: 'Plan',
    icon: (
      <>
        <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
        <path d="M8.5 9.5h7M8.5 13.5h7M8.5 17h4" />
      </>
    ),
  },
  {
    id: 'read',
    label: 'Read',
    icon: (
      <>
        <path d="M12 7.5C10.5 5.5 8 5 4.5 5.5v12C8 17 10.5 17.5 12 19.5c1.5-2 4-2.5 7.5-2v-12C16 5 13.5 5.5 12 7.5Z" />
        <path d="M12 7.5v12" />
      </>
    ),
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />,
  },
];

const MORE = [
  {
    id: 'prayer',
    label: 'Prayer',
    blurb: 'Journal, Examen, Rule of Life',
    icon: <path d="M12 21c-1.2-1.6-2-3-2-4.7 0-2 1-3.4 2-5 1 1.6 2 3 2 5 0 1.7-.8 3.1-2 4.7Z" />,
  },
  {
    id: 'memorize',
    label: 'Memory',
    blurb: 'Verse memorization',
    icon: (
      <path d="M12 3.5a5.5 5.5 0 0 0-3.4 9.8c.6.5.9 1.1.9 1.8v.4h5v-.4c0-.7.3-1.3.9-1.8A5.5 5.5 0 0 0 12 3.5ZM9.5 18.5h5M10.5 21h3" />
    ),
  },
  {
    id: 'lifegroup',
    label: 'Lifegroup',
    blurb: 'Epic of Eden · Ch. 6',
    icon: (
      <>
        <path d="M4 19.5V6.2c0-.7.4-1.3 1-1.6L12 2l7 2.6c.6.3 1 .9 1 1.6v13.3" />
        <path d="M12 2v17.5M8 10h2M8 13h2M14 10h2M14 13h2" />
      </>
    ),
  },
  {
    id: 'family',
    label: 'Family',
    blurb: 'Shared progress',
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 6.2a3 3 0 0 1 0 5.6M15.6 20a6.5 6.5 0 0 0-1.6-4.3" />
      </>
    ),
  },
  {
    id: 'progress',
    label: 'Stats',
    blurb: 'Streaks & year review',
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
  },
];

const MORE_IDS = new Set(MORE.map((t) => t.id));

function TabIcon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export default function BottomNav({ active, onChange, planTitle = 'Bible in a Year' }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_IDS.has(active);

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  return (
    <>
      <nav className="app-nav" aria-label="Main">
        <div className="nav-brand">
          <span className="brand-lockup">Piarulli</span>
          <span className="brand-sub">{planTitle}</span>
        </div>

        <div className="nav-tabs">
          {PRIMARY.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`nav-tab${active === tab.id ? ' active' : ''}`}
              onClick={() => {
                setMoreOpen(false);
                onChange(tab.id);
              }}
              aria-current={active === tab.id ? 'page' : undefined}
              aria-label={tab.label}
            >
              <TabIcon>{tab.icon}</TabIcon>
              <span className="nav-label-full">{tab.label}</span>
              <span className="nav-label-short">{tab.label}</span>
            </button>
          ))}

          <button
            type="button"
            className={`nav-tab more-tab${moreActive || moreOpen ? ' active' : ''}`}
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            aria-label="More"
          >
            <TabIcon>
              <circle cx="6" cy="12" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="18" cy="12" r="1.4" fill="currentColor" stroke="none" />
            </TabIcon>
            <span className="nav-label-full">More</span>
            <span className="nav-label-short">More</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="more-sheet-root">
          <button
            type="button"
            className="more-sheet-scrim"
            aria-label="Dismiss"
            onClick={() => setMoreOpen(false)}
          />
          <div className="more-sheet" role="dialog" aria-label="More">
            <div className="more-sheet-grabber" />
            <h3 className="more-sheet-title">More</h3>
            <ul className="more-sheet-list">
              {MORE.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`more-sheet-item${active === item.id ? ' active' : ''}`}
                    onClick={() => {
                      setMoreOpen(false);
                      onChange(item.id);
                    }}
                  >
                    <span className="more-sheet-icon">
                      <TabIcon>{item.icon}</TabIcon>
                    </span>
                    <span className="more-sheet-copy">
                      <strong>{item.label}</strong>
                      <span>{item.blurb}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
