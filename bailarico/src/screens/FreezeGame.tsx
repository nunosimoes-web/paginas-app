import { useEffect, useMemo, useRef, useState } from "react";
import type { StyleId } from "../../shared/types.js";
import { clipMovesForStyle } from "../../shared/catalog.js";
import { MascotView } from "../components/MascotView";
import { Footer, Mascot, Topbar } from "../components/ui";
import { useMeter } from "../components/useMeter";
import { speak, warmup } from "../audio/voice";
import { sfx } from "../audio/sfx";
import { BeatEngine } from "../audio/beat";
import { progress, useProgress } from "../lib/progress";
import { confettiBurst } from "../lib/confetti";
import { go } from "../lib/router";
import { mascotImage, moveClip, styleMusic } from "../lib/assets";
import { useI18n } from "../lib/i18n";

/**
 * Estátua: dança enquanto há música; quando para, todos ficam quietos.
 * Sem câmara é um jogo de honra (ótimo em grupo com um adulto). Com câmara, a app vê se alguém se mexeu.
 */
type Phase = "intro" | "dance" | "freeze" | "result" | "over";
const ROUNDS = 8;

export function FreezeGame() {
  const { t, f, dict, pick, styles, styleById } = useI18n();
  const [styleId, setStyleId] = useState<StyleId>("disco");
  const style = styleById(styleId);
  const pool = useMemo(() => clipMovesForStyle(styleId).filter((m) => m !== "estatua"), [styleId]);
  const meter = useMeter();
  const p = useProgress();
  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState(0);
  const [moveId, setMoveId] = useState(pool[0]);
  const [msg, setMsg] = useState("");
  const [count, setCount] = useState(0);
  const caught = useRef(false);
  const moved = useRef(0);
  const timers = useRef<number[]>([]);
  const audio = useRef<HTMLAudioElement | null>(null);
  const synth = useRef<BeatEngine | null>(null);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      audio.current?.pause();
      synth.current?.stop();
    },
    [],
  );
  useEffect(() => {
    warmup([t.dance, t.freeze, ...dict.freezeOk, ...dict.freezeFail]);
    void speak(t.freezeIntroVoice);
  }, [t, dict]);

  // com câmara: mexer durante a estátua conta
  useEffect(() => {
    if (phase !== "freeze" || meter.camera !== "on") return;
    if (meter.value > 0.22) moved.current++;
    if (moved.current >= 3) caught.current = true;
  }, [meter.value, phase, meter.camera]);

  const music = (on: boolean) => {
    const track = styleMusic(styleId);
    if (track) {
      const a = (audio.current ??= new Audio());
      if (on) {
        if (!a.src.endsWith(track)) a.src = track;
        a.loop = true;
        void a.play().catch(() => undefined);
      } else a.pause();
    } else {
      const e = (synth.current ??= new BeatEngine(style));
      e.setStyle(style);
      if (on) e.start();
      else e.stop();
    }
  };

  const dance = (r: number) => {
    setPhase("dance");
    setRound(r);
    caught.current = false;
    moved.current = 0;
    setMoveId(pick(pool));
    music(true);
    void speak(t.dance);
    later(freeze, 4000 + Math.random() * 4500);
  };

  const freeze = () => {
    music(false);
    sfx.whistle();
    setPhase("freeze");
    void speak(t.freeze);
    setCount(3);
    later(() => setCount(2), 1000);
    later(() => setCount(1), 2000);
    later(result, 3000);
  };

  const result = () => {
    setPhase("result");
    const ok = !caught.current;
    const m = ok ? pick(dict.freezeOk) : pick(dict.freezeFail);
    setMsg(m);
    void speak(m);
    if (ok) {
      sfx.star();
      progress.addEnergy(10);
    } else sfx.oops();
    const next = r0() + 1;
    if (next >= ROUNDS) later(win, 1600);
    else later(() => dance(next), 1800);
  };
  const roundRef = useRef(0);
  roundRef.current = round;
  const r0 = () => roundRef.current;

  const win = () => {
    setPhase("over");
    confettiBurst();
    sfx.fanfare();
    void speak(t.championVoice);
    progress.update((s) => ({ bestFreeze: Math.max(s.bestFreeze, ROUNDS) }));
    progress.addStars(2);
  };

  const frozen = phase === "freeze" || phase === "result";
  const clip = moveClip(styleId, phase === "intro" || phase === "over" ? "estatua" : moveId) ?? moveClip(styleId, pool[0]);

  return (
    <div className="app">
      <Topbar back="/" />
      <div className="lesson-layout">
        <div className={`stage video ${phase === "dance" ? "pulse" : ""}`} style={{ "--stage-c": frozen ? "#60a5fa" : style.colors.main } as React.CSSProperties}>
          <MascotView style={style} clip={clip} poster={mascotImage(styleId)} frozen={frozen} mirror />
          {phase === "freeze" && <div className="big-count">{count}</div>}
          <video ref={meter.videoRef} className={`cam ${meter.camera === "on" ? "" : "hidden"}`} playsInline muted />
        </div>
        <div>
          {phase === "intro" && (
            <>
              <h1 className="title" style={{ color: "#1d4ed8" }}>
                {t.freezeTitle} 🗿
              </h1>
              <Mascot emoji={styleById("disco").emoji} image={mascotImage("disco")} color={styleById("disco").colors.main}>
                {t.freezeHonor}
              </Mascot>
              <p className="subtitle mt">{t.music}</p>
              <div className="chips">
                {styles.map((s) => (
                  <button key={s.id} className="chip" style={s.id === styleId ? { background: s.colors.main, color: "#fff" } : undefined} onClick={() => setStyleId(s.id)}>
                    {s.emoji} {s.name}
                  </button>
                ))}
              </div>
              <button className="btn huge blue mt" onClick={() => { sfx.whoosh(); dance(0); }}>
                ▶️ {t.play}
              </button>
              {meter.cameraSupported && (
                <p className="tip">
                  <button className="btn ghost" onClick={meter.toggleCamera}>
                    {meter.camera === "on" ? t.cameraOn : t.cameraOff}
                  </button>
                  {meter.camera === "on" ? t.camFreezeInfo : ""}
                </p>
              )}
            </>
          )}

          {(phase === "dance" || phase === "freeze" || phase === "result") && (
            <>
              <span className="pill">
                {t.round} {round + 1}/{ROUNDS}
              </span>
              <div className={`banner ${frozen ? "freeze" : "dance"} mt`} key={phase}>
                {phase === "dance" ? `${t.dance} 💃` : phase === "freeze" ? `${t.freeze} 🗿` : msg}
              </div>
            </>
          )}

          {phase === "over" && (
            <div className="center">
              <h1 className="title rainbow">{t.champion}</h1>
              <p className="subtitle">{f(t.held, { n: Math.max(p.bestFreeze, ROUNDS) })}</p>
              <div className="row center">
                <button className="btn big blue" onClick={() => setPhase("intro")}>
                  {t.again}
                </button>
                <button className="btn white" onClick={() => go("/")}>
                  {t.home}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
