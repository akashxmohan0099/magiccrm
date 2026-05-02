"use client";

import { useId } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "primary";
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  variant = "danger",
}: ConfirmDialogProps) {
  const messageId = useId();
  return (
    <Modal open={open} onClose={onClose} title={title} role="alertdialog" aria-describedby={messageId}>
      <p id={messageId} className="text-sm text-text-secondary mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          variant={variant}
          onClick={() => {
            // try/finally so the dialog still closes even if onConfirm
            // throws — otherwise the user is stuck on a dead modal that
            // looks like nothing happened.
            try {
              onConfirm();
            } finally {
              onClose();
            }
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
