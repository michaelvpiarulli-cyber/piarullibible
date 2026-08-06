import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchChapter } from './PassageText';
import { buildQuiz, mergeQuizQuestions, QUESTIONS_PER_QUIZ } from '../data/readingQuiz';
import { useQuizzes } from '../hooks/useQuizzes';
import { useJournal } from '../hooks/useJournal';

/** Alternate application prompts so the ending question stays personal. */
export function reflectionPromptForDay(day) {
  return day % 2 === 0
    ? 'What’s one way you’ll apply today’s reading this week?'
    : 'How does today’s reading change or deepen your view of God?';
}

/**
 * Day-level quiz after today’s chapters.
 * Prefers AI-generated, passage-specific questions when /api/quiz is configured;
 * otherwise builds anchored questions from the day’s text locally.
 * Ends with a personal application / view-of-God reflection (not scored).
 */
export default function DayQuiz({ day, readings }) {
  const quizId = `day-${day}`;
  const { resultFor, saveResult } = useQuizzes();
  const { addEntry } = useJournal();
  const prior = resultFor(quizId);
  const reflectPrompt = reflectionPromptForDay(day);

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
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState(null); // 'ai' | 'local'

  const [started, setStarted] = useState(false);
  const [reflecting, setReflecting] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [reflection, setReflection] = useState('');
  const [finished, setFinished] = useState(Boolean(prior));
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const feedbackRef = useRef(null);
  const reflectRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setParts(null);
    setQuestions([]);
    setError(null);
    setLoading(true);
    setSource(null);
    setStarted(false);
    setReflecting(false);
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setAnswers([]);
    setReflection(prior?.reflection || '');
    setFinished(Boolean(resultFor(quizId)));

    (async () => {
      try {
        const loaded = [];
        for (const c of chapters) {
          loaded.push(await fetchChapter(c.book, c.chapter));
          if (cancelled) return;
        }
        if (cancelled) return;
        setParts(loaded);

        let aiQuestions = null;
        try {
          const passages = loaded.map((p) => ({
            book: p.book,
            chapter: p.chapter,
            text: (p.verses || []).map((v) => `${v.number}. ${v.text}`).join('\n'),
          }));
          const res = await fetch('/api/quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day, labels, passages }),
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.questions) && data.questions.length > 0) {
              aiQuestions = data.questions;
            }
          }
        } catch {
          // fall through to local builder
        }

        if (cancelled) return;

        const local = buildQuiz(quizId, loaded, { labels });
        const localQs = local.questions || [];
        const merged = mergeQuizQuestions(aiQuestions, localQs);
        if (merged.length >= QUESTIONS_PER_QUIZ) {
          setQuestions(merged.slice(0, QUESTIONS_PER_QUIZ));
          setSource(aiQuestions?.length ? 'ai' : 'local');
        } else if (localQs.length >= QUESTIONS_PER_QUIZ) {
          setQuestions(localQs.slice(0, QUESTIONS_PER_QUIZ));
          setSource('local');
        } else {
          setQuestions(merged.length ? merged : localQs);
          setSource(aiQuestions?.length ? 'ai' : 'local');
        }
        setLoading(false);
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

  const question = questions[index];
  const score = answers.filter(Boolean).length;
  const ready = !loading && !error && questions.length > 0;

  const begin = () => {
    if (!ready) return;
    setStarted(true);
    setReflecting(false);
    setFinished(false);
    setIndex(0);
    setSelected(null);
    setRevealed(false);
    setAnswers([]);
    setReflection('');
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

  const finishWithReflection = (text) => {
    const finalAnswers = answersRef.current;
    const trimmed = (text || '').trim();
    saveResult(quizId, {
      score: finalAnswers.filter(Boolean).length,
      total: questions.length,
      passedAt: new Date().toISOString(),
      label: `Day ${day}`,
      reflection: trimmed || null,
      reflectionPrompt: reflectPrompt,
    });
    if (trimmed) {
      addEntry('thought', `${reflectPrompt}\n\n${trimmed}`, day);
    }
    setFinished(true);
    setReflecting(false);
    setStarted(false);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setReflecting(true);
      setRevealed(false);
      requestAnimationFrame(() => {
        reflectRef.current?.focus();
        reflectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setRevealed(false);
  };

  if (!readings.length) return null;

  if (!started) {
    return (
      <section className="reading-quiz day-quiz" aria-label={`Day ${day} quiz`}>
        <div className="quiz-head">
          <span className="quiz-eyebrow">After today’s chapters</span>
          <h4 className="quiz-title">Daily reading quiz</h4>
          <p className="quiz-blurb">
            {loading
              ? `Preparing questions from ${labels}…`
              : error
                ? error
                : ready
                  ? `${questions.length} questions + a personal reflection${
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
          <>
            <p className={`quiz-last${prior.score === prior.total ? ' perfect' : ''}`}>
              {prior.score === prior.total
                ? 'Perfect — you nailed every question.'
                : `You got ${prior.score} of ${prior.total}. Retake anytime.`}
            </p>
            {prior.reflection && (
              <div className="quiz-reflection-saved">
                <span className="quiz-reflection-label">
                  {prior.reflectionPrompt || 'Your reflection'}
                </span>
                <p>{prior.reflection}</p>
              </div>
            )}
          </>
        )}
      </section>
    );
  }

  if (reflecting) {
    return (
      <section className="reading-quiz day-quiz active" aria-label="Personal reflection">
        <div className="quiz-progress" aria-hidden="true">
          <div className="quiz-progress-bar" style={{ width: '100%' }} />
        </div>

        <div className="quiz-head">
          <span className="quiz-eyebrow">Make it personal</span>
          <h4 className="quiz-title">{reflectPrompt}</h4>
          <p className="quiz-blurb">
            Not scored — just take a moment with God before you close today’s reading.
          </p>
        </div>

        <textarea
          ref={reflectRef}
          className="quiz-reflection-input"
          rows={5}
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Write a sentence or two…"
          aria-label={reflectPrompt}
        />

        <div className="quiz-feedback">
          <button
            type="button"
            className="btn-primary"
            onClick={() => finishWithReflection(reflection)}
            disabled={!reflection.trim()}
          >
            Save reflection
          </button>
          <button
            type="button"
            className="btn-text"
            onClick={() => finishWithReflection('')}
          >
            Skip for now
          </button>
        </div>
      </section>
    );
  }

  const totalSteps = questions.length + 1; // + reflection
  const progress = ((index + (revealed ? 1 : 0)) / totalSteps) * 100;

  return (
    <section className="reading-quiz day-quiz active" aria-label={`Day ${day} quiz`}>
      <div className="quiz-progress" aria-hidden="true">
        <div className="quiz-progress-bar" style={{ width: `${Math.round(progress)}%` }} />
      </div>

      <div className="quiz-head">
        <span className="quiz-eyebrow">
          Question {index + 1} of {questions.length}
        </span>
        <h4 className="quiz-title">{question.prompt}</h4>
        {question.passage && (
          <p className="quiz-passage">
            {String(question.passage)
              .split('\n')
              .map((line, i) => (
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
            {index + 1 >= questions.length ? 'Personal reflection →' : 'Next question'}
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
