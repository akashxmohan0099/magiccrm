// Dev-only Zustand store for the /dev launcher.
// Persists the chosen persona + role across page navigations so that the
// dashboard layout's seed effect (or the launcher's explicit re-seed)
// uses the right fixture set.
//
// This store is harmless in production — nothing reads from it outside
// the `/dev` page (which itself returns notFound() in prod).

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DevPersonaKey, DevRole } from "@/lib/seed-data";

interface DevState {
  personaKey: DevPersonaKey;
  role: DevRole;
  setPersona: (p: DevPersonaKey) => void;
  setRole: (r: DevRole) => void;
  reset: () => void;
}

const DEFAULT_PERSONA: DevPersonaKey = "hair-salon";
const DEFAULT_ROLE: DevRole = "owner";

export const useDevStore = create<DevState>()(
  persist(
    (set) => ({
      personaKey: DEFAULT_PERSONA,
      role: DEFAULT_ROLE,
      setPersona: (personaKey) => set({ personaKey }),
      setRole: (role) => set({ role }),
      reset: () => set({ personaKey: DEFAULT_PERSONA, role: DEFAULT_ROLE }),
    }),
    {
      name: "magic-crm:dev",
      version: 1,
    },
  ),
);
