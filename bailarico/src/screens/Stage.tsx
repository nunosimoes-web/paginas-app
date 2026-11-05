import { useEffect, useMemo, useRef, useState } from "react";
import type { StyleId } from "../../shared/types.js";
import { clipMovesForStyle } from "../../shared/catalog.js";
import { MascotView } from "../components/MascotView";
import { CountDots, Energy, Footer, Topbar } from "../components/ui";
import { useMeter } from "../components/useMeter";
import { useBeat, useBeatEngine } from "../audio/useBeat";
import { speak, warmup } from "../audio/voice";
import { sfx } from "../audio/sfx";
import { progress, useProgress } from "../lib/progress";
import { confettiBurst } from "../lib/confetti";
import { mascotImage, moveClip, styleMusic } from "../lib/assets";
import { loadGallery } from "./Studio";
import { useI18n } from "../lib/i18n";

/** Palco Livre = "Dança comigo": o professor vai mudando de passo com a música; a criança imita. */
export function Stage() {
  const { t, f, dict, pick, styles, styleById, moveById } = useI18n();
  const [styleId, setStyleId] = useState<StyleId>("festa");
  const style = styleById(styleId);
  const pool = useMemo(() => clipMovesForStyle(styleId).filter((m) => m !== "estatua"), [styleId]);
  const engine = useBeatEngine(style);
  const meter = useMeter();
  const p = useProgress();
  const [playing, setPlaying] = useState(false);
  const [moveId, setMoveId] = useState(pool[0]);
  const [goal, setGoal] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const goalRef = useRef(0);
  const customSongs = loadGallery().songs;

  useEffect(() => {
    void speak(t.stageIntroVoice);
  }, [t]);
  useEffect(() => {
    warmup(pool.map((id) => moveById(id).name));
  }, [pool, moveById]);

  // a cada 4 compassos muda de passo e a voz diz qual
  const beat = useBeat(engine, (e) => {
    if (e.beat === 0 && e.bar > 0 && e.bar % 4 === 0) {
      const next = pick(pool.filter((m) => m !== moveId)) ?? pool[0];
      setMoveId(next);
      void speak(moveById(next).name);
    }
  });

  // com câmara, o movimento enche a barra
  useEffect(() => {
    if (!playing || meter.camera !== "on") return;
    goalRef.current = Math.min(1, goalRef.current + meter.value * 0.012);
    setGoal(goalRef.current);
    if (goalRef.current >= 1) {
      goalRef.current = 0;
      progress.addEnergy(50);
      progress.addStars(1);
      confettiBurst({ colors: [style.colors.main, style.colors.glow, "#fff"] });
      sfx.fanfare();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meter.value, playing]);

  const start = async (dedicationName?: string) => {
    sfx.whoosh();
    const url = styleMusic(styleId) ?? null;
    engine.setStyle(style);
    engine.setLayers({ drums: !url, music: !url }); // com faixa gravada, o motor só marca o tempo
    setPlaying(true);
    const first = pick(pool);
    setMoveId(first);
    if (dedicationName) await speak(f(t.dedication, { name: dedicationName }));
    else await speak(moveById(first).name);
    engine.start();
    if (url) {
      const a = (audioRef.current ??= new Audio());
      a.src = url;
      a.loop = true;
      void a.play().catch(() => undefined);
    }
  };
  // a dançar: uma estrela a cada 30 segundos
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      progress.addStars(1);
      void speak(pick(dict.praise));
    }, 30_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const stop = () => {
    engine.stop();
    audioRef.current?.pause();
    setPlaying(false);
  };
  useEffect(() => () => audioRef.current?.pause(), []);

  const move = moveById(moveId);

  return (
    <div className="app">
      <Topbar back="/" right={<span className="pill">⚡ {p.energy}</span>} />
      <div className="lesson-layout">
        <div className={`stage video ${playing ? "pulse" : ""}`} style={{ "--stage-c": style.colors.main, "--beat": `${engine.secondsPerBeat}s` } as React.CSSProperties}>
          {playing && <CountDots beats={style.beatsPerBar} current={beat.beat} />}
          <MascotView style={style} clip={moveClip(styleId, moveId)} poster={mascotImage(styleId)} mirror={playing} />
          <video ref={meter.videoRef} className={`cam ${meter.camera === "on" ? "" : "hidden"}`} playsInline muted />
        </div>
        <div>
          <h1 className="title" style={{ color: style.colors.dark }}>
            {t.stageIntro} 🎤
          </h1>
          {!playing ? (
            <>
              <p className="subtitle">{t.stageFollow}</p>
              <div className="chips">
                {styles.map((s) => (
                  <button key={s.id} className="chip" style={s.id === styleId ? { background: s.colors.main, color: "#fff" } : undefined} onClick={() => setStyleId(s.id)}>
                    {s.emoji} {s.name}
                  </button>
                ))}
              </div>
              <button className="btn huge teal mt" onClick={() => void start()}>
                ▶️ {t.playMusic}
              </button>
              {customSongs.length > 0 && (
                <div className="mt">
                  <p className="subtitle">{t.mySongs}</p>
                  <div className="chips">
                    {customSongs.map((s) => (
                      <button key={s.style + s.name} className="chip" onClick={() => { setStyleId(s.style); void start(s.name); }}>
                        🎶 {f(t.songTitle, { style: styleById(s.style).name, name: s.name })}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {meter.cameraSupported && (
                <button className="btn ghost mt" onClick={meter.toggleCamera}>
                  {meter.camera === "on" ? t.cameraOn : t.cameraOff}
                </button>
              )}
            </>
          ) : (
            <>
              <h2 className="move-name" key={moveId}>
                {move.emoji} {move.name}
              </h2>
              <p className="instruction">{move.instruction}</p>
              {meter.camera === "on" && (
                <div className="mt">
                  <Energy value={goal} label={`${t.goal} ${Math.round(goal * 100)}%`} />
                </div>
              )}
              <button className="btn big white mt" onClick={stop}>
                {t.stop}
              </button>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
