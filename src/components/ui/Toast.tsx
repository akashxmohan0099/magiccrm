"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { create } from "zustand";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastStore {
  toasts: ToastItem[];
  add: (message: string, type?: ToastType) => void;
  remove: (id: string) => void;
  markExiting: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts.slice(-4), { id, message, type }] }));
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  markExiting: (id) =>
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    })),
}));

export function toast(message: string, type: ToastType = "success") {
  useToastStore.getState().add(message, type);
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
    const exitTimer = setTimeout(() => markExiting(item.id), 3000);
    const removeTimer = setTimeout(() => remove(item.id), 3300);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [item.id, remove, markExiting]);

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
      <p className={`text-[13px] flex-1 font-medium [overflow-wrap:anywhere] ${colors.text}`}>{item.message}</p>
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
