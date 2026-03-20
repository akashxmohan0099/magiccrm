"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wand2, MessageSquare, Cpu, Sparkles, ArrowRight,
  Shield, Database, Layout, Zap, Trash2,
} from "lucide-react";
import { useBuilderStore } from "@/store/builder";

const EXAMPLE_PROMPTS = [
  "Gift card & voucher system",
  "Client loyalty points tracker",
  "Inventory alerts when stock is low",
  "Custom intake form for new clients",
  "Waitlist for fully booked slots",
  "Referral tracking system",
];

export default function BuilderPage() {
  const { credits, prompt, setPrompt, customFeatures, removeFeature } = useBuilderStore();
  const [isBuilding, setIsBuilding] = useState(false);

  const readyFeatures = customFeatures.filter((f) => f.status === "ready");

  const handleBuild = () => {
    if (!prompt.trim()) return;
    setIsBuilding(true);
    // TODO: Wire to Claude API to generate CustomFeature definition
    setTimeout(() => setIsBuilding(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="w-14 h-14 bg-primary-muted rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Wand2 className="w-6 h-6 text-foreground" />
        </div>
        <h1 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
          Build Your Own Feature
        </h1>
        <p className="text-[15px] text-text-secondary max-w-md mx-auto leading-relaxed">
          Describe what you need in plain English. We&apos;ll build it as an add-on to your existing platform.
        </p>
      </motion.div>

      {/* Prompt */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. I need a waitlist system where clients can join a queue when all my slots are booked..."
          rows={4}
          className="w-full px-5 py-4 bg-card-bg border border-border-light rounded-2xl text-[15px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-[12px] text-text-tertiary">
            <span className="font-semibold text-foreground">{credits}</span> credits remaining
          </span>
          <button
            onClick={handleBuild}
            disabled={!prompt.trim() || isBuilding}
            className="px-6 py-2.5 bg-foreground text-white rounded-full text-[14px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {isBuilding ? "Building..." : "Build it"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Example prompts */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mb-12">
        <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-3">Try an example</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              onClick={() => setPrompt(example)}
              className="px-3.5 py-2 bg-card-bg border border-border-light rounded-full text-[13px] text-text-secondary hover:text-foreground hover:border-foreground/15 transition-all cursor-pointer"
            >
              {example}
            </button>
          ))}
        </div>
      </motion.div>

      {/* How it works */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-12">
        <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-4">How it works</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: MessageSquare, title: "Describe it", desc: "Tell us what you need" },
            { icon: Cpu, title: "We build it", desc: "AI creates the feature" },
            { icon: Sparkles, title: "It's yours", desc: "Use it right away" },
          ].map((step, i) => (
            <div key={step.title} className="bg-card-bg border border-border-light rounded-2xl p-5 text-center">
              <div className="w-9 h-9 bg-surface rounded-xl flex items-center justify-center mx-auto mb-3">
                <step.icon className="w-4 h-4 text-text-secondary" />
              </div>
              <p className="text-[13px] font-semibold text-foreground mb-0.5">{step.title}</p>
              <p className="text-[12px] text-text-tertiary">{step.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* What custom features can do */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-12">
        <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-4">What you can build</p>
        <div className="bg-card-bg border border-border-light rounded-2xl divide-y divide-border-light">
          {[
            { icon: Database, label: "Custom data tables", desc: "Track anything — loyalty points, inventory, waitlists" },
            { icon: Layout, label: "Custom pages & views", desc: "Tables, kanban boards, and forms for your data" },
            { icon: Zap, label: "Automations & triggers", desc: "React to events — send alerts, update records" },
            { icon: Shield, label: "Sandboxed & safe", desc: "Add-ons sit on top — your core CRM is never modified" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4 px-5 py-4">
              <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-text-secondary" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-foreground">{item.label}</p>
                <p className="text-[12px] text-text-tertiary">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Existing custom features */}
      {readyFeatures.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-4">Your custom features</p>
          <div className="space-y-2">
            {readyFeatures.map((feature) => (
              <div key={feature.id} className="flex items-center gap-4 px-5 py-4 bg-card-bg border border-border-light rounded-2xl">
                <div className="w-8 h-8 bg-primary-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-foreground">{feature.name}</p>
                  <p className="text-[12px] text-text-tertiary">{feature.description}</p>
                </div>
                <button
                  onClick={() => removeFeature(feature.id)}
                  className="text-text-tertiary hover:text-red-500 transition-colors cursor-pointer p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Pricing */}
      <div className="mt-12 text-center text-[13px] text-text-tertiary">
        <p>Each feature costs 1–5 credits depending on complexity.</p>
        <p>Need more? <span className="font-semibold text-foreground">$5 for 10 credits</span>.</p>
      </div>
    </div>
  );
}
