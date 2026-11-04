import { useEffect, useRef, useState } from "react";
import { STYLES, styleById } from "../../shared/styles.js";
import { movesForStyle, type MoveAnim } from "../../shared/moves.js";
import { UI_PHRASES, PRAISE, pick } from "../../shared/phrases.js";
import type { StyleId } from "../../shared/types.js";
import { Dancer } from "../components/Dancer";
import { CountDots, Energy, Footer, Topbar } from "../components/ui";
import { useMeter } from "../components/useMeter";
import { useBeat, useBeatEngine } from "../audio/useBeat";
import { speak } from "../audio/voice";
import { sfx } from "../audio/sfx";
import { progress, useProgress } from "../lib/progress";
import { confettiBurst } from "../lib/confetti";
import { styleMusic } from "../lib/assets";
import { loadGallery } from "./Studio";

/** Palco Livre: dança livre com música, luzes e barra de energia. */
export function Stage() {
  const [styleId, setStyleId] = useState<StyleId>("festa");
  const style = styleById(styleId);
  const engine = useBeatEngine(style);
  const meter = useMeter();
  const p = useProgress();
  const [playing, setPlaying] = useState(false);
  const [anim, setAnim] = useState<MoveAnim>("bounce");
  const [goal, setGoal] = useState(0); // 0..1
  const [track, setTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const goalRef = useRef(0);
  const customSongs = loadGallery().songs;

  useEffect(() => {
    void speak(UI_PHRASES.stageIntro);
  }, []);

  const beat = useBeat(engine, (e) => {
    if (e.beat === 0 && e.bar % 2 === 0) {
      const pool = movesForStyle(styleId).filter((m) => m.anim !== "estatua");
      setAnim(pick(pool).anim);
    }
  });

  // energia -> objetivo
  useEffect(() => {
    if (!playing) return;
    goalRef.current = Math.min(1, goalRef.current + meter.value * 0.012);
    setGoal(goalRef.current);
    if (goalRef.current >= 1) {
      goalRef.current = 0;
      progress.addEnergy(50);
      confettiBurst({ colors: [style.colors.main, style.colors.glow, "#fff"] });
      sfx.fanfare();
      void speak(`${pick(PRAISE)} Barra cheia! Mais 50 de energia!`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meter.value, playing]);

  const start = (customUrl?: string) => {
    sfx.whoosh();
    const url = customUrl ?? styleMusic(styleId) ?? null;
    setTrack(url);
    if (url) {
      engine.setLayers({ drums: false, music: false }); // só marca o tempo para a animação
    } else engine.setLayers({ drums: true, music: true });
    engine.start();
    setPlaying(true);
    if (url) {
      const a = (audioRef.current ??= new Audio());
      a.src = url;
      a.loop = true;
      a.volume = 0.9;
      void a.play().catch(() => undefined);
    }
  };
  const stop = () => {
    engine.stop();
    audioRef.current?.pause();
    setPlaying(false);
    engine.setLayers({ drums: true, music: true });
  };
  useEffect(() => () => audioRef.current?.pause(), []);

  return (
    <div className="app">
      <Topbar back="/" right={<span className="pill">⚡ {p.energy}</span>} />
      <div className="lesson-layout">
        <div className={`stage ${playing ? "pulse" : ""}`} style={{ "--stage-c": style.colors.main, "--beat": `${engine.secondsPerBeat}s` } as React.CSSProperties}>
          {playing && <div className="lights" />}
          {playing && !track && <CountDots beats={style.beatsPerBar} current={beat.beat} />}
          <Dancer move={playing ? anim : "idle"} face={p.avatar || "⭐"} color={style.colors.main} colorDark={style.colors.dark} beat={engine.secondsPerBeat} />
          <video ref={meter.videoRef} className={`cam ${meter.camera === "on" ? "" : "hidden"}`} playsInline muted />
        </div>
        <div>
          <h1 className="title" style={{ color: style.colors.dark }}>
            Palco Livre 🎤
          </h1>
          {!playing ? (
            <>
              <p className="subtitle">Escolhe a música e dança como quiseres. Quanto mais te mexes, mais depressa a barra enche!</p>
              <div className="chips">
                {STYLES.map((s) => (
                  <button key={s.id} className="chip" style={s.id === styleId ? { background: s.colors.main, color: "#fff" } : undefined} onClick={() => setStyleId(s.id)}>
                    {s.mascot.emoji} {s.name}
                  </button>
                ))}
              </div>
              <div className="row mt">
                <button className="btn big teal" onClick={() => start()}>
                  Tocar música! 🎵
                </button>
                {meter.cameraSupported && (
                  <button className="btn white" onClick={meter.toggleCamera}>
                    {meter.camera === "on" ? "📷 Câmara ligada" : "📷 Ligar câmara"}
                  </button>
                )}
              </div>
              {customSongs.length > 0 && (
                <div className="mt">
                  <p className="subtitle">🪄 As tuas músicas mágicas:</p>
                  <div className="chips">
                    {customSongs.map((s) => (
                      <button key={s.url} className="chip" onClick={() => start(s.url)}>
                        🎶 {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="subtitle">Enche a barra para ganhar 50 de energia!</p>
              <Energy value={goal} label={`Objetivo ${Math.round(goal * 100)}%`} />
              <div className="mt">
                <Energy value={meter.value} />
              </div>
              {meter.camera !== "on" && (
                <button className="btn huge pink mt" style={{ width: "100%" }} onPointerDown={meter.tap}>
                  🥁 Bate o ritmo!
                </button>
              )}
              <button className="btn white mt" onClick={stop}>
                ⏹ Parar
              </button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
