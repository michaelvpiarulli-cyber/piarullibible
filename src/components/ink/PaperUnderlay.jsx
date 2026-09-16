import { classifyOutlineSection, parsePaperSections } from '../../lib/subsplash';
import OutlineRichText from '../OutlineRichText';

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
          const kind = section.kind || classifyOutlineSection(section.text);
          return (
            <div key={`${kind}-${i}`} className={`paper-block-chunk is-${kind}`}>
              <div
                className={`paper-block-text${kind === 'answers' ? ' is-answers' : ''}${
                  kind === 'quote' ? ' is-quote' : ''
                }${kind === 'heading' ? ' is-heading' : ''}`}
              >
                <OutlineRichText text={section.text} />
              </div>
              <div
                className={`paper-write-gap${kind === 'answers' || kind === 'heading' ? ' is-tight' : ''}${
                  kind === 'quote' ? ' is-quote-gap' : ''
                }${isLast ? ' is-end' : ''}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
