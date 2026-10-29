"use client";

import Script from "next/script";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CONSENT_KEY, consentSignals, eligiblePublicLocation, readConsent } from "@/lib/marketing-consent";
import { styles } from "./ui";

declare global { interface Window { dataLayer?: unknown[] } }

function snapshot() {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}
function subscribe(callback: () => void) {
  const changed = (event: StorageEvent) => {
    if (event.key === CONSENT_KEY || event.key === null) { window.location.reload(); callback(); }
  };
  window.addEventListener("storage", changed);
  return () => window.removeEventListener("storage", changed);
}

// Mounted only on the anonymous landing page. No container ID means no tags.
export function MarketingConsent({ containerId }: { containerId: string | null }) {
  const t = useTranslations("cookies");
  const locale = useLocale();
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const consent = readConsent(raw);
  const dialog = useRef<HTMLDialogElement>(null);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [error, setError] = useState(false);
  const [loadTags, setLoadTags] = useState(false);

  useEffect(() => {
    if (location.hash === "#cookie-preferences") dialog.current?.showModal();
  }, []);

  useEffect(() => {
    const stored = readConsent(raw);
    if (!containerId || !stored || (!stored.analytics && !stored.marketing) ||
      !eligiblePublicLocation(location.pathname, location.search, location.hash)) return;
    window.dataLayer = window.dataLayer || [];
    const gtag: (...args: unknown[]) => void = function () {
      // Google's documented gtag queue requires an Arguments object.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    gtag("consent", "default", consentSignals(null));
    gtag("consent", "update", consentSignals(stored));
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    // A full document navigation prevents third-party listeners from surviving
    // a Next.js transition into a journal, check-in or account form.
    const leave = (event: MouseEvent) => {
      const a = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(a instanceof HTMLAnchorElement) || a.target === "_blank" || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const next = new URL(a.href, location.href);
      if (next.origin === location.origin && !eligiblePublicLocation(next.pathname, next.search, next.hash)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        location.assign(next.href);
      }
    };
    document.addEventListener("click", leave, true);
    // Schedule the render after consent commands and navigation protection exist.
    const ready = window.setTimeout(() => setLoadTags(true), 0);
    return () => { clearTimeout(ready); document.removeEventListener("click", leave, true); };
  }, [containerId, raw]);

  function open() {
    setAnalytics(consent?.analytics ?? false);
    setMarketing(consent?.marketing ?? false);
    setError(false);
    dialog.current?.showModal();
  }

  function save(a: boolean, m: boolean) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: 1, analytics: !!containerId && a, marketing: !!containerId && m, savedAt: Date.now() }));
      // Reload also stops any previously loaded tags after withdrawal.
      location.replace(location.pathname);
    } catch { setError(true); }
  }

  return (
    <>
      {loadTags && containerId ? (
        <Script id="mindwink-gtm" src={`https://www.googletagmanager.com/gtm.js?id=${containerId}`} strategy="afterInteractive" referrerPolicy="no-referrer"
          onLoad={() => window.dataLayer?.push({ event: "mw_public_page_view", product: "mindwink", locale, page_path: location.pathname, page_location: location.origin + location.pathname })} />
      ) : null}
      <button type="button" onClick={open} className="fixed bottom-3 left-3 z-40 rounded-full border border-line bg-paper px-3 py-2 text-xs text-muted shadow-sm hover:text-ink">{t("preferences")}</button>
      {containerId && !consent ? (
        <section aria-label={t("title")} className="fixed inset-x-3 bottom-16 z-40 mx-auto max-w-2xl rounded-2xl border border-line bg-paper p-5 shadow-lg">
          <p className="font-serif text-lg">{t("title")}</p><p className="mt-2 text-sm text-muted">{t("description")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={styles.btnGhost} onClick={() => save(false, false)}>{t("essentialOnly")}</button>
            <button type="button" className={styles.btnGhost} onClick={() => save(true, true)}>{t("acceptAll")}</button>
            <button type="button" className={styles.btnGhost} onClick={open}>{t("customize")}</button>
          </div>
        </section>
      ) : null}
      <dialog ref={dialog} aria-labelledby="cookie-title" className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line bg-paper p-6 text-ink shadow-xl backdrop:bg-black/30">
        <h2 id="cookie-title" className="font-serif text-2xl">{t("title")}</h2>
        <p className="mt-3 text-sm text-muted">{containerId ? t("description") : t("inactive")}</p>
        <p className="mt-4 text-sm">{t("essential")}</p>
        {containerId ? <div className="mt-4 space-y-3">
          <label className="flex items-start gap-3"><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} className="mt-1" /><span>{t("analytics")}</span></label>
          <label className="flex items-start gap-3"><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} className="mt-1" /><span>{t("marketing")}</span></label>
        </div> : null}
        <p className="mt-4 text-sm text-muted">{t("privateExcluded")}</p>
        <a href={locale === "en" ? "/en/privacy" : "/privacy"} className="mt-3 inline-block text-sm underline">{t("privacy")}</a>
        {error ? <p role="alert" className="mt-3 text-sm text-clay">{t("error")}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" className={styles.btnGhost} onClick={() => save(false, false)}>{t("essentialOnly")}</button>
          {containerId ? <button type="button" className={styles.btnPrimary} onClick={() => save(analytics, marketing)}>{t("save")}</button> : null}
          <button type="button" className={styles.btnGhost} onClick={() => dialog.current?.close()}>{t("close")}</button>
        </div>
      </dialog>
    </>
  );
}
