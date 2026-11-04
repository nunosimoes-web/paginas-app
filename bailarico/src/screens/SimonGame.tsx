import { useEffect, useRef, useState } from "react";
import { MascotView } from "../components/MascotView";
import { Footer, Mascot, Topbar } from "../components/ui";
import { speak } from "../audio/voice";
import { sfx } from "../audio/sfx";
import { progress, useProgress } from "../lib/progress";
import { confettiBurst } from "../lib/confetti";
import { go } from "../lib/router";
import { useI18n } from "../lib/i18n";
import { mascotImage, moveClip } from "../lib/assets";
import type { Move } from "../../shared/i18n/index.js";
import type { StyleId } from "../../shared/types.js";

const POOL_IDS = ["bounce", "palmas", "bracos-ar", "salto", "giro", "robo-bracos", "anca", "chuto", "apontar"];
type Phase = "intro" | "show" | "input" | "levelup" | "wrong";

/** Escolhe um estilo que tenha clip para o passo, para o mascote o demonstrar em vídeo. */
function clipFor(m: Move): { style: StyleId; url?: string } {
  for (const s of m.styles) {
    const url = moveClip(s, m.id);
    if (url) return { style: s, url };
  }
  return { style: m.styles[0] };
}

export function SimonGame() {
  const { t, f, dict, pick, moveById, styleById } = useI18n();
  const POOL = POOL_IDS.map(moveById);
  const p = useProgress();
  const [phase, setPhase] = useState<Phase>("intro");
  const [level, setLevel] = useState(1);
  const [seq, setSeq] = useState<Move[]>([]);
  const [lit, setLit] = useState<string | null>(null);
  const [showIdx, setShowIdx] = useState(-1);
  const [inputIdx, setInputIdx] = useState(0);
  const [flash, setFlash] = useState<{ id: string; ok: boolean } | null>(null);
  const options = POOL.slice(0, Math.min(POOL.length, 4 + Math.floor(level / 2)));
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    void speak(t.simonIntroVoice);
  }, [t]);

  const startLevel = (lvl: number, prev: Move[]) => {
    const opts = POOL.slice(0, Math.min(POOL.length, 4 + Math.floor(lvl / 2)));
    const next = lvl === 1 || prev.length === 0 ? [pick(opts), pick(opts)] : [...prev, pick(opts)];
    setLevel(lvl);
    setSeq(next);
    setPhase("show");
    setInputIdx(0);
    setFlash(null);
    void speak(t.watch);
    const per = 2600; // tempo por passo (dá para ver o vídeo)
    next.forEach((m, i) => {
      later(() => {
        setShowIdx(i);
        setLit(m.id);
        sfx.tick(true);
        void speak(m.name);
      }, 900 + i * per);
      later(() => setLit(null), 900 + i * per + per - 300);
    });
    later(() => {
      setShowIdx(-1);
      setPhase("input");
      void speak(t.simonYourTurnVoice);
    }, 900 + next.length * per + 200);
  };

  const choose = (m: Move) => {
    if (phase !== "input") return;
    const expected = seq[inputIdx];
    if (m.id === expected.id) {
      sfx.tap();
      setFlash({ id: m.id, ok: true });
      later(() => setFlash(null), 300);
      const n = inputIdx + 1;
      setInputIdx(n);
      if (n >= seq.length) {
        setPhase("levelup");
        sfx.star();
        progress.update((s) => ({ bestSimon: Math.max(s.bestSimon, level) }));
        progress.addEnergy(5 * level);
        void speak(f(t.levelUpVoice, { praise: pick(dict.praise), n: level + 1 }));
        if (level % 3 === 0) confettiBurst();
        later(() => startLevel(level + 1, seq), 1800);
      }
    } else {
      sfx.oops();
      setFlash({ id: m.id, ok: false });
      setPhase("wrong");
      void speak(f(t.almostWas, { name: expected.name }));
      later(() => {
        setFlash(null);
        startLevel(level, seq);
      }, 2200);
    }
  };

  const shown = showIdx >= 0 ? seq[showIdx] : null;
  const shownClip = shown ? clipFor(shown) : null;
  const stageStyle = styleById(shownClip?.style ?? "festa");

  return (
    <div className="app">
      <Topbar back="/" />
      <div className="lesson-layout">
        <div className={`stage ${shownClip?.url ? "video" : ""}`} style={{ "--stage-c": "#fb923c", "--beat": "0.6s" } as React.CSSProperties}>
          <MascotView style={stageStyle} clip={shownClip?.url} poster={mascotImage(stageStyle.id)} anim={shown ? shown.anim : phase === "input" ? "idle" : "bounce"} beat={0.6} face="🦉" />
          {shown && (
            <div className="banner" style={{ position: "absolute", bottom: 20, fontSize: "1.8rem", color: "#c2410c", zIndex: 2 }}>
              {shown.emoji} {shown.name}
            </div>
          )}
        </div>
        <div>
          {phase === "intro" ? (
            <>
              <h1 className="title" style={{ color: "#c2410c" }}>
                {t.simonTitle} 🧠
              </h1>
              <Mascot emoji="🦉" color="#fb923c">
                {t.simonIntro}
              </Mascot>
              <button className="btn big orange mt" onClick={() => { sfx.whoosh(); startLevel(1, []); }}>
                {t.start} 🎵
              </button>
              {p.bestSimon > 0 && (
                <p className="tip">
                  {t.record}: {t.level.toLowerCase()} {p.bestSimon}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="row">
                <span className="pill">
                  {t.level} {level}
                </span>
                <span className="pill">
                  {seq.length} {t.steps}
                </span>
                <span className="pill">{phase === "show" ? t.look : phase === "input" ? `👆 ${t.yourTurn}` : phase === "levelup" ? t.good : t.almost}</span>
              </div>
              <div className="dots mt">
                {seq.map((m, i) => (
                  <span key={m.id + i} className={phase === "input" ? (i < inputIdx ? "done" : i === inputIdx ? "now" : "") : i === showIdx ? "now" : ""} />
                ))}
              </div>
              <div className="simon-grid mt">
                {options.map((m) => (
                  <button key={m.id} className={`simon-card ${lit === m.id ? "lit" : ""} ${flash?.id === m.id ? (flash.ok ? "good" : "bad") : ""}`} onClick={() => choose(m)} disabled={phase !== "input"}>
                    <span className="emo">{m.emoji}</span>
                    {m.name}
                  </button>
                ))}
              </div>
              <button className="btn ghost mt" onClick={() => go("/")}>
                {t.exit}
              </button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
