import { useEffect, useRef, useState } from "react";
import { STYLES, styleById } from "../../shared/styles.js";
import { FREEZE_FAIL, FREEZE_OK, UI_PHRASES, pick } from "../../shared/phrases.js";
import type { StyleId } from "../../shared/types.js";
import { Dancer } from "../components/Dancer";
import { Energy, Footer, Mascot, Topbar } from "../components/ui";
import { useMeter } from "../components/useMeter";
import { useBeat, useBeatEngine } from "../audio/useBeat";
import { speak } from "../audio/voice";
import { sfx } from "../audio/sfx";
import { progress, useProgress } from "../lib/progress";
import { confettiBurst } from "../lib/confetti";
import { go } from "../lib/router";
import type { MoveAnim } from "../../shared/moves.js";

type Phase = "intro" | "dance" | "freeze" | "result" | "over";
const DANCE_ANIMS: MoveAnim[] = ["bounce", "bracos-ar", "anca", "salto", "passo-lado", "palmas", "giro", "ombros"];
const ROUNDS_TO_WIN = 10;

export function FreezeGame() {
  const [styleId, setStyleId] = useState<StyleId>("disco");
  const style = styleById(styleId);
  const engine = useBeatEngine(style);
  const meter = useMeter();
  const p = useProgress();

  const [phase, setPhase] = useState<Phase>("intro");
  const [round, setRound] = useState(0);
  const [lives, setLives] = useState(3);
  const [anim, setAnim] = useState<MoveAnim>("bounce");
  const [msg, setMsg] = useState("");
  const phaseRef = useRef<Phase>("intro");
  phaseRef.current = phase;
  const caught = useRef(false);
  const timers = useRef<number[]>([]);
  const movedFrames = useRef(0);
  const tappedWhileDancing = useRef(0);

  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    void speak(UI_PHRASES.freezeIntro);
  }, []);

  useBeat(engine, (e) => {
    if (phaseRef.current === "dance" && e.beat === 0 && e.bar % 2 === 0) setAnim(pick(DANCE_ANIMS));
  });

  // Durante a estátua: movimento (câmara) ou toque (modo ritmo) = apanhado.
  useEffect(() => {
    if (phase !== "freeze") return;
    if (meter.camera === "on" && meter.value > 0.22) movedFrames.current++;
    if (movedFrames.current >= 3 && !caught.current) caught.current = true;
  }, [meter.value, phase, meter.camera]);

  const startDance = (r: number) => {
    setPhase("dance");
    setRound(r);
    caught.current = false;
    movedFrames.current = 0;
    tappedWhileDancing.current = 0;
    engine.start();
    void speak(UI_PHRASES.dance);
    const dur = 4000 + Math.random() * 5000 - Math.min(2500, r * 250);
    later(() => freeze(), Math.max(2500, dur));
  };

  const freeze = () => {
    engine.stop();
    sfx.whistle();
    setPhase("freeze");
    void speak(UI_PHRASES.freeze);
    later(() => result(), 3200);
  };

  const result = () => {
    setPhase("result");
    const ok = !caught.current;
    if (ok) {
      sfx.star();
      const m = pick(FREEZE_OK);
      setMsg(m);
      void speak(m);
      const next = round + 1;
      progress.addEnergy(10);
      if (next >= ROUNDS_TO_WIN) {
        later(() => win(next), 1500);
      } else later(() => startDance(next), 1800);
    } else {
      sfx.oops();
      const m = pick(FREEZE_FAIL);
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
    setMsg("Campeão das estátuas! Dez rondas seguidas!");
    confettiBurst();
    sfx.fanfare();
    void speak("Campeão das estátuas! Fizeste as dez rondas!");
    progress.update((s) => ({ bestFreeze: Math.max(s.bestFreeze, rounds) }));
  };
  const over = (rounds: number) => {
    setPhase("over");
    setMsg(`Boa! Aguentaste ${rounds} rondas.`);
    progress.update((s) => ({ bestFreeze: Math.max(s.bestFreeze, rounds) }));
    void speak(`Boa! Aguentaste ${rounds} rondas. Queres tentar outra vez?`);
  };

  const tapButton = () => {
    if (phase === "freeze") caught.current = true;
    else if (phase === "dance") {
      tappedWhileDancing.current++;
      meter.tap();
    }
  };

  const reset = () => {
    setLives(3);
    setRound(0);
    setPhase("intro");
  };

  return (
    <div className="app">
      <Topbar back="/" />
      <div className="lesson-layout">
        <div className={`stage ${phase === "dance" ? "pulse" : ""}`} style={{ "--stage-c": phase === "freeze" ? "#60a5fa" : style.colors.main, "--beat": `${engine.secondsPerBeat}s` } as React.CSSProperties}>
          {phase === "dance" && <div className="lights" />}
          <Dancer move={phase === "freeze" ? "estatua" : anim} face={style.mascot.emoji} color={style.colors.main} colorDark={style.colors.dark} beat={engine.secondsPerBeat} frozen={phase === "freeze"} />
          <video ref={meter.videoRef} className={`cam ${meter.camera === "on" ? "" : "hidden"}`} playsInline muted />
        </div>
        <div>
          {phase === "intro" && (
            <>
              <h1 className="title" style={{ color: "#1d4ed8" }}>
                Estátua! 🗿
              </h1>
              <Mascot emoji="🦖" color="#facc15">
                Quando a música toca, danças. Quando para, ficas em estátua! Tens 3 corações. Aguenta 10 rondas para seres campeão.
              </Mascot>
              <p className="subtitle mt">Música:</p>
              <div className="chips">
                {STYLES.map((s) => (
                  <button key={s.id} className="chip" style={s.id === styleId ? { background: s.colors.main, color: "#fff" } : undefined} onClick={() => setStyleId(s.id)}>
                    {s.mascot.emoji} {s.name}
                  </button>
                ))}
              </div>
              <div className="row mt">
                <button className="btn big blue" onClick={() => { sfx.whoosh(); startDance(0); }}>
                  Jogar! 🎵
                </button>
                {meter.cameraSupported && (
                  <button className="btn white" onClick={meter.toggleCamera}>
                    {meter.camera === "on" ? "📷 Câmara ligada" : "📷 Ligar câmara"}
                  </button>
                )}
              </div>
              <p className="tip">
                {meter.camera === "on"
                  ? "A câmara vê se te mexes durante a estátua. A imagem nunca sai do teu aparelho."
                  : "Sem câmara: bate no botão enquanto danças e NÃO toques em nada durante a estátua!"}
              </p>
            </>
          )}

          {(phase === "dance" || phase === "freeze" || phase === "result") && (
            <>
              <div className="row">
                <span className="pill">Ronda {round + 1}/{ROUNDS_TO_WIN}</span>
                <span className="pill">{"❤️".repeat(lives)}{"🖤".repeat(3 - lives)}</span>
              </div>
              <div className={`banner ${phase === "freeze" ? "freeze" : "dance"} mt`} key={phase}>
                {phase === "dance" ? "DANÇA! 💃" : phase === "freeze" ? "ESTÁTUA! 🗿" : msg}
              </div>
              <div className="mt">
                <Energy value={meter.value} label={phase === "freeze" ? "Nem um dedo!" : undefined} />
              </div>
              <button
                className={`btn huge ${phase === "freeze" ? "blue" : "pink"} mt`}
                style={{ width: "100%" }}
                onPointerDown={tapButton}
                disabled={phase === "result"}
              >
                {phase === "freeze" ? "🤫 Não toques!" : "🥁 Bate o ritmo!"}
              </button>
            </>
          )}

          {phase === "over" && (
            <div className="center">
              <h1 className="title rainbow">{msg}</h1>
              <p className="subtitle">Recorde: {p.bestFreeze} rondas</p>
              <div className="row center">
                <button className="btn big blue" onClick={reset}>
                  🔁 Outra vez
                </button>
                <button className="btn white" onClick={() => go("/")}>
                  🏠 Início
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
