"use client";

import { Mail, Lock, User as UserIcon } from "lucide-react";

export function SignupStep({
  email,
  password,
  businessName,
  onEmail,
  onPassword,
  onBusinessName,
  error,
  notice,
}: {
  email: string;
  password: string;
  businessName: string;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onBusinessName: (v: string) => void;
  error: string;
  notice: string;
}) {
  return (
    <div>
      <h2 className="text-[22px] font-bold text-foreground text-center mb-1">
        Create your account
      </h2>
      <p className="text-[13px] text-text-secondary text-center mb-8">
        Last step — your login and business name
      </p>
      {error && (
        <p className="mb-3 text-[12px] text-red-600 text-center">{error}</p>
      )}
      {notice && (
        <p className="mb-3 text-[12px] text-emerald-600 text-center">{notice}</p>
      )}
      <div className="space-y-2.5">
        <div className="relative">
          <Mail className="w-4 h-4 text-text-tertiary absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            type="email"
            autoFocus
            placeholder="you@example.com"
            className="w-full pl-11 pr-4 py-3 bg-background border border-border-light rounded-full text-[14px] text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-text-tertiary absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={password}
            onChange={(e) => onPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full pl-11 pr-4 py-3 bg-background border border-border-light rounded-full text-[14px] text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="relative">
          <UserIcon className="w-4 h-4 text-text-tertiary absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            value={businessName}
            onChange={(e) => onBusinessName(e.target.value)}
            placeholder="Business name"
            className="w-full pl-11 pr-4 py-3 bg-background border border-border-light rounded-full text-[14px] text-foreground outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>
    </div>
  );
}
