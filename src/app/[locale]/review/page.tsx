import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PublicHeader } from "@/components/PublicHeader";
import { prisma } from "@/lib/prisma";
import { pickText } from "@/lib/content";

// Lê a base de dados — nunca prerenderizar estaticamente (não há BD no build).
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("review");
  // Página de revisão interna — não indexar.
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function ReviewPage({
  searchParams,
}: PageProps<"/[locale]/review">) {
  // Acesso só por chave — partilhada apenas com os revisores escolhidos.
  const sp = await searchParams;
  const key = process.env.REVIEW_KEY;
  if (!key || sp.k !== key) notFound();

  const t = await getTranslations("review");
  const pt = await getTranslations("pieceType");
  const locale = await getLocale();

  const [themes, pieces] = await Promise.all([
    prisma.theme.findMany({ orderBy: { slug: "asc" } }),
    prisma.contentPiece.findMany({ orderBy: [{ day: "asc" }] }),
  ]);

  const needsReview = pieces.filter((p) => p.needsReview).length;

  const groups = themes.map((th) => ({
    slug: th.slug,
    name: pickText(th.nameI18n, locale),
    pieces: pieces.filter((p) => p.themeId === th.id),
  }));
  const orphan = pieces.filter((p) => !p.themeId);
  if (orphan.length) {
    groups.push({ slug: "_none", name: t("noTheme"), pieces: orphan });
  }
  const visibleGroups = groups.filter((g) => g.pieces.length > 0);

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:py-16">
        <header className="space-y-5">
          <h1 className="font-serif text-3xl text-ink sm:text-4xl">
            {t("title")}
          </h1>
          <p className="max-w-2xl leading-relaxed text-muted">{t("intro")}</p>

          <dl className="flex flex-wrap gap-x-8 gap-y-2">
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">
                {t("statPieces")}
              </dt>
              <dd className="font-serif text-2xl text-ink">{pieces.length}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">
                {t("statThemes")}
              </dt>
              <dd className="font-serif text-2xl text-ink">{themes.length}</dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-muted uppercase">
                {t("statNeedsReview")}
              </dt>
              <dd className="font-serif text-2xl text-clay">{needsReview}</dd>
            </div>
          </dl>

          <a
            href={`/api/review/export?k=${encodeURIComponent(key)}`}
            className="inline-flex items-center gap-2 rounded-full bg-accent-strong px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent"
          >
            ↓ {t("download")}
          </a>
        </header>

        {/* Navegação por tema */}
        <nav aria-label={t("themeNav")} className="mt-10 border-t border-line pt-6">
          <p className="text-xs tracking-wide text-muted uppercase">
            {t("themeNav")}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {visibleGroups.map((g) => (
              <li key={g.slug}>
                <a
                  href={`#theme-${g.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-muted transition hover:border-accent hover:text-ink"
                >
                  {g.name}
                  <span className="text-xs text-muted/60">{g.pieces.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Peças agrupadas por tema */}
        <div className="mt-12 space-y-14">
          {visibleGroups.map((g) => (
            <section key={g.slug} id={`theme-${g.slug}`} className="scroll-mt-6">
              <h2 className="flex items-baseline gap-2 font-serif text-2xl text-ink">
                {g.name}
                <span className="text-sm font-normal text-muted">
                  {g.pieces.length}
                </span>
              </h2>

              <div className="mt-5 space-y-4">
                {g.pieces.map((p) => (
                  <article
                    key={p.id}
                    className="rounded-2xl border border-line bg-surface p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[11px] tracking-[0.08em] text-muted uppercase">
                      <span className="font-serif text-sm text-accent-strong normal-case">
                        {t("dayLabel")} {p.day}
                      </span>
                      <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-accent-strong">
                        {pt(p.type)}
                      </span>
                      <span aria-hidden>·</span>
                      <span>
                        {t("depthLabel")} {p.depth}
                      </span>
                      {p.needsReview ? (
                        <span className="rounded-full border border-clay/30 bg-clay/5 px-2.5 py-0.5 text-clay">
                          {t("needsReviewBadge")}
                        </span>
                      ) : null}
                      <span className="ml-auto font-mono text-[10px] text-muted/50 normal-case">
                        {p.externalId}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-muted">
                      <span className="font-medium">{t("principleLabel")}:</span>{" "}
                      {p.principle}
                    </p>

                    <p className="mt-3 font-serif leading-relaxed text-ink">
                      {pickText(p.bodyI18n, "pt-PT")}
                    </p>
                    <p className="mt-2 border-t border-line/60 pt-2 font-serif text-sm leading-relaxed text-muted">
                      {pickText(p.bodyI18n, "en")}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 border-t border-line pt-6">
          <Link
            href="/"
            className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            ← {t("backHome")}
          </Link>
        </div>
      </main>
    </div>
  );
}
