"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { useOnboardingStore } from "@/store/onboarding";
import { createClient } from "@/lib/supabase";

export function SignupStep() {
  const { prevStep, nextStep, businessContext } = useOnboardingStore();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordsMatch = password === confirmPassword;
  const isValid = email.trim() && password.length >= 6 && passwordsMatch && agreedToTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    if (!passwordsMatch) {
      setError("Passwords don't match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Signup failed");
        setLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      const { data: workspace } = await supabase
        .from("workspaces")
        .insert({ name: businessContext.businessName || "My Workspace" })
        .select("id")
        .single();

      if (workspace) {
        await supabase.from("workspace_members").insert({
          auth_user_id: result.userId,
          workspace_id: workspace.id,
          name: email.trim().split("@")[0],
          email: email.trim(),
          role: "owner",
          status: "active",
        });

        await supabase.from("workspace_settings").insert({
          workspace_id: workspace.id,
        });
      }

      nextStep();
    } catch (_err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3.5 bg-card-bg border border-border-light rounded-xl text-[15px] text-foreground placeholder:text-text-tertiary focus:border-foreground focus:ring-2 focus:ring-foreground/10 outline-none transition-all";

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="max-w-md mx-auto"
    >
      <button
        onClick={prevStep}
        className="flex items-center gap-1.5 text-[13px] text-text-tertiary hover:text-foreground transition-colors cursor-pointer mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>

      <div className="mb-8">
        <h2 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
          Create your account
        </h2>
        <p className="text-text-secondary text-[15px]">
          Save your progress and launch
          {businessContext.businessName ? ` ${businessContext.businessName}` : " your workspace"}.
        </p>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-[13px] text-red-600 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="you@example.com"
            className={inputClass}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="At least 6 characters"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-foreground mb-1.5">Confirm password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
            placeholder="Re-enter your password"
            className={`${inputClass} ${confirmPassword && !passwordsMatch ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
          />
          {confirmPassword && !passwordsMatch && (
            <p className="text-[12px] text-red-500 mt-1.5">Passwords don&apos;t match</p>
          )}
        </div>

        {/* Terms & Conditions */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0 ${
                  agreedToTerms
                    ? "bg-foreground"
                    : "border-2 border-border-light group-hover:border-foreground/30"
                }`}
              >
                {agreedToTerms && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
            <span className="text-[13px] text-text-secondary leading-relaxed">
              I agree to the{" "}
              <a href="/terms" target="_blank" className="text-foreground font-medium underline underline-offset-2 hover:no-underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" className="text-foreground font-medium underline underline-offset-2 hover:no-underline">
                Privacy Policy
              </a>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={!isValid || loading}
          className={`w-full py-4 rounded-2xl text-[15px] font-semibold transition-all duration-200 flex items-center justify-center gap-2 mt-2 ${
            isValid && !loading
              ? "bg-foreground text-white hover:opacity-90 cursor-pointer shadow-lg"
              : "bg-border-light text-text-tertiary cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-[12px] text-text-tertiary mt-6">
        Already have an account?{" "}
        <a href="/login" className="text-foreground font-medium hover:underline">Log in</a>
      </p>
    </motion.div>
  );
}
