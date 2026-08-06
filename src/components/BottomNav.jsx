const TABS = [
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
    id: 'prayer',
    label: 'Prayer',
    icon: (
      <>
        <path d="M12 21c-1.2-1.6-2-3-2-4.7 0-2 1-3.4 2-5 1 1.6 2 3 2 5 0 1.7-.8 3.1-2 4.7Z" />
        <path d="M12 11.3V3M9 6l3-3 3 3" />
      </>
    ),
  },
  {
    id: 'memorize',
    label: 'Memorize',
    icon: (
      <path d="M12 3.5a5.5 5.5 0 0 0-3.4 9.8c.6.5.9 1.1.9 1.8v.4h5v-.4c0-.7.3-1.3.9-1.8A5.5 5.5 0 0 0 12 3.5ZM9.5 18.5h5M10.5 21h3" />
    ),
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />,
  },
  {
    id: 'family',
    label: 'Family',
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
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
  },
];

export default function BottomNav({ active, onChange, planTitle = 'Bible in a Year' }) {
  return (
    <nav className="app-nav">
      <div className="nav-brand">
        <span className="brand-lockup">Piarulli</span>
        <span className="brand-sub">{planTitle}</span>
      </div>

      <div className="nav-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`nav-tab${active === tab.id ? ' active' : ''}`}
            onClick={() => onChange(tab.id)}
            aria-current={active === tab.id ? 'page' : undefined}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {tab.icon}
            </svg>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
