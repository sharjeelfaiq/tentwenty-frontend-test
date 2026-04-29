import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@lib/utils";

interface FieldFrameProps {
  label?: string;
  hint?: string;
  required?: boolean;
  error?: string;
}

function FieldLabel({ label, hint, required, htmlFor }: FieldFrameProps & { htmlFor?: string }) {
  if (!label) {
    return null;
  }

  return (
    <label htmlFor={htmlFor} className="mb-2 block text-[15px] font-medium text-slate-800">
      {label}
      {required ? " *" : ""}
      {hint ? <span className="ml-1 text-[11px] font-medium text-slate-400">{hint}</span> : null}
    </label>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldFrameProps {}

export function Input({ label, hint, required, error, className, id, ...props }: InputProps) {
  const fallbackId = id ?? props.name;
  const errorId = error && fallbackId ? `${fallbackId}-error` : undefined;

  return (
    <div>
      <FieldLabel label={label} hint={hint} required={required} htmlFor={fallbackId} />
      <input
        id={fallbackId}
        className={cn(
          "h-12 w-full rounded-[10px] border border-[var(--app-border-strong)] bg-white px-4 text-[15px] text-slate-800 placeholder:text-slate-400 focus:border-[var(--app-blue)] focus:outline-none",
          error && "border-red-400 focus:border-red-500",
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...props}
      />
      {error ? (
        <p id={errorId} className="mt-1 text-[12px] text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldFrameProps {
  note?: string;
}

export function Textarea({ label, hint, required, note, error, className, id, ...props }: TextareaProps) {
  const fallbackId = id ?? props.name;
  const errorId = error && fallbackId ? `${fallbackId}-error` : undefined;

  return (
    <div>
      <FieldLabel label={label} hint={hint} required={required} htmlFor={fallbackId} />
      <textarea
        id={fallbackId}
        className={cn(
          "min-h-[104px] w-full resize-none rounded-[8px] border border-[var(--app-border)] bg-white px-4 py-3 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-[var(--app-blue)] focus:outline-none",
          error && "border-red-400 focus:border-red-500",
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...props}
      />
      {error ? (
        <p id={errorId} className="mt-1 text-[12px] text-red-500">
          {error}
        </p>
      ) : null}
      {note ? <p className="mt-1 text-[10px] text-slate-400">{note}</p> : null}
    </div>
  );
}
