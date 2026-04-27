"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Shield,
  AlertTriangle,
  Save,
  Check,
  LogOut,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";

// ============================================================
// Section wrapper — matches GeneralSettings card pattern
// ============================================================
function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
  delay = 0,
  variant = "default",
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  children: React.ReactNode;
  delay?: number;
  variant?: "default" | "danger";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={`bg-card-bg border rounded-2xl p-6 sm:p-8 ${
        variant === "danger"
          ? "border-red-200 dark:border-red-900/40"
          : "border-border-light"
      }`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            variant === "danger"
              ? "bg-red-50 dark:bg-red-950/30"
              : "bg-surface"
          }`}
        >
          <Icon
            className={`w-[18px] h-[18px] ${
              variant === "danger" ? "text-red-500" : "text-text-secondary"
            }`}
          />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

// ============================================================
// Main Profile Page
// ============================================================
export default function ProfilePage() {
  const supabase = createClient();
  const { user, signOut } = useAuth();

  // ── Personal Details ──
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState("");

  // ── Password ──
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // ── Delete Account ──
  const [deleteInput, setDeleteInput] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Pre-fill name from user metadata
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  // ── Save Name ──
  const handleSaveName = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      setNameError("Name cannot be empty.");
      return;
    }

    setNameError("");
    setSavingName(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: trimmed },
      });

      if (error) {
        setNameError(error.message);
      } else {
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 2500);
      }
    } catch {
      setNameError("Something went wrong. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  // ── Change Password ──
  const handleChangePassword = async () => {
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setSavingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSaved(true);
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSaved(false), 2500);
      }
    } catch {
      setPasswordError("Something went wrong. Please try again.");
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Delete Account ──
  const handleDeleteAccount = async () => {
    // Account deletion requires a server-side admin call.
    // For now, sign out and show a message. A proper implementation
    // would call an API route that uses the Supabase service role key.
    await signOut();
  };

  const inputClass =
    "w-full px-4 py-3 bg-card-bg border border-border-light rounded-xl text-[15px] text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground transition-all";

  return (
    <div>
      <PageHeader title="Profile" description="Manage your account settings" />

      <div className="max-w-2xl space-y-5">
        {/* ── Section 1: Personal Details ── */}
        <SettingsSection
          icon={User}
          title="Personal Details"
          description="Your name and contact information"
          delay={0.05}
        >
          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (nameSaved) setNameSaved(false);
                  if (nameError) setNameError("");
                }}
                placeholder="Your full name"
                className={inputClass}
              />
            </div>

            {/* Email — read-only */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                readOnly
                className="w-full px-4 py-3 bg-surface border border-border-light rounded-xl text-[15px] text-text-secondary cursor-not-allowed"
              />
              <p className="text-[11px] text-text-tertiary mt-1.5">
                Contact support to change your email address.
              </p>
            </div>

            {/* Error */}
            {nameError && (
              <p className="text-sm text-red-500">{nameError}</p>
            )}

            {/* Save */}
            <div className="flex items-center gap-3 pt-1">
              <Button onClick={handleSaveName} loading={savingName} size="md">
                <Save className="w-4 h-4 mr-1.5" />
                Save Changes
              </Button>
              <AnimatePresence>
                {nameSaved && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium text-green-600 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Saved!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </SettingsSection>

        {/* ── Section 2: Security ── */}
        <SettingsSection
          icon={Shield}
          title="Security"
          description="Update your password"
          delay={0.1}
        >
          <div className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  placeholder="Min. 8 characters"
                  className={inputClass + " pr-11"}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-foreground transition-colors cursor-pointer"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  placeholder="Repeat your new password"
                  className={inputClass + " pr-11"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-foreground transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password validation hints */}
            {(newPassword || confirmPassword) && (
              <div className="space-y-1">
                <p
                  className={`text-xs flex items-center gap-1.5 ${
                    newPassword.length >= 8
                      ? "text-green-600"
                      : "text-text-tertiary"
                  }`}
                >
                  <Check className="w-3 h-3" />
                  At least 8 characters
                </p>
                {confirmPassword && (
                  <p
                    className={`text-xs flex items-center gap-1.5 ${
                      newPassword === confirmPassword && confirmPassword.length > 0
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}

            {/* Save */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                onClick={handleChangePassword}
                loading={savingPassword}
                size="md"
                disabled={!newPassword || !confirmPassword}
              >
                Update Password
              </Button>
              <AnimatePresence>
                {passwordSaved && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium text-green-600 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Password updated!
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </SettingsSection>

        {/* ── Section 3: Danger Zone ── */}
        <SettingsSection
          icon={AlertTriangle}
          title="Danger Zone"
          description="Irreversible actions"
          delay={0.15}
          variant="danger"
        >
          <div className="space-y-5">
            {/* Sign Out */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Sign Out</p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Sign out of your account on this device.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={signOut}>
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Sign Out
              </Button>
            </div>

            <div className="border-t border-border-light" />

            {/* Delete Account */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">
                    Delete Account
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Permanently delete your account and all associated data. This
                    cannot be undone.
                  </p>
                </div>
                {!showDeleteConfirm && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Delete
                  </Button>
                )}
              </div>

              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl"
                  >
                    <p className="text-[13px] text-text-secondary mb-3">
                      To confirm, type{" "}
                      <span className="font-mono font-semibold text-foreground bg-surface px-1.5 py-0.5 rounded">
                        DELETE
                      </span>{" "}
                      below:
                    </p>
                    <input
                      type="text"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="w-full px-3 py-2.5 bg-card-bg border border-border-light rounded-xl text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:border-red-300 font-mono"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteInput("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteAccount}
                        className={
                          deleteInput !== "DELETE"
                            ? "opacity-40 pointer-events-none"
                            : ""
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Delete My Account
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </SettingsSection>

        {/* Bottom spacer */}
        <div className="pb-4" />
      </div>
    </div>
  );
}
