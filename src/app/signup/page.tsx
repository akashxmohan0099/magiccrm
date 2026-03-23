"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inputClass =
    "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      newErrors.email = "Enter a valid email";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      // 1. Create account via server-side API (auto-confirms, no email verification)
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const result = await res.json();
      if (!res.ok) {
        setErrors({ form: result.error || "Signup failed" });
        setLoading(false);
        return;
      }

      // 2. Sign in immediately (account is already confirmed)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setErrors({ form: signInError.message });
        setLoading(false);
        return;
      }

      // 3. Create workspace + member now that user is authenticated
      const { data: workspace, error: wsError } = await supabase
        .from("workspaces")
        .insert({ name: "My Workspace" })
        .select("id")
        .single();

      if (wsError) {
        console.error("Workspace creation error:", wsError);
        // Non-blocking — workspace can be created in onboarding
      }

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

      // 4. Redirect to onboarding
      router.push("/onboarding");
      router.refresh();
    } catch (_err) {
      setErrors({ form: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--logo-green)" }}
            >
              <div className="w-3.5 h-3.5 bg-foreground rounded-[4px]" />
            </div>
            <span className="font-bold text-foreground text-[16px] tracking-tight">Magic</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card-bg border border-border-light rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">
              Create your account
            </h1>
            <p className="text-[14px] text-text-secondary mt-1.5">
              Get started in seconds. No credit card required.
            </p>
          </div>

          {errors.form && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-[13px] text-red-600 font-medium">{errors.form}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-1">
            {/* Email */}
            <div className="mb-5">
              <label className="block text-[13px] font-medium text-foreground mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
                placeholder="you@example.com"
                className={inputClass}
                autoFocus
              />
              {errors.email && (
                <p className="text-[12px] text-red-500 mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className="block text-[13px] font-medium text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError("password");
                  }}
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
              {errors.password && (
                <p className="text-[12px] text-red-500 mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-foreground text-white text-[14px] font-semibold rounded-full hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating account..." : "Get Started"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-[13px] text-text-secondary mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
