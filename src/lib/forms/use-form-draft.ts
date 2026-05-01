import { useCallback, useRef, useState } from "react";
import type {
  Form,
  FormBranding,
  FormFieldConfig,
  FormFontFamily,
  FormSuccessVariant,
  FormTemplate,
  FormTheme,
} from "@/types/models";

/**
 * The editor's editable state in one place.
 *
 * Why a single object: `FormEditor` previously kept 32+ scalar `useState`
 * slots for branding fields plus separate `userSlug`/`slugTouched`/`fields`
 * trackers. Every JSX expression that read or wrote a branding value
 * referenced two identifiers (`color` + `setColor`); the autosave effect
 * had a 30-line dep array; the live-preview wiring re-built a `branding`
 * object on every render. This hook collapses all of that to one piece of
 * state, two patch functions, and a small reducer-shaped `fieldOps` for
 * list mutations that need atomic transitions.
 *
 * Defaults are pulled from the loaded form once. Re-rendering the parent
 * with a new `form` prop won't reset state — that matches the pre-refactor
 * behaviour (the parent remounts FormEditor via `key={selected.id}` when
 * switching forms, so the hook's `useState` initializer fires fresh).
 */
export interface DraftBranding {
  primaryColor: string;
  accentColor: string;
  description: string;
  successMessage: string;
  template: FormTemplate;
  fontFamily: FormFontFamily;
  headingFontFamily: FormFontFamily;
  theme: FormTheme;
  logo?: string;
  coverImage?: string;
  welcomeEnabled: boolean;
  welcomeTitle: string;
  welcomeSubtitle: string;
  welcomeCtaLabel: string;
  successRouteFieldName?: string;
  successVariants: FormSuccessVariant[];
  successCtaLabel: string;
  successCtaUrl: string;
  successRedirectUrl: string;
  successRedirectDelaySeconds: number;
  autoReplyEnabled: boolean;
  autoReplySubject: string;
  autoReplyBody: string;
  autoReplyDelayMinutes: number;
  autoReplySmsEnabled: boolean;
  autoReplySmsBody: string;
  autoReplySmsDelayMinutes: number;
  notifyOwnerEmail: boolean;
}

export interface FormDraft {
  name: string;
  /** User-typed slug. While `slugTouched` is false, this is empty and the
   *  editor derives a display slug from the name on render. Once the user
   *  edits the slug field, `slugTouched` flips and `slug` becomes canonical. */
  slug: string;
  slugTouched: boolean;
  fields: FormFieldConfig[];
  branding: DraftBranding;
}

/**
 * Convert the draft's branding shape to the persisted FormBranding shape.
 * The draft uses non-optional defaults for ergonomics (empty string instead
 * of undefined); the DB column expects undefined for "no value." This
 * coercion is also what determines whether a per-field default takes effect
 * when the form is rendered (an empty `successCtaLabel` becomes undefined,
 * which means "no CTA shown").
 *
 * Pure — same inputs always produce the same output. Originally inlined in
 * `FormEditor` as a useCallback; pulling it out makes the live preview and
 * the save commit share a single source of truth for the conversion.
 */
export function buildBrandingFromDraft(
  draft: DraftBranding,
  base: FormBranding,
): FormBranding {
  return {
    ...base,
    primaryColor: draft.primaryColor,
    accentColor: draft.accentColor.trim() || undefined,
    description: draft.description.trim() || undefined,
    successMessage: draft.successMessage.trim() || undefined,
    template: draft.template,
    fontFamily: draft.fontFamily,
    headingFontFamily: draft.headingFontFamily,
    theme: draft.theme,
    logo: draft.logo,
    coverImage: draft.coverImage,
    welcomeEnabled: draft.welcomeEnabled,
    welcomeTitle: draft.welcomeTitle.trim() || undefined,
    welcomeSubtitle: draft.welcomeSubtitle.trim() || undefined,
    welcomeCtaLabel: draft.welcomeCtaLabel.trim() || undefined,
    successCtaLabel: draft.successCtaLabel.trim() || undefined,
    successCtaUrl: draft.successCtaUrl.trim() || undefined,
    successRedirectUrl: draft.successRedirectUrl.trim() || undefined,
    successRedirectDelaySeconds:
      draft.successRedirectUrl.trim() && Number.isFinite(draft.successRedirectDelaySeconds)
        ? Math.max(0, Math.min(60, draft.successRedirectDelaySeconds))
        : undefined,
    successRouteFieldName: draft.successRouteFieldName || undefined,
    successVariants: draft.successVariants.length > 0 ? draft.successVariants : undefined,
    autoReplyEnabled: draft.autoReplyEnabled,
    autoReplySubject: draft.autoReplySubject.trim() || undefined,
    autoReplyBody: draft.autoReplyBody.trim() || undefined,
    autoReplyDelayMinutes: clampDelay(draft.autoReplyDelayMinutes),
    autoReplySmsEnabled: draft.autoReplySmsEnabled,
    autoReplySmsBody: draft.autoReplySmsBody.trim() || undefined,
    autoReplySmsDelayMinutes: clampDelay(draft.autoReplySmsDelayMinutes),
    notifyOwnerEmail: draft.notifyOwnerEmail,
  };
}

