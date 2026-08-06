/**
 * Vercel serverless quiz generator.
 * When OPENAI_API_KEY (or AI_GATEWAY_API_KEY) is set, writes passage-specific
 * questions about what God is teaching in the day's readings.
 *
 * POST body: { day, labels, passages: [{ book, chapter, text }] }
 * Returns: { questions: [{ id, prompt, passage, options, answer, explain }] }
 */

const SYSTEM = `You write short Bible-reading quiz questions for Christians who just finished today's chapters.

Rules:
- Every question MUST be about something concrete in the provided text (a person, speech, event, command, or claim).
- Focus on what God is revealing / teaching / calling for — not trivia like "which verse number comes first".
- A careful reader of THIS passage should do well; someone who skipped reading should not.
- Multiple choice with exactly 4 options; one clearly best answer.
- Wrong options should be plausible misreadings, not joke answers.
- Keep prompts to 1–2 sentences. Keep options concise.
- Return ONLY valid JSON matching the schema.`;

function trimPassages(passages) {
  return (passages || []).map((p) => ({
    book: p.book,
    chapter: p.chapter,
    // Cap length so prompts stay affordable
    text: String(p.text || '').slice(0, 3500),
  }));
}

function normalizeQuestions(raw) {
  const list = Array.isArray(raw) ? raw : raw?.questions;
  if (!Array.isArray(list)) return [];
  return list
    .map((q, i) => {
      const options = Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : [];
      const answer = String(q.answer || '');
      if (options.length < 2 || !answer || !options.includes(answer)) return null;
      while (options.length < 4) options.push(`Option ${options.length + 1}`);
      return {
        id: String(q.id || `ai-${i}`),
        type: 'ai',
        prompt: String(q.prompt || '').trim(),
        passage: q.passage ? String(q.passage) : null,
        options,
        answer,
        explain: String(q.explain || '').trim(),
      };
    })
    .filter((q) => q && q.prompt);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY;
  if (!key) {
    return res.status(503).json({
      error: 'AI quiz not configured',
      fallback: true,
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const passages = trimPassages(body.passages);
    if (!passages.length) return res.status(400).json({ error: 'No passages' });

    const userPrompt = {
      day: body.day,
      labels: body.labels,
      instruction:
        'Write exactly 10 multiple-choice questions for this day. Cover each major passage. Mix: what God said/did, what that reveals about Him, the response God seeks, and the heart of key movements in the text. Every question must require having read THIS text.',
      passages,
      schema: {
        questions: [
          {
            id: 'string',
            prompt: 'string',
            passage: 'optional short quote or null',
            options: ['a', 'b', 'c', 'd'],
            answer: 'must be one of options',
            explain: 'one sentence tying answer to the text’s teaching',
          },
        ],
      },
    };

    const baseUrl = process.env.OPENAI_API_KEY
      ? 'https://api.openai.com/v1'
      : 'https://ai-gateway.vercel.sh/v1';
    const model = process.env.QUIZ_MODEL || (process.env.OPENAI_API_KEY ? 'gpt-4o-mini' : 'openai/gpt-4o-mini');

    const aiRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: JSON.stringify(userPrompt) },
        ],
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text();
      return res.status(502).json({ error: 'AI provider error', detail: detail.slice(0, 300), fallback: true });
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(502).json({ error: 'Bad AI JSON', fallback: true });
    }

    const questions = normalizeQuestions(parsed);
    if (questions.length < 5) {
      return res.status(502).json({ error: 'Too few questions', fallback: true });
    }

    return res.status(200).json({ questions, source: 'ai' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Quiz failed', fallback: true });
  }
}
