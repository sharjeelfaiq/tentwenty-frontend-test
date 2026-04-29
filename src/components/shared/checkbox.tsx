import type { InputHTMLAttributes } from "react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Checkbox({ label, ...props }: CheckboxProps) {
  return (
    <label className="inline-flex items-center gap-2 text-[13px] text-slate-500">
      <input
        type="checkbox"
        className="h-[18px] w-[18px] rounded-[5px] border border-[var(--app-border)] accent-[var(--app-blue)]"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
