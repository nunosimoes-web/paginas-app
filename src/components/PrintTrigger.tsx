"use client";

type Props = { label: string; className?: string };

export function PrintTrigger({ label, className }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.print()}
    >
      {label}
    </button>
  );
}
