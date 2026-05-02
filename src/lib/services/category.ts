/**
 * Resolve a service's display category name.
 *
 * Services link to a category via two fields:
 *   - `categoryId` — the canonical link to a `service_categories` row.
 *   - `category`   — legacy free-text fallback, kept until every consumer
 *                    has migrated to the canonical link.
 *
 * Order of precedence: categoryId → category → empty string. Returning the
 * empty string lets the caller render whatever its "Uncategorized" label is.
 *
 * Pure helper — accepts whatever shape is at hand. The category lookup only
 * needs `id` and `name`.
 */
export function resolveServiceCategoryName(
  service: { categoryId?: string | null; category?: string },
  categories: Array<{ id: string; name: string }>,
): string {
  if (service.categoryId) {
    const found = categories.find((c) => c.id === service.categoryId);
    if (found) return found.name;
  }
  return service.category ?? "";
}
