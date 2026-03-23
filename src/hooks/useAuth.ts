"use client";

import { useEffect, useState, useCallback } from "react";
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

  // Fetch workspace_member for the authenticated user
  const fetchMember = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("workspace_members")
        .select("id, workspace_id, auth_user_id, name, email, role, status")
        .eq("auth_user_id", userId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setMember(data as WorkspaceMember);
      } else {
        setMember(null);
      }
    },
    [supabase]
  );

  useEffect(() => {
    // Get the initial session
    const init = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchMember(currentSession.user.id);
      }

      setLoading(false);
    };

    init();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, newSession: Session | null) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchMember(newSession.user.id);
      } else {
        setMember(null);
      }
    });

    return () => {
      subscription.unsubscribe();
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
