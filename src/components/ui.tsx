import type { ReactNode } from "react";

// Pequeno conjunto de primitivas visuais partilhadas — tom calmo e consistente.

export const styles = {
  card: "rounded-2xl border border-line bg-surface shadow-[0_1px_3px_rgba(47,43,38,0.05)]",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-accent-strong px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
  btnGhost:
    "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-accent-soft disabled:opacity-50",
  input:
    "w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-ink outline-none transition placeholder:text-muted/60 focus:border-accent",
  label: "block text-sm font-medium text-ink",
};

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return <Tag className={`${styles.card} ${className}`}>{children}</Tag>;
}

export function PageHeader({
  title,
  subtitle,
  kicker,
}: {
  title: string;
  subtitle?: string;
  kicker?: string;
}) {
  return (
    <header className="space-y-1.5">
      {kicker ? (
        <p className="font-serif text-sm tracking-wide text-accent-strong">
          {kicker}
        </p>
      ) : null}
      <h1 className="font-serif text-2xl leading-snug text-ink sm:text-3xl">
        {title}
      </h1>
      {subtitle ? <p className="text-muted">{subtitle}</p> : null}
    </header>
  );
}
