/**
 * Portfolio assistant v1 — pure, dependency-free keyword search.
 *
 * This module is the whole "intelligence" of the assistant, and there is
 * none: it tokenizes a query and scores it against an index serialized into
 * the page at build time (see `assistantIndex` in `lib/data.ts`). No model
 * call, no typing animation, no simulated answers. When nothing matches,
 * `searchEntries` returns nothing and the widget renders its honest fallback
 * (`AssistantWidget.astro`, `docs/assistant.md`).
 *
 * The file has zero imports and uses only erasable TypeScript syntax, so the
 * exact same code runs in three places: the browser bundle (the widget
 * script), the Astro build (index construction), and a bare `node` process
 * (verification). Keeping the scoring here — not inside the .astro file — is
 * what makes "suggested questions answer correctly from the data" a testable
 * claim instead of a hope.
 */

export type AssistantKind = 'work' | 'evidence' | 'evolution' | 'profile';

export interface AssistantEntry {
  /** Entry type; drives the tie-break bias in `searchEntries`. */
  ty: AssistantKind;
  /**
   * Strong tokens: words from the entry's name/tags/title/label plus the
   * documented keyword affordances added by `assistantIndex`. A query token
   * equal to one of these scores highest.
   */
  lo: string[];
  /**
   * Folded weak text (summary, narrative, headline, url): a query token found
   * as a substring here scores lower than a strong-token match — the ranking
   * rule the assistant promises.
   */
  we: string;
  /** Display title of the result row. */
  ti: string;
  /** One-line snippet under the title. */
  sn: string;
  /** Locale- and base-aware href (site route) or a `mailto:` compose. */
  hr: string;
  /** Localized status-badge label, or `null` when the entry has no status. */
  ba: string | null;
  /** Badge chip variant (`success` | `accent` | `warn` | `neutral`), or `null`. */
  bv: string | null;
  /** Milestone year (`YYYY`), or `null` for every other kind. */
  yr: string | null;
}

