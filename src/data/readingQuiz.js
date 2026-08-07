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

const SPEAKER =
  '(?:the )?(?:LORD|Lord|God|Jesus|Christ|Holy Spirit|angel of the Lord|Satan|serpent|Pharaoh)|Job|Joseph|Mary|Moses|Abraham|Abram|Isaiah|Peter|Paul|David|Solomon|Samuel|Nathan|Elijah|Elisha|Jonah|Noah|Cain|Jacob|Esau|Ruth|Boaz|Hannah|Deborah|Joshua|Caleb';

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

    // Allow “said to Abram,” / “answered him,” between verb and quote.
    const re = new RegExp(
      `(${SPEAKER})\\s+(?:answered(?:[\\s\\S]{0,80}?)(?:,)?\\s*and said|has spoken|said|says|saying|spoke|commanded|declared|replied|asked)[\\s\\S]{0,90}?[“"]([\\s\\S]{12,450}?)[”"]`,
      'gi'
    );

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
    /let there be|save .+ from .+ sins|immanuel|god with us|fear god for nothing|hedge around|skin for skin|rebelled against|seek justice|wash yourselves|though your sins|lord gave, and the lord has taken|naked I came|enough of the burnt|multitude of your sacrifices|leave your country|I will bless|I will make of you|follow me|repent|kingdom of heaven|born again|I am the/i.test(
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
function teachingFromSpeech(speech) {
  const q = speech.quote;
  const speaker = speech.speaker;
  const ref = refLabel(speech.verse);
  const isDivine = /^(lord|god|jesus|christ|angel)/i.test(speaker);

  // Call / obedience (Abram, disciples, etc.)
  if (/leave your country|go to the land|follow me|come after me|go therefore|get up and go/i.test(q)) {
    return {
      prompt: `In ${ref}, ${speaker} says, “${snip(q, 100)}” What is being asked?`,
      answer: 'Trust God enough to leave the familiar and obey His call',
      wrong: [
        'Stay put until every detail of the future is explained',
        'Treat God’s word as optional advice for later',
        'Negotiate a safer path that never costs anything',
      ],
      explain: `${ref} shows faith as response — hearing God and moving when He speaks.`,
    };
  }

  // Promise / blessing
  if (/I will bless|I will make|I will give|you will be a blessing|all (?:the )?families|covenant/i.test(q)) {
    return {
      prompt: `In ${ref}, God promises: “${snip(q, 100)}” What does this reveal?`,
      answer: 'God’s purposes are generous — He initiates blessing and keeps His word',
      wrong: [
        'Blessing depends only on human cleverness and luck',
        'God’s promises are vague slogans with no real claim',
        'God blesses only those who never struggle or fail',
      ],
      explain: `${ref} anchors hope in God’s promise, not in self-made security.`,
    };
  }

  // Creation by word
  if (/let there be|be fruitful|let us make|let’s make|let the (earth|waters)/i.test(q)) {
    const specific = q.match(/let(?:’s| us)? (?:there be |make |the )([^,.]+)/i);
    if (specific && !/light/i.test(specific[1])) {
      const thing = snip(specific[1].trim(), 70);
      return {
        prompt: `In ${ref}, God says, “${snip(q, 95)}” What is He bringing about?`,
        answer: `${thing.charAt(0).toUpperCase()}${thing.slice(1)} — by His spoken command`,
        wrong: [
          'A world that runs without His involvement',
          'Chaos left exactly as it was',
          'A creation that people invent on their own',
        ],
        explain: `${ref} records a specific work God speaks into being.`,
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

  // Call to repentance / justice
  if (/wash|seek justice|relieve the oppressed|learn to do well|though your sins|repent/i.test(q)) {
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

  // Kingdom / identity of Jesus
  if (/kingdom of heaven|kingdom of god|son of man|I am the|born again|take up .+ cross/i.test(q)) {
    return {
      prompt: `In ${ref}, Jesus says, “${snip(q, 100)}” What is He pressing on His hearers?`,
      answer: 'A call to receive God’s reign and follow Him on His terms',
      wrong: [
        'Religion as a hobby with no claim on daily life',
        'A kingdom that never asks for trust or change',
        'Advice to stay exactly as you are',
      ],
      explain: `${ref} reveals Jesus’ authority and the response He seeks.`,
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

/** Narrative / claim beats that don’t need quotation marks. */
function extractKeyClaims(verses) {
  const claims = [];
  for (const v of verses) {
    const t = v.text;
    const ref = refLabel(v);

    if (/^In the beginning, God created/i.test(t)) {
      claims.push({
        verse: v,
        kind: 'creator',
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
        kind: 'image',
        prompt: `According to ${ref}, how are human beings described?`,
        answer: 'Made in God’s image — with God-given dignity and purpose',
        wrong: [
          'As cosmic accidents with no sacred worth',
          'As equals to God in power and authority',
          'As valuable only if they achieve greatness',
        ],
        explain: `${ref} grounds human dignity in God’s design, not performance.`,
      });
    }
    if (/blameless and upright|feared God, and turned away from evil/i.test(t)) {
      claims.push({
        verse: v,
        kind: 'job-upright',
        prompt: `How does ${ref} describe Job before his suffering?`,
        answer: 'As a man who feared God and turned away from evil',
        wrong: [
          'As wealthy but spiritually indifferent',
          'As secretly corrupt while looking religious',
          'As someone God had never noticed',
        ],
        explain: `${ref} establishes Job’s integrity so his later trial is not portrayed as punishment for secret sin.`,
      });
    }
    if (/Holy Spirit|conceived|pregnant by the Holy Spirit/i.test(t) && /Mary|Jesus/i.test(t)) {
      claims.push({
        verse: v,
        kind: 'virgin-birth',
        prompt: `What does ${ref} teach about Jesus’ birth?`,
        answer: 'Jesus’ conception is by the Holy Spirit — God initiating salvation',
        wrong: [
          'Jesus is only an ordinary child with an inspiring story',
          'Joseph is presented as the biological father of Jesus',
          'The virgin birth is unrelated to who Jesus is',
        ],
        explain: `${ref} presents Jesus’ coming as God’s own saving action.`,
      });
    }
    if (/god saw .+ (good|very good)/i.test(t)) {
      claims.push({
        verse: v,
        kind: 'creation-good',
        prompt: `In ${ref}, God sees what He has made and calls it good. What does that affirm?`,
        answer: 'Creation is purposeful and valued by God — not a mistake',
        wrong: [
          'The material world is evil and God regrets making it',
          'God is unsure whether creation was worthwhile',
          'Only spiritual things matter; the world itself does not',
        ],
        explain: `${ref} affirms the goodness of God’s ordered world.`,
      });
    }

    // Obedience narrative
    if (
      /\b(went|did|obeyed|departed|followed)\b.{0,40}(as the LORD|as (?:the )?Lord|as God|as Jesus|as he (?:had )?told|according to (?:all )?that)/i.test(t)
      || /as the LORD had told him|they left everything and followed|Abram went, as the LORD/i.test(t)
    ) {
      claims.push({
        verse: v,
        kind: 'obedience',
        prompt: `In ${ref} we read, “${snip(t, 110)}” What stands out?`,
        answer: 'Someone responds to God’s word with real-world obedience',
        wrong: [
          'Hearing God is enough; action never matters',
          'The characters ignore God and invent their own plan',
          'Faith here is only a private feeling with no next step',
        ],
        explain: `${ref} shows that trust in God shows up in concrete steps.`,
      });
    }

    // Fear / faith failure
    if (/afraid|feared|because .+ beautiful|say you are my sister|lied|deceived/i.test(t)
      && /Abram|Abraham|Sarai|Sarah|Isaac|Jacob|Peter|disciple/i.test(t)) {
      claims.push({
        verse: v,
        kind: 'fear',
        prompt: `Looking at ${ref} (“${snip(t, 95)}”), what tension is in the story?`,
        answer: 'Fear or self-protection pulls someone away from simple trust in God',
        wrong: [
          'Everyone in the story already trusts God perfectly',
          'The Bible never shows weakness in people of faith',
          'Fear is presented as wiser than depending on God',
        ],
        explain: `${ref} is honest about fear — and invites a better trust.`,
      });
    }

    // Worship / altar
    if (/built an altar|called on the name of the LORD|worshiped|sang to the LORD|gave thanks/i.test(t)) {
      claims.push({
        verse: v,
        kind: 'worship',
        prompt: `In ${ref}, “${snip(t, 100)}” What response to God is on display?`,
        answer: 'Worship — turning toward God with gratitude and reverence',
        wrong: [
          'Indifference after God has acted',
          'Using religion only to impress other people',
          'Treating God’s kindness as something owed',
        ],
        explain: `${ref} models a heart that answers God’s work with worship.`,
      });
    }

    // Judgment / warning
    if (/woe to|hypocrite|brood of vipers|unless you repent|day of the LORD|will rise up in the judgment|will condemn/i.test(t)) {
      claims.push({
        verse: v,
        kind: 'warning',
        prompt: `In ${ref}, the warning is sharp: “${snip(t, 100)}” What is at stake?`,
        answer: 'God confronts empty religion and calls for a real turn of heart',
        wrong: [
          'God is fine with appearance as long as rituals continue',
          'Warnings in Scripture are only for ancient enemies, never for us',
          'Judgment language has no moral claim on the reader',
        ],
        explain: `${ref} refuses to let us confuse looking religious with loving God.`,
      });
    }

    // Compassion / healing
    if (/healed|had compassion|mercy|forgave|made clean|stretched out (?:his )?hand/i.test(t)
      && /Jesus|Lord|God/i.test(t)) {
      claims.push({
        verse: v,
        kind: 'mercy',
        prompt: `From ${ref} (“${snip(t, 100)}”), what do we see about Jesus / the Lord?`,
        answer: 'He meets real need with mercy and power — not cold distance',
        wrong: [
          'He ignores suffering and only teaches ideas',
          'Compassion is weakness and He refuses to help',
          'He helps only people who have already fixed themselves',
        ],
        explain: `${ref} shows the heart of God toward the broken and needy.`,
      });
    }

    // God’s sovereignty (Job-style) — not creation “have dominion”
    if (
      (/he (?:increases|destroys|loosens|binds|makes|leads).+(nations|kings|princes|judges|counselors)/i.test(t)
        || /with God is wisdom|to God belong wisdom/i.test(t))
      && !/let(?:’s| us) make|let them have dominion/i.test(t)
    ) {
      claims.push({
        verse: v,
        kind: 'sovereignty',
        prompt: `In ${ref}, “${snip(t, 100)}” What claim is being made about God?`,
        answer: 'God rules history and human power — wisdom and dominion are His',
        wrong: [
          'Nations rise and fall by chance alone',
          'Human rulers are the final authority over the world',
          'God is uninvolved in the affairs of peoples and kings',
        ],
        explain: `${ref} lifts our eyes from human control to God’s sovereign hand.`,
      });
    }

    // Shepherd / refuge trust
    if (/the LORD is my shepherd|I shall not want|I shall lack nothing|valley of the shadow|rod and .+ staff|dwell in the house of the LORD/i.test(t)) {
      claims.push({
        verse: v,
        kind: 'shepherd',
        prompt: `In ${ref}, “${snip(t, 110)}” What is the psalmist confessing?`,
        answer: 'The LORD personally cares for, guides, and protects His people',
        wrong: [
          'God is distant and only helps the self-sufficient',
          'Safety comes from never walking through hard places',
          'Shepherd language is only poetry with no claim on trust',
        ],
        explain: `${ref} invites deep trust in God’s near, shepherding care.`,
      });
    }

    // Presence in trouble
    if (/you are with me|I will fear no evil|though I walk|my cup (?:runs over|overflows)|prepare .+ table/i.test(t)) {
      claims.push({
        verse: v,
        kind: 'presence',
        prompt: `From ${ref} (“${snip(t, 100)}”), what hope is held out in hard places?`,
        answer: 'God’s presence and provision meet fear — even in the darkest valley',
        wrong: [
          'Dark valleys prove God has abandoned His people',
          'Comfort is only for people who never suffer',
          'God’s care stops at the edge of difficulty',
        ],
        explain: `${ref} anchors courage in God being with us, not in easy circumstances.`,
      });
    }

    // Praise / trust psalm-like
    if (/I will trust|I will praise|the LORD is my (?!shepherd)|sing to the LORD|great is the|his love endures|God is my salvation/i.test(t)) {
      claims.push({
        verse: v,
        kind: 'praise',
        prompt: `In ${ref}, “${snip(t, 100)}” What posture toward God is modeled?`,
        answer: 'Choosing trust and praise because of who God is',
        wrong: [
          'Waiting to worship until life feels effortless',
          'Praising only when other people are watching',
          'Treating God as useful only for getting what we want',
        ],
        explain: `${ref} invites the same trust and praise in our own lives.`,
      });
    }
  }
  return claims;
}

/**
 * Event / detail questions that still reward careful reading —
 * who acted, what happened, what God did — not random vocabulary blanks.
 */
function extractReadingBeats(verses) {
  const beats = [];
  for (const v of verses) {
    const t = v.text;
    const ref = refLabel(v);

    // Named person + action
    const actor = t.match(
      /\b((?:the )?(?:LORD|Lord|God|Jesus|Christ)|Abram|Abraham|Sarai|Sarah|Lot|Job|Isaiah|Moses|Joseph|Mary|Peter|Paul|David|Solomon|Noah|Jacob|Esau|Ruth|Boaz|Pharaoh|Satan)\b[^.]{0,120}?\b(said|went|took|built|called|appeared|blessed|cursed|healed|commanded|answered|followed|departed|sent|gave|saw|heard|feared|worshiped|sang|prayed)\b/i
    );
    if (actor) {
      const who = actor[1].replace(/^the /i, '');
      const verb = actor[2].toLowerCase();
      beats.push({
        verse: v,
        kind: 'event',
        prompt: `According to ${ref}, what happens in this part of the story?`,
        answer: snip(t, 110),
        wrongPool: 'event',
        explain: `${ref} — “${snip(t, 160)}” (${who} ${verb}…)`,
      });
    }

    // Result / so / therefore
    if (/\b(so|therefore|then)\b.+\b(went|built|believed|followed|worshiped|left|obeyed|feared)\b/i.test(t)
      && t.split(/\s+/).length >= 12) {
      beats.push({
        verse: v,
        kind: 'result',
        prompt: `After what comes before, ${ref} records: “${snip(t, 100)}” What kind of moment is this?`,
        answer: 'A response to God that moves from hearing into action',
        wrong: [
          'A pause where nothing connects to God’s prior word',
          'Proof that Scripture stories never ask for a response',
          'A random detail with no link to faith or obedience',
        ],
        explain: `${ref} ties God’s word to a lived response.`,
      });
    }
  }
  return beats;
}

function makeSpeechQuestion(speech, rand, used) {
  const id = `speech-${refLabel(speech.verse)}-${speech.quote.slice(0, 20)}`;
  if (used.has(id)) return null;
  used.add(id);
  const built = teachingFromSpeech(speech);
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
  const id = `claim-${refLabel(claim.verse)}-${claim.prompt.slice(0, 24)}`;
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

const EVENT_DISTRACTORS = [
  'Everyone ignored God and nothing noteworthy happened',
  'The chapter pauses for a genealogy with no action',
  'The people decided God had stopped speaking forever',
  'A king rewrote the law without any reference to the LORD',
  'The disciples concluded miracles were impossible',
  'Worship was canceled because no one remembered God',
];

function makeBeatQuestion(beat, verses, rand, used) {
  const id = `beat-${beat.kind}-${refLabel(beat.verse)}`;
  if (used.has(id)) return null;
  used.add(id);

  if (beat.wrong) {
    return {
      id,
      type: 'passage',
      prompt: beat.prompt,
      passage: null,
      options: shuffle([beat.answer, ...beat.wrong], rand),
      answer: beat.answer,
      explain: beat.explain,
    };
  }

  // Event: answer is the real verse snippet; distractors are other verses / generic misses.
  const others = shuffle(
    verses
      .filter((v) => v !== beat.verse && v.text.split(/\s+/).length >= 10)
      .map((v) => snip(v.text, 110)),
    rand
  ).filter((s) => s !== beat.answer);
  const distractors = others.slice(0, 3);
  while (distractors.length < 3) {
    distractors.push(EVENT_DISTRACTORS[distractors.length % EVENT_DISTRACTORS.length]);
  }

  return {
    id,
    type: 'passage',
    prompt: beat.prompt,
    passage: `Stay with ${refLabel(beat.verse)} — what does the text actually recount?`,
    options: shuffle([beat.answer, ...distractors.slice(0, 3)], rand),
    answer: beat.answer,
    explain: beat.explain,
  };
}

const QUOTE_DISTRACTORS = [
  'Ignore the poor and keep the festivals going',
  'Trust only what you can control with your own hands',
  'God is finished speaking and no longer involved',
  'Blessed are those who never need mercy',
  'The covenant is optional when life gets hard',
  'Worship without justice is all God requires',
];

/**
 * Quote-comprehension: what was actually said?
 */
function makeQuoteComprehension(speeches, rand, used) {
  if (!speeches.length) return null;
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
      distractors.push(QUOTE_DISTRACTORS[distractors.length % QUOTE_DISTRACTORS.length]);
    }

    return {
      id,
      type: 'quote',
      prompt: `In ${refLabel(chosen.verse)}, what does ${chosen.speaker} say?`,
      passage: 'Catch what was actually spoken in today’s reading.',
      options: shuffle([answer, ...distractors.slice(0, 3)], rand),
      answer,
      explain: `${refLabel(chosen.verse)} — “${snip(chosen.quote, 180)}”`,
    };
  }
  return null;
}

/** Meaning question from a substantial verse — not a spelling bee. */
function makeVerseMeaning(verse, rand, used) {
  const id = `meaning-${refLabel(verse)}`;
  if (used.has(id)) return null;
  if (verse.text.split(/\s+/).length < 12) return null;
  used.add(id);

  const snippet = snip(verse.text, 140);
  return {
    id,
    type: 'passage',
    prompt: `Read ${refLabel(verse)} carefully. What is this verse doing in the story?`,
    passage: `“${snippet}”`,
    options: shuffle(
      [
        'Recording something God wants noticed — a word, act, or response that shapes faith',
        'Filling space with detail that has no claim on how we trust God',
        'Proving that ordinary obedience never matters in Scripture',
        'Showing that God stays silent and uninvolved in real lives',
      ],
      rand
    ),
    answer: 'Recording something God wants noticed — a word, act, or response that shapes faith',
    explain: `${refLabel(verse)} belongs to today’s word from God — receive it as such.`,
  };
}

function teachKeyForSpeech(s) {
  if (/let there be|let the (earth|waters)|let’s make|let us make|be fruitful/i.test(s.quote)) return 'creation-word';
  if (/fear god for nothing|hedge/i.test(s.quote)) return 'job-test';
  if (/rebelled against me|ox knows his owner/i.test(s.quote)) return 'isaiah-rebel';
  if (/seek justice|wash yourselves|scarlet/i.test(s.quote)) return 'isaiah-repent';
  if (/save .+ sins|immanuel/i.test(s.quote)) return 'jesus-save';
  if (/leave your country|go to the land/i.test(s.quote)) return 'call-leave';
  if (/I will bless|I will make of you/i.test(s.quote)) return 'promise-bless';
  return `${s.verse.book}:${s.verse.chapter}:${s.verse.number}`;
}

/**
 * @param {string} readingId
 * @param {{ book: string, chapter: number, verses: { number: number, text: string }[] }[]} parts
 * @param {{ labels?: string }} [meta]
 */
export function buildQuiz(readingId, parts, meta = {}) {
  const verses = flattenVerses(parts);
  if (!verses.length) return { questions: [], verseCount: 0 };

  const rand = rngFrom(hashSeed(`${readingId}|passage-v5`));
  const used = new Set();
  const speeches = extractSpeeches(verses);
  const claims = extractKeyClaims(verses);
  const beats = extractReadingBeats(verses);

  const questions = [];
  const booksCovered = new Set();
  const seenTeachKeys = new Set();
  const seenKinds = new Map(); // kind -> count

  const noteKind = (kind) => {
    if (!kind) return true;
    const n = seenKinds.get(kind) || 0;
    // Allow at most one of each teaching template (keeps the quiz varied).
    if (n >= 1) return false;
    seenKinds.set(kind, n + 1);
    return true;
  };

  const byChapter = new Map();
  for (const s of speeches) {
    const key = `${s.verse.book}:${s.verse.chapter}`;
    if (!byChapter.has(key)) byChapter.set(key, []);
    byChapter.get(key).push(s);
  }

  // 1) Strong speech-teaching questions — prefer one per chapter.
  for (const [, list] of shuffle([...byChapter.entries()], rand)) {
    if (questions.length >= QUESTIONS_PER_QUIZ) break;
    const ranked = [...list].sort((a, b) => speechWeight(b) - speechWeight(a));
    const best = ranked.find((s) => speechWeight(s) >= 6) || ranked[0];
    if (!best || speechWeight(best) < 5) continue;
    const teachKey = teachKeyForSpeech(best);
    if (seenTeachKeys.has(teachKey)) continue;
    const q = makeSpeechQuestion(best, rand, used);
    if (q) {
      questions.push(q);
      booksCovered.add(best.verse.book);
      seenTeachKeys.add(teachKey);
    }
  }

  // 2) Teaching claims / narrative beats.
  for (const claim of shuffle(claims, rand)) {
    if (questions.length >= QUESTIONS_PER_QUIZ) break;
    if (!noteKind(claim.kind)) continue;
    const q = makeClaimQuestion(claim, rand, used);
    if (q) {
      questions.push(q);
      booksCovered.add(claim.verse.book);
    }
  }

  for (const beat of shuffle(beats, rand)) {
    if (questions.length >= QUESTIONS_PER_QUIZ) break;
    if (booksCovered.has(beat.verse.book) && questions.length >= 6) continue;
    if (!noteKind(beat.kind)) continue;
    const q = makeBeatQuestion(beat, verses, rand, used);
    if (q) {
      questions.push(q);
      booksCovered.add(beat.verse.book);
    }
  }

  // 3) More speeches / quotes.
  for (const s of [...speeches].sort((a, b) => speechWeight(b) - speechWeight(a))) {
    if (questions.length >= QUESTIONS_PER_QUIZ) break;
    if (speechWeight(s) < 4) continue;
    const teachKey = teachKeyForSpeech(s);
    if (seenTeachKeys.has(teachKey)) continue;
    const q = makeSpeechQuestion(s, rand, used);
    if (q) {
      questions.push(q);
      seenTeachKeys.add(teachKey);
    }
  }

  while (questions.length < QUESTIONS_PER_QUIZ) {
    const q = makeQuoteComprehension(speeches, rand, used);
    if (!q) break;
    questions.push(q);
  }

  // 4) Remaining beats (allow more event variety), then limited meaning fillers.
  for (const beat of shuffle(beats, rand)) {
    if (questions.length >= QUESTIONS_PER_QUIZ) break;
    const q = makeBeatQuestion(beat, verses, rand, used);
    if (q) questions.push(q);
  }

  const versePool = shuffle(
    verses.filter((v) => v.text.split(/\s+/).length >= 12),
    rand
  );
  let meaningCount = 0;
  for (const v of versePool) {
    if (questions.length >= QUESTIONS_PER_QUIZ) break;
    if (meaningCount >= 2) break;
    const q = makeVerseMeaning(v, rand, used);
    if (q) {
      questions.push(q);
      meaningCount += 1;
    }
  }

  // Last resort: one application question, then event snippets from unused verses.
  if (questions.length < QUESTIONS_PER_QUIZ && verses[0]) {
    const v = verses[Math.floor(verses.length / 3)] || verses[0];
    const id = `anchor-${refLabel(v)}`;
    if (!used.has(id)) {
      used.add(id);
      questions.push({
        id,
        type: 'passage',
        prompt: `Holding ${refLabel(v)} with the rest of ${meta.labels || 'today’s reading'}, what is a faithful next step?`,
        passage: `“${snip(v.text, 120)}”`,
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
  }

  for (const v of versePool) {
    if (questions.length >= QUESTIONS_PER_QUIZ) break;
    const id = `snap-${refLabel(v)}`;
    if (used.has(id)) continue;
    used.add(id);
    const answer = snip(v.text, 110);
    const distractors = shuffle(
      versePool.filter((x) => x !== v).map((x) => snip(x.text, 110)),
      rand
    ).slice(0, 3);
    while (distractors.length < 3) {
      distractors.push(EVENT_DISTRACTORS[distractors.length % EVENT_DISTRACTORS.length]);
    }
    questions.push({
      id,
      type: 'passage',
      prompt: `Which line is actually in ${refLabel(v)} from today’s reading?`,
      passage: 'Stay close to the text you just read.',
      options: shuffle([answer, ...distractors.slice(0, 3)], rand),
      answer,
      explain: `${refLabel(v)} — “${snip(v.text, 160)}”`,
    });
  }

  return {
    questions: questions.slice(0, QUESTIONS_PER_QUIZ),
    verseCount: verses.length,
  };
}

/** Prefer AI questions, then pad with local until exactly QUESTIONS_PER_QUIZ. */
export function mergeQuizQuestions(aiQuestions, localQuestions) {
  const out = [];
  const seen = new Set();
  for (const q of [...(aiQuestions || []), ...(localQuestions || [])]) {
    if (!q || out.length >= QUESTIONS_PER_QUIZ) break;
    const key = String(q.id || q.prompt || '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}

export { QUESTIONS_PER_QUIZ };
