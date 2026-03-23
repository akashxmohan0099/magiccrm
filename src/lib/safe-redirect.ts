/**
 * Validate a redirect path is safe (relative, no open redirect).
 */
export function safeRedirect(path: string | null, fallback = "/dashboard"): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }
  return path;
}
