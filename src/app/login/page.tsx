"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { safeRedirect } from "@/lib/safe-redirect";
import { toast, ToastContainer } from "@/components/ui/Toast";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;

    if (error === "auth_callback_failed") {
      setErrors((prev) => ({
        ...prev,
        form: "We couldn't complete sign-in. Please try again from the login page.",
      }));
      return;
    }

    setErrors((prev) => ({
      ...prev,
      form: "We couldn't complete sign-in. Please try again.",
    }));
  }, [searchParams]);

  const inputClass =
    "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
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
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setErrors({ form: "Please check your email and confirm your account before logging in." });
        } else if (error.message.includes("Invalid login credentials")) {
          setErrors({ form: "Invalid email or password. Please try again." });
        } else {
          setErrors({ form: error.message });
        }
        setLoading(false);
        return;
      }

      // Redirect to the page they were trying to access, or dashboard
      const redirect = safeRedirect(searchParams.get("redirect"));
      router.push(redirect);
      router.refresh();
    } catch {
      setErrors({ form: "An unexpected error occurred. Please try again." });
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast("Password reset is coming soon. Contact support for help.", "info");
  };

  const clearError = (...fields: string[]) => {
    setErrors((prev) => {
      const next = { ...prev };
      fields.forEach((field) => {
        delete next[field];
      });
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
              <div className="w-3.5 h-3.5 bg-card-bg rounded-[4px]" />
            </div>
            <span className="font-bold text-foreground text-[16px] tracking-tight">Magic</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card-bg border border-border-light rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">Welcome back</h1>
            <p className="text-sm text-text-secondary mt-1.5">
              Sign in to your workspace.
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
              <label className="block text-[13px] font-medium text-foreground mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email", "form");
                }}
                placeholder="sarah@business.com"
                className={inputClass}
                autoFocus
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[13px] font-medium text-foreground">Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-text-tertiary hover:text-foreground cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError("password", "form");
                  }}
                  placeholder="Enter your password"
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
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-foreground text-white text-sm font-semibold rounded-full hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-[13px] text-text-secondary mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/onboarding" className="text-foreground font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      {/* Toast container for forgot-password toast */}
      <ToastContainer />
    </div>
  );
}
