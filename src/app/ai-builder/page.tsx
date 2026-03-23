"use client";

import { useState } from "react";
import {
  Wand2, Send, ArrowLeft, Sparkles, Coins, Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useBuilderStore } from "@/store/builder";
import { useOnboardingStore } from "@/store/onboarding";
import { BuilderRequestList } from "@/components/builder/BuilderRequestList";
import { requestBuilderBrief } from "@/lib/builder-requests";
import { toast } from "@/components/ui/Toast";

export default function AIBuilderPage() {
  const { credits, prompt, setPrompt, buildRequests, createBuildRequest, updateBuildRequest, useCredits: consumeCredits } =
    useBuilderStore();
  const businessContext = useOnboardingStore((s) => s.businessContext);
  const [submitting, setSubmitting] = useState(false);
  const requests = buildRequests.filter((request) => request.source === "ai-builder");

  const handleSubmit = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || submitting) return;

    if (!consumeCredits(1)) {
      toast("You need at least 1 credit to submit a builder request", "error");
      return;
    }

    const request = createBuildRequest({
      prompt: trimmedPrompt,
      source: "ai-builder",
      requestType: "feature",
      status: "generating",
      creditCost: 1,
    });

    setPrompt("");
    setSubmitting(true);

    try {
      const result = await requestBuilderBrief({ prompt: trimmedPrompt, businessContext });
      updateBuildRequest(request.id, { status: "review-ready", result, error: undefined });
      toast("Implementation brief generated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate AI brief";
      updateBuildRequest(request.id, {
        status: "failed",
        error: `${message}. The request is still saved for backend handoff.`,
      });
      toast("AI generation failed. Request saved locally for backend handoff.", "warning");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" /> Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 tracking-tight">
                <Wand2 className="w-6 h-6 text-foreground" />
                AI Builder
              </h1>
              <p className="text-sm text-text-secondary">
                Describe a feature and generate an implementation brief for the backend
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-card-bg rounded-xl border border-border-light">
            <Coins className="w-4 h-4 text-foreground" />
            <span className="font-semibold text-foreground">{credits}</span>
            <span className="text-sm text-text-secondary">credits</span>
          </div>
        </div>

        {/* Input area */}
        <div className="bg-card-bg rounded-2xl border border-border-light p-6 mb-8">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-surface rounded-lg mt-1">
              <Sparkles className="w-5 h-5 text-foreground" />
            </div>
            <div className="flex-1">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the feature you need... e.g., 'I need a loyalty points system that tracks customer purchases and rewards repeat buyers with discounts'"
                rows={3}
                className="w-full px-0 py-1 text-foreground placeholder-text-secondary bg-transparent border-none outline-none resize-none text-base"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey) handleSubmit();
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-light">
            <p className="text-xs text-text-secondary">
              {credits > 0
                ? `Each request uses 1 credit. ${credits} remaining.`
                : "No credits remaining. Purchase more to continue."}
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() || submitting || credits < 1}
              loading={submitting}
              size="sm"
            >
              <Send className="w-4 h-4" /> Generate Brief
            </Button>
          </div>
        </div>

        <div className="bg-surface border border-border-light rounded-xl p-4 mb-6">
          <p className="text-sm text-text-secondary leading-relaxed">
            Requests are persisted locally now. If the AI route is available, this screen generates a short implementation brief immediately; if not, the saved request still defines the backend work item.
          </p>
        </div>

        {/* Suggestions */}
        {requests.length === 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              Try these ideas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "A loyalty points system for repeat customers",
                "Automated follow-up emails after purchases",
                "A simple referral tracking system",
                "Custom intake form for new client onboarding",
              ].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(suggestion)}
                  className="p-4 bg-card-bg rounded-xl border border-border-light text-left hover:border-foreground/20 hover:bg-surface transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{suggestion}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <BuilderRequestList
          requests={requests}
          title="AI Builder Requests"
          description="Saved prompts and AI-generated implementation briefs for custom features."
        />
      </div>
    </div>
  );
}
