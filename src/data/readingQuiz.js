/**
 * Conceptual reading quizzes — test what God is teaching, not verse trivia.
 *
 * Questions focus on:
 * - What the passage reveals about God
 * - What God said, commanded, or promised
 * - The heart of the teaching / takeaway
 * - Faithful vs unfaithful responses
 */

const QUESTIONS_PER_QUIZ = 4;

/** Stable string → uint32 seed. */
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

function fullText(verses) {
  return verses.map((v) => v.text).join(' ');
}

function snip(text, n = 180) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1).replace(/\s+\S*$/, '')}…`;
}

/**
 * Theme lessons matched against the day's text.
 * Each theme has teaching-focused questions with one right answer and
 * plausible-but-wrong options (common misunderstandings).
 */
const THEMES = [
  {
    id: 'creation',
    test: (t, books) =>
      (books.has('Genesis') && /\b(created|creation|heavens and the earth|let there be|image of god)\b/i.test(t)) ||
      /\b(created|creation|heavens and the earth|let there be light|formless and empty|image of god|male and female he created)\b/i.test(
        t
      ),
    questions: [
      {
        prompt: 'What does this reading teach about how the world came to be?',
        answer: 'God spoke creation into being by His word and declared it good',
        wrong: [
          'The world arranged itself without a Creator',
          'Creation was an accident God later adopted',
          'Angels designed the earth and God approved it',
        ],
        explain: 'Scripture presents God as the intentional Creator whose word brings life and order.',
      },
      {
        prompt: 'According to this passage, what is true about people?',
        answer: 'Humans are made in God’s image and given purpose under His care',
        wrong: [
          'People are no different from animals in God’s eyes',
          'Human dignity is only earned by good behavior',
          'God is distant from ordinary human life',
        ],
        explain: 'Being made in God’s image means every person has God-given worth and calling.',
      },
    ],
  },
  {
    id: 'fall-sin',
    test: (t) =>
      /\b(serpent|cursed|ashamed|hid|sin|transgression|iniquity|evil|disobey|forbidden)\b/i.test(t) &&
      /\b(god|lord|garden|adam|eve|fruit)\b/i.test(t),
    questions: [
      {
        prompt: 'What does this passage show about sin?',
        answer: 'Sin begins with distrusting God and leads to shame, brokenness, and separation',
        wrong: [
          'Sin is only a private feeling with no real consequences',
          'Sin is mostly other people’s problem, not ours',
          'God overlooks disobedience if intentions seem good',
        ],
        explain: 'The Bible treats sin as rebellion against God that damages our relationship with Him and others.',
      },
    ],
  },
  {
    id: 'covenant-promise',
    test: (t) =>
      /\b(covenant|I will establish|I will make of you|promised land|oath to abraham|descendants as the stars|bless(ing)? all (the )?nations|everlasting covenant)\b/i.test(
        t
      ),
    questions: [
      {
        prompt: 'What is God doing through His promise in this reading?',
        answer: 'God commits Himself to bless and keep His people according to His word',
        wrong: [
          'God makes deals He may later abandon if people fail',
          'Promises in Scripture are only inspiring metaphors',
          'God’s favor depends entirely on human negotiation',
        ],
        explain: 'God’s covenant promises reveal His faithfulness — He binds Himself by His own word.',
      },
    ],
  },
  {
    id: 'faith-trust',
    test: (t) =>
      /\b(faith|believe[ds]?|trusted|trust in|counted .* righteousness|without seeing)\b/i.test(t),
    questions: [
      {
        prompt: 'What does this passage teach about faith?',
        answer: 'Faith means trusting God’s word and character, even when we cannot see the outcome',
        wrong: [
          'Faith is pretending to be certain about things we know are false',
          'Faith is mainly a feeling that comes and goes',
          'Faith is unnecessary if we have enough information',
        ],
        explain: 'Biblical faith is active trust in God — taking Him at His word.',
      },
    ],
  },
  {
    id: 'suffering-job',
    test: (t, books) =>
      books.has('Job') ||
      /\b(suffer|afflict|why have you|though he slay|patience|tested)\b/i.test(t),
    questions: [
      {
        prompt: 'What does this reading push us to remember in suffering?',
        answer: 'God’s wisdom and faithfulness are deeper than our explanations of pain',
        wrong: [
          'Suffering always means God has abandoned someone',
          'If you have enough faith, hard things never come',
          'The righteous should never question or lament before God',
        ],
        explain: 'Scripture makes room for lament while still calling us to trust God’s goodness and sovereignty.',
      },
    ],
  },
  {
    id: 'repentance-judgment',
    test: (t) =>
      /\b(repent|return to|woe|judgment|justice|iniquity|forsake|seek the lord|wash yourselves)\b/i.test(
        t
      ),
    questions: [
      {
        prompt: 'What is God calling for in this kind of passage?',
        answer: 'Turning from sin to God with a sincere heart, not empty religion',
        wrong: [
          'Keeping up appearances while ignoring injustice and idolatry',
          'Blaming God for the consequences of rebellion',
          'Assuming religious activity replaces obedience',
        ],
        explain: 'The prophets press God’s people toward real repentance — changed hearts that produce changed lives.',
      },
    ],
  },
  {
    id: 'gospel-jesus',
    test: (t, books) =>
      [...books].some((b) =>
        /Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Hebrews|Peter|Jude|Revelation/.test(
          b
        )
      ) || /\b(jesus|christ|gospel|kingdom of heaven|son of (man|god)|cross|resurrection)\b/i.test(t),
    questions: [
      {
        prompt: 'What does this New Testament reading center on?',
        answer: 'Jesus — who He is, what He teaches, and how God saves through Him',
        wrong: [
          'Tips for self-improvement without needing a Savior',
          'A call to earn God’s love by flawless performance',
          'Advice that leaves Jesus as only a moral example',
        ],
        explain: 'The New Testament continually points to Jesus as Lord and Savior, not merely a teacher.',
      },
    ],
  },
  {
    id: 'kingdom-discipleship',
    test: (t) =>
      /\b(kingdom|disciple|follow me|blessed are|love your enemies|sermon|teach(ing|es)? them)\b/i.test(
        t
      ),
    questions: [
      {
        prompt: 'What kind of life is Jesus calling His followers to?',
        answer: 'A life shaped by God’s kingdom — humble, obedient, and marked by love',
        wrong: [
          'A life focused mainly on status, comfort, and looking spiritual',
          'Keeping faith private so it never affects how we treat others',
          'Obeying only the commands that feel easy or popular',
        ],
        explain: 'Discipleship means learning from Jesus and living under His reign in ordinary life.',
      },
    ],
  },
  {
    id: 'wisdom-fear',
    test: (t, books) =>
      books.has('Proverbs') ||
      books.has('Ecclesiastes') ||
      books.has('Job') ||
      /\b(wisdom|fear of (the )?lord|understanding|foolish|vanity)\b/i.test(t),
    questions: [
      {
        prompt: 'What is the beginning of true wisdom in Scripture?',
        answer: 'The fear of the Lord — reverent trust and obedience toward God',
        wrong: [
          'Gathering as many opinions as possible',
          'Trusting your instincts above God’s word',
          'Avoiding hard questions about life and God',
        ],
        explain: 'Biblical wisdom starts with knowing who God is and living accordingly.',
      },
    ],
  },
  {
    id: 'psalm-worship',
    test: (t, books) =>
      books.has('Psalms') ||
      /\b(praise|psalm|sing to the lord|refuge|shepherd|bless the lord|worship)\b/i.test(t),
    questions: [
      {
        prompt: 'What do passages like this invite God’s people to do?',
        answer: 'Bring real praise, trust, and honest prayer before God',
        wrong: [
          'Hide struggle and only speak polished religious words',
          'Treat worship as entertainment rather than response to God',
          'Rely on ourselves instead of making God our refuge',
        ],
        explain: 'The Psalms teach us to worship with honesty — joy, lament, trust, and praise.',
      },
    ],
  },
  {
    id: 'law-obedience',
    test: (t, books) =>
      books.has('Exodus') ||
      books.has('Leviticus') ||
      books.has('Numbers') ||
      books.has('Deuteronomy') ||
      /\b(commandment|statutes|ordinances|law of (the )?lord|you shall not|keep my commandments)\b/i.test(
        t
      ),
    questions: [
      {
        prompt: 'Why does God give commands in passages like this?',
        answer: 'To shape a holy people who love Him and walk in His ways',
        wrong: [
          'To invent busywork unrelated to the heart',
          'So people can earn salvation by perfect rule-keeping alone',
          'To keep God distant from everyday life',
        ],
        explain: 'God’s law reveals His character and trains His people to live as His own.',
      },
    ],
  },
  {
    id: 'providence-care',
    test: (t) =>
      /\b(provide|shepherd|care(s|d)? for|with you|do not fear|I am with|refuge|sustains)\b/i.test(t),
    questions: [
      {
        prompt: 'What does this reading reveal about God’s care?',
        answer: 'God is present and faithful to sustain those who belong to Him',
        wrong: [
          'God only helps after we have everything under control',
          'God is powerful but uninterested in ordinary needs',
          'Trusting God means never needing courage or perseverance',
        ],
        explain: 'Again and again, God assures His people of His presence and provision.',
      },
    ],
  },
  {
    id: 'mercy-forgiveness',
    test: (t) =>
      /\b(mercy|merciful|forgive|forgiveness|compassion|gracious|steadfast love|cleanse)\b/i.test(t),
    questions: [
      {
        prompt: 'What does this passage highlight about God’s heart?',
        answer: 'God is merciful and ready to forgive those who turn to Him',
        wrong: [
          'God is eager to condemn and slow to show compassion',
          'Forgiveness is earned only by never failing again',
          'Mercy means sin no longer matters at all',
        ],
        explain: 'God’s mercy does not ignore sin — it meets sinners with grace that restores.',
      },
    ],
  },
  {
    id: 'mission-witness',
    test: (t) =>
      /\b(nations|gentiles|make disciples|witness|gospel|light to|send|go therefore)\b/i.test(t),
    questions: [
      {
        prompt: 'What mission heartbeat shows up in this reading?',
        answer: 'God’s blessing and truth are meant to reach beyond one person or people',
        wrong: [
          'Faith is only for a private spiritual club',
          'God’s concern stops at national or family boundaries',
          'Witness is optional for serious disciples',
        ],
        explain: 'From Abraham to Jesus’ commission, God aims His blessing outward to the nations.',
      },
    ],
  },
];

/** Generic fallbacks when no theme matches strongly enough. */
const FALLBACK_TEACHING = [
  {
    prompt: 'What should we look for first in a Bible reading like today’s?',
    answer: 'What it reveals about God and how He calls us to respond',
    wrong: [
      'Only unusual facts we can impress others with',
      'A hidden code unrelated to the plain meaning',
      'Ways to make the text say whatever we already wanted',
    ],
    explain: 'Scripture is God-breathed — we read to know Him and be changed.',
  },
  {
    prompt: 'Which posture best fits hearing God’s word?',
    answer: 'Humility — ready to trust, obey, and be corrected by God',
    wrong: [
      'Standing over the text as its final judge',
      'Listening only for verses that comfort us',
      'Treating the reading as optional background noise',
    ],
    explain: 'A teachable heart is the right response to God’s word.',
  },
];

export function flattenVerses(parts) {
  const verses = [];
  for (const part of parts || []) {
    for (const v of part.verses || []) {
      const text = (v.text || '').replace(/\s+/g, ' ').trim();
      if (text.split(/\s+/).length < 6) continue;
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

/** Pull speech attributed to God / the Lord / Jesus. */
function extractDivineSpeech(verses) {
  const out = [];
  const speechRe =
    /\b((?:the )?(?:Lord|God|Jesus|Christ)|Yahweh)\b[^.?!]{0,40}\b(?:said|says|saying|spoke|answered|commanded|promised|declared)\b[,:]?\s*[“"]([^”"]{20,220})[”"]/gi;

  for (const v of verses) {
    let m;
    const text = v.text;
    speechRe.lastIndex = 0;
    while ((m = speechRe.exec(text))) {
      out.push({
        speaker: m[1],
        quote: m[2].replace(/\s+/g, ' ').trim(),
        verse: v,
      });
    }
    // Also catch: God said, “…” without long middle gap
    const simple = text.match(
      /\b(God|the Lord|Jesus)\s+said,?\s*[“"]([^”"]{20,220})[”"]/i
    );
    if (simple) {
      out.push({
        speaker: simple[1],
        quote: simple[2].replace(/\s+/g, ' ').trim(),
        verse: v,
      });
    }
  }

  // Dedupe by quote
  const seen = new Set();
  return out.filter((s) => {
    const key = s.quote.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Detect divine actions for character questions. */
function extractDivineActions(verses) {
  const actions = [];
  const patterns = [
    {
      re: /\bGod (created|made|formed)\b/i,
      teaching: 'God is the Creator who brings life and order by His power',
      wrong: [
        'Creation runs on its own with no personal God behind it',
        'God only observes the world but never acts in it',
        'Matter is eternal and God merely rearranges it',
      ],
    },
    {
      re: /\bGod (blessed|blesses)\b/i,
      teaching: 'God freely gives blessing and life to what He has made',
      wrong: [
        'Blessing is random luck with no Giver',
        'God blesses only those who never struggle',
        'Blessing means life will be easy and painless',
      ],
    },
    {
      re: /\b(God|the Lord|Jesus) (forgave|forgives|had compassion|was moved with compassion)\b/i,
      teaching: 'God’s heart is compassionate toward sinners and sufferers',
      wrong: [
        'God is cold and unmoved by human need',
        'Compassion is weakness God does not show',
        'God only cares about the already-righteous',
      ],
    },
    {
      re: /\b(God|the Lord) (commanded|commands|said, “You shall|said, “Do not)\b/i,
      teaching: 'God speaks with authority and calls His people to obey',
      wrong: [
        'God’s commands are suggestions we can safely ignore',
        'Divine commands are outdated and irrelevant',
        'Obedience is optional if we feel spiritual enough',
      ],
    },
    {
      re: /\b(God|the Lord) (saw|looked|heard)\b/i,
      teaching: 'God sees and knows — nothing in creation is hidden from Him',
      wrong: [
        'God is unaware of what happens on earth',
        'God only notices public religious acts',
        'God’s knowledge is limited like ours',
      ],
    },
  ];

  const blob = fullText(verses);
  for (const p of patterns) {
    if (p.re.test(blob)) actions.push(p);
  }
  return actions;
}

function makeThemeQuestions(verses, rand, used) {
  const text = fullText(verses);
  const books = new Set(verses.map((v) => v.book));
  const matched = THEMES.filter((th) => th.test(text, books));
  const pool = matched.length ? matched : [{ id: 'fallback', questions: FALLBACK_TEACHING }];

  const questions = [];
  for (const theme of shuffle(pool, rand)) {
    for (const q of shuffle(theme.questions, rand)) {
      const id = `theme-${theme.id}-${q.prompt.slice(0, 24)}`;
      if (used.has(id)) continue;
      used.add(id);
      questions.push({
        id,
        type: 'teaching',
        prompt: q.prompt,
        passage: null,
        options: shuffle([q.answer, ...q.wrong], rand),
        answer: q.answer,
        explain: q.explain,
      });
    }
  }
  return questions;
}

function makeDivineSpeechQuestion(verses, rand, used) {
  const speeches = extractDivineSpeech(verses);
  if (speeches.length < 1) return null;

  const chosen = pick(speeches, rand);
  const id = `speech-${refLabel(chosen.verse)}`;
  if (used.has(id)) return null;
  used.add(id);

  const answer = snip(chosen.quote, 140);
  const otherQuotes = speeches
    .filter((s) => s.quote !== chosen.quote)
    .map((s) => snip(s.quote, 140));

  const distractors = [
    ...otherQuotes,
    'Follow your own heart above everything else',
    'There is no need to trust God when life is hard',
    'God’s word is optional for the spiritually mature',
    'Blessing comes only to those who never fail',
  ].filter((d, i, arr) => d !== answer && arr.indexOf(d) === i);

  if (distractors.length < 3) return null;

  return {
    id,
    type: 'god-said',
    prompt: `In ${refLabel(chosen.verse)}, what did ${chosen.speaker} say?`,
    passage: `Listen for the heart of ${chosen.speaker}’s words in today’s reading.`,
    options: shuffle([answer, ...shuffle(distractors, rand).slice(0, 3)], rand),
    answer,
    explain: `${refLabel(chosen.verse)} — “${snip(chosen.quote, 160)}”`,
  };
}

function makeCharacterQuestion(verses, rand, used) {
  const actions = extractDivineActions(verses);
  if (!actions.length) return null;
  const chosen = pick(actions, rand);
  const id = `character-${chosen.teaching.slice(0, 28)}`;
  if (used.has(id)) return null;
  used.add(id);

  return {
    id,
    type: 'character',
    prompt: 'What does today’s reading reveal about God?',
    passage: null,
    options: shuffle([chosen.teaching, ...chosen.wrong], rand),
    answer: chosen.teaching,
    explain: 'Pay attention to what God does and says — His actions reveal His character.',
  };
}

function makeSummaryQuestion(verses, readingsMeta, rand, used) {
  if (used.has('summary')) return null;
  used.add('summary');

  const books = [...new Set(verses.map((v) => v.book))];
  const labels = readingsMeta?.labels || books.join(', ');
  const text = fullText(verses).toLowerCase();

  // Build a grounded summary from strongest signals.
  let answer =
    'God is making Himself known and calling for a faithful response to His word';
  const wrong = [
    'The reading is mainly random stories with no shared purpose',
    'The point is to collect trivia rather than know God',
    'God’s word today has no claim on how we live',
  ];

  if (/\bcreated|let there be|image of god\b/.test(text)) {
    answer = 'God is Creator — He speaks, orders, and gives life with purpose';
  } else if (/\brepent|woe|iniquity|justice\b/.test(text)) {
    answer = 'God confronts sin and calls His people back to sincere repentance';
  } else if (/\bjesus|kingdom|disciple|gospel\b/.test(text)) {
    answer = 'Jesus reveals God’s kingdom and calls people to follow Him';
  } else if (/\bcovenant|promise|bless\b/.test(text)) {
    answer = 'God keeps covenant and advances His promises for His people';
  } else if (/\bsuffer|afflict|job\b/.test(text) || books.includes('Job')) {
    answer = 'In suffering, God’s wisdom and faithfulness still hold when our explanations fail';
  }

  return {
    id: 'summary',
    type: 'summary',
    prompt: `Which best captures the heart of today’s reading (${labels})?`,
    passage: null,
    options: shuffle([answer, ...wrong], rand),
    answer,
    explain: 'Look for what God is revealing about Himself and what He asks of His people.',
  };
}

function makeResponseQuestion(verses, rand, used) {
  const text = fullText(verses);
  const id = 'response';
  if (used.has(id)) return null;

  const patterns = [
    {
      test: /\b(believe[ds]?|trusted|obeyed|followed|worshiped|praised|repented)\b/i,
      prompt: 'What kind of response does this passage commend?',
      answer: 'Trusting God and responding with obedience, worship, or repentance',
      wrong: [
        'Ignoring God’s word while staying religious on the outside',
        'Hardening your heart when God speaks',
        'Using Scripture only to win arguments',
      ],
      explain: 'A living response to God — faith, obedience, worship — is the fruit Scripture seeks.',
    },
    {
      test: /\b(afraid|hid|hardened|refused|grumbled|complained|idol)\b/i,
      prompt: 'What warning can we take from human responses in this reading?',
      answer: 'Unbelief, hiding, and hardness of heart push us away from God',
      wrong: [
        'Fear and resistance are always healthy spirituality',
        'God is pleased when we refuse His word',
        'There is no danger in ignoring conviction',
      ],
      explain: 'Scripture often shows failed responses so we will choose trust instead.',
    },
  ];

  const hit = patterns.find((p) => p.test.test(text));
  if (!hit) return null;
  used.add(id);

  return {
    id,
    type: 'response',
    prompt: hit.prompt,
    passage: null,
    options: shuffle([hit.answer, ...hit.wrong], rand),
    answer: hit.answer,
    explain: hit.explain,
  };
}

/**
 * Build up to QUESTIONS_PER_QUIZ concept-focused questions.
 * @param {string} readingId
 * @param {{ book: string, chapter: number, verses: { number: number, text: string }[] }[]} parts
 * @param {{ labels?: string }} [meta]
 */
export function buildQuiz(readingId, parts, meta = {}) {
  const verses = flattenVerses(parts);
  if (verses.length < 1) {
    return { questions: [], verseCount: 0 };
  }

  const rand = rngFrom(hashSeed(`${readingId}|concept-v2`));
  const used = new Set();

  const candidates = [
    ...makeThemeQuestions(verses, rand, used),
    makeDivineSpeechQuestion(verses, rand, used),
    makeCharacterQuestion(verses, rand, used),
    makeResponseQuestion(verses, rand, used),
    makeSummaryQuestion(verses, meta, rand, used),
  ].filter(Boolean);

  // Prefer teaching/character/summary over quote-recall when we have enough.
  const priority = { teaching: 0, character: 1, summary: 2, response: 3, 'god-said': 4 };
  const ranked = shuffle(candidates, rand).sort(
    (a, b) => (priority[a.type] ?? 9) - (priority[b.type] ?? 9)
  );

  const questions = [];
  const typesUsed = new Set();
  for (const q of ranked) {
    if (questions.length >= QUESTIONS_PER_QUIZ) break;
    // Keep variety: at most one god-said unless we are short.
    if (q.type === 'god-said' && typesUsed.has('god-said') && questions.length < 3) continue;
    if (typesUsed.has(q.type) && q.type !== 'teaching' && questions.length < QUESTIONS_PER_QUIZ - 1) {
      // allow multiple teaching questions
      if (q.type !== 'teaching') continue;
    }
    questions.push(q);
    typesUsed.add(q.type);
  }

  // Fill remaining slots with leftover teaching questions.
  if (questions.length < QUESTIONS_PER_QUIZ) {
    for (const q of ranked) {
      if (questions.length >= QUESTIONS_PER_QUIZ) break;
      if (questions.some((x) => x.id === q.id)) continue;
      questions.push(q);
    }
  }

  return { questions: questions.slice(0, QUESTIONS_PER_QUIZ), verseCount: verses.length };
}

export { QUESTIONS_PER_QUIZ };
