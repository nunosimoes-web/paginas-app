import { useEffect, useRef, useState } from "react";
import type { StyleId } from "../../shared/types.js";
import { MascotView } from "../components/MascotView";
import { Energy, Footer, Mascot, Topbar } from "../components/ui";
import { useMeter } from "../components/useMeter";
import { useBeat, useBeatEngine } from "../audio/useBeat";
import { speak } from "../audio/voice";
import { sfx } from "../audio/sfx";
import { progress, useProgress } from "../lib/progress";
import { confettiBurst } from "../lib/confetti";
import { go } from "../lib/router";
import { mascotImage, moveClip, styleMusic } from "../lib/assets";
import { useI18n } from "../lib/i18n";
import type { Move } from "../../shared/i18n/index.js";

type Phase = "intro" | "dance" | "freeze" | "result" | "over";
const ROUNDS_TO_WIN = 10;

export function FreezeGame() {
  const { t, f, dict, pick, styles, styleById, movesForStyle } = useI18n();
  const [styleId, setStyleId] = useState<StyleId>("disco");
  const style = styleById(styleId);
  const engine = useBeatEngine(style);
  const meter = useMeter();
  const p = useProgress();
  const dancePool = movesForStyle(styleId).filter((m) => m.id !== "estatua");

  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState(0);
  const [lives, setLives] = useState(3);
  const [move, setMove] = useState<Move>(dancePool[0]);
  const [msg, setMsg] = useState("");
  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;
  const caught = useRef(false);
  const timers = useRef<number[]>([]);
  const movedFrames = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      audio.current?.pause();
    },
    [],
  );
  useEffect(() => {
    void speak(t.freezeIntroVoice);
  }, [t]);

  useBeat(engine, (e) => {
    if (phaseRef.current === "dance" && e.beat === 0 && e.bar % 2 === 0) setMove(pick(dancePool));
  });

  useEffect(() => {
    if (phase !== "freeze") return;
    if (meter.camera === "on" && meter.value > 0.22) movedFrames.current++;
    if (movedFrames.current >= 3) caught.current = true;
  }, [meter.value, phase, meter.camera]);

  const music = (on: boolean) => {
    const track = styleMusic(styleId);
    if (track) {
      const a = (audio.current ??= new Audio());
      if (on) {
        if (a.src !== new URL(track, location.href).href) a.src = track;
        a.loop = true;
        void a.play().catch(() => undefined);
      } else a.pause();
      engine.setLayers({ drums: false, music: false });
    } else engine.setLayers({ drums: true, music: true });
    if (on) engine.start();
    else engine.stop();
  };

  const startDance = (r: number) => {
    setPhase("dance");
    setRound(r);
    caught.current = false;
    movedFrames.current = 0;
    setMove(pick(dancePool));
    music(true);
    void speak(t.dance);
    const dur = 4000 + Math.random() * 5000 - Math.min(2500, r * 250);
    later(freeze, Math.max(2500, dur));
  };

  const freeze = () => {
    music(false);
    sfx.whistle();
    setPhase("freeze");
    void speak(t.freeze);
    later(result, 3200);
  };

  const result = () => {
    setPhase("result");
    if (!caught.current) {
      sfx.star();
      const m = pick(dict.freezeOk);
      setMsg(m);
      void speak(m);
      progress.addEnergy(10);
      const next = round + 1;
      if (next >= ROUNDS_TO_WIN) later(() => win(next), 1500);
      else later(() => startDance(next), 1800);
    } else {
      sfx.oops();
      const m = pick(dict.freezeFail);
      setMsg(m);
      void speak(m);
      const l = lives - 1;
      setLives(l);
      if (l <= 0) later(() => over(round), 1800);
      else later(() => startDance(round + 1), 1800);
    }
  };

  const win = (rounds: number) => {
    setPhase("over");
    setMsg(t.champion);
    confettiBurst();
    sfx.fanfare();
    void speak(t.championVoice);
    progress.update((s) => ({ bestFreeze: Math.max(s.bestFreeze, rounds) }));
  };
  const over = (rounds: number) => {
    setPhase("over");
    setMsg(f(t.held, { n: rounds }));
    progress.update((s) => ({ bestFreeze: Math.max(s.bestFreeze, rounds) }));
    void speak(t.heldVoice);
  };

  const tapButton = () => {
    if (phase === "freeze") caught.current = true;
    else if (phase === "dance") meter.tap();
  };
  const reset = () => {
    setLives(3);
    setRound(0);
    setPhase("intro");
  };

  const frozen = phase === "freeze";
  const clip = phase === "intro" || phase === "over" ? moveClip(styleId, "estatua") ?? moveClip(styleId, dancePool[0].id) : frozen ? moveClip(styleId, "estatua") ?? moveClip(styleId, move.id) : moveClip(styleId, move.id);
  const dino = styleById("disco");

  return (
    <div className="app">
      <Topbar back="/" />
      <div className="lesson-layout">
        <div className={`stage ${clip ? "video" : ""} ${phase === "dance" ? "pulse" : ""}`} style={{ "--stage-c": frozen ? "#60a5fa" : style.colors.main, "--beat": `${engine.secondsPerBeat}s` } as React.CSSProperties}>
          {phase === "dance" && <div className="lights" />}
          <MascotView style={style} clip={clip} poster={mascotImage(styleId)} anim={frozen ? "estatua" : phase === "dance" ? move.anim : "bounce"} beat={engine.secondsPerBeat} frozen={frozen} />
          <video ref={meter.videoRef} className={`cam ${meter.camera === "on" ? "" : "hidden"}`} playsInline muted />
        </div>
        <div>
          {phase === "intro" && (
            <>
              <h1 className="title" style={{ color: "#1d4ed8" }}>
                {t.freezeTitle} 🗿
              </h1>
              <Mascot emoji={dino.emoji} image={mascotImage("disco")} color={dino.colors.main}>
                {t.freezeIntro}
              </Mascot>
              <p className="subtitle mt">{t.music}</p>
              <div className="chips">
                {styles.map((s) => (
                  <button key={s.id} className="chip" style={s.id === styleId ? { background: s.colors.main, color: "#fff" } : undefined} onClick={() => setStyleId(s.id)}>
                    {s.emoji} {s.name}
                  </button>
                ))}
              </div>
              <div className="row mt">
                <button className="btn big blue" onClick={() => { sfx.whoosh(); startDance(0); }}>
                  {t.play} 🎵
                </button>
                {meter.cameraSupported && (
                  <button className="btn white" onClick={meter.toggleCamera}>
                    {meter.camera === "on" ? t.cameraOn : t.cameraOff}
                  </button>
                )}
              </div>
              <p className="tip">{meter.camera === "on" ? t.camFreezeInfo : t.noCamFreezeInfo}</p>
            </>
          )}

          {(phase === "dance" || phase === "freeze" || phase === "result") && (
            <>
              <div className="row">
                <span className="pill">
                  {t.round} {round + 1}/{ROUNDS_TO_WIN}
                </span>
                <span className="pill">
                  {"❤️".repeat(lives)}
                  {"🖤".repeat(3 - lives)}
                </span>
              </div>
              <div className={`banner ${frozen ? "freeze" : "dance"} mt`} key={phase}>
                {phase === "dance" ? `${t.dance} 💃` : frozen ? `${t.freeze} 🗿` : msg}
              </div>
              {phase === "dance" && (
                <p className="instruction center">
                  {move.emoji} {move.name}
                </p>
              )}
              <div className="mt">
                <Energy value={meter.value} label={frozen ? t.notAFinger : undefined} />
              </div>
              <button className={`btn huge ${frozen ? "blue" : "pink"} mt`} style={{ width: "100%" }} onPointerDown={tapButton} disabled={phase === "result"}>
                {frozen ? t.dontTouch : t.beatButton}
              </button>
            </>
          )}

          {phase === "over" && (
            <div className="center">
              <h1 className="title rainbow">{msg}</h1>
              <p className="subtitle">
                {t.record}: {p.bestFreeze}
              </p>
              <div className="row center">
                <button className="btn big blue" onClick={reset}>
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
