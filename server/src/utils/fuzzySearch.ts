// ─────────────────────────────────────────────────────────────────────────────
// fuzzySearch — Google-style ranked fuzzy text matching.
//
// Pure functions, no database or framework dependencies.
//
// What "Google-style" means here:
//   • Word order does not matter ("binary tree depth" finds "depth of a tree").
//   • Typos are tolerated ("recusion" → "recursion", "algoritm" → "algorithm").
//   • Partial words work as you type ("recurs" → "recursion").
//   • Light stemming ("sorted"/"sorting"/"sorts" all match "sort").
//   • Accents and case are ignored.
//   • A message does not have to contain EVERY word — messages matching more
//     of your words, with better matches, simply rank higher.
//   • Filler words ("the", "is", "how") never count against a message.
//   • Exact phrases and words appearing close together get a bonus.
// ─────────────────────────────────────────────────────────────────────────────

export interface FuzzyMatch {
  score: number;
  /** [start, end) offsets into the ORIGINAL text, sorted and non-overlapping. */
  ranges: Array<[number, number]>;
}

interface DocToken {
  norm: string; // normalised token text
  stem: string;
  start: number; // offsets in the original string
  end: number;
}

const STOPWORDS = new Set(
  (
    "a an the and or but if of to in on at by for with from as is are was were be been being " +
    "it its this that these those i me my we our you your he she they them his her their " +
    "do does did so not no can could should would will just about into than then there here " +
    "what which who whom how when where why also very too"
  ).split(" "),
);

// Strip accents + lowercase, one character at a time so offsets stay aligned
// with the original string (NFD can change string length, so we map each
// original char individually).
function foldChar(ch: string): string {
  const folded = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return folded.length === 1 ? folded : folded.charAt(0) || ch.toLowerCase();
}

const WORD_CHAR = /[\p{L}\p{N}]/u;

/** Light suffix stemmer — deliberately conservative to avoid false matches. */
export function stem(word: string): string {
  let w = word;
  if (w.length <= 3) return w;
  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";
  if (w.endsWith("sses")) return w.slice(0, -2);
  if (w.endsWith("ing") && w.length > 5) {
    w = w.slice(0, -3);
    if (/(.)\1$/.test(w)) w = w.slice(0, -1); // running → run
    return w;
  }
  if (w.endsWith("ed") && w.length > 4) {
    w = w.slice(0, -2);
    if (/(.)\1$/.test(w)) w = w.slice(0, -1);
    return w;
  }
  if (w.endsWith("es") && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) return w.slice(0, -1);
  return w;
}

/** Split text into normalised word tokens, remembering original offsets. */
export function tokenize(text: string): DocToken[] {
  const tokens: DocToken[] = [];
  let i = 0;
  const n = text.length;
  while (i < n) {
    if (!WORD_CHAR.test(text[i])) {
      i++;
      continue;
    }
    const start = i;
    let norm = "";
    while (i < n && WORD_CHAR.test(text[i])) {
      norm += foldChar(text[i]);
      i++;
    }
    tokens.push({ norm, stem: stem(norm), start, end: i });
  }
  return tokens;
}

/** Optimal-string-alignment distance (Levenshtein + adjacent transposition), early-exits above `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  let prev2: number[] = new Array(lb + 1).fill(0);
  let prev: number[] = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i++) {
    const cur: number[] = new Array(lb + 1);
    cur[0] = i;
    let rowMin = cur[0];
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        v = Math.min(v, prev2[j - 2] + 1);
      }
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[lb];
}

/** How many typos we forgive for a query word of this length. */
function allowedEdits(len: number): number {
  if (len <= 3) return 0;
  if (len <= 7) return 1;
  return 2;
}

/** Score (0–1) of how well query word `q` matches document token `t`. */
function scoreWord(q: { norm: string; stem: string }, t: DocToken): number {
  if (q.norm === t.norm) return 1;
  if (q.stem === t.stem && q.stem.length >= 3) return 0.92;

  const ql = q.norm.length;
  // Prefix / "as you type": query is the beginning of the word.
  if (ql >= 2 && t.norm.startsWith(q.norm)) {
    return 0.78 + 0.12 * (ql / t.norm.length);
  }
  // Query is the beginning of the stemmed word's neighbours (recurs → recursion handled above).
  // Substring inside a longer word (e.g. "tree" in "subtree").
  if (ql >= 3 && t.norm.includes(q.norm)) {
    return 0.55 + 0.1 * (ql / t.norm.length);
  }
  // Typo tolerance — whole word.
  const maxEdits = allowedEdits(ql);
  if (maxEdits > 0) {
    const d = editDistance(q.norm, t.norm, maxEdits);
    if (d <= maxEdits) return 0.75 - 0.15 * (d - 1) - 0.05 * (d / ql);
    // Typo tolerance — partial word typed with a typo ("recurs1on" → "recursion").
    if (t.norm.length > ql) {
      const pd = editDistance(q.norm, t.norm.slice(0, ql), maxEdits);
      if (pd <= maxEdits) return 0.55 - 0.1 * (pd - 1);
    }
  }
  return 0;
}

