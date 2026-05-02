"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Calendar } from "lucide-react";

export function DemoContent({ module, features, data }: { module: string; features: Record<string, boolean>; data?: { type: string; data: Record<string, unknown>[] } }) {
  const f = (name: string) => features[name] ?? false;

  // Payments tab state
  const paymentsTabs = useMemo(() => {
    if (module !== "Payments") return [];
    const tabs: string[] = [];
    if (f("Invoices")) tabs.push("Invoices");
    if (f("Quotes")) tabs.push("Quotes");
    if (f("Proposals")) tabs.push("Proposals");
    return tabs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, features]);

  const [demoTab, setDemoTab] = useState("Invoices");

  // Auto-switch to a valid tab when tabs change
  useEffect(() => {
    if (module !== "Payments") return;
    if (paymentsTabs.length > 0 && !paymentsTabs.includes(demoTab)) {
      setDemoTab(paymentsTabs[0]);
    }
    // When a new tab appears, auto-select it to show the change
    if (paymentsTabs.length > 0) {
      const lastAdded = paymentsTabs[paymentsTabs.length - 1];
      if (lastAdded !== "Invoices") setDemoTab(lastAdded);
    }
  }, [paymentsTabs, module, demoTab]);

  if (module === "Payments") {
    const invoices = [
      { num: "INV-001", client: "Sarah M.", amount: 175, status: "paid", aging: "Current" },
      { num: "INV-002", client: "Jess T.", amount: 200, status: "sent", aging: "30 days" },
      { num: "INV-003", client: "Emma R.", amount: 95, status: "overdue", aging: "60 days" },
    ];
    const quotes = [
      { num: "QT-001", client: "Tom K.", amount: 4500, status: "pending" },
      { num: "QT-002", client: "Lisa M.", amount: 1200, status: "accepted" },
    ];
    const proposals = [
      { num: "PROP-001", client: "James W.", amount: 8500, status: "Sent" },
      { num: "PROP-002", client: "Zoe R.", amount: 3200, status: "Viewed" },
      { num: "PROP-003", client: "Sarah M.", amount: 6000, status: "Accepted" },
    ];

    const nothingOn = paymentsTabs.length === 0;

    return (
      <div>
        {/* Tab pills */}
        {paymentsTabs.length > 0 && (
          <div className="flex gap-1.5 mb-3">
            <AnimatePresence>
              {paymentsTabs.map((tab: string) => (
                <motion.button
                  key={tab}
                  initial={{ opacity: 0, scale: 0.8, width: 0 }}
                  animate={{ opacity: 1, scale: 1, width: "auto" }}
                  exit={{ opacity: 0, scale: 0.8, width: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setDemoTab(tab)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                    demoTab === tab ? "bg-foreground text-background" : "bg-background border border-border-light text-text-secondary hover:text-foreground"
                  }`}
                >
                  {tab}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}

        {nothingOn && (
          <div className="py-8 text-center text-[11px] text-text-tertiary">Turn on Invoices, Quotes, or Proposals to see billing content.</div>
        )}

        {/* Invoices tab */}
        <AnimatePresence mode="wait">
          {demoTab === "Invoices" && f("Invoices") && (
            <motion.div key="invoices-tab" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <div className="border border-border-light rounded-xl overflow-hidden">
                <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr 60px ${f("Aging Report") ? "55px " : ""}${f("Payment Plans") ? "70px " : ""}55px` }}>
                  <span>Invoice</span><span>Amount</span>
                  {f("Aging Report") && <span>Aging</span>}
                  {f("Payment Plans") && <span>Plan</span>}
                  <span>Status</span>
                </motion.div>
                {invoices.map((inv, idx) => (
                  <motion.div layout key={inv.num} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: `1fr 60px ${f("Aging Report") ? "55px " : ""}${f("Payment Plans") ? "70px " : ""}55px` }}>
                    <div>
                      <span className="font-medium text-foreground">{inv.num} <span className="text-text-tertiary font-normal">{inv.client}</span></span>
                      {f("Milestone Billing") && idx === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 rounded-full" style={{ width: "75%" }} /></div>
                          <span className="text-[8px] text-emerald-600 font-medium">3/4 milestones</span>
                        </motion.div>
                      )}
                    </div>
                    <span className="font-medium text-foreground">${inv.amount}</span>
                    {f("Aging Report") && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[8px] px-1.5 py-0.5 rounded font-medium w-fit ${inv.aging === "Current" ? "bg-emerald-50 text-emerald-700" : inv.aging === "30 days" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-600"}`}>{inv.aging}</motion.span>
                    )}
                    {f("Payment Plans") && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-primary font-medium">{idx === 1 ? "2 of 4" : "—"}</motion.span>
                    )}
                    <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${inv.status === "paid" ? "bg-emerald-50 text-emerald-700" : inv.status === "overdue" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-700"}`}>{inv.status}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Quotes tab */}
          {demoTab === "Quotes" && f("Quotes") && (
            <motion.div key="quotes-tab" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <div className="border border-border-light rounded-xl overflow-hidden">
                <div className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: "1fr 70px 55px" }}>
                  <span>Quote</span><span>Amount</span><span>Status</span>
                </div>
                {quotes.map((qt) => (
                  <div key={qt.num} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: "1fr 70px 55px" }}>
                    <span className="font-medium text-foreground">{qt.num} <span className="text-text-tertiary font-normal">{qt.client}</span></span>
                    <span className="font-medium text-foreground">${qt.amount.toLocaleString()}</span>
                    <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${qt.status === "accepted" ? "bg-emerald-50 text-emerald-700" : "bg-yellow-50 text-yellow-700"}`}>{qt.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Proposals tab */}
          {demoTab === "Proposals" && f("Proposals") && (
            <motion.div key="proposals-tab" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <div className="border border-border-light rounded-xl overflow-hidden">
                <div className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: "1fr 70px 60px" }}>
                  <span>Proposal</span><span>Value</span><span>Status</span>
                </div>
                {proposals.map((p) => (
                  <div key={p.num} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: "1fr 70px 60px" }}>
                    <span className="font-medium text-foreground">{p.num} <span className="text-text-tertiary font-normal">{p.client}</span></span>
                    <span className="font-medium text-foreground">${p.amount.toLocaleString()}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-medium w-fit ${p.status === "Accepted" ? "bg-emerald-50 text-emerald-700" : p.status === "Viewed" ? "bg-blue-50 text-blue-600" : "bg-yellow-50 text-yellow-700"}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Bookings") {
    const appts = [
      { time: "9:00 AM", name: "Sarah — Lash Fill", color: "bg-pink-400", done: true },
      { time: "11:30 AM", name: "Jess — Volume Set", color: "bg-purple-400", done: false },
      { time: "2:00 PM", name: "Emma — Brow Tint", color: "bg-blue-400", done: false },
    ];
    return (
      <div>
        {f("Online Booking Page") && (
          <motion.div key="Online Booking Page" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3 rounded-lg border border-primary/15 overflow-hidden">
            <div className="px-3 py-1.5 bg-primary/5 flex items-center justify-between">
              <span className="text-[10px] text-primary font-medium">Public booking page</span>
              <span className="text-[8px] text-primary/50 bg-primary/10 px-1.5 py-0.5 rounded">Live</span>
            </div>
            <div className="px-3 py-2 bg-card-bg text-[9px] space-y-1">
              <div className="flex items-center justify-between"><span className="text-text-secondary">yourname.magic/book</span><span className="text-primary font-medium underline">Copy link</span></div>
              <div className="flex gap-1">{["Lash Fill — A$80", "Volume Set — A$200"].map(s => <span key={s} className="px-1.5 py-0.5 bg-background border border-border-light rounded text-[8px] text-text-tertiary">{s}</span>)}</div>
            </div>
          </motion.div>
        )}
        <div className="space-y-1.5 mb-2">
          {appts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card-bg border border-border-light">
              <div className={`w-1 h-5 rounded-full ${a.color}`} />
              <span className="text-[10px] text-text-tertiary w-14">{a.time}</span>
              <span className="text-[10px] font-medium text-foreground flex-1">{a.name}</span>
              {f("Booking Deposits") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium">A$30 dep</motion.span>}
              {f("Satisfaction Rating") && a.done && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-yellow-500">&#9733;&#9733;&#9733;&#9733;&#9733;</motion.span>}
            </div>
          ))}
        </div>
        <AnimatePresence>
          {f("Walk-In Queue") && (
            <motion.div key="Walk-In Queue" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
              <div className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-purple-800">Walk-ins</span>
                  <span className="text-[8px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">3 waiting</span>
                </div>
                <div className="space-y-1">
                  {["Amy L. — 12min", "David R. — 5min", "Nina S. — 1min"].map((w) => (
                    <div key={w} className="flex items-center gap-2 text-[9px] text-purple-700">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />{w}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          {f("Rebooking Prompts") && (
            <motion.div key="Rebooking Prompts" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
              <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"><Calendar className="w-3 h-3 text-blue-600" /></div>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-blue-800">Rebooking reminder</p>
                  <p className="text-[9px] text-blue-600">Sarah M. hasn&#39;t rebooked in 4 weeks — send prompt?</p>
                </div>
                <span className="text-[8px] px-2 py-1 bg-blue-600 text-white rounded-lg font-medium">Send</span>
              </div>
            </motion.div>
          )}
          {f("No-Show Protection") && (
            <motion.div key="No-Show Protection" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[10px]">!</span></div>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold text-red-700">No-show warning</p>
                  <p className="text-[9px] text-red-600">Tom K. — 2 no-shows this month. Deposit required for next booking.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Clients") {
    const clients = [
      { name: "Sarah Mitchell", email: "sarah@email.com", stage: "VIP", status: "active", reminder: "Follow up Fri" },
      { name: "Jess Thompson", email: "jess@email.com", stage: "Active", status: "active", reminder: "" },
      { name: "Emma Roberts", email: "emma@email.com", stage: "At Risk", status: "inactive", reminder: "Overdue 7d" },
      { name: "Tom Kennedy", email: "tom@email.com", stage: "New", status: "prospect", reminder: "Call today" },
    ];
    return (
      <div>
        {/* Header row with optional Import button */}
        <AnimatePresence>
          {f("CSV Import") && (
            <motion.div key="CSV Import" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2">
              <div className="flex items-center justify-end gap-1.5">
                <span className="px-2.5 py-1 bg-background border border-border-light rounded-lg text-[9px] text-text-secondary font-medium cursor-pointer hover:bg-surface">Import CSV</span>
                <span className="px-2.5 py-1 bg-background border border-border-light rounded-lg text-[9px] text-text-secondary font-medium cursor-pointer hover:bg-surface">Export</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr ${f("Custom Fields") ? "70px " : ""}${f("Lifecycle Stages") ? "55px " : ""}${f("Follow-Up Reminders") ? "70px " : ""}50px` }}>
            <span>Client</span>
            {f("Custom Fields") && <span>Company</span>}
            {f("Lifecycle Stages") && <span>Stage</span>}
            {f("Follow-Up Reminders") && <span>Follow-Up</span>}
            <span>Status</span>
          </motion.div>
          {clients.map((c) => (
            <motion.div layout key={c.name} className="grid px-3 py-1.5 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: `1fr ${f("Custom Fields") ? "70px " : ""}${f("Lifecycle Stages") ? "55px " : ""}${f("Follow-Up Reminders") ? "70px " : ""}50px` }}>
              <div className="min-w-0">
                <span className="font-medium text-foreground truncate block">{c.name}</span>
                <span className="text-[9px] text-text-tertiary">{c.email}</span>
              </div>
              {f("Custom Fields") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-text-tertiary truncate">{c.name === "Sarah Mitchell" ? "Bloom Co." : c.name === "Tom Kennedy" ? "TK Media" : "—"}</motion.span>}
              {f("Lifecycle Stages") && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium w-fit ${
                  c.stage === "VIP" ? "bg-purple-50 text-purple-700" : c.stage === "Active" ? "bg-emerald-50 text-emerald-700" : c.stage === "At Risk" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                }`}>{c.stage}</motion.span>
              )}
              {f("Follow-Up Reminders") && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[8px] px-1.5 py-0.5 rounded font-medium ${
                  c.reminder ? (c.reminder.includes("Overdue") ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600") : "text-text-tertiary"
                }`}>{c.reminder || "—"}</motion.span>
              )}
              <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : c.status === "inactive" ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-600"}`}>{c.status}</span>
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Birthday Alerts") && <motion.div key="Birthday Alerts" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-pink-50 border border-pink-200 rounded-lg text-[10px] text-pink-700">Sarah Mitchell&#39;s birthday is in 3 days — send a greeting?</div></motion.div>}
          {f("Referral Tracking") && <motion.div key="Referral Tracking" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-surface rounded-lg text-[10px] text-text-secondary">Tom Kennedy referred by <span className="font-medium text-foreground">Sarah Mitchell</span> — 2 referrals this month</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Inquiries") {
    const stages = [{ stage: "New", color: "bg-blue-400", items: ["Lisa M.", "Tom K."] }, { stage: "Contacted", color: "bg-yellow-400", items: ["Sarah P."] }, { stage: "Proposal", color: "bg-purple-400", items: ["James W."] }, { stage: "Won", color: "bg-green-400", items: ["Zoe R."] }];
    return (
      <div>
        <AnimatePresence>{f("Web Capture Forms") && <motion.div key="Web Capture Forms" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-2"><div className="px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-lg text-[10px] text-primary font-medium">Web form active — share your capture link</div></motion.div>}</AnimatePresence>
        <div className="grid grid-cols-4 gap-1.5">
          {stages.map((col) => (
            <div key={col.stage}>
              <div className="flex items-center gap-1 mb-1.5"><div className={`w-2 h-2 rounded-full ${col.color}`} /><span className="text-[9px] font-semibold text-text-tertiary uppercase">{col.stage}</span></div>
              {col.items.map((item, idx) => (
                <div key={item} className="bg-card-bg rounded-lg px-2 py-1.5 mb-1 border border-border-light">
                  <p className="text-[10px] font-medium text-foreground">{item}</p>
                  {f("Lead Scoring") && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 mt-0.5"><div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${col.stage === "Won" ? "bg-emerald-400" : col.stage === "Proposal" ? "bg-purple-400" : idx === 0 ? "bg-red-400" : "bg-yellow-400"}`} style={{ width: `${col.stage === "Won" ? 95 : col.stage === "Proposal" ? 72 : idx === 0 ? 85 : 40}%` }} /></div><span className={`text-[7px] font-bold ${col.stage === "Won" ? "text-emerald-600" : col.stage === "Proposal" ? "text-purple-600" : idx === 0 ? "text-red-600" : "text-yellow-600"}`}>{col.stage === "Won" ? 95 : col.stage === "Proposal" ? 72 : idx === 0 ? 85 : 40}</span></motion.div>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <AnimatePresence>
          {f("Custom Pipeline Stages") && <motion.div key="Custom Pipeline Stages" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="flex gap-1">{["+ Add Stage", "Rename", "Reorder"].map(t => <span key={t} className="px-2 py-1 bg-background border border-border-light rounded text-[9px] text-text-secondary">{t}</span>)}</div></motion.div>}
          {f("Follow-Up Reminders") && <motion.div key="Follow-Up Reminders" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[9px] text-blue-700">2 follow-ups due today — Lisa M. (new), Sarah P. (contacted)</div></motion.div>}
          {f("Auto-Response") && <motion.div key="Auto-Response" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="text-[9px] text-text-tertiary">Auto-response active: sending welcome message to new leads</div></motion.div>}
          {f("Lead to Client Conversion") && <motion.div key="Lead to Client Conversion" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[9px] text-emerald-700">Zoe R. won — <span className="font-medium underline">Convert to client</span></div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Messages") {
    const convos = [{ name: "Sarah M.", ch: "SMS", msg: "Can I reschedule Thursday?", time: "2m" }, { name: "Jess T.", ch: "Email", msg: "Thanks for the invoice!", time: "1hr" }, { name: "Emma R.", ch: "Instagram", msg: "Saturday availability?", time: "3hr" }];
    const channelMap: Record<string, string[]> = { Email: ["Email"], SMS: ["SMS"], "Instagram DMs": ["Instagram"], WhatsApp: ["WhatsApp"] };
    const activeChannels = Object.entries(channelMap).filter(([feat]) => f(feat)).flatMap(([, chs]) => chs);
    const filteredConvos = activeChannels.length > 0 ? convos.filter(c => activeChannels.includes(c.ch)) : convos;

    return (
      <div>
        {/* Channel filter pills */}
        {activeChannels.length > 0 && (
          <div className="flex gap-1 mb-2">
            {activeChannels.map(ch => (
              <span key={ch} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-medium">{ch}</span>
            ))}
          </div>
        )}
        <div className="space-y-1.5">
          {filteredConvos.map((c, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card-bg border border-border-light">
              <div className="w-6 h-6 bg-surface rounded-full flex items-center justify-center flex-shrink-0"><span className="text-[8px] font-bold">{c.name[0]}</span></div>
              <div className="flex-1 min-w-0"><div className="flex items-center gap-1"><span className="text-[10px] font-semibold text-foreground">{c.name}</span><span className="text-[8px] px-1 bg-surface rounded text-text-tertiary">{c.ch}</span></div><p className="text-[10px] text-text-secondary truncate">{c.msg}</p></div>
              <span className="text-[9px] text-text-tertiary">{c.time}</span>
            </div>
          ))}
        </div>
        <AnimatePresence>
          {f("Bulk Messaging") && <motion.div key="Bulk Messaging" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-1.5 bg-foreground/5 rounded-lg text-[9px] text-foreground font-medium">Compose Bulk Message →</div></motion.div>}
          {f("After-Hours Auto-Reply") && <motion.div key="After-Hours Auto-Reply" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[9px] text-blue-700">Auto-reply active outside business hours</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Projects") {
    const jobs = [{ title: "Kitchen renovation", stage: "In Progress", cost: 2400 }, { title: "Bathroom refit", stage: "Quoted", cost: 850 }, { title: "Garden lights", stage: "Complete", cost: 1100 }];
    return (
      <div>
        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr 70px ${f("Expense Tracking") ? "60px " : ""}${f("Billable Rate Tracking") ? "50px " : ""}` }}>
            <span>Job</span><span>Stage</span>
            {f("Expense Tracking") && <span>Cost</span>}
            {f("Billable Rate Tracking") && <span>Rate</span>}
          </motion.div>
          {jobs.map((j) => (
            <motion.div layout key={j.title} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px]" style={{ gridTemplateColumns: `1fr 70px ${f("Expense Tracking") ? "60px " : ""}${f("Billable Rate Tracking") ? "50px " : ""}` }}>
              <span className="font-medium text-foreground">{j.title}</span>
              <span className="text-text-secondary">{j.stage}</span>
              {f("Expense Tracking") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text-secondary">${j.cost}</motion.span>}
              {f("Billable Rate Tracking") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-text-secondary">A$85/hr</motion.span>}
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Recurring Jobs") && <motion.div key="Recurring Jobs" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="text-[9px] text-text-tertiary">1 recurring job: Garden maintenance (monthly)</div></motion.div>}
          {f("Job Templates") && <motion.div key="Job Templates" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="flex gap-1">{["Renovation", "Repair", "Install"].map(t => <span key={t} className="px-2 py-1 bg-background border border-border-light rounded text-[9px] text-text-secondary">{t}</span>)}</div></motion.div>}
          {f("Client Approval") && <motion.div key="Client Approval" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[9px] text-blue-700">Kitchen renovation — awaiting client sign-off</div></motion.div>}
          {f("Profitability Summary") && <motion.div key="Profitability Summary" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-700">Total profit: <span className="font-bold">A$1,850</span> across 3 jobs (42% margin)</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Documents") {
    const docs = [
      { name: "Service Agreement", type: "Contract", status: "signed", job: "Lash Full Set", expiry: "Dec 2026", version: "v2" },
      { name: "NDA — Tom K.", type: "NDA", status: "pending", job: "Kitchen rewire", expiry: "Jun 2026", version: "v1" },
      { name: "Consent Form", type: "Form", status: "signed", job: "Volume Set", expiry: null as string | null, version: "v3" },
    ];
    return (
      <div>
        {f("Contract Templates") && <motion.div key="Contract Templates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 mb-3">{["Service Agreement", "NDA", "Consent Form"].map(t => <span key={t} className="px-2 py-1 bg-background border border-border-light rounded text-[9px] text-text-secondary">+ {t}</span>)}</motion.div>}
        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr 50px ${f("E-Signatures") ? "50px " : ""}${f("Auto-Attach to Job") ? "70px " : ""}${f("Expiry Tracking") ? "55px " : ""}${f("Version History") ? "30px " : ""}` }}>
            <span>Document</span><span>Type</span>
            {f("E-Signatures") && <span>Signed</span>}
            {f("Auto-Attach to Job") && <span>Linked Job</span>}
            {f("Expiry Tracking") && <span>Expires</span>}
            {f("Version History") && <span>Ver</span>}
          </motion.div>
          {docs.map((d) => (
            <motion.div layout key={d.name} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: `1fr 50px ${f("E-Signatures") ? "50px " : ""}${f("Auto-Attach to Job") ? "70px " : ""}${f("Expiry Tracking") ? "55px " : ""}${f("Version History") ? "30px " : ""}` }}>
              <span className="font-medium text-foreground truncate">{d.name}</span>
              <span className="text-text-tertiary">{d.type}</span>
              {f("E-Signatures") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[8px] px-1 py-0.5 rounded font-medium w-fit ${d.status === "signed" ? "bg-emerald-50 text-emerald-700" : "bg-yellow-50 text-yellow-700"}`}>{d.status === "signed" ? "Signed" : "Awaiting"}</motion.span>}
              {f("Auto-Attach to Job") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-blue-500 truncate">{d.job}</motion.span>}
              {f("Expiry Tracking") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-text-tertiary">{d.expiry || "—"}</motion.span>}
              {f("Version History") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-text-tertiary">{d.version}</motion.span>}
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Document Tags") && <motion.div key="Document Tags" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="flex gap-1">{["Legal", "Client-facing", "Internal"].map(t => <span key={t} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[8px] font-medium">{t}</span>)}</div></motion.div>}
          {f("Expiry Tracking") && <motion.div key="Expiry Tracking" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-800">NDA — Tom K. expires in 3 months — <span className="font-medium underline">Renew</span></div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Marketing") {
    const campaigns = [
      { name: "Summer Promo", type: "Email", status: "sent", segment: "VIP Clients" },
      { name: "New Year Offer", type: "Email", status: "draft", segment: "All Clients" },
      { name: "Rebooking Nudge", type: "SMS", status: "scheduled", segment: "Inactive 30d" },
    ];
    return (
      <div>
        {f("Audience Segmentation") && <motion.div key="Audience Segmentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 mb-3 flex-wrap">{["All Clients", "VIP", "Inactive 30d", "New This Month"].map(s => <span key={s} className="px-2 py-1 bg-background border border-border-light rounded-full text-[9px] text-text-secondary">{s}</span>)}</motion.div>}
        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr 40px ${f("Audience Segmentation") ? "70px " : ""}50px` }}>
            <span>Campaign</span><span>Type</span>
            {f("Audience Segmentation") && <span>Segment</span>}
            <span>Status</span>
          </motion.div>
          {campaigns.map((c) => (
            <motion.div layout key={c.name} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: `1fr 40px ${f("Audience Segmentation") ? "70px " : ""}50px` }}>
              <span className="font-medium text-foreground">{c.name}</span>
              <span className="text-text-tertiary">{c.type}</span>
              {f("Audience Segmentation") && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-primary truncate">{c.segment}</motion.span>}
              <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${c.status === "sent" ? "bg-emerald-50 text-emerald-700" : c.status === "scheduled" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>{c.status}</span>
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Email Sequences") && <motion.div key="Email Sequences" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-primary/5 border border-primary/10 rounded-lg text-[10px] text-primary">Active sequence: &quot;Welcome Series&quot; — 3 emails, 42 recipients enrolled</div></motion.div>}
          {f("Social Scheduling") && <motion.div key="Social Scheduling" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-surface rounded-lg text-[10px] text-text-secondary">3 posts scheduled this week — Instagram, Facebook</div></motion.div>}
          {f("Review Collection") && <motion.div key="Review Collection" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-800">5 review requests sent this week — 2 reviews collected</div></motion.div>}
          {f("Coupon Codes") && <motion.div key="Coupon Codes" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-surface rounded-lg text-[10px] text-text-secondary">Active coupon: <span className="font-medium text-foreground">SUMMER20</span> (20% off) — used 8 times</div></motion.div>}
          {f("Referral Program") && <motion.div key="Referral Program" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] text-emerald-700">Referral program: 4 active referrers — 7 new clients this month</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Team") {
    const members = [
      { name: "You", role: "Owner", status: "online", tasks: 8, modules: ["All"], perf: { jobs: 24, revenue: "A$3.2k" }, comments: 5 },
      { name: "Alex K.", role: "Stylist", status: "online", tasks: 5, modules: ["Clients", "Scheduling", "Billing"], perf: { jobs: 18, revenue: "A$2.1k" }, comments: 3 },
      { name: "Mia L.", role: "Junior", status: "offline", tasks: 3, modules: ["Scheduling"], perf: { jobs: 9, revenue: "A$0.8k" }, comments: 1 },
    ];
    return (
      <div>
        <div className="border border-border-light rounded-xl overflow-hidden">
          <motion.div layout className="grid bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary" style={{ gridTemplateColumns: `1fr ${f("Role Templates") ? "60px " : "55px "}${f("Module Access Control") ? "85px " : ""}${f("Performance Dashboard") ? "70px " : ""}${f("Team Discussions") ? "35px " : ""}50px` }}>
            <span>Member</span>
            <span>{f("Role Templates") ? "Role" : "Role"}</span>
            {f("Module Access Control") && <span>Access</span>}
            {f("Performance Dashboard") && <span>Stats</span>}
            {f("Team Discussions") && <span></span>}
            <span>Status</span>
          </motion.div>
          {members.map((m) => (
            <motion.div layout key={m.name} className="grid px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px] items-center" style={{ gridTemplateColumns: `1fr ${f("Role Templates") ? "60px " : "55px "}${f("Module Access Control") ? "85px " : ""}${f("Performance Dashboard") ? "70px " : ""}${f("Team Discussions") ? "35px " : ""}50px` }}>
              <span className="font-medium text-foreground">{m.name}</span>
              {f("Role Templates") ? (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium w-fit ${
                  m.role === "Owner" ? "bg-purple-50 text-purple-700" : m.role === "Stylist" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"
                }`}>{m.role}</motion.span>
              ) : (
                <span className="text-text-tertiary">{m.role}</span>
              )}
              {f("Module Access Control") && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-0.5 flex-wrap">
                  {m.modules.slice(0, 3).map(mod => (
                    <span key={mod} className="text-[7px] px-1 py-0.5 bg-primary/10 text-primary rounded">{mod}</span>
                  ))}
                </motion.div>
              )}
              {f("Performance Dashboard") && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5">
                  <span className="text-[8px] text-text-secondary">{m.perf.jobs} jobs</span>
                  <span className="text-[8px] text-emerald-600 font-medium">{m.perf.revenue}</span>
                </motion.div>
              )}
              {f("Team Discussions") && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-0.5">
                  <MessageCircle className="w-3 h-3 text-text-tertiary" />
                  <span className="text-[8px] text-text-tertiary">{m.comments}</span>
                </motion.div>
              )}
              <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${m.status === "online" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{m.status}</span>
            </motion.div>
          ))}
        </div>
        <AnimatePresence>
          {f("Workload View") && <motion.div key="Workload View" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2">
            <div className="px-3 py-2 bg-surface rounded-xl space-y-1.5">
              <p className="text-[9px] font-semibold text-text-secondary">Workload</p>
              {members.map(m => (
                <div key={m.name} className="flex items-center gap-2">
                  <span className="text-[9px] text-foreground w-12 font-medium">{m.name}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: `${(m.tasks / 8) * 100}%` }} /></div>
                  <span className="text-[8px] text-text-tertiary">{m.tasks} tasks</span>
                </div>
              ))}
            </div>
          </motion.div>}
          {f("Shift Scheduling") && <motion.div key="Shift Scheduling" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-700">Today: You (9AM-5PM), Alex K. (10AM-6PM), Mia L. (off)</div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  if (module === "Automations") {
    const rules = [
      { name: "Welcome email", trigger: "New client added", action: "Send welcome email", status: "active" },
      { name: "Follow-up reminder", trigger: "No booking in 30 days", action: "Send SMS reminder", status: "active" },
      { name: "Invoice overdue", trigger: "Invoice unpaid 7 days", action: "Send payment reminder", status: "paused" },
    ];
    return (
      <div>
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.name} className="px-3 py-2.5 rounded-xl bg-card-bg border border-border-light">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-foreground">{r.name}</span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${r.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{r.status}</span>
              </div>
              {f("Trigger Rules") && <motion.div key="Trigger Rules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 mb-1"><span className="text-[8px] px-1 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">WHEN</span><span className="text-[9px] text-text-secondary">{r.trigger}</span></motion.div>}
              {f("Conditional Logic") && <motion.div key="Conditional Logic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 mb-1"><span className="text-[8px] px-1 py-0.5 bg-purple-50 text-purple-600 rounded font-medium">IF</span><span className="text-[9px] text-text-secondary">Client has no upcoming booking</span></motion.div>}
              {f("Email Automations") && <motion.div key="Email Automations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 mb-1"><span className="text-[8px] px-1 py-0.5 bg-emerald-50 text-emerald-700 rounded font-medium">SEND</span><span className="text-[9px] text-text-secondary">{r.action}</span></motion.div>}
              {f("Activity Triggers") && <motion.div key="Activity Triggers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5"><span className="text-[8px] px-1 py-0.5 bg-orange-50 text-orange-600 rounded font-medium">LOG</span><span className="text-[9px] text-text-secondary">Record activity in client timeline</span></motion.div>}
            </div>
          ))}
        </div>
        <AnimatePresence>
          {f("Recurring Task Templates") && <motion.div key="Recurring Task Templates" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="px-3 py-2 bg-surface rounded-lg text-[10px] text-text-secondary">3 recurring templates: Weekly cleanup, Monthly report, Quarterly review</div></motion.div>}
          {f("Automation Log") && <motion.div key="Automation Log" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2"><div className="text-[10px] text-text-tertiary space-y-1"><div className="flex gap-2"><div className="w-1 h-1 bg-emerald-400 rounded-full mt-1.5" /><span>Welcome email sent to Tom K. — 2hr ago</span></div><div className="flex gap-2"><div className="w-1 h-1 bg-emerald-400 rounded-full mt-1.5" /><span>Follow-up SMS sent to Lisa M. — 5hr ago</span></div></div></motion.div>}
        </AnimatePresence>
      </div>
    );
  }

  // Fallback for other modules
  if (!data) return null;
  const rows = data.data as { name: string; email: string; status: string }[];
  const activeFeatures = Object.entries(features).filter(([, v]) => v).map(([k]) => k);
  return (
    <div>
      <div className="border border-border-light rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 bg-background px-3 py-1.5 border-b border-border-light text-[9px] font-medium text-text-tertiary"><span>Name</span><span>Details</span><span>Status</span></div>
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-3 px-3 py-2 border-b border-border-light/50 last:border-0 text-[10px]">
            <span className="font-medium text-foreground">{row.name}</span><span className="text-text-tertiary">{row.email}</span>
            <span className={`px-1 py-0.5 rounded text-[8px] font-medium w-fit ${row.status === "paid" || row.status === "signed" || row.status === "active" ? "bg-emerald-50 text-emerald-700" : row.status === "overdue" ? "bg-red-50 text-red-600" : "bg-yellow-50 text-yellow-700"}`}>{row.status}</span>
          </div>
        ))}
      </div>
      {activeFeatures.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{activeFeatures.map(af => <span key={af} className="text-[8px] px-1.5 py-0.5 bg-primary/5 border border-primary/10 rounded-full text-primary">{af}</span>)}</div>}
    </div>
  );
}

// Legacy export for backward compat
