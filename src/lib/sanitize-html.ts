/**
 * Sanitize HTML content to prevent XSS attacks.
 * Removes script tags, iframes, embeds, and all event handler attributes.
 */
export function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") return html; // SSR safety
  const div = document.createElement("div");
  div.innerHTML = html;
  div.querySelectorAll("script, style, iframe, object, embed").forEach((el) => el.remove());
  div.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
      if (attr.name === "href" && (el.getAttribute("href") || "").startsWith("javascript:")) {
        el.removeAttribute("href");
      }
    }
  });
  return div.innerHTML;
}
