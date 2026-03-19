"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2, Send, ArrowLeft, Sparkles, Coins,
  Clock, Check, AlertCircle, Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface BuildRequest {
  id: string;
  prompt: string;
  status: "pending" | "building" | "complete" | "error";
  result?: string;
  timestamp: Date;
}

export default function AIBuilderPage() {
  const [prompt, setPrompt] = useState("");
  const [credits, setCredits] = useState(25);
  const [requests, setRequests] = useState<BuildRequest[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim() || credits <= 0 || isGenerating) return;

    const newRequest: BuildRequest = {
      id: Date.now().toString(),
      prompt: prompt.trim(),
      status: "building",
      timestamp: new Date(),
    };

    setRequests((prev) => [newRequest, ...prev]);
    setPrompt("");
    setIsGenerating(true);
    setCredits((c) => c - 1);

    // Simulate AI generation (in production, this calls /api/ai-builder)
    setTimeout(() => {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === newRequest.id
            ? {
                ...r,
                status: "complete",
                result: `Custom feature "${r.prompt}" has been generated and added to your CRM. You can find it in your dashboard under Custom Features.`,
              }
            : r
        )
      );
      setIsGenerating(false);
    }, 3000);
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
                Describe a custom feature and we&apos;ll build it for you
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
              disabled={!prompt.trim() || credits <= 0 || isGenerating}
              size="sm"
            >
              {isGenerating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                  Building...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Build Feature
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Credit upsell */}
        {credits <= 5 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border-light rounded-xl p-4 mb-6 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-foreground flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {credits === 0 ? "Out of credits!" : `Only ${credits} credits left`}
              </p>
              <p className="text-xs text-text-secondary">
                Get more credits to keep building custom features.
              </p>
            </div>
            <Button size="sm" variant="secondary">
              Buy Credits
            </Button>
          </motion.div>
        )}

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

        {/* Request history */}
        <AnimatePresence>
          {requests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card-bg rounded-xl border border-border-light p-5 mb-4"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    req.status === "complete"
                      ? "bg-surface"
                      : req.status === "error"
                      ? "bg-[#FFBDB1]/20"
                      : "bg-surface"
                  }`}
                >
                  {req.status === "complete" ? (
                    <Check className="w-4 h-4 text-foreground" />
                  ) : req.status === "error" ? (
                    <AlertCircle className="w-4 h-4 text-[#CB2D2D]" />
                  ) : (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-4 h-4 text-foreground" />
                    </motion.div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{req.prompt}</p>
                  {req.result && (
                    <p className="text-sm text-text-secondary mt-2">{req.result}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3 text-text-secondary" />
                    <span className="text-xs text-text-secondary">
                      {req.timestamp.toLocaleTimeString()}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        req.status === "complete"
                          ? "bg-surface text-foreground"
                          : req.status === "error"
                          ? "bg-[#FFBDB1]/20 text-[#CB2D2D]"
                          : "bg-surface text-foreground"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
