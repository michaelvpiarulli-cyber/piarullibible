import { parseOutlineLines } from '../lib/subsplash';

function InlineSegments({ segments }) {
  return segments.map((seg, i) => {
    if (seg.type === 'blank') {
      const ch = Math.max(4, Math.min(16, seg.width || 8));
      return (
        <span
          key={i}
          className="outline-blank"
          style={{ width: `${ch * 0.55}em` }}
          aria-label="fill-in blank"
        />
      );
    }
    if (seg.type === 'bold') {
      return (
        <strong key={i} className="outline-strong">
          {seg.value}
        </strong>
      );
    }
    if (seg.type === 'italic') {
      return (
        <em key={i} className="outline-em">
          {seg.value}
        </em>
      );
    }
    if (seg.type === 'cite') {
      return (
        <cite key={i} className="outline-cite-inline">
          {seg.value}
        </cite>
      );
    }
    return <span key={i}>{seg.value}</span>;
  });
}

/**
 * Pretty-print imported Subsplash / sermon outline text —
 * scripture quotes, fill-in blanks, headings, and answer keys.
 */
export default function OutlineRichText({ text, compact = false, className = '' }) {
  const lines = parseOutlineLines(text);
  if (!lines.length) return null;

  return (
    <div className={`outline-rich${compact ? ' is-compact' : ''}${className ? ` ${className}` : ''}`}>
      {lines.map((line, i) => {
        if (line.type === 'heading') {
          return (
            <p key={i} className={`outline-heading level-${Math.min(line.level || 1, 3)}`}>
              <InlineSegments segments={line.segments} />
            </p>
          );
        }
        if (line.type === 'quote') {
          return (
            <blockquote key={i} className="outline-quote">
              <InlineSegments segments={line.segments} />
            </blockquote>
          );
        }
        if (line.type === 'cite') {
          return (
            <p key={i} className="outline-cite">
              <span className="outline-cite-mark" aria-hidden="true">
                —
              </span>
              {line.text}
            </p>
          );
        }
        if (line.type === 'answer-title') {
          return (
            <p key={i} className="outline-answer-title">
              Answer key
            </p>
          );
        }
        if (line.type === 'answer') {
          return (
            <p key={i} className="outline-answer">
              <InlineSegments segments={line.segments} />
            </p>
          );
        }
        return (
          <p key={i} className="outline-body">
            <InlineSegments segments={line.segments} />
          </p>
        );
      })}
    </div>
  );
}
