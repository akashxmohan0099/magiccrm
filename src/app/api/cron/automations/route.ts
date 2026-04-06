import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";

interface AutomationLogRecord {
  id?: string;
  workspace_id: string;
  automation_type: "win-back" | "waitlist" | "membership" | "recurring";
  client_id?: string;
  triggered_at: string;
  status: "pending" | "completed" | "failed";
  metadata?: Record<string, unknown>;
}

interface ProcessingResult {
  winBack: number;
  waitlist: number;
  memberships: number;
  automations: number;
}

async function verifyAuthorization(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get("authorization");
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;
  return authHeader === expectedToken;
}

async function logAutomationAction(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  record: AutomationLogRecord
): Promise<void> {
  const { error } = await supabase
    .from("automation_log")
    .upsert([record], { onConflict: "id" });

  if (error) {
    console.error("Failed to log automation action:", error);
  }
}

async function processWinBackRules(
  supabase: Awaited<ReturnType<typeof createAdminClient>>
): Promise<number> {
  let processed = 0;

  try {
    const { data: rules, error: rulesError } = await supabase
      .from("win_back_rules")
      .select("*")
      .eq("enabled", true);

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) return 0;

    for (const rule of rules) {
      try {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - rule.days_threshold);

        // Find clients whose last booking is older than threshold
        const { data: clients, error: clientsError } = await supabase
          .from("clients")
          .select("id, workspace_id, last_win_back_sent_at")
          .eq("workspace_id", rule.workspace_id)
          .lt("last_booking_date", thresholdDate.toISOString());

        if (clientsError) throw clientsError;
        if (!clients) continue;

        for (const client of clients) {
          // Check if we already sent win-back recently
          if (client.last_win_back_sent_at) {
            const lastSent = new Date(client.last_win_back_sent_at);
            const daysSinceSent = Math.floor(
              (Date.now() - lastSent.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSinceSent < rule.days_threshold) {
              continue; // Skip if we already sent one recently
            }
          }

          // Log the action
          await logAutomationAction(supabase, {
            workspace_id: client.workspace_id,
            automation_type: "win-back",
            client_id: client.id,
            triggered_at: new Date().toISOString(),
            status: "pending",
            metadata: { rule_id: rule.id },
          });

          // Update last_win_back_sent_at
          await supabase
            .from("clients")
            .update({ last_win_back_sent_at: new Date().toISOString() })
            .eq("id", client.id);

          processed++;
        }
      } catch (err) {
        console.error(`Win-back rule ${rule.id} processing failed:`, err);
      }
    }
  } catch (err) {
    console.error("Win-back processing error:", err);
  }

  return processed;
}

async function processWaitlistNotifications(
  supabase: Awaited<ReturnType<typeof createAdminClient>>
): Promise<number> {
  let processed = 0;

  try {
    const { data: waitlistEntries, error: waitlistError } = await supabase
      .from("waitlist_entries")
      .select("*")
      .eq("status", "waiting");

    if (waitlistError) throw waitlistError;
    if (!waitlistEntries || waitlistEntries.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const entry of waitlistEntries) {
      try {
        // Check if the requested service has availability
        const { data: bookings, error: bookingsError } = await supabase
          .from("bookings")
          .select("id")
          .eq("service_id", entry.service_id)
          .gte("booking_date", today.toISOString())
          .lt("booking_date", tomorrow.toISOString());

        if (bookingsError) throw bookingsError;

        // Simplified availability check: if fewer than expected bookings, slot available
        const maxSlots = 5; // Example: assume max 5 bookings per day
        const isAvailable = !bookings || bookings.length < maxSlots;

        if (isAvailable) {
          // Update status to notified
          await supabase
            .from("waitlist_entries")
            .update({ status: "notified" })
            .eq("id", entry.id);

          // Log the action
          await logAutomationAction(supabase, {
            workspace_id: entry.workspace_id,
            automation_type: "waitlist",
            client_id: entry.client_id,
            triggered_at: new Date().toISOString(),
            status: "pending",
            metadata: { waitlist_entry_id: entry.id, service_id: entry.service_id },
          });

          processed++;
        }
      } catch (err) {
        console.error(`Waitlist entry ${entry.id} processing failed:`, err);
      }
    }
  } catch (err) {
    console.error("Waitlist processing error:", err);
  }

  return processed;
}

