"use client";

import { useEffect, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, description, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocusedElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = getFocusableElements(dialogRef.current);
    (focusable[0] ?? dialogRef.current)?.focus();

    return () => {
      previouslyFocusedElement.current?.focus();
    };
  }, [open]);

  if (!open) {
    return null;
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    const focusable = getFocusableElements(dialogRef.current);

    if (focusable.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const firstElement = focusable[0];
    const lastElement = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--app-overlay)] p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        tabIndex={-1}
        className="w-full max-w-[415px] overflow-hidden rounded-[8px] border border-[var(--app-border)] bg-white shadow-[0_24px_48px_rgba(15,23,42,0.18)]"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleDialogKeyDown}
      >
        <div className="flex items-center justify-between border-b border-[var(--app-border)] px-[14px] py-[12px]">
          <div>
            <h2 id="modal-title" className="text-[14px] font-semibold text-slate-800">
              {title}
            </h2>
            {description ? (
              <p id="modal-description" className="mt-1 text-[12px] text-slate-500">
                {description}
              </p>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="text-[18px] leading-none text-slate-400" aria-label="Close modal">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled") && element.tabIndex !== -1);
}
