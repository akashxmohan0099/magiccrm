"use client";

import { useState, useRef, useEffect, useCallback, FormEvent } from "react";
import { Sparkles, Send, Trash2, User, Wrench, Loader2 } from "lucide-react";
import { useAIChatStore, ChatMessage } from "@/store/ai-chat";
import { useClientsStore } from "@/store/clients";
import { useBookingsStore } from "@/store/bookings";
import { useLeadsStore } from "@/store/leads";
import { useInvoicesStore } from "@/store/invoices";
import { useJobsStore } from "@/store/jobs";
import { useProductsStore } from "@/store/products";
import { executeToolCall } from "@/lib/ai-tool-executor";

const READ_TOOLS = new Set([
  "list_clients",
  "list_bookings",
  "list_leads",
  "list_invoices",
  "list_jobs",
  "list_products",
]);

function toolDisplayName(name: string): string {
  const map: Record<string, string> = {
    list_clients: "Looked up clients",
    list_bookings: "Looked up bookings",
    list_leads: "Looked up leads",
    list_invoices: "Looked up invoices",
    list_jobs: "Looked up jobs",
    list_products: "Looked up products",
    create_client: "Created a client",
    create_booking: "Created a booking",
    cancel_booking: "Cancelled a booking",
    update_booking: "Updated a booking",
    create_lead: "Created a lead",
    create_invoice: "Created an invoice",
    create_job: "Created a job",
    update_client: "Updated a client",
  };
  return map[name] || name;
}

function useWorkspaceContext() {
  const clients = useClientsStore((s) => s.clients);
  const bookings = useBookingsStore((s) => s.bookings);
  const leads = useLeadsStore((s) => s.leads);
  const invoices = useInvoicesStore((s) => s.invoices);
  const jobs = useJobsStore((s) => s.jobs);
  const products = useProductsStore((s) => s.products);

  return useCallback(() => {
    const clientMap = new Map(clients.map((c) => [c.id, c.name]));
    return {
      clients: clients.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone || "",
        status: c.status,
        tags: c.tags,
      })),
      bookings: bookings.map((b) => ({
        id: b.id,
        title: b.title,
        clientId: b.clientId,
        clientName: b.clientId ? clientMap.get(b.clientId) || "" : "",
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
      })),
      leads: leads.map((l) => ({
        id: l.id,
        name: l.name,
        email: l.email,
        stage: l.stage,
        value: l.value,
      })),
      invoices: invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        clientId: inv.clientId,
        status: inv.status,
        total: inv.lineItems.reduce(
          (sum, li) => sum + li.quantity * li.unitPrice - (li.discount ?? 0),
          0
        ),
      })),
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        clientId: j.clientId,
        stage: j.stage,
        dueDate: j.dueDate,
      })),
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        category: p.category,
      })),
    };
  }, [clients, bookings, leads, invoices, jobs, products]);
}

