/**
 * Deep-dive onboarding analytics — instrumented from day one.
 *
 * v1: console.log structured events. Ready for future analytics pipeline.
 * Tracks: questions shown, answers given, features auto-enabled, features recommended.
 */

export interface DeepDiveEvent {
  event:
    | "question_shown"
    | "question_answered"
    | "followup_shown"
    | "followup_answered"
    | "feature_auto_enabled"
    | "feature_recommended"
    | "channel_selected"
    | "configure_completed"
    | "configure_skipped";
  questionId?: string;
  answer?: boolean | string[];
  featureId?: string;
  moduleId?: string;
  totalQuestionsShown?: number;
  timestamp: string;
}

export interface FeatureActivation {
  featureId: string;
  moduleId: string;
  state: "enabled" | "recommended";
  source: "default" | "deep-dive";
  triggerQuestionId?: string;
  triggerAnswer?: boolean | string[];
  appliedAt: string;
}

const events: DeepDiveEvent[] = [];

export function trackDeepDiveEvent(
  event: DeepDiveEvent["event"],
  data?: Omit<DeepDiveEvent, "event" | "timestamp">,
): void {
  const entry: DeepDiveEvent = {
    event,
    ...data,
    timestamp: new Date().toISOString(),
  };
  events.push(entry);

  if (process.env.NODE_ENV === "development") {
    console.log("[deep-dive]", entry.event, data ?? "");
  }
}

export function getDeepDiveEvents(): DeepDiveEvent[] {
  return [...events];
}

export function createActivation(
  featureId: string,
  moduleId: string,
  state: "enabled" | "recommended",
  source: "default" | "deep-dive",
  triggerQuestionId?: string,
  triggerAnswer?: boolean | string[],
): FeatureActivation {
  return {
    featureId,
    moduleId,
    state,
    source,
    triggerQuestionId,
    triggerAnswer,
    appliedAt: new Date().toISOString(),
  };
}
