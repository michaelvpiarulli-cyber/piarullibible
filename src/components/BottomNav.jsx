import { useEffect, useState } from 'react';

const PRIMARY = [
  {
    id: 'today',
    label: 'Today',
    icon: <path d="M3 10.5 12 3l9 7.5M5.5 9.5V20h13V9.5" />,
  },
  {
    id: 'read',
    label: 'Bible',
    icon: (
      <>
        <path d="M12 7.5C10.5 5.5 8 5 4.5 5.5v12C8 17 10.5 17.5 12 19.5c1.5-2 4-2.5 7.5-2v-12C16 5 13.5 5.5 12 7.5Z" />
        <path d="M12 7.5v12" />
      </>
    ),
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
    id: 'prayer',
    label: 'Prayer',
    icon: (
      <>
        <path d="M12 21c-1.2-1.6-2-3-2-4.7 0-2 1-3.4 2-5 1 1.6 2 3 2 5 0 1.7-.8 3.1-2 4.7Z" />
        <path d="M12 11.3V3M9 6l3-3 3 3" />
      </>
    ),
  },
];

const MORE = [
  {
    id: 'memorize',
    label: 'Memorize',
    blurb: 'Practice verses with drills',
    icon: (
      <path d="M12 3.5a5.5 5.5 0 0 0-3.4 9.8c.6.5.9 1.1.9 1.8v.4h5v-.4c0-.7.3-1.3.9-1.8A5.5 5.5 0 0 0 12 3.5ZM9.5 18.5h5M10.5 21h3" />
    ),
  },
  {
    id: 'notes',
    label: 'Notes',
    blurb: 'Sermons & highlights',
    icon: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />,
  },
  {
    id: 'family',
    label: 'Family',
    blurb: 'Read together',
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 6.2a3 3 0 0 1 0 5.6M15.6 20a6.5 6.5 0 0 0-1.6-4.3" />
      </>
    ),
  },
  {
    id: 'progress',
    label: 'Progress',
    blurb: 'Stats & plan settings',
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
  },
];

const MORE_IDS = new Set(MORE.map((t) => t.id));
const DESKTOP_TABS = [...PRIMARY, ...MORE];

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
    if (!moreOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  // Close the sheet whenever the active tab changes from outside.
  useEffect(() => {
    setMoreOpen(false);
  }, [active]);

  const pick = (id) => {
    setMoreOpen(false);
    onChange(id);
  };

  return (
    <>
      <nav className="app-nav" aria-label="Main">
        <div className="nav-brand">
          <span className="brand-lockup">Piarulli</span>
          <span className="brand-sub">{planTitle}</span>
        </div>

        {/* Phone: 4 primary + More. Desktop: full list in the sidebar. */}
        <div className="nav-tabs nav-tabs-mobile">
          {PRIMARY.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`nav-tab${active === tab.id ? ' active' : ''}`}
              onClick={() => pick(tab.id)}
              aria-current={active === tab.id ? 'page' : undefined}
            >
              <TabIcon>{tab.icon}</TabIcon>
              <span>{tab.label}</span>
            </button>
          ))}

          <button
            type="button"
            className={`nav-tab${moreActive || moreOpen ? ' active' : ''}`}
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
          >
            <TabIcon>
              <circle cx="6.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="17.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
            </TabIcon>
            <span>More</span>
          </button>
        </div>

        <div className="nav-tabs nav-tabs-desktop">
          {DESKTOP_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`nav-tab${active === tab.id ? ' active' : ''}`}
              onClick={() => onChange(tab.id)}
              aria-current={active === tab.id ? 'page' : undefined}
            >
              <TabIcon>{tab.icon}</TabIcon>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {moreOpen && (
        <>
          <div className="sheet-scrim more-scrim" onClick={() => setMoreOpen(false)} />
          <div className="more-sheet" role="dialog" aria-label="More">
            <div className="sheet-grabber" />
            <h2 className="more-sheet-title">More</h2>
            <ul className="more-list">
              {MORE.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`more-row${active === item.id ? ' active' : ''}`}
                    onClick={() => pick(item.id)}
                  >
                    <span className="more-icon">
                      <TabIcon>{item.icon}</TabIcon>
                    </span>
                    <span className="more-copy">
                      <span className="more-label">{item.label}</span>
                      <span className="more-blurb">{item.blurb}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
