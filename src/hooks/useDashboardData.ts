"use client";

import useSWR from "swr";
import { createClient } from "@/lib/supabase";

/**
 * SWR-powered dashboard data hook.
 *
 * Provides cached, auto-revalidating data for dashboard widgets.
 * Uses the browser Supabase client (respects RLS) and SWR's
 * stale-while-revalidate strategy:
 * - Shows cached data instantly on return visits
 * - Refreshes in the background
 * - Auto-revalidates on tab focus and reconnect
 * - Deduplicates concurrent requests for the same data
 *
 * Usage: const { stats, recentActivity, isLoading } = useDashboardData(workspaceId);
 */

interface DashboardStats {
  totalClients: number;
  totalLeads: number;
  upcomingBookings: number;
  overdueInvoices: number;
  activeJobs: number;
  revenue: number;
}

interface ActivityItem {
  id: string;
  type: string | null;
  module: string | null;
  description: string | null;
  created_at: string;
}

const supabase = createClient();

async function fetchDashboardStats([, workspaceId]: [string, string]): Promise<DashboardStats> {
  const [clients, leads, bookings, invoices, jobs, payments] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("bookings").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).gte("date", new Date().toISOString().split("T")[0]).eq("status", "confirmed"),
    supabase.from("invoices").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "overdue"),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).neq("stage", "completed"),
    supabase.from("payments").select("amount").eq("workspace_id", workspaceId).eq("status", "processed"),
  ]);

  const totalRevenue = (payments.data || []).reduce((sum: number, p: { amount: number | null }) => sum + Number(p.amount || 0), 0);

  return {
    totalClients: clients.count || 0,
    totalLeads: leads.count || 0,
    upcomingBookings: bookings.count || 0,
    overdueInvoices: invoices.count || 0,
    activeJobs: jobs.count || 0,
    revenue: totalRevenue,
  };
}

async function fetchRecentActivity([, workspaceId]: [string, string]): Promise<ActivityItem[]> {
  const { data } = await supabase
    .from("activity_log")
    .select("id, type, module, description, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(10);

  return (data || []) as ActivityItem[];
}

export function useDashboardData(workspaceId: string | null) {
  const { data: stats, error: statsError, isLoading: statsLoading } = useSWR(
    workspaceId ? ["dashboard-stats", workspaceId] : null,
    fetchDashboardStats,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 10_000, // Don't refetch within 10s
      refreshInterval: 60_000,  // Auto-refresh every 60s
    },
  );

  const { data: recentActivity, isLoading: activityLoading } = useSWR(
    workspaceId ? ["dashboard-activity", workspaceId] : null,
    fetchRecentActivity,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10_000,
      refreshInterval: 60_000,
    },
  );

  return {
    stats: stats || {
      totalClients: 0,
      totalLeads: 0,
      upcomingBookings: 0,
      overdueInvoices: 0,
      activeJobs: 0,
      revenue: 0,
    },
    recentActivity: recentActivity || [],
    isLoading: statsLoading || activityLoading,
    error: statsError,
  };
}
