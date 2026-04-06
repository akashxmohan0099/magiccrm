/**
 * Sanitize HTML content to prevent XSS attacks.
 * Uses a strict allowlist of tags and attributes.
 * Anything not on the list is stripped entirely.
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "s", "strike",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "a", "span", "div",
  "table", "thead", "tbody", "tr", "th", "td",
  "hr", "sub", "sup",
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "title"]),
  span: new Set(["class"]),
  div: new Set(["class"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
};

/** Protocols allowed in href attributes. */
const SAFE_URL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, "https://placeholder.invalid");
    return SAFE_URL_PROTOCOLS.has(parsed.protocol);
  } catch {
    // Relative URLs are fine
    return !url.trim().toLowerCase().startsWith("javascript:");
  }
}

export function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") {
    // SSR: strip all HTML tags as a safe fallback
    return html.replace(/<[^>]*>/g, "");
  }

  const div = document.createElement("div");
  div.innerHTML = html;

  sanitizeNode(div);

  return div.innerHTML;
}

function sanitizeNode(node: Node): void {
  const childrenToRemove: Node[] = [];

  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      continue; // text is safe
    }

    if (child.nodeType === Node.COMMENT_NODE) {
      childrenToRemove.push(child);
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      childrenToRemove.push(child);
      continue;
    }

    const el = child as Element;
    const tagName = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tagName)) {
      // Replace disallowed element with its text content
      const text = document.createTextNode(el.textContent || "");
      node.replaceChild(text, child);
      continue;
    }

    // Strip all attributes except those in the allowlist
    const allowedForTag = ALLOWED_ATTRS[tagName];
    for (const attr of Array.from(el.attributes)) {
      if (!allowedForTag?.has(attr.name)) {
        el.removeAttribute(attr.name);
      }
    }

    // Validate href on anchor tags
    if (tagName === "a") {
      const href = el.getAttribute("href");
      if (href && !isSafeUrl(href)) {
        el.removeAttribute("href");
      }
      // Force external links to open safely
      el.setAttribute("rel", "noopener noreferrer");
    }

    // Recurse into children
    sanitizeNode(el);
  }

  for (const child of childrenToRemove) {
    node.removeChild(child);
  }
}
