/**
 * Import helpers for Subsplash Fill-In Notes.
 *
 * Public notes load from:
 *   GET /api/subsplash/pages/view?hid=<docId>
 * which proxies to notes.subsplash.com (see vite.config.js / vercel.json).
 */

const HID_RE = /(?:[?&](?:doc|page|hid)=|\/(?:view|notes)\/)([A-Za-z0-9_-]{5,})/;
const CITE_RE = /<cite>\s*-{0,3}\s*([^<]+?)\s*<\/cite>/gi;
const FILL_RE = /__([^_\n]+?)__/g;

/** Pull a Subsplash document id out of a share URL or bare id. */
export function extractSubsplashHid(input) {
  const raw = (input || '').trim();
  if (!raw) return null;
  if (/^[A-Za-z0-9_-]{5,20}$/.test(raw) && !/\s/.test(raw)) return raw;

  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get('doc') || url.searchParams.get('page') || url.searchParams.get('hid');
    if (fromQuery) return fromQuery;
  } catch {
    /* not a full URL — fall through to regex */
  }

  const m = raw.match(HID_RE);
  return m?.[1] || null;
}

/**
 * Turn Subsplash markdown-ish content into a clean sermon outline:
 * fill-ins become blanks, {note} becomes writing space, cites become refs.
 */
export function formatSubsplashContent(content) {
  const answers = [];
  let text = String(content || '');

  text = text.replace(FILL_RE, (_, word) => {
    const clean = word.trim();
    if (clean) answers.push(clean);
    return '______';
  });

  text = text
    .replace(CITE_RE, (_, ref) => `(${ref.trim()})`)
    .replace(/\{note\}/gi, '\n________________________________\n')
    .replace(/<\/?[^>]+>/g, '') // stray HTML
    .replace(/^>\s?/gm, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (answers.length) {
    text += `\n\nAnswer key\n${answers.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;
  }

  return text;
}

/** First scripture citation in the note, if any. */
export function extractPassage(content) {
  const m = CITE_RE.exec(String(content || ''));
  CITE_RE.lastIndex = 0;
  return m?.[1]?.trim() || '';
}

/** Map a Subsplash page JSON payload into our sermon form fields. */
export function pageToSermonFields(page) {
  const content = page?.content || '';
  const publish = page?.publish || page?.created || '';
  return {
    title: page?.title || '',
    speaker: page?.author || '',
    date: publish ? String(publish).slice(0, 10) : new Date().toISOString().slice(0, 10),
    passage: extractPassage(content),
    series: page?.collection?.name || page?.collection?.title || '',
    church: '',
    tagsText: 'subsplash',
    notes: formatSubsplashContent(content),
    takeaway: '',
    ink: [],
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
    throw new Error(`Couldn’t load Subsplash note (${res.status}).`);
  }

  const data = await res.json();
  if (data?.error) throw new Error(data.error.message || 'Subsplash returned an error.');
  if (!data?.page) throw new Error('Unexpected response from Subsplash.');
  return data.page;
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

  let passage = '';
  for (const line of nonempty) {
    const cite = line.match(/[-–—]{1,3}\s*([1-3]?\s*[A-Za-z].+\d+:\d+)/);
    if (cite) {
      passage = cite[1].trim();
      break;
    }
    const bare = line.match(
      /\b((?:[1-3]\s)?[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(\d+)[:.](\d+)/
    );
    if (bare && /genesis|exodus|psalm|matthew|mark|luke|john|romans|corinthians|revelation/i.test(bare[1])) {
      passage = `${bare[1]} ${bare[2]}:${bare[3]}`;
      break;
    }
  }

  return {
    title,
    speaker: '',
    date: new Date().toISOString().slice(0, 10),
    passage,
    series: '',
    church: '',
    tagsText: 'imported',
    notes: formatSubsplashContent(text),
    takeaway: '',
    ink: [],
    starred: false,
    sourceUrl: '',
  };
}
