import { useEffect, useState, type ReactNode } from "react";
import { go } from "../lib/router";
import { sfx } from "../audio/sfx";
import { useProgress, totalStars } from "../lib/progress";
import { isVoiceMuted, setVoiceMuted, stopVoice } from "../audio/voice";
import { useI18n } from "../lib/i18n";
import { DICTS } from "../../shared/i18n/index.js";
import { LogoMark, Wordmark } from "./Logo";

export function Topbar({ back, right }: { back?: string; right?: ReactNode }) {
  const p = useProgress();
  const { t, locale, locales, setLocale } = useI18n();
  const [muted, setMuted] = useState(isVoiceMuted());
  const nextLocale = locales[(locales.indexOf(locale) + 1) % locales.length];
  return (
    <header className="topbar">
      {back ? (
        <button
          className="iconbtn"
          aria-label={t.back}
          onClick={() => {
            sfx.tap();
            go(back);
          }}
        >
          ←
        </button>
      ) : (
        <a className="brand" href="#/" aria-label={t.appName}>
          <LogoMark size={38} /> <Wordmark />
        </a>
      )}
      <div className="row">
        {right}
        <a className="iconbtn adults" href="#/pais" aria-label={t.parents.title} title={t.parents.title}>
          ℹ️
        </a>
        {p.name && (
          <span className="pill">
            <span className="avatar">{p.avatar}</span> {p.name} · ⭐ {totalStars(p)}
          </span>
        )}
        <button
          className="iconbtn lang"
          aria-label={`${t.language}: ${DICTS[nextLocale].name}`}
          title={DICTS[nextLocale].name}
          onClick={() => {
            stopVoice();
            sfx.tap();
            setLocale(nextLocale);
          }}
        >
          {DICTS[locale].flag}
        </button>
        <button
          className="iconbtn"
          aria-label={muted ? t.voiceOff : t.voiceOn}
          title={muted ? t.voiceOff : t.voiceOn}
          onClick={() => {
            setVoiceMuted(!muted);
            setMuted(!muted);
          }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>
    </header>
  );
}

export function Stars({ n, big }: { n: number; big?: boolean }) {
  return (
    <span className={`stars ${big ? "big" : ""}`} aria-label={`${n} ★`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? "" : "off"}>
          ⭐
        </span>
      ))}
    </span>
  );
}

export function Energy({ value, label }: { value: number; label?: string }) {
  const { t } = useI18n();
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="energy" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="fill" style={{ width: `${pct}%` }} />
      <div className="label">{label ?? `${t.energy} ${pct}%`}</div>
    </div>
  );
}

export function Mascot({ emoji, image, color, children }: { emoji: string; image?: string; color: string; children: ReactNode }) {
  return (
    <div className="mascot" style={{ "--c": color } as React.CSSProperties}>
      <div className="face">{image ? <img src={image} alt="" /> : emoji}</div>
      <div className="bubble">{children}</div>
    </div>
  );
}

export function Loading({ text }: { text: string }) {
  return (
    <div className="loading" role="status">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
      {text}
    </div>
  );
}

export function CountDots({ beats, current }: { beats: number; current: number }) {
  return (
    <div className="count" aria-hidden="true">
      {Array.from({ length: beats }, (_, i) => (
        <span key={i} className={i === current ? "on" : ""}>
          {i + 1}
        </span>
      ))}
    </div>
  );
}

export function useCountdown(active: boolean, onDone: () => void) {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (!active) return;
    setN(3);
    let i = 3;
    sfx.tick(true);
    const t = window.setInterval(() => {
      i--;
      if (i <= 0) {
        window.clearInterval(t);
        setN(0);
        onDone();
      } else {
        sfx.tick();
        setN(i);
      }
    }, 800);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  return n;
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="foot">
      {t.footer} ·{" "}
      <a href="https://playlabacademy.com" target="_blank" rel="noreferrer">
        PlayLab Academy
      </a>
    </footer>
  );
}
