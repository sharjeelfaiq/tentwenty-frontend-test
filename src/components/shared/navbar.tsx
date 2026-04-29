"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { logout } from "@features/auth/services/auth-service";

interface NavbarProps {
  sectionLabel: string;
  userName: string;
}

export function Navbar({ sectionLabel, userName }: NavbarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="border-b border-black/10 bg-white">
      <div className="flex h-[72px] w-full items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <span className="text-[26px] font-bold tracking-[-0.04em] text-slate-900">ticktock</span>
          <span className="pt-1 text-[14px] text-slate-700">{sectionLabel}</span>
        </div>
        <div className="relative" ref={containerRef}>
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={isOpen}
            aria-haspopup="menu"
            aria-controls={menuId}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-[18px] text-slate-500 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[var(--app-blue)] focus-visible:ring-offset-2"
            onClick={() => {
              setIsOpen((open) => !open);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsOpen(true);
              }
            }}
          >
            <span>{userName}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {isOpen ? (
            <div
              id={menuId}
              role="menu"
              aria-label="User menu"
              className="absolute right-0 top-full z-20 mt-2 min-w-[180px] rounded-xl border border-black/10 bg-white p-1 shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
            >
              <button
                type="button"
                role="menuitem"
                className="block w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-[var(--app-blue)] outline-none transition hover:bg-slate-100 focus-visible:bg-slate-100"
                onClick={async () => {
                  setIsOpen(false);
                  await logout();
                  router.replace("/login");
                  router.refresh();
                }}
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
