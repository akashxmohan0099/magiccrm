"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { create } from "zustand";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions {
  type?: ToastType;
  /**
   * Optional inline action (e.g. an Undo button). When provided the toast
   * stays on screen ~1.5s longer so users actually see and click it.
   */
  action?: ToastAction;
  /** Override the auto-dismiss delay in ms. */
  durationMs?: number;
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
  durationMs: number;
  exiting?: boolean;
}

interface ToastStore {
  toasts: ToastItem[];
  add: (message: string, opts?: ToastOptions) => void;
  remove: (id: string) => void;
  markExiting: (id: string) => void;
}

const DEFAULT_DURATION_MS = 3000;
const ACTION_DURATION_MS = 4500;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    const type = opts.type ?? "success";
    const durationMs =
      opts.durationMs ?? (opts.action ? ACTION_DURATION_MS : DEFAULT_DURATION_MS);
    set((s) => ({
      toasts: [
        ...s.toasts.slice(-4),
        { id, message, type, action: opts.action, durationMs },
      ],
    }));
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  markExiting: (id) =>
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    })),
}));

/**
 * Trigger a toast.
 *
 * Legacy form: `toast("Saved")` / `toast("Saved", "error")` still works.
 * New form: `toast("Closed Saturday", { type: "success", action: { label: "Undo", onClick } })`.
 */
export function toast(
  message: string,
  optsOrType: ToastOptions | ToastType = {},
): void {
  const opts: ToastOptions =
    typeof optsOrType === "string" ? { type: optsOrType } : optsOrType;
  useToastStore.getState().add(message, opts);
}

const ICONS: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const COLORS: Record<ToastType, { text: string; bg: string; border: string }> = {
  success: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  error: { text: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  warning: { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  info: { text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
};

function ToastItem({ item }: { item: ToastItem }) {
  const { remove, markExiting } = useToastStore();
  const Icon = ICONS[item.type];

  useEffect(() => {
    const exitTimer = setTimeout(() => markExiting(item.id), item.durationMs);
    const removeTimer = setTimeout(() => remove(item.id), item.durationMs + 300);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [item.id, item.durationMs, remove, markExiting]);

  const colors = COLORS[item.type];
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${colors.bg} border ${colors.border} rounded-xl shadow-lg shadow-black/5 max-w-sm w-full ${
        item.exiting ? "toast-exit" : "toast-enter"
      }`}
      style={{
        animation: item.exiting
          ? "toast-out 300ms ease-in forwards"
          : "toast-in 300ms ease-out forwards",
      }}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${colors.text}`} />
      <p className={`text-[13px] flex-1 font-medium ${colors.text}`}>{item.message}</p>
      {item.action && (
        <button
          onClick={() => {
            item.action!.onClick();
            markExiting(item.id);
            setTimeout(() => remove(item.id), 300);
          }}
          className={`px-2 py-1 rounded text-[12px] font-semibold underline-offset-2 hover:underline cursor-pointer flex-shrink-0 ${colors.text}`}
        >
          {item.action.label}
        </button>
      )}
      <button
        onClick={() => {
          markExiting(item.id);
          setTimeout(() => remove(item.id), 300);
        }}
        className={`p-1.5 rounded hover:opacity-75 transition-opacity cursor-pointer flex-shrink-0 ${colors.text}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
      {toasts.map((item) => (
        <ToastItem key={item.id} item={item} />
      ))}
    </div>
  );
}
