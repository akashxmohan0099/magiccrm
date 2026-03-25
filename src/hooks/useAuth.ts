"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

interface WorkspaceMember {
  id: string;
  workspace_id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "staff";
  status: string;
}

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  member: WorkspaceMember | null;
  workspaceId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<WorkspaceMember | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  // Fetch workspace_member for the authenticated user.
  // Retries up to 3 times with increasing delays to handle:
  // - Race condition where the row was just created by the signup API
  // - Session propagation delay after login
  // - RLS cache lag
  const fetchMember = useCallback(
    async (userId: string) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      const MAX_ATTEMPTS = 4;
      const DELAYS = [0, 300, 800, 2000];

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, DELAYS[attempt]));
        }

        try {
          const { data, error } = await supabase
            .from("workspace_members")
            .select("id, workspace_id, auth_user_id, name, email, role, status")
            .eq("auth_user_id", userId)
            .eq("status", "active")
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error(`[useAuth] fetchMember attempt ${attempt + 1} error:`, error.message);
            continue;
          }

          if (data) {
            setMember(data as WorkspaceMember);
            fetchingRef.current = false;
            return;
          }
        } catch (err) {
          console.error(`[useAuth] fetchMember attempt ${attempt + 1} threw:`, err);
        }
      }

      console.warn("[useAuth] No workspace_members row found after all retries for user", userId);
      setMember(null);
      fetchingRef.current = false;
    },
    [supabase],
  );

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        // Try getSession first (reads from cookie, no network call — fast)
        const { data: { session: localSession } } = await supabase.auth.getSession();

        // Then validate with server
        const { data: { user: serverUser }, error: userError } = await supabase.auth.getUser();

        if (cancelled) return;

        // Use server-validated user, fall back to session user
        const resolvedUser = serverUser ?? localSession?.user ?? null;

        if (userError && !resolvedUser) {
          console.warn("[useAuth] no valid session:", userError.message);
        }

        if (resolvedUser) {
          setUser(resolvedUser);
          setSession(localSession);
          await fetchMember(resolvedUser.id);
        } else {
          setUser(null);
          setSession(null);
          setMember(null);
        }
      } catch (err) {
        console.error("[useAuth] init failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    // Safety timeout — never let loading stay true forever
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    // Listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, newSession: Session | null) => {
      if (cancelled) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        fetchingRef.current = false; // Allow a fresh fetch
        await fetchMember(newSession.user.id);
      } else {
        setMember(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase, fetchMember]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setMember(null);
    router.push("/login");
    router.refresh();
  }, [supabase, router]);

  return {
    user,
    session,
    member,
    workspaceId: member?.workspace_id ?? null,
    loading,
    signOut,
  };
}
