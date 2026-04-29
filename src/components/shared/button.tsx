import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  children: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-[var(--app-blue)] text-white hover:bg-[var(--app-blue-dark)]",
  secondary: "border-[var(--app-border)] bg-white text-[var(--app-foreground)] hover:bg-slate-50",
  ghost: "border-transparent bg-transparent text-[var(--app-blue)] hover:bg-[var(--app-blue-soft)]",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-[8px] border px-4 text-sm font-medium transition-colors focus-visible:app-focus-ring disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
