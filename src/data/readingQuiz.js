/**
 * Passage-specific reading quizzes.
 *
 * Every question must be anchored to something concrete in today's text
 * (a verse, a speech, a turning point) — not a generic theology template
 * you could answer without reading.
 */

const QUESTIONS_PER_QUIZ = 10;

export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rngFrom(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rand) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pick(list, rand) {
  if (!list.length) return null;
  return list[Math.floor(rand() * list.length)];
}

function refLabel(v) {
  return `${v.book} ${v.chapter}:${v.number}`;
}

function snip(text, n = 160) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1).replace(/\s+\S*$/, '')}…`;
}

export function flattenVerses(parts) {
  const verses = [];
  for (const part of parts || []) {
    for (const v of part.verses || []) {
      const text = (v.text || '').replace(/\s+/g, ' ').trim();
      if (text.split(/\s+/).length < 5) continue;
      verses.push({
        book: part.book,
        chapter: part.chapter,
        number: v.number,
        text,
      });
    }
  }
  return verses;
}

/** Speeches: Speaker said “…” (quotes often span multiple verses). */
function extractSpeeches(verses) {
  const byChapter = new Map();
  for (const v of verses) {
    const key = `${v.book}:${v.chapter}`;
    if (!byChapter.has(key)) byChapter.set(key, []);
    byChapter.get(key).push(v);
  }

  const out = [];
  for (const [, list] of byChapter) {
    const ordered = [...list].sort((a, b) => a.number - b.number);
    let cursor = 0;
    const spans = [];
    const chunks = ordered.map((v) => {
      const start = cursor;
      const piece = `${v.text} `;
      cursor += piece.length;
      spans.push({ start, end: cursor, verse: v });
      return piece;
    });
    const blob = chunks.join('');

    const verseAt = (index) => {
      for (const s of spans) {
        if (index >= s.start && index < s.end) return s.verse;
      }
      return ordered[0];
    };

    const re =
      /((?:the )?(?:LORD|Lord|God|Jesus|Christ|Holy Spirit|angel of the Lord|Satan|serpent)|Job|Joseph|Mary|Moses|Abraham|Isaiah)\s+(?:answered(?:[\s\S]{0,60}?)(?:,)?\s*and said|has spoken|said|says|saying|spoke|commanded|declared)[,:]?\s*[“"]([\s\S]{12,450}?)[”"]/gi;

    let m;
    while ((m = re.exec(blob))) {
      const quote = m[2].replace(/\s+/g, ' ').trim();
      if (quote.length < 12) continue;
      out.push({
        speaker: m[1].replace(/^the /i, ''),
        quote,
        verse: verseAt(m.index),
      });
    }

    // “….?”, says the LORD. “…”
    const saysRe =
      /[“"]([^”"]{15,240})[”"]\s*,?\s*says the LORD\.?\s*[“"]([^”"]{15,240})[”"]/gi;
    while ((m = saysRe.exec(blob))) {
      out.push({
        speaker: 'LORD',
        quote: `${m[1].replace(/\s+/g, ' ').trim()} ${m[2].replace(/\s+/g, ' ').trim()}`.trim(),
        verse: verseAt(m.index),
      });
    }
  }

  const seen = new Set();
  return out.filter((s) => {
    const k = `${s.speaker}|${s.quote.slice(0, 80)}`.toLowerCase();
    if (seen.has(k) || s.quote.length < 12) return false;
    seen.add(k);
    return true;
  });
}

function speechWeight(s) {
  let n = 0;
  if (/^(lord|god|jesus|christ|angel|holy spirit)/i.test(s.speaker)) n += 8;
  if (/^satan$/i.test(s.speaker)) n += 6;
  if (
    /let there be|save .+ from .+ sins|immanuel|god with us|fear god for nothing|hedge around|skin for skin|rebelled against|seek justice|wash yourselves|though your sins|lord gave, and the lord has taken|naked I came|enough of the burnt|multitude of your sacrifices/i.test(
      s.quote
    )
  ) {
    n += 12;
  }
  if (/going back and forth|walking up and down/i.test(s.quote)) n -= 6;
  if (/my sons have sinned|renounced God/i.test(s.quote)) n -= 4;
  return n;
}

/**
 * Map a concrete speech to a teaching question that still depends on
 * having heard that speech — not a free-floating slogan.
 */
function teachingFromSpeech(speech, rand) {
  const q = speech.quote;
  const speaker = speech.speaker;
  const ref = refLabel(speech.verse);
  const lower = q.toLowerCase();
  const isDivine = /^(lord|god|jesus|christ|angel)/i.test(speaker);

  // Creation by word
  if (/let there be|be fruitful|let us make|let’s make|let the (earth|waters)/i.test(q)) {
    // First-style: teaching about God's word. Later fills: what specifically was commanded.
    const specific = q.match(/let(?:’s| us)? (?:there be |make |the )([^,.]+)/i);
    if (specific && !/light/i.test(specific[1])) {
      const thing = snip(specific[1].trim(), 60);
      return {
        prompt: `In ${ref}, God commands something into being: “${snip(q, 95)}” What is He ordering here?`,
        answer: `That ${thing} would come about by His word`,
        wrong: [
          'That people should invent this without Him',
          'That chaos should remain untouched',
          'That only angels may act in the world',
        ],
        explain: `${ref} shows a specific work of creation spoken by God.`,
      };
    }
    return {
      prompt: `In ${ref}, ${speaker} says, “${snip(q, 90)}” What does this show about how God works?`,
      answer: 'God accomplishes His will by His powerful word',
      wrong: [
        'God needs raw materials and a long struggle before anything happens',
        'Creation language is only poetry with no claim about God’s power',
        'God speaks, but the world ignores Him until people help',
      ],
      explain: `${ref} shows God speaking reality into being — His word is effective.`,
    };
  }

  // Gospel / salvation name
  if (/save .+ from .+ sins|immanuel|god with us/i.test(q)) {
    return {
      prompt: `In ${ref}, the promise about Jesus is: “${snip(q, 100)}” What is God making clear?`,
      answer: 'Jesus comes to save people from sin and bring God’s presence to them',
      wrong: [
        'Jesus comes mainly to improve politics and leave sin untouched',
        'The name of Jesus is symbolic only, with no saving work attached',
        'People must first perfect themselves before Jesus can help',
      ],
      explain: `${ref} announces Jesus’ mission: salvation from sin, God with us.`,
    };
  }

  // Satan’s accusation / testing faith
  if (/fear god for nothing|hedge around|skin for skin/i.test(q)) {
    return {
      prompt: `In ${ref}, Satan argues: “${snip(q, 100)}” What is he attacking?`,
      answer: 'The idea that people can love and fear God for who He is, not only for His gifts',
      wrong: [
        'The weather in the land of Uz',
        'Whether God is allowed to bless anyone at all',
        'Whether Job knew the ceremonial law',
      ],
      explain: `${ref} puts genuine faith on trial: is devotion to God real when blessings are stripped away?`,
    };
  }

  // Rebellion / indictment
  if (/rebelled|doesn’t know|don’t consider|forsaken|rejected/i.test(q)) {
    return {
      prompt: `In ${ref}, ${speaker} says, “${snip(q, 100)}” What is the charge?`,
      answer: 'God’s people have turned away from the One who cared for them',
      wrong: [
        'The nations have studied theology too carefully',
        'God admits He failed as a Father',
        'Worship schedules were running a few minutes long',
      ],
      explain: `${ref} confronts covenant unfaithfulness — forgetting the God who raised them.`,
    };
  }

  // Call to repentance / justice (Isaiah-style)
  if (/wash|seek justice|relieve the oppressed|learn to do well|though your sins/i.test(q)) {
    return {
      prompt: `In ${ref}, God calls: “${snip(q, 100)}” What does He want from His people?`,
      answer: 'Real repentance that shows up in justice, mercy, and cleaned-up lives',
      wrong: [
        'More impressive ceremonies with unchanged hearts',
        'Ignoring the vulnerable while keeping religious festivals',
        'Debating doctrine while refusing to turn from sin',
      ],
      explain: `${ref} ties returning to God with concrete righteousness, not empty ritual.`,
    };
  }

  // Comfort / presence
  if (/do not (be )?afraid|I am with|peace|comfort/i.test(q)) {
    return {
      prompt: `In ${ref}, ${speaker} says, “${snip(q, 100)}” What encouragement is being given?`,
      answer: 'God’s presence and purpose meet fear with courage to obey',
      wrong: [
        'Fear means God has already left',
        'Obedience can wait until feelings improve',
        'God only comforts people who never struggle',
      ],
      explain: `${ref} pairs God’s nearness with a call to faithful action.`,
    };
  }

  // Blessing the Lord in loss (Job)
  if (/lord gave|lord has taken|blessed be the lord/i.test(q)) {
    return {
      prompt: `After devastating loss, Job says in ${ref}: “${snip(q, 100)}” What does his response teach?`,
      answer: 'True worship can bless God’s name even when gifts are taken away',
      wrong: [
        'Faith is only real when life is comfortable',
        'Loss proves God was never generous',
        'Worship should stop until explanations arrive',
      ],
      explain: `${ref} shows faith that loves the Giver more than the gifts.`,
    };
  }

  // Generic divine speech — still anchored to the quote
  if (isDivine) {
    return {
      prompt: `In today’s reading (${ref}), ${speaker} says, “${snip(q, 110)}” Which response fits that word?`,
      answer: 'Take God at His word — trust what He says and align your life with it',
      wrong: [
        'Treat it as optional inspiration with no claim on you',
        'Assume God did not mean what He clearly said',
        'Wait for a more convenient season before paying attention',
      ],
      explain: `God has spoken in ${ref}. The right posture is trust and obedience.`,
    };
  }

  // Human speech — ask what it reveals about their heart toward God
  return {
    prompt: `In ${ref}, ${speaker} says, “${snip(q, 110)}” What does this moment expose?`,
    answer: 'A heart either turning toward God or away from Him in a real situation',
    wrong: [
      'That Bible characters never struggle',
      'That words in Scripture have no connection to the heart',
      'That God is uninterested in human speech and response',
    ],
    explain: `${ref} lets us watch a real response to God — for instruction and warning.`,
  };
}

/** Non-speech verses that still carry a clear teaching payload. */
function extractKeyClaims(verses) {
  const claims = [];
  for (const v of verses) {
    const t = v.text;
    if (/^In the beginning, God created/i.test(t)) {
      claims.push({
        verse: v,
        prompt: `Genesis ${v.chapter}:${v.number} opens with, “${snip(t, 80)}” What foundation is being laid?`,
        answer: 'The universe exists because God created it — He is Maker of all',
        wrong: [
          'The world is eternal and God merely appears later in the story',
          '“God” here is only a name for impersonal natural forces',
          'Creation is background mythology with no bearing on worship',
        ],
        explain: 'All of Scripture’s faith rests on God as Creator.',
      });
    }
    if (/image of God|in his own image/i.test(t)) {
      claims.push({
        verse: v,
        prompt: `According to ${refLabel(v)}, how are human beings described?`,
        answer: 'Made in God’s image — with God-given dignity and purpose',
        wrong: [
          'As cosmic accidents with no sacred worth',
          'As equals to God in power and authority',
          'As valuable only if they achieve greatness',
        ],
        explain: `${refLabel(v)} grounds human dignity in God’s design, not performance.`,
      });
    }
    if (/blameless and upright|feared God, and turned away from evil/i.test(t)) {
      claims.push({
        verse: v,
        prompt: `How does ${refLabel(v)} describe Job before his suffering?`,
        answer: 'As a man who feared God and turned away from evil',
        wrong: [
          'As wealthy but spiritually indifferent',
          'As secretly corrupt while looking religious',
          'As someone God had never noticed',
        ],
        explain: `${refLabel(v)} establishes Job’s integrity so his later trial is not portrayed as punishment for secret sin.`,
      });
    }
    if (/Holy Spirit|conceived|pregnant by the Holy Spirit/i.test(t) && /Mary|Jesus/i.test(t)) {
      claims.push({
        verse: v,
        prompt: `What does ${refLabel(v)} teach about Jesus’ birth?`,
        answer: 'Jesus’ conception is by the Holy Spirit — God initiating salvation',
        wrong: [
          'Jesus is only an ordinary child with an inspiring story',
          'Joseph is presented as the biological father of Jesus',
          'The virgin birth is unrelated to who Jesus is',
        ],
        explain: `${refLabel(v)} presents Jesus’ coming as God’s own saving action.`,
      });
    }
    if (/god saw .+ (good|very good)/i.test(t)) {
      claims.push({
        verse: v,
        prompt: `In ${refLabel(v)}, God sees what He has made and calls it good. What does that affirm?`,
        answer: 'Creation is purposeful and valued by God — not a mistake',
        wrong: [
          'The material world is evil and God regrets making it',
          'God is unsure whether creation was worthwhile',
          'Only spiritual things matter; the world itself does not',
        ],
        explain: `${refLabel(v)} affirms the goodness of God’s ordered world.`,
      });
    }
  }
  return claims;
}

function makeSpeechQuestion(speech, rand, used) {
  const id = `speech-${refLabel(speech.verse)}-${speech.quote.slice(0, 20)}`;
  if (used.has(id)) return null;
  used.add(id);
  const built = teachingFromSpeech(speech, rand);
  if (!built) return null;
  return {
    id,
    type: 'passage',
    prompt: built.prompt,
    passage: null,
    options: shuffle([built.answer, ...built.wrong], rand),
    answer: built.answer,
    explain: built.explain,
  };
}

function makeClaimQuestion(claim, rand, used) {
  const id = `claim-${refLabel(claim.verse)}`;
  if (used.has(id)) return null;
  used.add(id);
  return {
    id,
    type: 'passage',
    prompt: claim.prompt,
    passage: null,
    options: shuffle([claim.answer, ...claim.wrong], rand),
    answer: claim.answer,
    explain: claim.explain,
  };
}

/**
 * Quote-comprehension: what was actually said? (still meaningful, not trivia)
 * Prefer when we have multiple speeches so distractors are other real lines.
 */
function makeQuoteComprehension(speeches, rand, used) {
  if (speeches.length < 2) return null;
  const divine = speeches.filter((s) => /^(lord|god|jesus|christ|angel)/i.test(s.speaker));
  const pool = shuffle(divine.length ? divine : speeches, rand);

  for (const chosen of pool) {
    const id = `quote-${refLabel(chosen.verse)}-${chosen.quote.slice(0, 24)}`;
    if (used.has(id)) continue;
    used.add(id);

    const answer = snip(chosen.quote, 130);
    const distractors = shuffle(
      speeches.filter((s) => s.quote !== chosen.quote).map((s) => snip(s.quote, 130)),
      rand
    ).slice(0, 3);

    while (distractors.length < 3) {
      distractors.push(
        [
          'Ignore the poor and keep the festivals going',
          'Trust only what you can control with your own hands',
          'God is finished speaking and no longer involved',
        ][distractors.length]
      );
    }

    return {
      id,
      type: 'quote',
      prompt: `In ${refLabel(chosen.verse)}, what does ${chosen.speaker} say?`,
      passage: 'This line sits at the heart of today’s reading — catch what was actually spoken.',
      options: shuffle([answer, ...distractors.slice(0, 3)], rand),
      answer,
      explain: `${refLabel(chosen.verse)} — “${snip(chosen.quote, 180)}”`,
    };
  }
  return null;
}

/**
 * @param {string} readingId
 * @param {{ book: string, chapter: number, verses: { number: number, text: string }[] }[]} parts
 * @param {{ labels?: string }} [meta]
 */
export function buildQuiz(readingId, parts, meta = {}) {
  const verses = flattenVerses(parts);
  if (!verses.length) return { questions: [], verseCount: 0 };

  const rand = rngFrom(hashSeed(`${readingId}|passage-v3`));
  const used = new Set();
  const speeches = extractSpeeches(verses);
  const claims = extractKeyClaims(verses);

  const questions = [];
  const booksCovered = new Set();

  const byChapter = new Map();
  for (const s of speeches) {
    const key = `${s.verse.book}:${s.verse.chapter}`;
    if (!byChapter.has(key)) byChapter.set(key, []);
    byChapter.get(key).push(s);
  }

  // Prefer one strong, passage-anchored teaching question per chapter.
  const seenTeachKeys = new Set();
  for (const [, list] of shuffle([...byChapter.entries()], rand)) {
    if (questions.length >= QUESTIONS_PER_QUIZ) break;
    const ranked = [...list].sort((a, b) => speechWeight(b) - speechWeight(a));
    const best = ranked.find((s) => speechWeight(s) >= 6) || ranked[0];
    if (!best || speechWeight(best) < 6) continue;
    // Avoid near-duplicate “Let there be…” creation questions.
    const teachKey = /let there be/i.test(best.quote)
      ? 'creation-word'
      : /fear god for nothing|hedge/i.test(best.quote)
        ? 'job-test'
        : /rebelled|seek justice|wash yourselves|scarlet/i.test(best.quote)
          ? 'isaiah-repent'
          : /save .+ sins|immanuel/i.test(best.quote)
            ? 'jesus-save'
            : `${best.verse.book}:${best.verse.chapter}`;
    if (seenTeachKeys.has(teachKey)) continue;
    const q = makeSpeechQuestion(best, rand, used);
    if (q) {
      questions.push(q);
      booksCovered.add(best.verse.book);
      seenTeachKeys.add(teachKey);
    }
  }

  // Claims that introduce books not yet covered.
  for (const claim of shuffle(claims, rand)) {
    if (questions.length >= QUESTIONS_PER_QUIZ) break;
    if (booksCovered.has(claim.verse.book) && questions.length >= 2) continue;
    const q = makeClaimQuestion(claim, rand, used);
    if (q) {
      questions.push(q);
      booksCovered.add(claim.verse.book);
    }
  }

  // Remaining speeches / claims to reach a full quiz.
  for (const s of [...speeches].sort((a, b) => speechWeight(b) - speechWeight(a))) {
    if (questions.length >= QUESTIONS_PER_QUIZ) break;
    if (speechWeight(s) < 4) continue;
    const teachKey = /let there be/i.test(s.quote)
      ? 'creation-word'
      : /fear god for nothing|hedge/i.test(s.quote)
        ? 'job-test'
        : /rebelled|seek justice|wash yourselves|scarlet/i.test(s.quote)
          ? 'isaiah-repent'
          : /save .+ sins|immanuel/i.test(s.quote)
            ? 'jesus-save'
            : null;
    if (teachKey && seenTeachKeys.has(teachKey)) continue;
    const q = makeSpeechQuestion(s, rand, used);
    if (q) {
      questions.push(q);
      if (teachKey) seenTeachKeys.add(teachKey);
    }
  }

  for (const claim of shuffle(claims, rand)) {
    if (questions.length >= QUESTIONS_PER_QUIZ) break;
    const q = makeClaimQuestion(claim, rand, used);
    if (q) questions.push(q);
  }

  while (questions.length < QUESTIONS_PER_QUIZ) {
    const q = makeQuoteComprehension(speeches, rand, used);
    if (!q) break;
    questions.push(q);
  }

  // Last resort: still passage-tied
  if (!questions.length && verses[0]) {
    const v = verses[Math.floor(verses.length / 3)] || verses[0];
    questions.push({
      id: `anchor-${refLabel(v)}`,
      type: 'passage',
      prompt: `After reading ${meta.labels || 'today’s chapters'}, which habit best fits receiving God’s word?`,
      passage: `A line from today’s text: “${snip(v.text, 120)}” (${refLabel(v)})`,
      options: shuffle(
        [
          'Ask what this shows about God and how you should respond',
          'Skim for trivia and move on unchanged',
          'Only keep the parts that already agree with you',
          'Treat it as optional background noise',
        ],
        rand
      ),
      answer: 'Ask what this shows about God and how you should respond',
      explain: 'Scripture is for knowing God and being shaped by Him — starting with today’s text.',
    });
  }

  return {
    questions: questions.slice(0, QUESTIONS_PER_QUIZ),
    verseCount: verses.length,
  };
}

export { QUESTIONS_PER_QUIZ };
