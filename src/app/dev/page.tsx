"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAddonsStore } from "@/store/addons";

const DEV_EMAIL = "demo@demo.com";
const DEV_PASSWORD = "12345678";

/**
 * /dev — One-click dashboard access for development.
 *
 * First visit: silently creates account + sample data, signs in, redirects.
 * Return visits: instant sign-in + redirect (< 1 second).
 *
 * All modules enabled. All sample data loaded.
 */
export default function DevPage() {
  const [status, setStatus] = useState("Loading...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function go() {
      // 1. Try to sign in (return visit = instant)
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
      });

      if (signInErr) {
        // 2. First visit — create account silently
        setStatus("Setting up dev workspace...");
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: DEV_EMAIL,
            password: DEV_PASSWORD,
            workspaceName: "Dev Studio",
            industry: "beauty-wellness",
            persona: "makeup-artist",
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || "Failed to create dev account");
          return;
        }

        // Sign in after creation
        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email: DEV_EMAIL,
          password: DEV_PASSWORD,
        });
        if (loginErr) {
          setError(loginErr.message);
          return;
        }
      }

      // 3. Set onboarding complete with ALL modules enabled
      const storeData = {
        state: {
          step: 5,
          selectedIndustry: "beauty-wellness",
          selectedPersona: "makeup-artist",
          businessContext: {
            businessName: "Dev Studio",
            businessDescription: "Development workspace with all modules",
            industry: "Beauty & Wellness",
            industryOther: "",
            location: "",
          },
          needs: {
            manageCustomers: true,
            receiveInquiries: true,
            communicateClients: true,
            sendInvoices: true,
            acceptBookings: true,
            manageProjects: true,
            runMarketing: true,
            handleSupport: true,
            manageDocuments: true,
          },
          teamSize: "2-5",
          operatingModel: { workLocation: "both", clientele: "", sellProducts: false },
          featureSelections: {},
          discoveryAnswers: {
            "module:leads-pipeline": true,
            "module:jobs-projects": true,
            "module:marketing": true,
            "module:team": true,
            "module:client-portal": true,
            "module:documents": true,
            "module:support": true,
            "config:event-workflow": true,
            "config:deposit-tracking": true,
            "config:booking-contracts": true,
            "config:proposal-builder": true,
            "config:custom-fields-mua": true,
            "config:stripe-integration": true,
            "config:rebooking-prompts": true,
            "config:public-booking-page": true,
          },
          isBuilding: false,
          buildComplete: true,
          chipSelections: [
            "op-team", "op-mobile", "op-fixed",
            "inquire-first", "referrals", "vendor-referrals", "long-lead", "online-booking",
            "bridal-wedding", "group-bookings", "trials", "lessons", "regular-clients",
            "deposits", "contracts", "proposals", "online-payments", "newsletters",
          ],
          aiCategories: [],
          aiAnswers: {},
          deepDiveAnswers: {},
          featureActivationLog: [],
          tuningPatches: [],
          tuningModuleMeta: {},
          tuningCombinations: [],
          tuningLoaded: false,
        },
        version: 19,
      };
      localStorage.setItem("magic-crm-onboarding", JSON.stringify(storeData));

      // 4. Enable ALL add-on modules
      const allAddons = [
        "documents", "support", "memberships", "before-after", "intake-forms",
        "soap-notes", "loyalty", "win-back", "storefront", "ai-insights",
        "notes-docs", "gift-cards", "class-timetable", "vendor-management",
        "proposals", "waitlist-manager",
      ];
      const addonsStore = useAddonsStore.getState();
      for (const id of allAddons) {
        if (!addonsStore.enabledAddons.includes(id)) {
          addonsStore.enableAddon(id, id);
        }
      }

      // 5. Go
      window.location.href = "/dashboard";
    }

    go();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
        <p className="text-sm text-text-secondary">{status}</p>
        {error && (
          <div className="max-w-sm mx-auto p-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-600">
            {error}
            <button
              onClick={() => { setError(null); window.location.reload(); }}
              className="block w-full mt-2 text-red-700 font-medium cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
