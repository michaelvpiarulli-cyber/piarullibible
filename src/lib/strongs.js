/**
 * Strong’s Exhaustive Concordance (Open Scriptures CC-BY-SA).
 * Dictionaries load once on first lookup, then stay in memory.
 */

const GREEK_URL =
  'https://cdn.jsdelivr.net/gh/openscriptures/strongs@master/greek/strongs-greek-dictionary.js';
const HEBREW_URL =
  'https://cdn.jsdelivr.net/gh/openscriptures/strongs@master/hebrew/strongs-hebrew-dictionary.js';

let greekDict = null;
let hebrewDict = null;
let greekLoading = null;
let hebrewLoading = null;

/** Normalize "G26", "g26", "26" (Greek), "H1254", etc. → "G26" / "H1254". */
export function normalizeStrongs(id, prefer = 'G') {
  const raw = String(id || '').trim().toUpperCase();
  const m = raw.match(/^([GH])?(\d+)$/);
  if (!m) return null;
  return `${m[1] || prefer}${Number(m[2])}`;
}

async function loadDict(url, varName) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't load Strong's dictionary (${res.status})`);
  const text = await res.text();
  // File ends with `module.exports = strongsXDictionary;` — strip for browsers.
  const cleaned = text.replace(/module\.exports\s*=\s*\w+\s*;?\s*$/, '');
  // eslint-disable-next-line no-new-func
  return new Function(`${cleaned}; return ${varName};`)();
}

async function ensureGreek() {
  if (greekDict) return greekDict;
  if (!greekLoading) {
    greekLoading = loadDict(GREEK_URL, 'strongsGreekDictionary')
      .then((d) => {
        greekDict = d;
        return d;
      })
      .catch((err) => {
        greekLoading = null;
        throw err;
      });
  }
  return greekLoading;
}

async function ensureHebrew() {
  if (hebrewDict) return hebrewDict;
  if (!hebrewLoading) {
    hebrewLoading = loadDict(HEBREW_URL, 'strongsHebrewDictionary')
      .then((d) => {
        hebrewDict = d;
        return d;
      })
      .catch((err) => {
        hebrewLoading = null;
        throw err;
      });
  }
  return hebrewLoading;
}

/**
 * Look up a Strong’s entry. Returns { id, lemma, translit, pronunciation,
 * definition, kjv, derivation } or null.
 */
export async function lookupStrongs(id, hint = 'G') {
  const key = normalizeStrongs(id, hint);
  if (!key) return null;

  const dict = key.startsWith('H') ? await ensureHebrew() : await ensureGreek();
  const entry = dict?.[key];
  if (!entry) return null;

  return {
    id: key,
    lemma: entry.lemma || '',
    translit: entry.translit || entry.xlit || '',
    pronunciation: entry.pron || '',
    definition: (entry.strongs_def || '').replace(/^[\s;:]+/, '').trim(),
    kjv: entry.kjv_def || '',
    derivation: entry.derivation || '',
  };
}
