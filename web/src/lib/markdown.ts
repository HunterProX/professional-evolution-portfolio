/**
 * Minimal, safe markdown renderer for case-study section bodies.
 *
 * The bodies in `data/case-studies.json` are verbatim slices of the legacy
 * `case-studies/*.md` files, so they are treated as untrusted text:
 *
 *  1. Every character is HTML-escaped first — no source byte can ever reach
 *     the DOM as markup (no HTML passthrough).
 *  2. Only two markdown constructs are then re-introduced, both as tags this
 *     module writes itself: **bold** → `<strong>`, and links — `[text](url)`
 *     plus the `<https://…>` autolink form the source uses for repositories.
 *
 * Everything else (`#`, backticks, angle-bracket prose, …) stays literal text
 * on purpose: the renderer is deliberately narrower than markdown so a body can
 * never inject an element, an attribute or a `javascript:` URL. URLs must be
 * http(s); anything else is left as text.
 *
 * Block level: blank lines separate blocks, `- `/`* ` lines become a `<ul>`,
 * an indented line continues the block above it (the source hard-wraps prose
 * and list items), and the remaining lines join into a paragraph — standard
 * markdown joining, so the wrapped source reads as one sentence.
 */
const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** Only absolute http(s) links are ever emitted as anchors. */
const SAFE_URL = `https?:\\/\\/[^\\s<>"']+`;

function renderInline(text: string): string {
  // Escape first: everything below this line is our own generated markup.
  let out = escapeHtml(text);

  // `<https://…>` autolinks. The brackets are already `&lt;` / `&gt;`.
  out = out.replace(
    new RegExp(`&lt;(${SAFE_URL}?)&gt;`, 'g'),
    (_match, url) => anchor(url, url),
  );

  // `[label](https://…)`
  out = out.replace(
    new RegExp(`\\[([^\\]]+)\\]\\((${SAFE_URL})\\)`, 'g'),
    (_match, label, url) => anchor(url, label),
  );

  // `**bold**`
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  return out;
}

function anchor(url: string, label: string): string {
  // Belt and braces: the regex already requires http(s), re-check the parsed
  // scheme so a malformed URL degrades to plain text instead of a live link.
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return label;
  } catch {
    return label;
  }
  return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

/** Trim leading/trailing blank lines without touching the content between them. */
function trimBlank(lines: string[]): string[] {
  const start = lines.findIndex((line) => line.trim() !== '');
  if (start === -1) return [];
  let end = lines.length - 1;
  while (end > start && lines[end].trim() === '') end -= 1;
  return lines.slice(start, end + 1);
}

/**
 * Render one section body to an HTML fragment safe for `set:html`.
 * Returns an empty string for an empty body.
 */
export function renderSectionBody(body: string): string {
  const blocks: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(`<ul>${list.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
    list = [];
  };

  const flush = () => {
    flushParagraph();
    flushList();
  };

  for (const line of trimBlank(body.split(/\r?\n/))) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      list.push(bullet[1]);
      continue;
    }

    if (/^\s+/.test(line)) {
      // Indented continuation of the block above (hard-wrapped source).
      if (list.length > 0) list[list.length - 1] += ` ${line.trim()}`;
      else paragraph.push(line.trim());
      continue;
    }

    // Column-0 prose closes a list and starts or continues a paragraph.
    if (list.length > 0) flushList();
    paragraph.push(line.trim());
  }

  flush();
  return blocks.join('\n');
}
