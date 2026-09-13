/**
 * Import helpers for Subsplash Fill-In Notes.
 *
 * Public notes load from:
 *   GET /api/subsplash/pages/view?hid=<docId>
 * which proxies to notes.subsplash.com (see vite.config.js / vercel.json).
 *
 * Share links look like:
 *   https://notes.subsplash.com/fill-in/view?doc=PP6UyBnxv5
 */

const HID_RE =
  /(?:[?&](?:doc|page|hid)=|\/(?:fill-in\/)?(?:view|notes)\/|\/d\/)([A-Za-z0-9_-]{5,})/i;
const CITE_CAPTURE_RE = /<cite>\s*-{0,3}\s*([^<]+?)\s*<\/cite>/gi;
const FILL_RE = /__([^_\n]+?)__/g;

/** Marker line inserted between outline blocks — room to write. */
export const WRITE_GAP = '···· ···· ····';

/** Pull a Subsplash document id out of a share URL or bare id. */
export function extractSubsplashHid(input) {
  const raw = (input || '').trim();
  if (!raw) return null;
  if (/^[A-Za-z0-9_-]{5,24}$/.test(raw) && !/\s/.test(raw)) return raw;

  try {
    const url = new URL(raw);
    const fromQuery =
      url.searchParams.get('doc') ||
      url.searchParams.get('page') ||
      url.searchParams.get('hid') ||
      url.searchParams.get('id');
    if (fromQuery) return fromQuery;
  } catch {
    /* not a full URL — fall through to regex */
  }

  const m = raw.match(HID_RE);
  return m?.[1] || null;
}

