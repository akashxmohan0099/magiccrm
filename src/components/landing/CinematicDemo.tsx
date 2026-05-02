"use client";

// Entry point for the landing-page cinematic demo. The actual choreography
// lives under ./cinematic/ — split per concern so each piece (data,
// component variants, demo content renderer) can be edited without
// scrolling past unrelated sub-components.
//
// CinematicDemo currently renders only the customize-features variant; the
// module picker is exported separately in case the landing copy ever wants
// to lead with it.

export { ModulePickerDemo } from "./cinematic/ModulePickerDemo";
export { FeatureCustomizeDemo } from "./cinematic/FeatureCustomizeDemo";
export { MobileFeatureDemo } from "./cinematic/MobileFeatureDemo";

import { FeatureCustomizeDemo } from "./cinematic/FeatureCustomizeDemo";

export function CinematicDemo() {
  return <FeatureCustomizeDemo />;
}