// Match FormEditor's clampDelay exactly so the persisted shape doesn't
// shift between the inline-callback world and the hook world.
const MAX_AUTOREPLY_DELAY_MINUTES = 60 * 24 * 7;
function clampDelay(v: number): number | undefined {
  if (!Number.isFinite(v) || v <= 0) return undefined;
  return Math.min(Math.max(0, Math.round(v)), MAX_AUTOREPLY_DELAY_MINUTES);
}

function brandingFromForm(branding: FormBranding): DraftBranding {
  return {
    primaryColor: branding.primaryColor || "#8B5CF6",
    accentColor: branding.accentColor || "",
    description: branding.description ?? "",
    successMessage: branding.successMessage ?? "",
    template: branding.template ?? "classic",
    fontFamily: branding.fontFamily ?? "sans",
    headingFontFamily:
      branding.headingFontFamily ?? branding.fontFamily ?? "sans",
    theme: branding.theme ?? "light",
    logo: branding.logo,
    coverImage: branding.coverImage,
    welcomeEnabled: branding.welcomeEnabled ?? false,
    welcomeTitle: branding.welcomeTitle ?? "",
    welcomeSubtitle: branding.welcomeSubtitle ?? "",
    welcomeCtaLabel: branding.welcomeCtaLabel ?? "",
    successRouteFieldName: branding.successRouteFieldName,
    successVariants: branding.successVariants ?? [],
    successCtaLabel: branding.successCtaLabel ?? "",
    successCtaUrl: branding.successCtaUrl ?? "",
    successRedirectUrl: branding.successRedirectUrl ?? "",
    successRedirectDelaySeconds: branding.successRedirectDelaySeconds ?? 5,
    autoReplyEnabled: branding.autoReplyEnabled ?? true,
    autoReplySubject: branding.autoReplySubject ?? "",
    autoReplyBody: branding.autoReplyBody ?? "",
    autoReplyDelayMinutes: branding.autoReplyDelayMinutes ?? 0,
    autoReplySmsEnabled: branding.autoReplySmsEnabled ?? false,
    autoReplySmsBody: branding.autoReplySmsBody ?? "",
    autoReplySmsDelayMinutes: branding.autoReplySmsDelayMinutes ?? 0,
    notifyOwnerEmail: branding.notifyOwnerEmail ?? true,
  };
}

/**
 * Auto-uniquify any duplicate `name`s in the loaded form. Older versions of
 * the editor rewrote `name` from `label` on every keystroke, so a form with
 * two identically-labelled fields persisted with colliding names. Submission
 * values would silently overwrite. We fix once on load by suffixing
 * collisions; the editor reads the returned `didUniquifyOnLoad` flag to
 * trigger a one-shot autosave that persists the fix to the DB.
 */
function uniquifyFieldNames(fields: FormFieldConfig[]): {
  fields: FormFieldConfig[];
  changed: boolean;
} {
  const seen = new Set<string>();
  let changed = false;
  const out = fields.map((f) => {
    if (!seen.has(f.name)) {
      seen.add(f.name);
      return f;
    }
    let suffix = 2;
    let candidate = `${f.name}_${suffix}`;
    while (seen.has(candidate)) {
      suffix += 1;
      candidate = `${f.name}_${suffix}`;
    }
    seen.add(candidate);
    changed = true;
    return { ...f, name: candidate };
  });
  return { fields: out, changed };
}

export interface FieldOps {
  /** Replace the entire field list. Accepts either the new array or a
   *  React-style updater function that receives the previous fields and
   *  returns the next ones — matches the dispatcher signature of the
   *  `useState` setter that this hook replaces, so existing call sites
   *  keep working without rewrites. */
  setFields: (next: FormFieldConfig[] | ((prev: FormFieldConfig[]) => FormFieldConfig[])) => void;
  /** Append a new field. Caller supplies the seeded base; the hook
   *  guarantees the `name` is unique by suffixing on collision. Returns
   *  the resolved name so the caller can scroll/focus the new row. */
  addField: (base: FormFieldConfig) => string;
  /** Patch a single field by index. */
  updateField: (index: number, patch: Partial<FormFieldConfig>) => void;
  /** Remove a field by index. */
  removeField: (index: number) => void;
  /** Move a field from one index to another. */
  reorderField: (from: number, to: number) => void;
  /** Duplicate a field — copies config, generates a unique name. */
  duplicateField: (index: number) => void;
}

