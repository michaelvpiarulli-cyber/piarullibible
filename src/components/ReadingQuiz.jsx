import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchChapter } from './PassageText';
import { buildQuiz } from '../data/readingQuiz';
import { useQuizzes } from '../hooks/useQuizzes';

/**
 * Short comprehension quiz generated from the passage the reader just finished.
 * Mounted at the foot of each expanded ReadingRow.
 */
export default function ReadingQuiz({ reading }) {
  const { resultFor, saveResult } = useQuizzes();
  const prior = resultFor(reading.id);

  const [parts, setParts] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState([]); // boolean per question
  const [finished, setFinished] = useState(Boolean(prior));
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Reload chapter text (hits PassageText's shared cache when already read).
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
    setFinished(Boolean(resultFor(reading.id)));

    (async () => {
      try {
        const loaded = [];
        for (const c of reading.chapters) {
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
  }, [reading.id, reading.chapters]);

  const quiz = useMemo(() => {
    if (!parts) return null;
    return buildQuiz(reading.id, parts);
  }, [parts, reading.id]);

  const questions = quiz?.questions || [];
  const question = questions[index];
  const score = answers.filter(Boolean).length;

  const begin = () => {
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
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      const finalAnswers = answersRef.current;
      saveResult(reading.id, {
        score: finalAnswers.filter(Boolean).length,
        total: questions.length,
        passedAt: new Date().toISOString(),
        label: reading.label,
      });
      setFinished(true);
      setStarted(false);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  };

  if (loading) {
    return (
      <section className="reading-quiz" aria-busy="true">
        <div className="quiz-status">Preparing quiz…</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="reading-quiz">
        <div className="quiz-status quiz-error">{error}</div>
      </section>
    );
  }

  if (!questions.length) {
    return null;
  }

  // Collapsed summary after a completed attempt (or before starting).
  if (!started) {
    return (
      <section className="reading-quiz" aria-label={`Quiz for ${reading.label}`}>
        <div className="quiz-head">
          <span className="quiz-eyebrow">Check your reading</span>
          <h4 className="quiz-title">Quick quiz</h4>
          <p className="quiz-blurb">
            {questions.length} questions on {reading.label}
            {prior
              ? ` · Last score ${prior.score}/${prior.total}`
              : ' · Drawn from the passage above'}
          </p>
        </div>
        <button type="button" className="btn-primary quiz-start" onClick={begin}>
          {prior ? 'Retake quiz' : 'Start quiz'}
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
    <section className="reading-quiz active" aria-label={`Quiz for ${reading.label}`}>
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
              <button
                type="button"
                className={cls}
                onClick={() => choose(opt)}
                disabled={revealed}
              >
                {opt}
              </button>
            </li>
          );
        })}
      </ul>

      {revealed && (
        <div className="quiz-feedback">
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
