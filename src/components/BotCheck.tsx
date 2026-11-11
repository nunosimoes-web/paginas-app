"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void; remove: (id: string) => void;
};
declare global { interface Window { turnstile?: Turnstile } }
export function BotCheck({ sitekey, action, locale, onToken, resetKey = 0 }: {
  sitekey: string; action: string; locale: string; onToken: (token: string) => void; resetKey?: number;
}) {
  const [failed, setFailed] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  function render() {
    if (container.current && window.turnstile && widget.current === null && sitekey) {
      widget.current = window.turnstile.render(container.current, {
        sitekey, action, language: locale === "en" ? "en" : "pt", theme: "auto",
        callback: (token: string) => { setFailed(false); onToken(token); }, "expired-callback": () => onToken(""), "error-callback": () => { setFailed(true); onToken(""); return true; },
      });
    }
  }
  useEffect(() => {
    if (resetKey && widget.current !== null) { window.turnstile?.reset(widget.current); onToken(""); }
  }, [resetKey, onToken]);
  useEffect(() => () => { if (widget.current !== null) window.turnstile?.remove(widget.current); }, []);
  return <>
    <div ref={container} />
    {failed ? <p role="alert" className="text-sm text-clay">{locale === "en" ? "Verification is unavailable. Please reload or contact " : "A validação está indisponível. Recarrega a página ou contacta "}<a href="mailto:hello@mindwink.cognixhub.com">hello@mindwink.cognixhub.com</a>.</p> : null}
    {sitekey ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={render} onError={() => setFailed(true)} /> : null}
  </>;
}
export function BotTrap() {
  return <div aria-hidden="true" className="absolute -left-[10000px] h-0 overflow-hidden">
    <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
  </div>;
}