async function processMembershipRenewals(
  supabase: Awaited<ReturnType<typeof createAdminClient>>
): Promise<number> {
  let processed = 0;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: memberships, error: membershipsError } = await supabase
      .from("memberships")
      .select("*")
      .eq("status", "active")
      .lte("next_renewal_date", today.toISOString());

    if (membershipsError) throw membershipsError;
    if (!memberships || memberships.length === 0) return 0;

    for (const membership of memberships) {
      try {
        // Calculate next renewal date based on interval
        const nextRenewalDate = new Date(membership.next_renewal_date);
        const intervalDays = membership.renewal_interval_days || 30;
        nextRenewalDate.setDate(nextRenewalDate.getDate() + intervalDays);

        // Create invoice
        const invoiceData = {
          workspace_id: membership.workspace_id,
          client_id: membership.client_id,
          amount: membership.plan_price,
          status: "pending",
          invoice_date: new Date().toISOString(),
          due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          description: `Membership renewal: ${membership.plan_name}`,
          metadata: { membership_id: membership.id },
        };

        const { error: invoiceError } = await supabase
          .from("invoices")
          .insert([invoiceData]);

        if (invoiceError) throw invoiceError;

        // Update membership next_renewal_date
        await supabase
          .from("memberships")
          .update({ next_renewal_date: nextRenewalDate.toISOString() })
          .eq("id", membership.id);

        // Log the action
        await logAutomationAction(supabase, {
          workspace_id: membership.workspace_id,
          automation_type: "membership",
          client_id: membership.client_id,
          triggered_at: new Date().toISOString(),
          status: "pending",
          metadata: { membership_id: membership.id, invoice_amount: membership.plan_price },
        });

        processed++;
      } catch (err) {
        console.error(`Membership ${membership.id} renewal failed:`, err);
      }
    }
  } catch (err) {
    console.error("Membership renewal processing error:", err);
  }

  return processed;
}

async function processRecurringAutomations(
  supabase: Awaited<ReturnType<typeof createAdminClient>>
): Promise<number> {
  let processed = 0;

  try {
    const now = new Date();

    const { data: automations, error: automationsError } = await supabase
      .from("automations")
      .select("*")
      .eq("enabled", true)
      .lte("next_run_at", now.toISOString());

    if (automationsError) throw automationsError;
    if (!automations || automations.length === 0) return 0;

    for (const automation of automations) {
      try {
        // Calculate next run date based on recurrence
        const nextRunDate = new Date(automation.next_run_at);
        const recurrenceMinutes = automation.recurrence_minutes || 1440; // Default to daily
        nextRunDate.setMinutes(nextRunDate.getMinutes() + recurrenceMinutes);

        // Update next_run_at
        await supabase
          .from("automations")
          .update({ next_run_at: nextRunDate.toISOString() })
          .eq("id", automation.id);

        // Log the triggered rule
        await logAutomationAction(supabase, {
          workspace_id: automation.workspace_id,
          automation_type: "recurring",
          triggered_at: new Date().toISOString(),
          status: "pending",
          metadata: {
            automation_id: automation.id,
            automation_name: automation.name,
            rule: automation.rule,
          },
        });

        processed++;
      } catch (err) {
        console.error(`Automation ${automation.id} processing failed:`, err);
      }
    }
  } catch (err) {
    console.error("Recurring automation processing error:", err);
  }

  return processed;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Verify authorization
  const isAuthorized = await verifyAuthorization(req);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createAdminClient();
  const result: ProcessingResult = {
    winBack: 0,
    waitlist: 0,
    memberships: 0,
    automations: 0,
  };

  try {
    // Process each automation type
    result.winBack = await processWinBackRules(supabase);
    result.waitlist = await processWaitlistNotifications(supabase);
    result.memberships = await processMembershipRenewals(supabase);
    result.automations = await processRecurringAutomations(supabase);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("Cron automation route error:", err);
    return NextResponse.json(
      { error: "Internal server error", ...result },
      { status: 500 }
    );
  }
}
