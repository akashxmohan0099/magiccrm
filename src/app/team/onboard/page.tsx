"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Instagram, Facebook, Globe, Loader2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { LogoUpload } from "@/components/ui/LogoUpload";
import { TextArea } from "@/components/ui/TextArea";
import { toast } from "@/components/ui/Toast";

interface InvitedMemberRow {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  avatar_url: string | null;
  bio: string | null;
  social_links: Record<string, string> | null;
}

export default function TeamOnboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [member, setMember] = useState<InvitedMemberRow | null>(null);

  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [facebook, setFacebook] = useState("");
  const [website, setWebsite] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login?next=/team/onboard");
        return;
      }

      const { data: row } = await supabase
        .from("workspace_members")
        .select("id, workspace_id, name, email, phone, status, avatar_url, bio, social_links")
        .eq("auth_user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (!row) {
        toast("No team membership found for this account.");
        router.replace("/dashboard");
        return;
      }

      setMember(row as InvitedMemberRow);
      setAvatarUrl(row.avatar_url ?? "");
      setBio(row.bio ?? "");
      setPhone(row.phone ?? "");
      const links = (row.social_links ?? {}) as Record<string, string>;
      setInstagram(links.instagram ?? "");
      setTiktok(links.tiktok ?? "");
      setFacebook(links.facebook ?? "");
      setWebsite(links.website ?? "");
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router, supabase]);

  const handleSubmit = async () => {
    if (!member) return;

    if (password || confirmPassword) {
      if (password.length < 8) {
        toast("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        toast("Passwords don't match.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const trimmedSocials: Record<string, string> = {};
      if (instagram.trim()) trimmedSocials.instagram = instagram.trim();
      if (tiktok.trim()) trimmedSocials.tiktok = tiktok.trim();
      if (facebook.trim()) trimmedSocials.facebook = facebook.trim();
      if (website.trim()) trimmedSocials.website = website.trim();

      const { error: updateError } = await supabase
        .from("workspace_members")
        .update({
          avatar_url: avatarUrl || null,
          bio: bio.trim() || null,
          phone: phone.trim() || null,
          social_links: trimmedSocials,
          status: "active",
        })
        .eq("id", member.id);

      if (updateError) {
        toast(updateError.message);
        setSubmitting(false);
        return;
      }

      if (password) {
        const { error: pwError } = await supabase.auth.updateUser({ password });
        if (pwError) {
          toast(`Profile saved, but password update failed: ${pwError.message}`);
        }
      }

      toast("Welcome to the team!");
      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      toast("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-text-tertiary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {member?.status === "active"
              ? "Your profile"
              : `Welcome, ${member?.name?.split(" ")[0] || "there"}`}
          </h1>
          <p className="text-[14px] text-text-secondary mt-2">
            {member?.status === "active"
              ? "Update anything clients see when they book with you."
              : "Tell clients a bit about yourself. This helps them book with confidence."}
          </p>
        </div>

        <div className="bg-card-bg border border-border-light rounded-2xl p-6 sm:p-8 space-y-6">
          <LogoUpload
            value={avatarUrl}
            onChange={setAvatarUrl}
            label="Profile Photo"
            emptyLabel="No photo"
            setLabel="Photo set"
            allowUrlPaste={false}
            hint="A clear headshot works best."
          />

          <div>
            <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Bio</p>
            <TextArea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short intro — specialties, years of experience, anything that helps clients pick you."
              rows={4}
              className="!text-[14px]"
            />
          </div>

          <div>
            <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Phone</p>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">Social Links</p>
            <div className="space-y-2">
              <SocialInput icon={<Instagram className="w-4 h-4" />} value={instagram} onChange={setInstagram} placeholder="instagram.com/handle" />
              <SocialInput icon={<TikTokIcon className="w-4 h-4" />} value={tiktok} onChange={setTiktok} placeholder="tiktok.com/@handle" />
              <SocialInput icon={<Facebook className="w-4 h-4" />} value={facebook} onChange={setFacebook} placeholder="facebook.com/handle" />
              <SocialInput icon={<Globe className="w-4 h-4" />} value={website} onChange={setWebsite} placeholder="yourwebsite.com" />
            </div>
          </div>

          <div className="border-t border-border-light pt-5">
            <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Set a password (optional)
            </p>
            <p className="text-[12px] text-text-secondary mb-3">
              Skip this and we&apos;ll email you a sign-in link each time.
            </p>
            <div className="space-y-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full px-3 py-2.5 bg-surface border border-border-light rounded-xl text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Saving…" : member?.status === "active" ? "Save changes" : "Finish setup"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SocialInput({
  icon,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-surface border border-border-light rounded-lg px-3 focus-within:ring-2 focus-within:ring-primary/20">
      <span className="text-text-tertiary flex-shrink-0">{icon}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 py-2.5 bg-transparent text-[14px] text-foreground outline-none placeholder:text-text-tertiary"
      />
    </div>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.896 2.896 0 0 1 2.305-4.638 2.91 2.91 0 0 1 .89.135V9.4a6.354 6.354 0 0 0-1-.083 6.34 6.34 0 0 0-3.486 11.643 6.337 6.337 0 0 0 9.823-5.291V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.83 4.83 0 0 1-.889-.104z" />
    </svg>
  );
}
