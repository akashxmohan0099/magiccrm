"use client";

import { createContext, useContext } from "react";
import type { User, Session } from "@supabase/supabase-js";

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "staff";
  status: string;
}

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  member: WorkspaceMember | null;
  workspaceId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshMember: () => Promise<void>;
}

export const AUTH_MEMBER_REFRESH_EVENT = "magic-crm:refresh-auth-member";

export const AuthContext = createContext<UseAuthReturn | null>(null);

export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
