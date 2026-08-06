import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchChapter } from './PassageText';
import { buildQuiz } from '../data/readingQuiz';
import { useQuizzes } from '../hooks/useQuizzes';

/**
 * Day-level comprehension quiz — always visible on Today after the readings.
 * Covers every passage assigned for that day. The card shows immediately;
 * passage text loads when the reader starts (or in the background).
 */
export default function DayQuiz({ day, readings }) {
  const quizId = `day-${day}`;
  const { resultFor, saveResult } = useQuizzes();
  const prior = resultFor(quizId);

  const chapters = useMemo(
    () => readings.flatMap((r) => r.chapters),
    [readings]
  );
  const chapterKey = useMemo(
    () => chapters.map((c) => `${c.book}:${c.chapter}`).join('|'),
    [chapters]
  );
  const labels = useMemo(() => readings.map((r) => r.label).join(' · '), [readings]);

  const [parts, setParts] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(Boolean(prior));
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const feedbackRef = useRef(null);

  // Prefetch chapter text in the background so Start is snappy.
  useEffect(() => {
    let cancelled = false;
    setParts(null);
    setError(null);
    setLoading(true);
    setStarted(false);
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setAnswers([]);
    setFinished(Boolean(resultFor(quizId)));

    (async () => {
      try {
        const loaded = [];
        for (const c of chapters) {
          loaded.push(await fetchChapter(c.book, c.chapter));
          if (cancelled) return;
        }
        if (!cancelled) {
          setParts(loaded);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Couldn’t load quiz');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, chapterKey]);

  const quiz = useMemo(() => {
    if (!parts) return null;
    return buildQuiz(quizId, parts);
  }, [parts, quizId]);

  const questions = quiz?.questions || [];
  const question = questions[index];
  const score = answers.filter(Boolean).length;
  const ready = !loading && !error && questions.length > 0;

  const begin = () => {
    if (!ready) return;
    setStarted(true);
    setFinished(false);
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setAnswers([]);
  };

  const choose = (option) => {
    if (revealed || !question) return;
    const correct = option === question.answer;
    setSelected(option);
    setRevealed(true);
    setAnswers((prev) => {
      const next = [...prev, correct];
      answersRef.current = next;
      return next;
    });
    requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      const finalAnswers = answersRef.current;
      saveResult(quizId, {
        score: finalAnswers.filter(Boolean).length,
        total: questions.length,
        passedAt: new Date().toISOString(),
        label: `Day ${day}`,
      });
      setFinished(true);
      setStarted(false);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  };

  if (!readings.length) return null;

  // Always show the card on Today — don't wait on network before it's visible.
  if (!started) {
    return (
      <section className="reading-quiz day-quiz" aria-label={`Day ${day} quiz`}>
        <div className="quiz-head">
          <span className="quiz-eyebrow">After today’s chapters</span>
          <h4 className="quiz-title">Daily reading quiz</h4>
          <p className="quiz-blurb">
            {loading
              ? `Loading questions on ${labels}…`
              : error
                ? error
                : ready
                  ? `${questions.length} questions on what you just read${
                      prior ? ` · Last score ${prior.score}/${prior.total}` : ''
                    }`
                  : `Not enough verse text yet for ${labels}.`}
          </p>
        </div>
        <button
          type="button"
          className="btn-primary quiz-start"
          onClick={begin}
          disabled={!ready}
        >
          {loading ? 'Preparing…' : prior ? 'Retake quiz' : 'Start quiz'}
        </button>
        {finished && prior && (
          <p className={`quiz-last${prior.score === prior.total ? ' perfect' : ''}`}>
            {prior.score === prior.total
              ? 'Perfect — you nailed every question.'
              : `You got ${prior.score} of ${prior.total}. Retake anytime.`}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="reading-quiz day-quiz active" aria-label={`Day ${day} quiz`}>
      <div className="quiz-progress" aria-hidden="true">
        <div
          className="quiz-progress-bar"
          style={{ width: `${Math.round(((index + (revealed ? 1 : 0)) / questions.length) * 100)}%` }}
        />
      </div>

      <div className="quiz-head">
        <span className="quiz-eyebrow">
          Question {index + 1} of {questions.length}
        </span>
        <h4 className="quiz-title">{question.prompt}</h4>
        {question.passage && (
          <p className="quiz-passage">
            {question.passage.split('\n').map((line, i) => (
              <span key={i} className="quiz-passage-line">
                {line}
              </span>
            ))}
          </p>
        )}
      </div>

      <ul className="quiz-options">
        {question.options.map((opt) => {
          let cls = 'quiz-option';
          if (revealed) {
            if (opt === question.answer) cls += ' correct';
            else if (opt === selected) cls += ' wrong';
            else cls += ' faded';
          } else if (opt === selected) {
            cls += ' selected';
          }
          return (
            <li key={opt}>
              <button type="button" className={cls} onClick={() => choose(opt)} disabled={revealed}>
                {opt}
              </button>
            </li>
          );
        })}
      </ul>

      {revealed && (
        <div className="quiz-feedback" ref={feedbackRef}>
          <p className={selected === question.answer ? 'ok' : 'miss'}>
            {selected === question.answer ? 'Correct' : 'Not quite'}
          </p>
          <p className="quiz-explain">{question.explain}</p>
          <button type="button" className="btn-primary" onClick={next}>
            {index + 1 >= questions.length ? 'See results' : 'Next question'}
          </button>
        </div>
      )}

      {!revealed && (
        <div className="quiz-actions">
          <button type="button" className="btn-text" onClick={() => setStarted(false)}>
            Exit
          </button>
          <span className="quiz-running-score">{score} correct so far</span>
        </div>
      )}
    </section>
  );
}