export default function AIChatPage() {
  const messages = useAIChatStore((s) => s.messages);
  const loading = useAIChatStore((s) => s.loading);
  const addMessage = useAIChatStore((s) => s.addMessage);
  const setLoading = useAIChatStore((s) => s.setLoading);
  const clearHistory = useAIChatStore((s) => s.clearHistory);

  const [input, setInput] = useState("");
  const [pendingToolCalls, setPendingToolCalls] = useState<{
    toolCalls: { name: string; input: Record<string, unknown>; result?: string }[];
    response: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const getContext = useWorkspaceContext();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    addMessage({ role: "user", content: text });
    setLoading(true);

    try {
      const context = getContext();

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, context }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Something went wrong" }));
        addMessage({
          role: "assistant",
          content: err.error || "Sorry, something went wrong. Please try again.",
        });
        return;
      }

      const data = (await res.json()) as {
        response: string;
        toolCalls: { name: string; input: Record<string, unknown>; result?: string }[];
      };

      // Separate read vs write tool calls
      const readCalls = data.toolCalls.filter((tc) => READ_TOOLS.has(tc.name));
      const writeCalls = data.toolCalls.filter((tc) => !READ_TOOLS.has(tc.name));

      if (writeCalls.length > 0) {
        // Queue write calls for user confirmation
        setPendingToolCalls({ toolCalls: writeCalls, response: data.response });
        if (readCalls.length > 0) {
          addMessage({ role: "assistant", content: "", toolCalls: readCalls });
        }
      } else {
        addMessage({
          role: "assistant",
          content: data.response,
          toolCalls: readCalls.length > 0 ? readCalls : undefined,
        });
      }
    } catch {
      addMessage({
        role: "assistant",
        content: "Sorry, I couldn't connect to the server. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleConfirmTools = () => {
    if (!pendingToolCalls) return;
    const executed = pendingToolCalls.toolCalls.map((tc) => {
      const result = executeToolCall(tc);
      return { ...tc, result: result.result };
    });
    addMessage({
      role: "assistant",
      content: pendingToolCalls.response,
      toolCalls: executed,
    });
    setPendingToolCalls(null);
  };

  const handleCancelTools = () => {
    if (!pendingToolCalls) return;
    addMessage({ role: "assistant", content: "Action cancelled. No changes were made." });
    setPendingToolCalls(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border-light mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">MagicAI</h1>
            <p className="text-[11px] text-text-tertiary">
              Your workspace assistant
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { clearHistory(); setPendingToolCalls(null); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-text-tertiary hover:text-foreground rounded-lg hover:bg-surface transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-thin">
        {messages.length === 0 && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground mb-1">
              Hey, I&apos;m MagicAI
            </h2>
            <p className="text-sm text-text-secondary max-w-sm">
              I can help you manage your workspace. Try asking me to add a
              client, book an appointment, create an invoice, or check your
              schedule.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {[
                "Show me all my clients",
                "Book an appointment for tomorrow",
                "Create an invoice",
                "Add a new lead",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface border border-border-light rounded-full hover:bg-foreground/5 hover:text-foreground transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-card-bg border border-border-light rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 text-text-tertiary animate-spin" />
                <span className="text-xs text-text-tertiary">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {pendingToolCalls && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="bg-card-bg border border-amber-200 rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]">
              <p className="text-xs font-medium text-amber-800 mb-2">MagicAI wants to:</p>
              <ul className="space-y-1 mb-3">
                {pendingToolCalls.toolCalls.map((tc, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-sm text-foreground">
                    <Wrench className="w-3 h-3 text-text-tertiary" />
                    {toolDisplayName(tc.name)}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2">
                <button onClick={handleConfirmTools} className="px-3 py-1.5 bg-foreground text-background rounded-lg text-xs font-medium cursor-pointer hover:opacity-90">Confirm</button>
                <button onClick={handleCancelTools} className="px-3 py-1.5 bg-surface border border-border-light text-text-secondary rounded-lg text-xs font-medium cursor-pointer hover:text-foreground">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="relative border border-border-light rounded-2xl bg-card-bg focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10 transition-all"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask MagicAI anything..."
          rows={1}
          className="w-full resize-none bg-transparent px-4 py-3 pr-12 text-sm text-foreground placeholder:text-text-tertiary focus:outline-none"
          disabled={loading || !!pendingToolCalls}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading || !!pendingToolCalls}
          className="absolute right-2 bottom-2 p-2 rounded-xl bg-foreground text-background disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="bg-foreground text-background rounded-2xl rounded-tr-md px-4 py-2.5 max-w-[80%]">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="w-7 h-7 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5 text-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="max-w-[80%] space-y-2">
        {/* Tool call cards */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.toolCalls.map((tc, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-border-light rounded-lg text-[11px] font-medium text-text-secondary"
              >
                <Wrench className="w-3 h-3 text-text-tertiary" />
                {toolDisplayName(tc.name)}
              </div>
            ))}
          </div>
        )}

        {/* Message content */}
        {message.content && (
          <div className="bg-card-bg border border-border-light rounded-2xl rounded-tl-md px-4 py-2.5">
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
