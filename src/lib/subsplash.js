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

  // Break before numbered / lettered points and markdown headings.
  // Do not break before em-dash citations — those belong with the quote above.
  const withBreaks = raw
    .replace(/\n(?=(?:\d+[).]\s|[A-Z][).]\s|[-•*]\s|#{1,6}\s))/g, '\n\n')
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
    const kind = classifyOutlineSection(text);
    sections.push({ text, kind });
  }

  if (!sections.length) {
    return splitOutlineBlocks(raw).map((text) => ({
      text,
      kind: classifyOutlineSection(text),
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

function unwrapQuoteText(quote) {
  return String(quote || '')
    .replace(/^["“„]\s*/, '')
    .replace(/\s*["”]$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Scripture / teaching block classification for rich display. */
export function classifyOutlineSection(text, kind = 'outline') {
  if (kind === 'answers' || /^answer key\b/i.test(text || '')) return 'answers';
  const raw = String(text || '').trim();
  if (!raw) return 'outline';

  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return 'outline';

  const first = lines[0];
  const second = lines[1] || '';
  const isQuoted =
    /^["“].+["”]$/.test(first) ||
    (/^["“].+["”]?$/.test(first) && /^[—–-]/.test(second));
  const hasCite =
    /^[—–-]\s*\S/.test(second) ||
    /\(([^()\n]{3,80})\)$/.test(first) ||
    lines.some((l) => /^[—–-]\s+\S/.test(l));

  if (isQuoted || (hasCite && lines.length <= 3 && !/_{3,}/.test(raw))) {
    return 'quote';
  }
  if (/^#{1,6}\s+\S/.test(first) && lines.length === 1) return 'heading';
  return 'outline';
}

/**
 * Inline segments for a single outline line — blanks, bold, italic, plain.
 * @returns {{ type: 'text'|'blank'|'bold'|'italic'|'cite', value: string, width?: number }[]}
 */
export function parseInlineSegments(line) {
  const src = String(line || '');
  if (!src) return [];

  // Whole-line citation: — John 3:16
  const citeOnly = src.match(/^[—–-]\s*(.+)$/);
  if (citeOnly && !/_{3,}|\*\*|__/.test(src)) {
    return [{ type: 'cite', value: citeOnly[1].trim() }];
  }

  const segments = [];
  // bold **…**, italic *…*, blanks ____, trailing (Cite Ref)
  const tokenRe =
    /(\*\*([^*]+)\*\*|\*([^*]+)\*|_{3,}|\(([^()\n]{3,80})\)$)/g;
  let last = 0;
  let m;
  while ((m = tokenRe.exec(src))) {
    if (m.index > last) {
      segments.push({ type: 'text', value: src.slice(last, m.index) });
    }
    if (m[0].startsWith('**')) {
      segments.push({ type: 'bold', value: m[2] });
    } else if (m[0].startsWith('*')) {
      segments.push({ type: 'italic', value: m[3] });
    } else if (m[0].startsWith('_')) {
      segments.push({ type: 'blank', value: m[0], width: m[0].length });
    } else if (m[4]) {
      segments.push({ type: 'cite', value: cleanCiteRef(m[4]) });
    }
    last = m.index + m[0].length;
  }
  if (last < src.length) {
    segments.push({ type: 'text', value: src.slice(last) });
  }
  return segments.length ? segments : [{ type: 'text', value: src }];
}

/**
 * Structured lines for rich outline rendering (paper, cards, preview).
 * @returns {{ type: string, text: string, segments: ReturnType<typeof parseInlineSegments>, level?: number }[]}
 */
export function parseOutlineLines(text) {
  const raw = String(text || '').replace(/\r\n/g, '\n');
  if (!raw.trim()) return [];

  const out = [];
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === WRITE_GAP || /^[·.\s]+$/.test(trimmed)) {
      continue;
    }

    if (/^answer key\b/i.test(trimmed)) {
      out.push({ type: 'answer-title', text: 'Answer key', segments: [] });
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      out.push({
        type: 'heading',
        text: heading[2],
        level: heading[1].length,
        segments: parseInlineSegments(heading[2]),
      });
      continue;
    }

    if (/^[—–-]\s*\S/.test(trimmed)) {
      out.push({
        type: 'cite',
        text: trimmed.replace(/^[—–-]\s*/, ''),
        segments: [{ type: 'cite', value: trimmed.replace(/^[—–-]\s*/, '') }],
      });
      continue;
    }

    if (/^["“].+["”]$/.test(trimmed) || /^["“].+["”]\s*$/.test(trimmed)) {
      const body = unwrapQuoteText(trimmed);
      out.push({
        type: 'quote',
        text: body,
        segments: parseInlineSegments(body),
      });
      continue;
    }

    // Legacy: quote with trailing (Ref) on the same line
    const legacyQuote = trimmed.match(/^(.+?)\s*\(([^()\n]{3,80})\)$/);
    if (
      legacyQuote &&
      !/_{3,}/.test(legacyQuote[1]) &&
      legacyQuote[1].length > 40 &&
      /\d/.test(legacyQuote[2])
    ) {
      out.push({
        type: 'quote',
        text: unwrapQuoteText(legacyQuote[1]),
        segments: parseInlineSegments(unwrapQuoteText(legacyQuote[1])),
      });
      out.push({
        type: 'cite',
        text: cleanCiteRef(legacyQuote[2]),
        segments: [{ type: 'cite', value: cleanCiteRef(legacyQuote[2]) }],
      });
      continue;
    }

    if (/^\d+\.\s+\S/.test(trimmed) && out.some((l) => l.type === 'answer-title')) {
      out.push({
        type: 'answer',
        text: trimmed,
        segments: parseInlineSegments(trimmed),
      });
      continue;
    }

    out.push({
      type: 'body',
      text: trimmed,
      segments: parseInlineSegments(trimmed),
    });
  }
  return out;
}

/**
 * Turn Subsplash markdown-ish content into a paper outline:
 * fill-ins become blanks, scripture becomes quoted + cited lines,
 * headings/bold/italic stay marked for rich display, {note} becomes a
 * write gap, and sections are spaced so you can write between them.
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

  // Blockquote + cite → curly quote + em-dash reference (reads well plain + rich).
  text = text.replace(
    /^>\s*([\s\S]*?)<cite>\s*-{0,3}\s*([^<]+?)\s*<\/cite>\s*$/gim,
    (_, quote, ref) => {
      const body = unwrapQuoteText(quote.replace(/\n+/g, ' '));
      return `“${body}”\n— ${cleanCiteRef(ref)}`;
    }
  );

  // Remaining cites (inline) → em-dash line when at end of a quote-ish block.
  text = text.replace(CITE_CAPTURE_RE, (_, ref) => `\n— ${cleanCiteRef(ref)}`);

  text = text
    // Explicit Subsplash note slots → our write-gap marker.
    .replace(/\{note\}/gi, `\n\n${WRITE_GAP}\n\n`)
    .replace(/<\/?[^>]+>/g, '') // stray HTML
    .replace(/^>\s+/gm, '') // leftover blockquote markers
    .replace(/^---+$/gm, '')
    // Keep # headings, **bold**, *italic* for OutlineRichText.
    .replace(/[ \t]+\n/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/^[ \t]+/gm, '')
    .trim();

  // Don't repeat the sermon title inside the outline body.
  if (opts.title) {
    const title = opts.title.trim();
    if (title) {
      const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(`^#{0,6}\\s*${escaped}\\s*\\n+`, 'i'), '').trim();
    }
  }

  // Keep a scripture citation on its own block when the next teaching point follows.
  text = text.replace(/(—\s[^\n]{3,80})\n(?!\n)/g, '$1\n\n');

  const blocks = splitOutlineBlocks(text);
  const outline = [];
  const answerBlocks = [];

  for (const block of blocks) {
    if (block === WRITE_GAP || /^[·.\s]+$/.test(block)) {
      // Intentional {note} gaps become blank-line breathing room at join time.
      continue;
    }
    if (/^answer key\b/i.test(block)) {
      answerBlocks.push(block);
      continue;
    }
    outline.push(block);
  }

  // Triple newlines → parsePaperSections write bands (no ugly ···· markers).
  let paper = outline.join('\n\n\n');

  if (answers.length) {
    const key = `Answer key\n${answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;
    paper = paper ? `${paper}\n\n\n${key}` : key;
  } else if (answerBlocks.length) {
    paper = paper
      ? `${paper}\n\n\n${answerBlocks.join('\n\n')}`
      : answerBlocks.join('\n\n');
  }

  // Soften runaway blank lines.
  paper = paper.replace(/\n{6,}/g, '\n\n\n\n\n').trim();

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
