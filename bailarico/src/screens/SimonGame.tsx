import { useEffect, useRef, useState } from "react";
import { moveById, type Move } from "../../shared/moves.js";
import { UI_PHRASES, PRAISE, pick } from "../../shared/phrases.js";
import { Dancer } from "../components/Dancer";
import { Footer, Mascot, Topbar } from "../components/ui";
import { speak } from "../audio/voice";
import { sfx } from "../audio/sfx";
import { progress, useProgress } from "../lib/progress";
import { confettiBurst } from "../lib/confetti";
import { go } from "../lib/router";

const POOL: Move[] = ["bounce", "palmas", "bracos-ar", "salto", "giro", "robo-bracos", "anca", "chuto", "apontar"].map(moveById);
type Phase = "intro" | "show" | "input" | "levelup" | "wrong";

export function SimonGame() {
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
    void speak(UI_PHRASES.simonIntro);
  }, []);

  const startLevel = (lvl: number, prev: Move[]) => {
    const opts = POOL.slice(0, Math.min(POOL.length, 4 + Math.floor(lvl / 2)));
    const next = lvl === 1 || prev.length === 0 ? [pick(opts), pick(opts)] : [...prev, pick(opts)];
    setLevel(lvl);
    setSeq(next);
    setPhase("show");
    setInputIdx(0);
    setFlash(null);
    void speak(UI_PHRASES.watch);
    next.forEach((m, i) => {
      later(() => {
        setShowIdx(i);
        setLit(m.id);
        sfx.tick(true);
        void speak(m.name);
      }, 900 + i * 1500);
      later(() => setLit(null), 900 + i * 1500 + 1100);
    });
    later(() => {
      setShowIdx(-1);
      setPhase("input");
      void speak(UI_PHRASES.simonYourTurn);
    }, 900 + next.length * 1500 + 200);
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
        const pr = pick(PRAISE);
        void speak(`${pr} Nível ${level + 1}!`);
        if (level % 3 === 0) confettiBurst();
        later(() => startLevel(level + 1, seq), 1800);
      }
    } else {
      sfx.oops();
      setFlash({ id: m.id, ok: false });
      setPhase("wrong");
      void speak(`Quase! Era ${expected.name}. Vê outra vez.`);
      later(() => {
        setFlash(null);
        startLevel(level, seq);
      }, 2200);
    }
  };

  const shown = showIdx >= 0 ? seq[showIdx] : null;
  const anim = shown ? shown.anim : phase === "input" ? "idle" : "bounce";

  return (
    <div className="app">
      <Topbar back="/" />
      <div className="lesson-layout">
        <div className="stage" style={{ "--stage-c": "#fb923c", "--beat": "0.6s" } as React.CSSProperties}>
          <Dancer move={anim} face="🦉" color="#fb923c" colorDark="#c2410c" beat={0.6} />
          {shown && (
            <div className="banner" style={{ position: "absolute", bottom: 20, fontSize: "1.8rem", color: "#c2410c" }}>
              {shown.emoji} {shown.name}
            </div>
          )}
        </div>
        <div>
          {phase === "intro" ? (
            <>
              <h1 className="title" style={{ color: "#c2410c" }}>
                Segue o Mestre 🧠
              </h1>
              <Mascot emoji="🦉" color="#fb923c">
                Eu, o Mestre Mocho, mostro uma sequência de passos. Depois tocas nos cartões pela mesma ordem. De cada vez acrescento um passo!
              </Mascot>
              <button className="btn big orange mt" onClick={() => { sfx.whoosh(); startLevel(1, []); }}>
                Começar! 🎵
              </button>
              {p.bestSimon > 0 && <p className="tip">O teu recorde: nível {p.bestSimon}</p>}
            </>
          ) : (
            <>
              <div className="row">
                <span className="pill">Nível {level}</span>
                <span className="pill">{seq.length} passos</span>
                <span className="pill">{phase === "show" ? "👀 Olha" : phase === "input" ? "👆 A tua vez" : phase === "levelup" ? "🎉 Boa!" : "🙈 Quase"}</span>
              </div>
              <div className="dots mt">
                {seq.map((m, i) => (
                  <span key={m.id + i} className={phase === "input" ? (i < inputIdx ? "done" : i === inputIdx ? "now" : "") : i === showIdx ? "now" : ""} />
                ))}
              </div>
              <div className="simon-grid mt">
                {options.map((m) => (
                  <button
                    key={m.id}
                    className={`simon-card ${lit === m.id ? "lit" : ""} ${flash?.id === m.id ? (flash.ok ? "good" : "bad") : ""}`}
                    onClick={() => choose(m)}
                    disabled={phase !== "input"}
                  >
                    <span className="emo">{m.emoji}</span>
                    {m.name}
                  </button>
                ))}
              </div>
              <button className="btn ghost mt" onClick={() => go("/")}>
                Sair
              </button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
