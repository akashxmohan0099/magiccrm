"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

const TEST_EMAIL = "dev-test@magic-crm.test";
const TEST_PASSWORD = "DevTest2026!";

export default function DevPage() {
  const [status, setStatus] = useState("Checking...");
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function setup() {
      // Try to sign in first
      setStatus("Signing in...");
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      if (!signInError) {
        // Already exists — get workspace
        setStatus("Signed in. Loading workspace...");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Set onboarding as complete
          setOnboardingComplete();
          setStatus("Ready! Redirecting to dashboard...");
          setTimeout(() => { window.location.href = "/dashboard"; }, 500);
        }
        return;
      }

      // Account doesn't exist — create it
      setStatus("Creating test account + sample data...");
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            workspaceName: "Glow Studio (Dev)",
            industry: "beauty-wellness",
            persona: "makeup-artist",
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Signup failed");
          return;
        }

        setWorkspaceId(data.workspaceId);
        setStatus("Account created. Signing in...");

        // Sign in
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });

        if (loginError) {
          setError(loginError.message);
          return;
        }

        setOnboardingComplete();
        setStatus("Ready! Redirecting to dashboard...");
        setTimeout(() => { window.location.href = "/dashboard"; }, 500);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    }

    function setOnboardingComplete() {
      const storeData = {
        state: {
          step: 5,
          selectedIndustry: "beauty-wellness",
          selectedPersona: "makeup-artist",
          businessContext: {
            businessName: "Glow Studio (Dev)",
            businessDescription: "Dev test MUA workspace",
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
            manageProjects: false,
            runMarketing: true,
            handleSupport: false,
            manageDocuments: false,
          },
          teamSize: "Just me",
          operatingModel: { workLocation: "mobile", clientele: "", sellProducts: false },
          featureSelections: {},
          discoveryAnswers: {
            "module:leads-pipeline": true,
            "module:marketing": true,
            "config:event-workflow": true,
            "config:deposit-tracking": true,
            "config:booking-contracts": true,
            "config:proposal-builder": true,
            "config:custom-fields-mua": true,
          },
          isBuilding: false,
          buildComplete: true,
          chipSelections: [
            "op-solo", "op-mobile", "inquire-first", "referrals",
            "vendor-referrals", "long-lead", "online-booking",
            "bridal-wedding", "group-bookings", "trials", "regular-clients",
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
    }

    setup();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="max-w-sm text-center space-y-4 px-6">
        <h1 className="text-[22px] font-bold text-foreground">Dev Mode</h1>
        <p className="text-sm text-text-secondary">{status}</p>
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[13px] text-red-600">
            {error}
          </div>
        )}
        {workspaceId && (
          <p className="text-[11px] text-text-tertiary font-mono">
            Workspace: {workspaceId}
          </p>
        )}
        <div className="pt-4 space-y-2">
          <a href="/dashboard" className="block w-full py-3 bg-foreground text-background rounded-xl text-sm font-medium text-center">
            Go to Dashboard
          </a>
          <a href="/onboarding" className="block w-full py-3 text-sm text-text-tertiary text-center">
            Go to Onboarding
          </a>
        </div>
      </div>
    </div>
  );
}
