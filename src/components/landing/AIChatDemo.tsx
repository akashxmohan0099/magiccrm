"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Users, Calendar, Receipt, MessageCircle, BarChart3, Send, Bot,
} from "lucide-react";
import { viewportConfig, sectionHeadingVariants, sectionTransition } from "@/app/landing-data";

type ChatMessage = {
  role: "user" | "ai";
  text: string;
  card?: React.ReactNode;
};

const AI_CHAT_CONVERSATIONS: { label: string; icon: typeof Receipt; messages: ChatMessage[] }[] = [
  {
    label: "Send an invoice",
    icon: Receipt,
    messages: [
      { role: "user", text: "Send Sarah M. her invoice for today\u2019s lash fill" },
      { role: "ai", text: "Here\u2019s the invoice I\u2019ve prepared:",
        card: (
          <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-text-tertiary">INV-1047</span>
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Sent</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-foreground">Sarah M.</p>
                <p className="text-[11px] text-text-tertiary">Lash Full Set</p>
              </div>
              <p className="text-[18px] font-bold text-foreground">A$120</p>
            </div>
            <div className="flex items-center gap-3 pt-1 border-t border-border-light">
              <span className="text-[10px] text-text-tertiary flex items-center gap-1"><MessageCircle className="w-3 h-3" /> SMS sent</span>
              <span className="text-[10px] text-text-tertiary flex items-center gap-1"><Send className="w-3 h-3" /> Email sent</span>
            </div>
          </div>
        ),
      },
      { role: "user", text: "Perfect. Does she have any upcoming bookings?" },
      { role: "ai", text: "Yes \u2014 she has a lash fill booked for April 28 at 10:00 AM. That\u2019s 9 days away. She\u2019s also due for a brow tint based on her usual 6-week cycle. Want me to suggest that when she comes in?" },
    ],
  },
  {
    label: "Check availability",
    icon: Calendar,
    messages: [
      { role: "user", text: "Am I free Thursday at 2pm? Can I fit a volume set?" },
      { role: "ai", text: "Let me check your Thursday schedule:",
        card: (
          <div className="mt-2 rounded-xl border border-border-light bg-surface/50 p-3.5 space-y-1.5">
            {[
              { time: "9:00 AM", client: "Megan T.", service: "Classic Set", color: "#EC4899" },
              { time: "12:00 PM", client: "Lunch break", service: "", color: "#9CA3AF" },
              { time: "2:00 PM", client: "Available", service: "2.5hr slot open", color: "#10B981" },
              { time: "5:00 PM", client: "Lily P.", service: "Lash Lift", color: "#8B5CF6" },
            ].map((s) => (
              <div key={s.time} className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono text-text-tertiary w-14 flex-shrink-0">{s.time}</span>
                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <div>
                  <p className={`text-[12px] font-medium ${s.color === "#10B981" ? "text-emerald-600" : "text-foreground"}`}>{s.client}</p>
                  {s.service && <p className="text-[10px] text-text-tertiary">{s.service}</p>}
                </div>
              </div>
            ))}
          </div>
        ),
      },
      { role: "ai", text: "A volume set (2.5hrs) would finish at 4:30 PM, and Lily P. is at 5:00 PM. You\u2019re good with 30 min buffer. Want me to hold the slot?" },
      { role: "user", text: "Yes, hold it for now" },
      { role: "ai", text: "Done. Thursday 2:00 PM is now blocked as a hold. I\u2019ll remind you tomorrow if it\u2019s still unbooked." },
    ],
  },
  {
    label: "Business insights",
    icon: BarChart3,
    messages: [
      { role: "user", text: "How did this week compare to last week?" },
      { role: "ai", text: "Here\u2019s your weekly snapshot:",
        card: (
          <div className="mt-2 rounded-xl border border-border-light bg-surface/50 p-3.5">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { label: "Revenue", value: "A$2,840", change: "+18%", up: true },
                { label: "Bookings", value: "24", change: "+3", up: true },
                { label: "Rebooking", value: "71%", change: "+9%", up: true },
              ].map((m) => (
                <div key={m.label} className="text-center">
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wider mb-0.5">{m.label}</p>
                  <p className="text-[18px] font-bold text-foreground leading-tight">{m.value}</p>
                  <p className={`text-[11px] font-semibold ${m.up ? "text-emerald-600" : "text-red-500"}`}>{m.change}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 pt-2 border-t border-border-light">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <p className="text-[11px] text-text-secondary">Tuesday afternoon is still your quietest slot</p>
            </div>
          </div>
        ),
      },
      { role: "user", text: "What can I do about those empty Tuesdays?" },
      { role: "ai", text: "Three options: run a 10% Tuesday-only promo to your 18 clients who\u2019ve visited in the last 60 days, open Tuesday slots on your Instagram booking link, or try a last-minute deal via SMS on Monday evening. Want me to draft any of these?" },
    ],
  },
  {
    label: "Client lookup",
    icon: Users,
    messages: [
      { role: "user", text: "What products did I use on Emma R. last time?" },
      { role: "ai", text: "Here\u2019s Emma R.\u2019s last visit:",
        card: (
          <div className="mt-2 rounded-xl border border-border-light bg-surface/50 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-pink-600">ER</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">Emma R.</p>
                <p className="text-[10px] text-text-tertiary">Last visit: March 12, 2026</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Service</p>
              <p className="text-[12px] text-foreground">Classic Lash Set</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">Products</p>
              <p className="text-[12px] text-foreground">Lash Box LA C-curl 0.15mm, 10\u201313mm mix</p>
            </div>
            <div className="flex items-center gap-1.5 pt-1 border-t border-border-light">
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">Note: Mild sensitivity on outer corners</span>
            </div>
          </div>
        ),
      },
      { role: "user", text: "She\u2019s coming in tomorrow. Should I adjust anything?" },
      { role: "ai", text: "Based on her sensitivity note, I\u2019d suggest switching to a sensitive adhesive for the outer corners, or going with a slightly shorter length (11mm max) on the outer edges. I\u2019ve added a prep reminder to her appointment for tomorrow." },
    ],
  },
];

export function AIChatDemo() {
  const [activeConvo, setActiveConvo] = useState(0);
  const [animatedCount, setAnimatedCount] = useState(0);
  const [animatingConvo, setAnimatingConvo] = useState(0);
  const [completedConvos, setCompletedConvos] = useState<Set<number>>(new Set());
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const convo = AI_CHAT_CONVERSATIONS[activeConvo];
  const isCompleted = completedConvos.has(activeConvo);

  // Reset the animation counter during render when we switch to a
  // not-yet-completed conversation. This avoids a setState-in-effect.
  if (!isCompleted && animatingConvo !== activeConvo) {
    setAnimatingConvo(activeConvo);
    setAnimatedCount(0);
  }

  const visibleMessages = isCompleted
    ? convo.messages.length
    : animatingConvo === activeConvo
    ? animatedCount
    : 0;

  useEffect(() => {
    // Already-played conversations render in full; no animation needed.
    if (isCompleted) return;

    if (messagesContainerRef.current) messagesContainerRef.current.scrollTop = 0;

    // Pace the reveal: give AI responses a longer "typing" window and
    // let the user's follow-ups breathe instead of snapping instantly.
    let cumulative = 0;
    const delays = convo.messages.map((msg, i) => {
      if (i === 0) {
        cumulative = 500;
      } else if (msg.role === "ai") {
        cumulative += 1900; // typing indicator before AI response
      } else {
        cumulative += 1500; // user "thinking" before typing a reply
      }
      return cumulative;
    });

    const timers: ReturnType<typeof setTimeout>[] = delays.map((delay, i) =>
      setTimeout(() => setAnimatedCount(i + 1), delay)
    );
    // Mark this conversation as played once the last message is visible.
    const finalIdx = activeConvo;
    timers.push(
      setTimeout(
        () => setCompletedConvos((prev) => new Set(prev).add(finalIdx)),
        (delays[delays.length - 1] ?? 0) + 150
      )
    );
    return () => timers.forEach(clearTimeout);
  }, [activeConvo, isCompleted, convo.messages]);

  // Auto-scroll chat container to bottom as new messages appear
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visibleMessages]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={viewportConfig}
      transition={{ duration: 0.5 }}
      className="relative py-12 sm:py-20 overflow-hidden"
      style={{ background: "linear-gradient(180deg, var(--card-bg) 0%, var(--background) 50%, var(--card-bg) 100%)" }}
    >
      {/* Decorative glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background: "radial-gradient(circle, var(--logo-green) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.03]" style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)" }} />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-10 lg:gap-16 items-center">
          {/* Left column: heading, copy, 2x2 features */}
          <div className="min-w-0">
            <motion.h2
              variants={sectionHeadingVariants}
              initial="hidden"
              whileInView="visible"
              viewport={viewportConfig}
              transition={sectionTransition}
              className="text-[1.75rem] sm:text-[2.5rem] lg:text-[2.75rem] font-bold text-foreground leading-[1.08] mb-5 tracking-tight"
            >
              Just ask your <span className="text-primary">AI</span>. Magic handles it.
            </motion.h2>

            <ul className="space-y-3 mt-8">
              {[
                "Reads your workspace — no prompts to engineer",
                "Takes real actions — sends, books, drafts",
                "Always asks first — nothing goes out unconfirmed",
              ].map((line, i) => (
                <motion.li
                  key={line}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportConfig}
                  transition={{ delay: 0.15 + i * 0.07, duration: 0.4 }}
                  className="flex items-center gap-3 text-[14px] sm:text-[15px] text-text-secondary"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  {line}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Right column: tabs + chat */}
          <div className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportConfig}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="flex gap-1.5 mb-5 overflow-x-auto sm:flex-wrap sm:overflow-x-visible -mx-4 px-4 sm:mx-0 sm:px-0"
              style={{ scrollbarWidth: "none" }}
            >
              {AI_CHAT_CONVERSATIONS.map((c, i) => {
                const Icon = c.icon;
                const active = activeConvo === i;
                return (
                  <button
                    key={c.label}
                    onClick={() => setActiveConvo(i)}
                    className={`flex-shrink-0 relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                      active
                        ? "bg-foreground text-background shadow-[0_4px_14px_-4px_rgba(10,10,10,0.35)]"
                        : "bg-card-bg border border-border-light text-text-secondary hover:text-foreground hover:border-foreground/25"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? "" : "text-text-tertiary"}`} />
                    {c.label}
                  </button>
                );
              })}
            </motion.div>

            <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportConfig}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full"
          >
            {/* Glow behind card */}
            <div className="absolute -inset-6 rounded-[32px] opacity-[0.09] blur-3xl pointer-events-none" style={{ background: "linear-gradient(135deg, var(--logo-green), #8B5CF6)" }} />

            <div className="relative bg-background rounded-[20px] border border-border-light overflow-hidden shadow-[0_24px_60px_-20px_rgba(10,10,10,0.18),0_8px_20px_-8px_rgba(10,10,10,0.08)]">
            {/* Title bar */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border-light bg-gradient-to-b from-surface/60 to-surface/20">
              <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shadow-[0_4px_12px_-3px_rgba(124,254,157,0.5)]" style={{ backgroundColor: "var(--logo-green)" }}>
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold text-foreground tracking-tight">Magic AI</p>
                <p className="text-[11px] text-text-tertiary truncate">Reads and writes across your workspace</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 flex-shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-700 font-semibold">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="px-5 py-5 h-[360px] sm:h-[400px] overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeConvo}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {convo.messages.map((msg, i) => (
                    <AnimatePresence key={i}>
                      {visibleMessages > i && (
                        <motion.div
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                          className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.role === "ai" && (
                            <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_3px_10px_-2px_rgba(124,254,157,0.5)]" style={{ backgroundColor: "var(--logo-green)" }}>
                              <div className="w-2.5 h-2.5 bg-white rounded-[3px]" />
                            </div>
                          )}
                          <div
                            className={`max-w-[82%] sm:max-w-[78%] min-w-0 rounded-2xl px-4 py-3 ${
                              msg.role === "user"
                                ? "bg-foreground text-background rounded-br-md shadow-[0_6px_16px_-4px_rgba(10,10,10,0.25)]"
                                : "bg-primary/[0.06] border border-primary/15 text-foreground rounded-bl-md"
                            }`}
                          >
                            <p className="text-[13.5px] leading-relaxed break-words">
                              {msg.text}
                            </p>
                            {msg.card && msg.card}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ))}

                  {/* Typing indicator */}
                  {visibleMessages < convo.messages.length && visibleMessages > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3 justify-start"
                    >
                      <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[0_3px_10px_-2px_rgba(124,254,157,0.5)]" style={{ backgroundColor: "var(--logo-green)" }}>
                        <div className="w-2.5 h-2.5 bg-white rounded-[3px]" />
                      </div>
                      <div className="bg-primary/[0.06] border border-primary/15 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            className="typing-dot w-1.5 h-1.5 rounded-full bg-primary/60"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Input bar */}
            <div className="px-5 pb-4 pt-3 border-t border-border-light bg-gradient-to-b from-transparent to-surface/30">
              <div className="flex items-center gap-2.5 px-4 py-3 bg-card-bg rounded-xl border border-border-light shadow-sm">
                <span className="text-[13px] text-text-tertiary flex-1 flex items-center gap-1.5">
                  Ask Magic anything about your business…
                  <span
                    className="cursor-blink inline-block w-[2px] h-3.5 bg-text-tertiary/70 rounded-sm"
                  />
                </span>
                <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 shadow-[0_3px_10px_-2px_rgba(124,254,157,0.5)]" style={{ backgroundColor: "var(--logo-green)" }}>
                  <Send className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
            </div>
          </motion.div>

          </div>
        </div>
      </div>
    </motion.section>
  );
}


