import { useTheme } from '../hooks/useTheme';

const ICONS = {
  light: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </>
  ),
  dark: <path d="M20 13.5A8 8 0 0 1 10.5 4a8.5 8.5 0 1 0 9.5 9.5Z" />,
  system: (
    <>
      <rect x="3" y="4" width="18" height="12.5" rx="2" />
      <path d="M8.5 20.5h7" />
    </>
  ),
};

const LABELS = { light: 'Light', dark: 'Dark', system: 'System' };

export default function ThemeToggle() {
  const { pref, cycle } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycle}
      aria-label={`Theme: ${LABELS[pref]}. Tap to change.`}
      title={`Theme: ${LABELS[pref]}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {ICONS[pref]}
      </svg>
    </button>
  );
}
