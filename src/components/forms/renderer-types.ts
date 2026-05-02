// Shared types for the form-renderer surface. Lifted out of FormRenderer.tsx
// so sub-components (templates, fields, etc.) can import them without dragging
// in the entire renderer module.

import type {
  FormBranding,
  FormFieldConfig,
  FormType,
} from "@/types/models";

/** Shared shape so editor preview, public inquiry page, and embed page can
 *  all hand the same renderer their form. Only the bits the renderer needs. */
export interface RenderableForm {
  id?: string;
  name: string;
  slug?: string;
  fields: FormFieldConfig[];
  branding: FormBranding;
  type?: FormType;
}

/** Minimal shape the renderer needs for the Service field dropdown. */
export interface RenderableService {
  id: string;
  name: string;
}

export interface FormRendererProps {
  form: RenderableForm;
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  onSubmit: () => void | Promise<void>;
  submitting?: boolean;
  submitted?: boolean;
  error?: string;
  compact?: boolean;
  /** Disables real submission and lets the editor force the success view. */
  preview?: boolean;
  /** Editor-only: pin which view (welcome / form / success) is rendered. */
  forceView?: "welcome" | "form" | "success";
  submitLabel?: string;
  /** Embed page can override accent via query param. */
  brandColorOverride?: string;
  showPoweredBy?: boolean;
  /** Workspace-level logo from Settings. Used when the form has no logo
   *  override of its own — keeps branding uniform by default. */
  workspaceLogo?: string;
  /** Live services from the workspace. Powers the Service field dropdown so
   *  options stay in sync as services are added/renamed. */
  services?: RenderableService[];
  /** Editor-only: pin a specific success variant on the Success view so the
   *  operator can preview each routed thank-you without faking submissions.
   *  When undefined the renderer falls through to value-based variant
   *  matching (the public-form behaviour). */
  forceSuccessVariantId?: string;
  /** Per-field validation errors keyed by field.name. Rendered inline under
   *  each affected field. Top-level submission errors still go through `error`. */
  fieldErrors?: Record<string, string>;
}
