"use client";

import { useState } from "react";
import { REGIONS, type RegionId, pickRegion } from "@/lib/body-regions";

type Props = {
  locale: string;
  labels: {
    pickZone: string;
    insightLabel: string;
    causesLabel: string;
    solutionsLabel: string;
  };
};

export function BodyMap({ locale, labels }: Props) {
  const [active, setActive] = useState<RegionId>("chest");
  const region = pickRegion(active);
  const en = locale === "en";

  const label = en ? region.labelEN : region.labelPT;
  const insight = en ? region.insightEN : region.insightPT;
  const causes = en ? region.causesEN : region.causesPT;
  const solution = en ? region.solutionEN : region.solutionPT;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="relative mx-auto aspect-[1/2.4] w-full max-w-[280px] rounded-3xl bg-paper">
        <svg
          viewBox="0 0 260 620"
          role="img"
          aria-label={labels.pickZone}
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="bodyFill" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#f3ece0" />
              <stop offset="100%" stopColor="#e7e0d3" />
            </linearGradient>
          </defs>
          <circle cx="130" cy="64" r="42" fill="url(#bodyFill)" />
          <path
            d="M81 145c8-33 30-51 49-51s41 18 49 51l12 85c3 21-4 42-18 58l-14 16 9 86 30 153c3 17-8 34-25 37-15 3-30-6-35-21l-39-134-38 134c-5 15-20 24-35 21-17-3-28-20-25-37l30-153 9-86-14-16c-14-16-21-37-18-58l12-85Z"
            fill="url(#bodyFill)"
          />
          <path
            d="M76 163 36 275c-7 20-5 42 6 60l41 67c8 13 25 17 38 10 13-8 18-25 10-38l-35-59 30-89"
            fill="none"
            stroke="#e7e0d3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="35"
          />
          <path
            d="M184 163 224 275c7 20 5 42-6 60l-41 67c-8 13-25 17-38 10-13-8-18-25-10-38l35-59-30-89"
            fill="none"
            stroke="#e7e0d3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="35"
          />
        </svg>
        {REGIONS.map((r) => {
          const isActive = active === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setActive(r.id)}
              aria-label={en ? r.labelEN : r.labelPT}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-line px-2 py-0.5 text-[10px] tracking-wide transition ${
                isActive
                  ? "bg-accent-strong text-paper"
                  : "bg-surface text-muted hover:bg-accent-soft hover:text-ink"
              }`}
              style={{ left: `${r.x}%`, top: `${r.y}%` }}
            >
              {en ? r.labelEN : r.labelPT}
            </button>
          );
        })}
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-xs tracking-wide text-muted uppercase">
            {labels.pickZone}
          </p>
          <h3 className="mt-1 font-serif text-2xl text-ink">{label}</h3>
          <p className="mt-2 text-sm text-muted">{insight}</p>
        </div>

        <div>
          <p className="text-xs tracking-wide text-muted uppercase">
            {labels.causesLabel}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {causes.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <span
                  aria-hidden
                  className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-strong"
                />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs tracking-wide text-muted uppercase">
            {labels.solutionsLabel}
          </p>
          <p className="mt-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink">
            {solution}
          </p>
        </div>
      </div>
    </div>
  );
}
