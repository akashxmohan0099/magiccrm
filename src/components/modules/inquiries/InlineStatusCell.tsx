"use client";

import type { Inquiry, InquiryStatus } from "@/types/models";
import { useInquiriesStore } from "@/store/inquiries";
import { useAuth } from "@/hooks/useAuth";
import { InlineDropdown } from "@/components/ui/InlineDropdown";

// Inline-editable Status cell — pill stays visible as the trigger; the
// dropdown shows colored dots for each status.
export function InlineStatusCell({
  inquiry,
  pillStyles,
}: {
  inquiry: Inquiry;
  pillStyles: Record<InquiryStatus, { dot: string; bg: string; text: string; label: string }>;
}) {
  const { updateInquiry } = useInquiriesStore();
  const { workspaceId } = useAuth();
  const c = pillStyles[inquiry.status] ?? pillStyles.new;
  const allStatuses: InquiryStatus[] = ["new", "in_progress", "converted", "closed"];
  const options = allStatuses.map((s) => ({
    value: s,
    label: pillStyles[s].label,
    dot: pillStyles[s].dot,
  }));

  return (
    <InlineDropdown
      ariaLabel="Edit status"
      value={inquiry.status}
      options={options}
      onChange={(next) =>
        updateInquiry(
          inquiry.id,
          { status: next as InquiryStatus },
          workspaceId || undefined,
        )
      }
    >
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${c.bg} ${c.text} text-[11px] font-semibold`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {c.label}
      </span>
    </InlineDropdown>
  );
}