export interface PreparedQuery {
  raw: string;
  normPhrase: string;
  words: Array<{ norm: string; stem: string; isStop: boolean }>;
}

export function prepareQuery(raw: string): PreparedQuery | null {
  const seen = new Set<string>();
  const all = tokenize(raw).filter((t) => {
    if (seen.has(t.norm)) return false;
    seen.add(t.norm);
    return true;
  });
  if (all.length === 0) return null;
  let words = all.map((t) => ({ norm: t.norm, stem: t.stem, isStop: STOPWORDS.has(t.norm) }));
  // Drop filler words — unless that would leave nothing to search for.
  const meaningful = words.filter((w) => !w.isStop);
  if (meaningful.length > 0) words = meaningful;
  return {
    raw,
    normPhrase: tokenize(raw).map((t) => t.norm).join(" "),
    words,
  };
}

/**
 * Score one document against a prepared query. Returns null if it should not
 * appear in the results at all.
 */
export function fuzzyMatch(query: PreparedQuery, text: string): FuzzyMatch | null {
  const tokens = tokenize(text);
  if (tokens.length === 0) return null;

  const n = query.words.length;
  const perWord: Array<{ score: number; idx: number }> = [];
  let matched = 0;
  let total = 0;

  for (const qw of query.words) {
    let best = 0;
    let bestIdx = -1;
    for (let i = 0; i < tokens.length; i++) {
      const s = scoreWord(qw, tokens[i]);
      if (s > best) {
        best = s;
        bestIdx = i;
        if (best === 1) break;
      }
    }
    perWord.push({ score: best, idx: bestIdx });
    if (best > 0) {
      matched++;
      total += best;
    }
  }

  // Need at least half of the (meaningful) words to match something.
  if (matched === 0 || matched < Math.ceil(n / 2)) return null;

  // Base: average quality across ALL query words (unmatched words count as 0),
  // so documents matching more of the query always outrank partial ones.
  let score = total / n;

  // Bonus: exact phrase present (normalised).
  if (n > 1) {
    const docNorm = tokens.map((t) => t.norm).join(" ");
    if (docNorm.includes(query.normPhrase)) score += 0.5;
  } else if (perWord[0].score === 1) {
    score += 0.1;
  }

  // Bonus: matched words close together (smaller span ⇒ bigger bonus).
  const idxs = perWord.filter((p) => p.idx >= 0).map((p) => p.idx);
  if (idxs.length > 1) {
    const span = Math.max(...idxs) - Math.min(...idxs) + 1;
    score += 0.25 * (idxs.length / span);
  }

  // Tiny bonus for repeated occurrences of an exact word; tiny penalty for
  // very long documents so a short, on-topic message beats a huge code dump.
  score += Math.min(0.05, tokens.length > 0 ? matched / tokens.length : 0);
  score -= Math.min(0.1, Math.log10(Math.max(10, tokens.length)) * 0.02);

  // Highlight every token that matched ANY query word.
  const ranges: Array<[number, number]> = [];
  for (const t of tokens) {
    for (const qw of query.words) {
      if (scoreWord(qw, t) >= 0.5) {
        ranges.push([t.start, t.end]);
        break;
      }
    }
  }

  return { score, ranges };
}

/**
 * Cut a readable window out of a long message, centred on the densest cluster
 * of matches, and re-base highlight offsets onto the window.
 */
export function buildSnippet(
  text: string,
  ranges: Array<[number, number]>,
  maxLen = 260,
): { snippet: string; highlights: Array<[number, number]> } {
  if (text.length <= maxLen) return { snippet: text, highlights: ranges };

  // Anchor on the first range that has the most neighbours within maxLen.
  let anchor = ranges[0]?.[0] ?? 0;
  let bestCount = -1;
  for (const [s] of ranges) {
    const count = ranges.filter(([rs]) => rs >= s && rs < s + maxLen - 40).length;
    if (count > bestCount) {
      bestCount = count;
      anchor = s;
    }
  }

  let start = Math.max(0, anchor - 60);
  let end = Math.min(text.length, start + maxLen);
  start = Math.max(0, end - maxLen);
  // Snap to word boundaries so we don't cut words in half.
  if (start > 0) {
    const sp = text.indexOf(" ", start);
    if (sp !== -1 && sp < anchor) start = sp + 1;
  }
  if (end < text.length) {
    const sp = text.lastIndexOf(" ", end);
    if (sp > anchor) end = sp;
  }

  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  const snippet = prefix + text.slice(start, end) + suffix;
  const shift = prefix.length - start;
  const highlights = ranges
    .filter(([s, e]) => s >= start && e <= end)
    .map(([s, e]) => [s + shift, e + shift] as [number, number]);
  return { snippet, highlights };
}
