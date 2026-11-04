import { useEffect, useState, type ReactNode } from "react";
import { go } from "../lib/router";
import { sfx } from "../audio/sfx";
import { useProgress, totalStars } from "../lib/progress";
import { isVoiceMuted, setVoiceMuted } from "../audio/voice";

export function Topbar({ back, right }: { back?: string; right?: ReactNode }) {
  const p = useProgress();
  const [muted, setMuted] = useState(isVoiceMuted());
  return (
    <header className="topbar">
      {back ? (
        <button
          className="iconbtn"
          aria-label="Voltar"
          onClick={() => {
            sfx.tap();
            go(back);
          }}
        >
          ←
        </button>
      ) : (
        <a className="brand" href="#/">
          <span className="logo">💃</span> Bailarico
        </a>
      )}
      <div className="row">
        {right}
        {p.name && (
          <span className="pill">
            <span className="avatar">{p.avatar}</span> {p.name} · ⭐ {totalStars(p)}
          </span>
        )}
        <button
          className="iconbtn"
          aria-label={muted ? "Ligar voz" : "Desligar voz"}
          title={muted ? "Ligar voz" : "Desligar voz"}
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
    <span className={`stars ${big ? "big" : ""}`} aria-label={`${n} estrelas`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < n ? "" : "off"}>
          ⭐
        </span>
      ))}
    </span>
  );
}

export function Energy({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="energy" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="fill" style={{ width: `${pct}%` }} />
      <div className="label">{label ?? `Energia ${pct}%`}</div>
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

/** Contagem decrescente 3-2-1 antes de começar. */
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
  return (
    <footer className="foot">
      Feito com 💜 para dançar em família · Sem registo, sem anúncios, sem recolha de dados ·{" "}
      <a href="https://playlabacademy.com" target="_blank" rel="noreferrer">
        PlayLab Academy
      </a>
    </footer>
  );
}
