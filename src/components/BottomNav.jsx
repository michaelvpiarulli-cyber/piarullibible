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

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="app-nav">
      <div className="nav-brand">
        <span className="nav-brand-mark">B</span>
        <span className="nav-brand-text">Bible in a Year</span>
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
