import { parsePaperSections } from '../../lib/subsplash';

/**
 * Printed outline sitting under the SketchPad canvas — notebook margins and
 * open write bands between Subsplash sections so Pencil notes have a home.
 */
export default function PaperUnderlay({ notes }) {
  const sections = parsePaperSections(notes);
  if (!sections.length) return null;

  return (
    <div className="paper-underlay" aria-hidden="true">
      <div className="paper-margin-rule" />
      <div className="paper-underlay-body">
        {sections.map((section, i) => (
          <div
            key={`${section.kind}-${i}`}
            className={`paper-block${section.kind === 'answers' ? ' is-answers' : ''}`}
          >
            <p className="paper-block-text">{section.text}</p>
            <div
              className={`paper-write-gap${section.kind === 'answers' ? ' is-tight' : ''}${
                i === sections.length - 1 ? ' is-end' : ''
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