/** Lowercase and strip diacritics so `IA`, `Qué` and `que` compare alike. */
export function fold(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Split folded text on any run of non-alphanumerics; no stopwords applied. */
export function words(text: string): string[] {
  return fold(text).split(/[^a-z0-9]+/).filter((word) => word.length > 0);
}

/**
 * Minimal English + Spanish stopword list, applied to queries only. It exists
 * so "What has Cristian built?" reduces to `cristian built` and the Spanish
 * chip "¿Qué trabajo de IA está demostrado?" reduces honestly too. Entries are
 * indexed with their full word set — filtering happens on the query side,
 * never on the data side.
 */
const STOPWORDS = new Set([
  // English
  'what', 'when', 'where', 'which', 'who', 'whom', 'why', 'how',
  'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might',
  'do', 'does', 'did', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'am', 'you', 'your', 'yours', 'he', 'she', 'it',
  'its', 'we', 'they', 'their', 'them', 'this', 'that', 'these', 'those',
  'the', 'an', 'and', 'or', 'of', 'to', 'on', 'for', 'with', 'about',
  'into', 'over', 'under', 'vs', 'versus', 'me', 'my', 'mine', 'us', 'our',
  // Spanish
  'que', 'quien', 'quienes', 'cual', 'cuales', 'como', 'cuando', 'donde',
  'un', 'una', 'unos', 'unas', 'lo', 'el', 'la', 'los', 'las', 'le', 'les',
  'del', 'al', 'y', 'o', 'u', 'con', 'sin', 'sobre', 'por', 'para', 'en',
  'es', 'son', 'ser', 'estar', 'esta', 'este', 'estos', 'estas', 'ese',
  'esa', 'esos', 'esas', 'mi', 'tu', 'tu', 'su', 'se', 'me', 'te', 'nos',
  'os', 'hay', 'ha', 'han', 'fue', 'fueron', 'era', 'eran', 'muy', 'mas',
  'tambien', 'tambien', 'si', 'asi', 'entre', 'desde', 'hasta', 'segun',
]);

/**
 * Spanish → English keyword synonyms.
 *
 * The published data is English-only (the site's own translation contract), so
 * a free-typed Spanish query would otherwise match almost nothing. This map
 * folds a small, documented set of Spanish query words onto the English tokens
 * the index actually carries. It is applied on the query side only (inside
 * `tokenize`), so the index is never rewritten; a synonym whose target is not
 * in the index simply scores nothing and the widget keeps its honest fallback.
 *
 * Keys are accent-folded (`evolucion`, not `evolución`) because `fold` runs
 * before this lookup. Values are the English tokens produced by the index
 * builders in `lib/data.ts` (`KIND_TERMS`, `STATUS_TERMS`, names and tags).
 */
const SYNONYMS: Record<string, string[]> = {
  // work / built
  construido: ['built'],
  construida: ['built'],
  construye: ['built'],
  construyo: ['built'],
  construccion: ['built'],
  builds: ['built'],
  proyecto: ['projects'],
  proyectos: ['projects'],
  trabajo: ['projects'],
  // contact
  contacto: ['contact'],
  contactar: ['contact'],
  correo: ['contact'],
  email: ['contact'],
  // evidence
  evidencia: ['evidence'],
  // evolution / milestones
  evolucion: ['evolution'],
  hito: ['milestone', 'milestones'],
  hitos: ['milestone', 'milestones'],
  // claims
  demostrado: ['demonstrated'],
  demostrada: ['demonstrated'],
  demostrar: ['demonstrated'],
  aspiracional: ['aspirational'],
  // ai
  inteligencia: ['ai'],
  ia: ['ai'],
  // suggestion
  sugerencia: ['suggestion'],
  sugerencias: ['suggestion'],
};

/**
 * Query tokens: folded, split, single-character words and stopwords dropped,
 * duplicates removed, then each surviving word expanded with its Spanish
 * synonyms (`SYNONYMS`). Order of first appearance is kept.
 */
export function tokenize(query: string): string[] {
  const base = words(query).filter((word) => word.length > 1 && !STOPWORDS.has(word));
  const expanded: string[] = [];
  for (const word of base) {
    expanded.push(word, ...(SYNONYMS[word] ?? []));
  }
  return [...new Set(expanded)];
}

/**
 * Tie-break preference between kinds — always below 1 point, so it can never
 * outrank a real token match. The promise "name/tag/title matches beat
 * summary/narrative matches" (+3 versus +1) therefore stays strictly true;
 * this bias only decides which of two *equally matched* entries comes first
 * (a project before an evidence item before a milestone).
 */
const KIND_BIAS: Record<AssistantKind, number> = {
  work: 0.55,
  evidence: 0.45,
  profile: 0.35,
  evolution: 0.25,
};

/**
 * Match score of one entry against the query tokens: +3 per token with an
 * exact strong-token hit, +1 per token found only as weak-text substring.
 * A token that hits the strong list does not also score on the weak list
 * (else branch), so the strong-over-weak rule cannot be gamed by length.
 */
export function scoreEntry(entry: AssistantEntry, tokens: string[]): number {
  let score = 0;
  for (const token of tokens) {
    if (entry.lo.includes(token)) score += 3;
    else if (entry.we.includes(token)) score += 1;
  }
  return score;
}

/**
 * Top `limit` entries for a free-text query, best first.
 *
 * An entry is a match only when it has at least one real token hit: the
 * filter (`> 1`) excludes anything carried by the tie-break bias alone
 * (bias never exceeds 0.55) while keeping even a single weak substring hit
 * (1 + bias). No tokens → no results → the widget shows its fallback.
 */
export function searchEntries(entries: AssistantEntry[], query: string, limit = 3): AssistantEntry[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];
  const scored = entries
    .map((entry, index) => ({ entry, index, score: scoreEntry(entry, tokens) + KIND_BIAS[entry.ty] }))
    .filter((item) => item.score > 1);
  scored.sort((a, b) => (a.score !== b.score ? b.score - a.score : a.index - b.index));
  return scored.slice(0, limit).map((item) => item.entry);
}
