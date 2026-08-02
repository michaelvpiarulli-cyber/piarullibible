import { parsePaperSections } from '../../lib/subsplash';

/**
 * Printed outline sitting under the SketchPad canvas — notebook margins and
 * open write bands between Subsplash sections so Pencil notes have a home.
 *
 * Gaps are direct flex children of the column so they can grow in fullscreen;
 * in the compact form they stay fixed-height and content stays at the top.
 */
export default function PaperUnderlay({ notes }) {
  const sections = parsePaperSections(notes);
  if (!sections.length) return null;

  return (
    <div className="paper-underlay" aria-hidden="true">
      <div className="paper-underlay-body">
        {sections.map((section, i) => {
          const isLast = i === sections.length - 1;
          return (
            <div key={`${section.kind}-${i}`} className="paper-block-chunk">
              <p
                className={`paper-block-text${section.kind === 'answers' ? ' is-answers' : ''}`}
              >
                {section.text}
              </p>
              <div
                className={`paper-write-gap${section.kind === 'answers' ? ' is-tight' : ''}${
                  isLast ? ' is-end' : ''
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