/** Split cleaned outline text into paper sections (before write-gap joining). */
export function splitOutlineBlocks(text) {
  const raw = String(text || '')
    .replace(/\r\n/g, '\n')
    .trim();
  if (!raw) return [];

  // Break before numbered / lettered points and markdown-ish headings that survived.
  const withBreaks = raw
    .replace(/\n(?=(?:\d+[).]\s|[A-Z][).]\s|[-•*]\s|#{1,3}\s))/g, '\n\n')
    .replace(/\n{3,}/g, '\n\n');

  return withBreaks
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
}

/**
 * Turn a notes string (with WRITE_GAP markers or blank runs) into paper sections.
 * Used to print the outline under the handwriting pad.
 */
export function parsePaperSections(notes) {
  const raw = String(notes || '').replace(/\r\n/g, '\n').trim();
  if (!raw) return [];

  // Split on WRITE_GAP lines or runs of blank lines.
  const parts = raw.split(/\n\s*···· ···· ····\s*\n|\n{3,}/);

  const sections = [];
  for (const part of parts) {
    const text = part.trim();
    if (!text || text === WRITE_GAP) continue;
    sections.push({
      text,
      kind: /^answer key\b/i.test(text) ? 'answers' : 'outline',
    });
  }

  if (!sections.length) {
    return splitOutlineBlocks(raw).map((text) => ({
      text,
      kind: /^answer key\b/i.test(text) ? 'answers' : 'outline',
    }));
  }

  return sections;
}

/** How many ruled pages a paper outline needs (outline + write bands). */
export function estimatePaperPages(sections) {
  if (!sections?.length) return 2;
  let weight = 0;
  let outlineCount = 0;
  for (const s of sections) {
    const lines = String(s.text || s)
      .split('\n')
      .reduce((n, line) => n + Math.max(1, Math.ceil(line.length / 52)), 0);
    weight += lines + (s.kind === 'answers' ? 2 : 6);
    if (s.kind !== 'answers') outlineCount += 1;
  }
  // Roomy paper — roughly a page per 1–2 sections, floored by line weight.
  const bySections = Math.ceil(outlineCount * 0.75);
  const byLines = Math.ceil(weight / 16);
  return Math.max(2, Math.min(8, Math.max(bySections, byLines)));
}

function cleanCiteRef(ref) {
  return String(ref || '')
    .replace(/^[-–—\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function blankFor(word) {
  const len = Math.max(6, Math.min(18, String(word || '').trim().length + 2));
  return '_'.repeat(len);
}

/**
 * Turn Subsplash markdown-ish content into a paper outline:
 * fill-ins become blanks, {note} becomes a write gap, cites become refs,
 * and sections are spaced so you can write between them.
 *
 * @param {string} content
 * @param {{ title?: string }} [opts] — strip a leading title line when it matches the page title
 */
export function formatSubsplashContent(content, opts = {}) {
  const answers = [];
  let text = String(content || '');

  text = text.replace(FILL_RE, (_, word) => {
    const clean = word.trim();
    if (clean) answers.push(clean);
    return blankFor(clean);
  });

  text = text
    .replace(CITE_CAPTURE_RE, (_, ref) => `(${cleanCiteRef(ref)})`)
    // Explicit Subsplash note slots → our write-gap marker.
    .replace(/\{note\}/gi, `\n\n${WRITE_GAP}\n\n`)
    .replace(/<\/?[^>]+>/g, '') // stray HTML
    .replace(/^>\s*/gm, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/^[ \t]+/gm, '')
    .trim();

  // Don't repeat the sermon title inside the outline body.
  if (opts.title) {
    const title = opts.title.trim();
    if (title) {
      const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(`^${escaped}\\s*\\n+`, 'i'), '').trim();
    }
  }

  // Keep a scripture quote on its own block when the next teaching point follows.
  text = text.replace(/(\([^()\n]{3,80}\))\n(?!\n)/g, '$1\n\n');

  const blocks = splitOutlineBlocks(text);
  const outline = [];
  const answerBlocks = [];

  const pushGap = () => {
    if (outline.length && outline[outline.length - 1] !== WRITE_GAP) {
      outline.push(WRITE_GAP);
    }
  };

  for (const block of blocks) {
    if (block === WRITE_GAP || /^[·.\s]+$/.test(block)) {
      // Keep intentional gaps from {note}; avoid stacking duplicates.
      pushGap();
      continue;
    }
    if (/^answer key\b/i.test(block)) {
      answerBlocks.push(block);
      continue;
    }
    outline.push(block);
    // Default breathing room after every outline block.
    pushGap();
  }

  // Trim trailing gap before answer key / end.
  while (outline.length && outline[outline.length - 1] === WRITE_GAP) outline.pop();

  let paper = outline.join('\n\n');

  if (answers.length) {
    const key = `Answer key\n${answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;
    paper = paper ? `${paper}\n\n${WRITE_GAP}\n\n${key}` : key;
  } else if (answerBlocks.length) {
    paper = paper
      ? `${paper}\n\n${WRITE_GAP}\n\n${answerBlocks.join('\n\n')}`
      : answerBlocks.join('\n\n');
  }

  // Soften runaway blank lines without touching write-gap spacing.
  paper = paper.replace(/\n{5,}/g, '\n\n\n\n').trim();

  return paper;
}

/** First scripture citation in the note, if any. */
export function extractPassage(content) {
  const m = CITE_CAPTURE_RE.exec(String(content || ''));
  CITE_CAPTURE_RE.lastIndex = 0;
  return cleanCiteRef(m?.[1] || '');
}

/** Count fill-in blanks in raw Subsplash content. */
export function countBlanks(content) {
  const matches = String(content || '').match(FILL_RE);
  FILL_RE.lastIndex = 0;
  return matches?.length || 0;
}

/** Compact preview stats for the import UI. */
export function summarizeImport(fields, rawContent = '') {
  const sections = parsePaperSections(fields.notes || '');
  const outline = sections.filter((s) => s.kind !== 'answers');
  return {
    title: fields.title || 'Untitled notes',
    speaker: fields.speaker || '',
    passage: fields.passage || '',
    date: fields.date || '',
    series: fields.series || '',
    blanks: countBlanks(rawContent),
    sections: outline.length,
    pages: fields.inkPages || estimatePaperPages(sections),
    sourceUrl: fields.sourceUrl || '',
  };
}

/** Map a Subsplash page JSON payload into our sermon form fields. */
export function pageToSermonFields(page) {
  const content = page?.content || '';
  const publish = page?.publish || page?.created || '';
  const title = page?.title || '';
  const notes = formatSubsplashContent(content, { title });
  const sections = parsePaperSections(notes);
  return {
    title,
    speaker: page?.author || '',
    date: publish ? String(publish).slice(0, 10) : new Date().toISOString().slice(0, 10),
    passage: extractPassage(content),
    series: page?.collection?.name || page?.collection?.title || '',
    church: '',
    tagsText: 'subsplash',
    notes,
    takeaway: '',
    ink: [],
    inkPages: estimatePaperPages(sections),
    starred: false,
    sourceUrl: page?.hid
      ? `https://notes.subsplash.com/fill-in/view?doc=${page.hid}`
      : '',
  };
}

/** Fetch a published Subsplash note by hid (via our same-origin proxy). */
export async function fetchSubsplashPage(hid) {
  const id = extractSubsplashHid(hid);
  if (!id) throw new Error('Couldn’t find a Subsplash note id in that link.');

  const filter = encodeURIComponent(JSON.stringify({ include: ['collection'] }));
  const res = await fetch(`/api/subsplash/pages/view?hid=${encodeURIComponent(id)}&filter=${filter}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Note not found — is it published and public?');
    if (res.status === 401 || res.status === 403) {
      throw new Error('That note isn’t public. Ask your church for the shared Fill-In link.');
    }
    throw new Error(`Couldn’t load Subsplash note (${res.status}).`);
  }

  const data = await res.json();
  if (data?.error) throw new Error(data.error.message || 'Subsplash returned an error.');
  if (!data?.page) throw new Error('Unexpected response from Subsplash.');
  if (data.page.public === false) {
    throw new Error('That note isn’t public. Ask your church for the shared Fill-In link.');
  }
  return data.page;
}

/** Fetch + map in one step (handy for the import preview flow). */
export async function importSubsplashNote(input) {
  const page = await fetchSubsplashPage(input);
  const fields = pageToSermonFields(page);
  return {
    page,
    fields,
    preview: summarizeImport(fields, page.content || ''),
  };
}

/** Best-effort parse of pasted / uploaded plain text into sermon fields. */
export function textToSermonFields(text, { filename } = {}) {
  const lines = String(text || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trimEnd());
  const nonempty = lines.map((l) => l.trim()).filter(Boolean);

  const title =
    nonempty.find((l) => !/^https?:/i.test(l) && l.length < 80) ||
    (filename ? filename.replace(/\.[^.]+$/, '') : 'Imported notes');

  let passage = extractPassage(text);
  if (!passage) {
    for (const line of nonempty) {
      const cite = line.match(/[-–—]{1,3}\s*([1-3]?\s*[A-Za-z].+\d+:\d+)/);
      if (cite) {
        passage = cleanCiteRef(cite[1]);
        break;
      }
      const bare = line.match(
        /\b((?:[1-3]\s)?[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(\d+)[:.](\d+)/
      );
      if (
        bare &&
        /genesis|exodus|leviticus|numbers|deuteronomy|psalm|proverbs|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|hebrews|james|peter|jude|revelation/i.test(
          bare[1]
        )
      ) {
        passage = `${bare[1]} ${bare[2]}:${bare[3]}`;
        break;
      }
    }
  }

  const notes = formatSubsplashContent(text, { title });
  const sections = parsePaperSections(notes);

  return {
    title,
    speaker: '',
    date: new Date().toISOString().slice(0, 10),
    passage,
    series: '',
    church: '',
    tagsText: 'imported',
    notes,
    takeaway: '',
    ink: [],
    inkPages: estimatePaperPages(sections),
    starred: false,
    sourceUrl: '',
  };
}
