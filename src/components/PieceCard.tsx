import type { ReactNode } from "react";
import { Card } from "@/components/ui";

/** Apresentação de uma peça de conteúdo — o centro calmo da experiência. */
export function PieceCard({
  typeLabel,
  themeName,
  themeLabel,
  body,
  footer,
  compact = false,
}: {
  typeLabel: string;
  themeName?: string | null;
  themeLabel: string;
  body: string;
  footer?: ReactNode;
  compact?: boolean;
}) {
  return (
    <Card className={compact ? "p-5" : "p-7 sm:p-9"}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium tracking-wide text-accent-strong uppercase">
          {typeLabel}
        </span>
        {themeName ? (
          <span className="text-xs text-muted">
            {themeLabel}: {themeName}
          </span>
        ) : null}
      </div>
      <p
        className={`mt-4 font-serif text-ink ${
          compact ? "text-lg leading-relaxed" : "text-xl leading-relaxed sm:text-2xl sm:leading-relaxed"
        }`}
      >
        {body}
      </p>
      {footer ? <div className="mt-6">{footer}</div> : null}
    </Card>
  );
}
