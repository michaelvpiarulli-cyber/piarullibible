import { COMMENTARIES } from '../lib/studyData';
import { READER_TRANSLATIONS } from '../hooks/useReaderPrefs';

const LEXICONS = [
  {
    id: 'strongs',
    name: 'Strong’s Exhaustive Concordance',
    blurb: 'Hebrew & Greek word numbers with definitions.',
  },
  {
    id: 'theographic',
    name: 'Factbook',
    blurb: 'People, places, and events for every chapter.',
  },
];

/**
 * Logos-style resource library — free public-domain tools available in-app.
 */
export default function LibraryPanel({ onSelectTranslation, onOpenRead, onOpenStudy }) {
  return (
    <div className="library-panel">
      <header className="library-hero">
        <h2>Library</h2>
        <p>Pick a Bible, then open commentaries and lexicons while you read.</p>
      </header>

      <section className="library-section">
        <h3>Bibles</h3>
        <ul className="library-list">
          {READER_TRANSLATIONS.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="library-card"
                onClick={() => {
                  onSelectTranslation?.(t.id);
                  onOpenRead?.();
                }}
              >
                <span className="library-card-title">{t.label}</span>
                <span className="library-card-meta">{t.name} · Free</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="library-section">
        <h3>Commentaries</h3>
        <ul className="library-list">
          {COMMENTARIES.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="library-card"
                onClick={() => onOpenStudy?.('commentary')}
              >
                <span className="library-card-title">{c.name}</span>
                <span className="library-card-meta">
                  {c.otOnly ? 'Old Testament' : 'Whole Bible'} · Classic
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="library-section">
        <h3>Lexicons & tools</h3>
        <ul className="library-list">
          {LEXICONS.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                className="library-card"
                onClick={() => onOpenStudy?.(l.id === 'strongs' ? 'words' : 'guide')}
              >
                <span className="library-card-title">{l.name}</span>
                <span className="library-card-meta">{l.blurb}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
