/**
 * Renders a day’s portion (or a full chapter) of the pastor’s book.
 * Paragraphs may span chapter boundaries; a heading appears when a new
 * chapter begins inside the selection.
 */
export default function BookText({ paragraphs, placeholder = false, author, emptyLabel }) {
  if (!paragraphs?.length) {
    return <p className="passage-status">{emptyLabel || 'No text for this reading yet.'}</p>;
  }

  let lastChapter = null;

  return (
    <div className="book-text">
      {placeholder && (
        <p className="book-placeholder-banner">
          Sample content — replace with your pastor’s book when the pages are ready.
        </p>
      )}
      {author && <p className="book-byline">{author}</p>}
      {paragraphs.map((p, i) => {
        const showHeading =
          p.isChapterStart || (p.chapterNumber != null && p.chapterNumber !== lastChapter);
        lastChapter = p.chapterNumber ?? lastChapter;
        return (
          <div key={`${p.chapterNumber}-${i}`} className="book-block">
            {showHeading && p.chapterTitle && (
              <h4 className="book-chapter-title">
                {p.chapterNumber != null ? `${p.chapterNumber}. ` : ''}
                {p.chapterTitle}
              </h4>
            )}
            <p className="book-paragraph">{p.text}</p>
          </div>
        );
      })}
    </div>
  );
}
