/**
 * Currency formatting that reads from workspace settings.
 *
 * The workspace's `currency` (ISO 4217) and `locale` (BCP-47) drive every
 * `$` we render. Falls back to USD/en-US when settings haven't loaded yet.
 *
 * Two flavours:
 *   - `formatMoney(amount, settings, opts)` — pure helper, takes settings.
 *   - `useMoney()` — React hook that pulls settings from the store and
 *     returns a memoised formatter for use inside components.
 */
import { useMemo } from "react";
import type { WorkspaceSettings } from "@/types/models";
import { useSettingsStore } from "@/store/settings";

const DEFAULT_CURRENCY = "USD";
const DEFAULT_LOCALE = "en-US";

export interface FormatMoneyOptions {
  /** Force decimals on (true) or off (false). Defaults to off (whole dollars). */
  withDecimals?: boolean;
  /** Override currency for one-off conversions (rare). */
  currency?: string;
}

export function getCurrency(settings: WorkspaceSettings | null): string {
  return settings?.currency || DEFAULT_CURRENCY;
}

export function getLocale(settings: WorkspaceSettings | null): string {
  return settings?.locale || DEFAULT_LOCALE;
}

export function formatMoney(
  amount: number,
  settings: WorkspaceSettings | null,
  opts: FormatMoneyOptions = {},
): string {
  const currency = opts.currency || getCurrency(settings);
  const locale = getLocale(settings);
  const fractionDigits = opts.withDecimals ? 2 : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    // Bad currency code — fall back to a plain symbol.
    const rounded = opts.withDecimals
      ? amount.toFixed(2)
      : Math.round(amount).toLocaleString();
    return `${currency} ${rounded}`;
  }
}

/**
 * Hook returning a memoised `format(amount, opts?)` bound to the workspace's
 * currency + locale. Re-renders only when those two settings change, so it's
 * safe to call from any component.
 */
export function useMoney() {
  const currency = useSettingsStore((s) => s.settings?.currency);
  const locale = useSettingsStore((s) => s.settings?.locale);

  return useMemo(() => {
    const c = currency || DEFAULT_CURRENCY;
    const l = locale || DEFAULT_LOCALE;
    return {
      currency: c,
      locale: l,
      format(amount: number, opts: FormatMoneyOptions = {}): string {
        const fractionDigits = opts.withDecimals ? 2 : 0;
        const cur = opts.currency || c;
        try {
          return new Intl.NumberFormat(l, {
            style: "currency",
            currency: cur,
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
          }).format(amount);
        } catch {
          const rounded = opts.withDecimals
            ? amount.toFixed(2)
            : Math.round(amount).toLocaleString();
          return `${cur} ${rounded}`;
        }
      },
      /** Just the symbol (or code) for inline use, e.g. "Price ($)". */
      symbol(): string {
        try {
          const parts = new Intl.NumberFormat(l, {
            style: "currency",
            currency: c,
          }).formatToParts(0);
          return parts.find((p) => p.type === "currency")?.value ?? c;
        } catch {
          return c;
        }
      },
    };
  }, [currency, locale]);
}
