"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import {
  AuthContext,
  AUTH_MEMBER_REFRESH_EVENT,
  type WorkspaceMember,
} from "@/hooks/useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<WorkspaceMember | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const userRef = useRef<User | null>(null);

  const fetchMember = useCallback(
    async (userId: string) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      const maxAttempts = 4;
      const delays = [0, 300, 800, 2000];

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
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
        } catch (error) {
          console.error(`[useAuth] fetchMember attempt ${attempt + 1} threw:`, error);
        }
      }

      console.warn("[useAuth] No workspace_members row found after all retries for user", userId);
      setMember(null);
      fetchingRef.current = false;
    },
    [supabase],
  );

  const refreshMember = useCallback(async () => {
    // Skip if a fetch is already in progress (e.g. from onAuthStateChange)
    if (fetchingRef.current) return;

    try {
      const {
        data: { user: serverUser },
      } = await supabase.auth.getUser();

      const resolvedUser = serverUser ?? userRef.current;
      userRef.current = resolvedUser ?? null;
      setUser(resolvedUser ?? null);

      if (resolvedUser) {
        await fetchMember(resolvedUser.id);
      } else {
        setSession(null);
        setMember(null);
      }
    } catch (error) {
      console.error("[useAuth] refreshMember failed:", error);
    }
  }, [supabase, fetchMember]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const {
          data: { session: localSession },
        } = await supabase.auth.getSession();

        const {
          data: { user: serverUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        const resolvedUser = serverUser ?? localSession?.user ?? null;

        if (userError && !resolvedUser) {
          console.warn("[useAuth] no valid session:", userError.message);
        }

        if (resolvedUser) {
          userRef.current = resolvedUser;
          setUser(resolvedUser);
          setSession(localSession);
          await fetchMember(resolvedUser.id);
        } else {
          userRef.current = null;
          setUser(null);
          setSession(null);
          setMember(null);
        }
      } catch (error) {
        console.warn("[useAuth] init failed, running in demo mode:", error);
        // Don't wait for the timeout — immediately stop loading
        if (!cancelled) setLoading(false);
        return;
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void init();

    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 2000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, newSession: Session | null) => {
      if (cancelled) return;

      setSession(newSession);
      userRef.current = newSession?.user ?? null;
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        fetchingRef.current = false;
        await fetchMember(newSession.user.id);
      } else {
        setMember(null);
      }
    });

    const handleRefresh = () => {
      void refreshMember();
    };
    window.addEventListener(AUTH_MEMBER_REFRESH_EVENT, handleRefresh);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener(AUTH_MEMBER_REFRESH_EVENT, handleRefresh);
      clearTimeout(timeout);
    };
  }, [supabase, fetchMember, refreshMember]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    userRef.current = null;
    setUser(null);
    setSession(null);
    setMember(null);
    router.push("/login");
    router.refresh();
  }, [supabase, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        member,
        workspaceId: member?.workspace_id ?? null,
        loading,
        signOut,
        refreshMember,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
