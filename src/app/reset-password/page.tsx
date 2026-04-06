"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // Verify the user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setHasSession(!!session);
      setSessionChecked(true);
    };
    checkSession();
  }, [supabase]);

  const validate = (): string | null => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password))
      return "Password must contain at least one uppercase letter";
    if (!/[0-9]/.test(password))
      return "Password must contain at least one number";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        if (updateError.message.includes("same_password")) {
          setError("New password must be different from your current password.");
        } else {
          setError(updateError.message);
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 bg-surface border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30";

  // Still checking session
  if (!sessionChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    );
  }

  // No valid session (invalid or expired reset link)
  if (!hasSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "var(--logo-green)" }}
              >
                <div className="w-3.5 h-3.5 bg-card-bg rounded-[4px]" />
              </div>
              <span className="font-bold text-foreground text-[16px] tracking-tight">
                Magic
              </span>
            </Link>
          </div>

          <div className="bg-card-bg border border-border-light rounded-2xl p-8 shadow-sm text-center">
            <h1 className="text-[22px] font-bold text-foreground tracking-tight">
              Invalid or expired link
            </h1>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              This password reset link has expired or has already been used.
              Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="mt-5 inline-block py-3 px-6 bg-foreground text-background text-sm font-semibold rounded-full hover:opacity-90 transition-all"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="font-bold text-foreground text-[16px] tracking-tight">
              Magic
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card-bg border border-border-light rounded-2xl p-8 shadow-sm">
          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <h1 className="text-[22px] font-bold text-foreground tracking-tight">
                Password updated
              </h1>
              <p className="text-sm text-text-secondary mt-2">
                Redirecting you to your dashboard...
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-[22px] font-bold text-foreground tracking-tight">
                  Set new password
                </h1>
                <p className="text-sm text-text-secondary mt-1.5">
                  Choose a strong password for your account.
                </p>
              </div>

              {error && (
                <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-[13px] text-red-600 font-medium">
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-1">
                {/* New Password */}
                <div className="mb-5">
                  <label className="block text-[13px] font-medium text-foreground mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      placeholder="At least 8 characters"
                      className={`${inputClass} pr-10`}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {/* Password strength hints */}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <PasswordCheck
                        label="At least 8 characters"
                        met={password.length >= 8}
                      />
                      <PasswordCheck
                        label="One uppercase letter"
                        met={/[A-Z]/.test(password)}
                      />
                      <PasswordCheck
                        label="One number"
                        met={/[0-9]/.test(password)}
                      />
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="mb-5">
                  <label className="block text-[13px] font-medium text-foreground mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Confirm your new password"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-foreground text-background text-sm font-semibold rounded-full hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordCheck({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-1.5 h-1.5 rounded-full ${met ? "bg-green-500" : "bg-border-light"}`}
      />
      <span
        className={`text-xs ${met ? "text-green-600" : "text-text-tertiary"}`}
      >
        {label}
      </span>
    </div>
  );
}
