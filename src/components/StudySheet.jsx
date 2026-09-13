import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * iPhone-style bottom sheet for Passage Guide / study tools.
 * Snap points: peek (~58%) and expanded (~92%).
 */
export default function StudySheet({ open, title, subtitle, onClose, children }) {
  const sheetRef = useRef(null);
  const startY = useRef(0);
  const dragY = useRef(0);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY;
    dragY.current = 0;
  };

  const onTouchMove = (e) => {
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) return;
    dragY.current = dy;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dy}px)`;
    }
  };

  const onTouchEnd = () => {
    if (dragY.current > 120) {
      onClose?.();
    }
    if (sheetRef.current) {
      sheetRef.current.style.transform = '';
    }
    dragY.current = 0;
  };

  return createPortal(
    <div className="study-sheet-root" role="presentation">
      <button type="button" className="study-sheet-scrim" aria-label="Dismiss study" onClick={onClose} />
      <div
        ref={sheetRef}
        className="study-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Study'}
      >
        <div
          className="study-sheet-handle-zone"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="study-sheet-grabber" />
          <header className="study-sheet-head">
            <div className="study-sheet-titles">
              <h3>{title}</h3>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <button type="button" className="study-sheet-close" onClick={onClose} aria-label="Close">
              Done
            </button>
          </header>
        </div>
        <div className="study-sheet-body">{children}</div>
      </div>
    </div>,
    document.body
  );
}
