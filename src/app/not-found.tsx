"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: "var(--logo-green)" }}>
        <div className="w-5 h-5 bg-white rounded-md" />
      </div>
      <h1 className="text-[64px] font-bold text-foreground leading-none mb-2">404</h1>
      <p className="text-[17px] text-text-secondary mb-8">This page doesn&apos;t exist.</p>
      <div className="flex gap-3">
        <Link href="/">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4" /> Home
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button size="sm">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
