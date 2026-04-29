"use client";

import { useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { cn } from "@lib/utils";

interface DropdownOption<T extends string> {
  label: string;
  value: T;
}

interface SelectDropdownProps<T extends string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  error?: string;
  id?: string;
}

interface DropdownChevronIconProps {
  className?: string;
}

export function DropdownChevronIcon({ className }: DropdownChevronIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={cn("h-5 w-5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="M4.5 7.25 10 12.25 15.5 7.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SelectDropdown<T extends string>({
  value,
  options,
  onChange,
  className,
  error,
  id,
}: SelectDropdownProps<T>) {
  return (
    <div className={cn("relative", className)}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={cn(
          "h-11 w-full appearance-none rounded-[10px] border border-[var(--app-border-strong)] bg-white px-4 pr-10 text-[15px] text-slate-500 focus:border-[var(--app-blue)] focus:outline-none",
          error && "border-red-400 focus:border-red-500",
        )}
        aria-invalid={Boolean(error)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
        <DropdownChevronIcon />
      </span>
      {error ? <p className="mt-1 text-[12px] text-red-500">{error}</p> : null}
    </div>
  );
}

interface ActionDropdownProps {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

interface ActionItemProps {
  label: string;
  tone?: "default" | "danger";
  onClick: () => void;
}

export function ActionDropdown({ open, onToggle, children }: ActionDropdownProps) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement | null>(null);

  function focusFirstMenuItem() {
    window.setTimeout(() => {
      menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    }, 0);
  }

  function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (!open) {
        onToggle();
      }

      focusFirstMenuItem();
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
    const currentIndex = items.findIndex((item) => item === document.activeElement);

    if (event.key === "Escape") {
      event.preventDefault();
      onToggle();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    }
  }

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        onClick={onToggle}
        onKeyDown={handleButtonKeyDown}
        className="flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-slate-500 hover:bg-slate-100"
        aria-label="Open row actions"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
      >
        ⋯
      </button>
      {open ? (
        <div
          id={menuId}
          ref={menuRef}
          role="menu"
          className="absolute right-8 top-0 z-10 min-w-[74px] rounded-[10px] border border-[var(--app-border)] bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
          onKeyDown={handleMenuKeyDown}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function ActionDropdownItem({ label, tone = "default", onClick }: ActionItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "block w-full px-3 py-1.5 text-left text-[12px]",
        tone === "danger" ? "text-red-500" : "text-slate-700",
      )}
    >
      {label}
    </button>
  );
}