export interface UseFormDraftResult {
  draft: FormDraft;
  /** Patch top-level scalars (name, slug, slugTouched). Does NOT recurse
   *  into branding or fields — use updateBranding / fieldOps for those. */
  updateDraft: (patch: Partial<Omit<FormDraft, "branding" | "fields">>) => void;
  /** Patch one or more branding values. Other branding keys are preserved. */
  updateBranding: (patch: Partial<DraftBranding>) => void;
  fieldOps: FieldOps;
  /** True when the load-time uniquify changed at least one field name.
   *  The editor uses this to force the first autosave instead of skipping. */
  didUniquifyOnLoad: boolean;
}

export function useFormDraft(form: Form): UseFormDraftResult {
  // Capture the load-time uniquify result in a ref so the editor can read
  // it during render (state setters in the initializer can't be async, and
  // we don't want to make this an effect).
  const didUniquifyOnLoadRef = useRef(false);

  const [draft, setDraft] = useState<FormDraft>(() => {
    const { fields, changed } = uniquifyFieldNames(form.fields);
    didUniquifyOnLoadRef.current = changed;
    return {
      name: form.name,
      slug: form.slug || "",
      slugTouched: !!form.slug,
      fields,
      branding: brandingFromForm(form.branding),
    };
  });

  const updateDraft = useCallback<UseFormDraftResult["updateDraft"]>(
    (patch) => {
      setDraft((prev) => ({ ...prev, ...patch }));
    },
    [],
  );

  const updateBranding = useCallback<UseFormDraftResult["updateBranding"]>(
    (patch) => {
      setDraft((prev) => ({
        ...prev,
        branding: { ...prev.branding, ...patch },
      }));
    },
    [],
  );

  const setFields = useCallback<FieldOps["setFields"]>((next) => {
    setDraft((prev) => ({
      ...prev,
      fields: typeof next === "function" ? next(prev.fields) : next,
    }));
  }, []);

  const addField = useCallback<FieldOps["addField"]>((base) => {
    let resolvedName = base.name;
    setDraft((prev) => {
      const taken = new Set(prev.fields.map((f) => f.name));
      // Suffix-on-collision so deleting a middle field then re-adding the
      // same type doesn't reuse the original index and overwrite the
      // earlier field's submission values.
      if (taken.has(base.name)) {
        let suffix = 2;
        let candidate = `${base.name}_${suffix}`;
        while (taken.has(candidate)) {
          suffix += 1;
          candidate = `${base.name}_${suffix}`;
        }
        resolvedName = candidate;
      }
      const next = { ...base, name: resolvedName };
      return { ...prev, fields: [...prev.fields, next] };
    });
    return resolvedName;
  }, []);

  const updateField = useCallback<FieldOps["updateField"]>(
    (index, patch) => {
      setDraft((prev) => {
        const fields = prev.fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
        return { ...prev, fields };
      });
    },
    [],
  );

  const removeField = useCallback<FieldOps["removeField"]>((index) => {
    setDraft((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  }, []);

  const reorderField = useCallback<FieldOps["reorderField"]>((from, to) => {
    setDraft((prev) => {
      if (from === to) return prev;
      const fields = [...prev.fields];
      const [moved] = fields.splice(from, 1);
      fields.splice(to, 0, moved);
      return { ...prev, fields };
    });
  }, []);

  const duplicateField = useCallback<FieldOps["duplicateField"]>((index) => {
    setDraft((prev) => {
      const source = prev.fields[index];
      if (!source) return prev;
      const taken = new Set(prev.fields.map((f) => f.name));
      let suffix = 1;
      let candidate = `${source.name}_copy`;
      while (taken.has(candidate)) {
        suffix += 1;
        candidate = `${source.name}_copy_${suffix}`;
      }
      const copy: FormFieldConfig = { ...source, name: candidate, label: `${source.label} (copy)` };
      const fields = [
        ...prev.fields.slice(0, index + 1),
        copy,
        ...prev.fields.slice(index + 1),
      ];
      return { ...prev, fields };
    });
  }, []);

  const fieldOps: FieldOps = {
    setFields,
    addField,
    updateField,
    removeField,
    reorderField,
    duplicateField,
  };

  return {
    draft,
    updateDraft,
    updateBranding,
    fieldOps,
    didUniquifyOnLoad: didUniquifyOnLoadRef.current,
  };
}
